// homewood API — Cloudflare Worker + D1
// 静的ファイル (public/) は Workers Static Assets が先に配信し、それ以外がここに来る。

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TABLES = { members: 'members', areas: 'areas' };

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const bad = (msg) => new HttpError(400, msg);

function date(v, label = 'date') {
  if (typeof v !== 'string' || !DATE.test(v)) throw bad(`${label} は YYYY-MM-DD 形式で指定してください`);
  return v;
}

function int(v, label) {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1) throw bad(`${label} が不正です`);
  return n;
}

function name(v) {
  const s = typeof v === 'string' ? v.trim() : '';
  if (!s) throw bad('名前を入力してください');
  if (s.length > 30) throw bad('名前は30文字以内にしてください');
  return s;
}

async function api(req, env, url) {
  const db = env.DB;
  const method = req.method;
  const path = url.pathname.slice('/api'.length);
  const body = method === 'POST' || method === 'PUT' ? await req.json().catch(() => ({})) : {};

  // 初期表示に必要なメンバーと掃除場所
  if (path === '/bootstrap' && method === 'GET') {
    const [members, areas] = await db.batch([
      db.prepare('SELECT id, name FROM members ORDER BY id'),
      db.prepare('SELECT id, name FROM areas ORDER BY id'),
    ]);
    return json({ members: members.results, areas: areas.results });
  }

  // メンバー / 掃除場所の追加・削除
  const col = path.match(/^\/(members|areas)(?:\/(\d+))?$/);
  if (col) {
    const table = TABLES[col[1]];
    if (method === 'POST' && !col[2]) {
      const row = await db
        .prepare(`INSERT INTO ${table} (name) VALUES (?) RETURNING id, name`)
        .bind(name(body.name))
        .first();
      return json(row, 201);
    }
    if (method === 'DELETE' && col[2]) {
      await db.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(int(col[2], 'id')).run();
      return json({ ok: true });
    }
  }

  // 洗濯機の予約
  if (path === '/laundry') {
    if (method === 'GET') {
      const from = date(url.searchParams.get('from'), 'from');
      const to = date(url.searchParams.get('to'), 'to');
      const { results } = await db
        .prepare(
          `SELECT date, slot, member_id, level FROM reservations WHERE date BETWEEN ? AND ?
           ORDER BY date, slot, level = 'maybe', member_id`,
        )
        .bind(from, to)
        .all();
      return json(results);
    }
    if (method === 'PUT') {
      const d = date(body.date);
      const slot = Number(body.slot);
      if (![0, 1, 2].includes(slot)) throw bad('slot が不正です');
      const member = int(body.member_id, 'member_id');
      if (body.level == null) {
        await db
          .prepare('DELETE FROM reservations WHERE date = ? AND slot = ? AND member_id = ?')
          .bind(d, slot, member)
          .run();
      } else {
        if (!['must', 'maybe'].includes(body.level)) throw bad('level が不正です');
        await db
          .prepare(
            `INSERT INTO reservations (date, slot, member_id, level) VALUES (?, ?, ?, ?)
             ON CONFLICT (date, slot, member_id) DO UPDATE SET level = excluded.level`,
          )
          .bind(d, slot, member, body.level)
          .run();
      }
      return json({ ok: true });
    }
  }

  // 掃除当番の完了
  if (path === '/chores') {
    if (method === 'GET') {
      const week = date(url.searchParams.get('week'), 'week');
      const { results } = await db
        .prepare('SELECT area_id, member_id, done_at FROM chores_done WHERE week = ?')
        .bind(week)
        .all();
      return json(results);
    }
    if (method === 'PUT') {
      const week = date(body.week, 'week');
      const area = int(body.area_id, 'area_id');
      if (body.done) {
        await db
          .prepare(
            `INSERT INTO chores_done (week, area_id, member_id) VALUES (?, ?, ?)
             ON CONFLICT (week, area_id) DO UPDATE SET member_id = excluded.member_id, done_at = datetime('now')`,
          )
          .bind(week, area, int(body.member_id, 'member_id'))
          .run();
      } else {
        await db.prepare('DELETE FROM chores_done WHERE week = ? AND area_id = ?').bind(week, area).run();
      }
      return json({ ok: true });
    }
  }

  throw new HttpError(404, 'Not found');
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(req);
    try {
      return await api(req, env, url);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      if (/FOREIGN KEY/i.test(String(e?.message))) return json({ error: '存在しないメンバーまたは場所です' }, 400);
      console.error(e);
      return json({ error: 'サーバーエラーが発生しました' }, 500);
    }
  },
};
