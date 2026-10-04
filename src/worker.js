// homewood API — Cloudflare Worker + D1
// 静的ファイル (public/) は Workers Static Assets が先に配信し、それ以外がここに来る。

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TABLES = { members: 'members', areas: 'areas' };

// エラー文言は画面の言語（x-lang ヘッダー）に合わせて返す
const MESSAGES = {
  ja: {
    date: (l) => `${l} は YYYY-MM-DD 形式で指定してください`,
    invalid: (l) => `${l} が不正です`,
    nameRequired: () => '名前を入力してください',
    nameTooLong: () => '名前は30文字以内にしてください',
    bodyTooLong: () => '280文字以内にしてください',
    guideTooLong: () => 'ガイドは2000文字以内にしてください',
    ownLike: () => '自分の投稿にはいいねできません',
    notFound: () => 'Not found',
    unknownRef: () => '存在しないメンバーまたは場所です',
    server: () => 'サーバーエラーが発生しました',
  },
  en: {
    date: (l) => `${l} must be in YYYY-MM-DD format`,
    invalid: (l) => `Invalid ${l}`,
    nameRequired: () => 'Please enter a name',
    nameTooLong: () => 'Names must be 30 characters or fewer',
    bodyTooLong: () => 'Please keep it within 280 characters',
    guideTooLong: () => 'Please keep the guide within 2000 characters',
    ownLike: () => "You can't like your own post",
    notFound: () => 'Not found',
    unknownRef: () => 'That resident or area no longer exists',
    server: () => 'Something went wrong on the server',
  },
};

class HttpError extends Error {
  constructor(status, code, arg) {
    super(code);
    this.status = status;
    this.code = code;
    this.arg = arg;
  }
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const bad = (code, arg) => new HttpError(400, code, arg);

function date(v, label = 'date') {
  if (typeof v !== 'string' || !DATE.test(v)) throw bad('date', label);
  return v;
}

function int(v, label) {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1) throw bad('invalid', label);
  return n;
}

function name(v) {
  const s = typeof v === 'string' ? v.trim() : '';
  if (!s) throw bad('nameRequired');
  if (s.length > 30) throw bad('nameTooLong');
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
      db.prepare('SELECT id, name, guide_ja, guide_en, images FROM areas ORDER BY id'),
    ]);
    return json({ members: members.results, areas: areas.results });
  }

  // 掃除場所のガイド更新
  const guide = path.match(/^\/areas\/(\d+)\/guide$/);
  if (guide && method === 'PUT') {
    const text = (v) => {
      const str = typeof v === 'string' ? v.trim() : '';
      if (str.length > 2000) throw bad('guideTooLong');
      return str;
    };
    await db
      .prepare('UPDATE areas SET guide_ja = ?, guide_en = ? WHERE id = ?')
      .bind(text(body.guide_ja), text(body.guide_en), int(guide[1], 'id'))
      .run();
    return json({ ok: true });
  }

  // メンバー / 掃除場所の追加・削除
  const col = path.match(/^\/(members|areas)(?:\/(\d+))?$/);
  if (col) {
    const table = TABLES[col[1]];
    if (method === 'POST' && !col[2]) {
      const row = await db
        .prepare(`INSERT INTO ${table} (name) VALUES (?) RETURNING ${table === 'areas' ? 'id, name, guide_ja, guide_en, images' : 'id, name'}`)
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
      if (![0, 1, 2].includes(slot)) throw bad('invalid', 'slot');
      const member = int(body.member_id, 'member_id');
      if (body.level == null) {
        await db
          .prepare('DELETE FROM reservations WHERE date = ? AND slot = ? AND member_id = ?')
          .bind(d, slot, member)
          .run();
      } else {
        if (!['must', 'maybe'].includes(body.level)) throw bad('invalid', 'level');
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

  // 掲示板
  if (path === '/board' && method === 'GET') {
    const [posts, likes] = await db.batch([
      db.prepare('SELECT member_id, body, updated_at FROM posts'),
      db.prepare('SELECT owner_id, liker_id FROM likes'),
    ]);
    return json({ posts: posts.results, likes: likes.results });
  }
  const board = path.match(/^\/board\/(\d+)(\/like)?$/);
  if (board && method === 'PUT') {
    const owner = int(board[1], 'member_id');
    if (!board[2]) {
      // 投稿の上書き（空なら削除）。新しい投稿になるので、いいねはリセット
      const text = typeof body.body === 'string' ? body.body.trim() : '';
      if (text.length > 280) throw bad('bodyTooLong');
      const write = text
        ? db
            .prepare(
              `INSERT INTO posts (member_id, body) VALUES (?, ?)
               ON CONFLICT (member_id) DO UPDATE SET body = excluded.body, updated_at = datetime('now')`,
            )
            .bind(owner, text)
        : db.prepare('DELETE FROM posts WHERE member_id = ?').bind(owner);
      await db.batch([write, db.prepare('DELETE FROM likes WHERE owner_id = ?').bind(owner)]);
      return json({ ok: true });
    }
    const liker = int(body.liker_id, 'liker_id');
    if (liker === owner) throw bad('ownLike');
    await db
      .prepare(
        body.on
          ? 'INSERT OR IGNORE INTO likes (owner_id, liker_id) SELECT ?, ? WHERE EXISTS (SELECT 1 FROM posts WHERE member_id = ?1)'
          : 'DELETE FROM likes WHERE owner_id = ? AND liker_id = ?',
      )
      .bind(owner, liker)
      .run();
    return json({ ok: true });
  }

  throw new HttpError(404, 'notFound');
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(req);
    const M = MESSAGES[req.headers.get('x-lang') === 'en' ? 'en' : 'ja'];
    try {
      return await api(req, env, url);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: M[e.code](e.arg) }, e.status);
      if (/FOREIGN KEY/i.test(String(e?.message))) return json({ error: M.unknownRef() }, 400);
      console.error(e);
      return json({ error: M.server() }, 500);
    }
  },
};
