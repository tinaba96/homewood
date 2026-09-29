// homewood — シェアハウス用 洗濯機予約 & 掃除当番（スマホ前提）

const SLOTS = [
  { label: '午前', time: '〜12時', end: 12 },
  { label: '午後', time: '12〜18時', end: 18 },
  { label: '夜', time: '18時〜', end: 24 },
];
const LEVEL = { must: '絶対使う', maybe: '使うかも' };
const LEVEL_NOTE = { must: 'この時間に必ず使う', maybe: '使う可能性がある' };
const WD = ['日', '月', '火', '水', '木', '金', '土'];
const TABS = ['laundry', 'chores', 'settings'];
const KEY = { me: 'homewood.me', hint: 'homewood.hint-dismissed', base: 'homewood.base', cache: 'homewood.cache' };
const POLL_MS = 60_000;

const ICON = {
  left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  right: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  share:
    '<svg class="inline-icon" viewBox="0 0 24 24" aria-label="共有"><path d="M12 15V3M7.5 7.5L12 3l4.5 4.5M7 10H5.5v11h13V10H17"/></svg>',
};

const $ = (s) => document.querySelector(s);
const view = $('#view');
const sheet = $('#sheet');

const state = {
  members: [],
  areas: [],
  me: null,
  picking: false, // ユーザー選択画面を表示中
  tab: 'laundry',
  laundryWeek: 0, // 今日から何週先か
  choresWeek: 0, // 今週から何週先か
  reservations: [],
  done: [],
  loading: false,
  offline: false,
  justDone: null, // 完了アニメーションを付ける場所 id
};

/* ---------- utils ---------- */
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const mondayOf = (d) => addDays(d, -((d.getDay() + 6) % 7));
const md = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
const mdw = (d) => `${md(d)}(${WD[d.getDay()]})`;
const weekIndex = (mon) => Math.floor(Date.UTC(mon.getFullYear(), mon.getMonth(), mon.getDate()) / 864e5 / 7);
const memberName = (id) => state.members.find((m) => m.id === id)?.name ?? '退去済み';
const byLevel = (a, b) => (a.level === 'maybe') - (b.level === 'maybe') || a.member_id - b.member_id;
const parseUtc = (s) => new Date(`${s.replace(' ', 'T')}Z`);
const nowUtc = () => new Date().toISOString().slice(0, 19).replace('T', ' ');
const AV_COLORS = ['#5f3dc4', '#c92a2a', '#0b7285', '#a61e4d', '#1864ab', '#2b8a3e', '#862e9c', '#d9480f'];
const avColor = (id) => AV_COLORS[(id - 1) % AV_COLORS.length];
const avatar = (m) =>
  `<span class="av" style="--av:${avColor(m.id)}" aria-hidden="true">${esc([...m.name][0] ?? '?')}</span>`;

function storage(fn) {
  try {
    return fn(localStorage);
  } catch {
    return null;
  }
}

// 画面をすぐ出すための簡易キャッシュ（最新16件まで）
const cache = {
  all: () => storage((s) => JSON.parse(s.getItem(KEY.cache))) ?? {},
  get: (k) => cache.all()[k] ?? null,
  set(k, v) {
    const all = cache.all();
    delete all[k];
    all[k] = v;
    const keys = Object.keys(all);
    for (const old of keys.slice(0, Math.max(0, keys.length - 16))) delete all[old];
    storage((s) => s.setItem(KEY.cache, JSON.stringify(all)));
  },
};

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 2600);
}

function buzz() {
  try {
    navigator.vibrate?.(10);
  } catch {}
}

async function api(path, opts = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      ...opts,
      headers: opts.body ? { 'content-type': 'application/json' } : undefined,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new Error('通信できませんでした。電波を確認してください');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `エラーが発生しました (${res.status})`);
  return data;
}

async function run(fn) {
  try {
    await fn();
  } catch (e) {
    toast(e.message);
  }
}

/* ---------- 掃除当番の割り当て（住人の登録順で毎週ローテーション） ---------- */
function assignments(monday) {
  const n = state.members.length;
  if (!n) return [];
  const w = weekIndex(monday);
  return state.areas.map((area, i) => ({ area, member: state.members[(((i + w) % n) + n) % n] }));
}

/* ---------- data ---------- */
function laundryRange() {
  const from = addDays(today(), state.laundryWeek * 7);
  return { from, to: addDays(from, 6) };
}
const choresMonday = () => addDays(mondayOf(today()), state.choresWeek * 7);

// 今のタブが必要とするデータの取得元
function source() {
  if (state.tab === 'laundry') {
    const { from, to } = laundryRange();
    return { key: `laundry:${ymd(from)}`, url: `/laundry?from=${ymd(from)}&to=${ymd(to)}`, field: 'reservations' };
  }
  if (state.tab === 'chores') {
    const week = ymd(choresMonday());
    return { key: `chores:${week}`, url: `/chores?week=${week}`, field: 'done' };
  }
  return null;
}

function applyBase(data) {
  state.members = data.members;
  state.areas = data.areas;
  const saved = Number(storage((s) => s.getItem(KEY.me)));
  state.me = state.members.find((m) => m.id === saved) ?? null;
}

async function loadBase() {
  const data = await api('/bootstrap');
  storage((s) => s.setItem(KEY.base, JSON.stringify(data)));
  applyBase(data);
}

let seq = 0;
async function show(tab, { silent = false } = {}) {
  state.tab = TABS.includes(tab) ? tab : 'laundry';
  const src = state.me && !state.picking ? source() : null;
  if (!src) return render();

  const token = ++seq;
  const cached = cache.get(src.key);
  if (cached) state[src.field] = cached;
  else if (!silent) state[src.field] = [];
  state.loading = !cached && !silent;
  if (!silent) render();

  try {
    const fresh = await api(src.url);
    if (token !== seq) return;
    cache.set(src.key, fresh);
    state[src.field] = fresh;
    state.offline = false;
  } catch (e) {
    if (token !== seq) return;
    state.offline = true;
    if (!silent) toast(e.message);
  } finally {
    if (token === seq) {
      state.loading = false;
      render();
    }
  }
}

/* ---------- install（ホーム画面に追加） ---------- */
let installEvent = null;
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.userAgent));
const isTouch = () => matchMedia('(pointer: coarse)').matches;
const installHow = () => (isIOS() ? `共有ボタン${ICON.share}→「ホーム画面に追加」` : 'ブラウザのメニュー →「ホーム画面に追加」');
const installText = () => `ホーム画面に追加すると、アプリのように開けます。${installEvent ? '' : installHow()}`;

function hintHTML() {
  if (isStandalone() || !isTouch() || storage((s) => s.getItem(KEY.hint))) return '';
  return `<div class="hint">
    <div><b>ホーム画面に追加</b>すると、アプリのように開けます。${installEvent ? '' : `<span class="how">${installHow()}</span>`}</div>
    ${installEvent ? '<button class="btn primary sm" data-action="install">追加</button>' : ''}
    <button class="x" data-action="dismiss-hint" aria-label="閉じる">${ICON.x}</button>
  </div>`;
}

const noticeHTML = () =>
  state.offline ? '<div class="notice">オフラインです。最後に読み込んだ内容を表示しています</div>' : '';

/* ---------- render ---------- */
let lastView = '';
function render() {
  const picking = !state.me || state.picking;
  $('#tabs').hidden = picking;
  const meBtn = $('#me-btn');
  meBtn.hidden = picking;
  if (state.me) meBtn.innerHTML = `${avatar(state.me)}<span>${esc(state.me.name)}</span>`;

  if (!picking) {
    document.querySelectorAll('#tabs a').forEach((a) => {
      const on = a.dataset.tab === state.tab;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  const name = picking ? 'picker' : state.tab;
  view.innerHTML = picking ? pickerHTML() : { laundry: laundryHTML, chores: choresHTML, settings: settingsHTML }[state.tab]();
  if (name !== lastView) {
    view.classList.remove('enter');
    void view.offsetWidth; // アニメーションを毎回かけ直す
    view.classList.add('enter');
    lastView = name;
  }
}

function pickerHTML() {
  const people = state.members
    .map(
      (m) =>
        `<button class="person ${state.me?.id === m.id ? 'current' : ''}" data-action="pick" data-id="${m.id}">${avatar(m)}<span>${esc(m.name)}</span></button>`,
    )
    .join('');
  return `<section class="picker">
    ${state.me ? `<button class="back" data-action="cancel-pick">${ICON.left}戻る</button>` : ''}
    <h2>あなたは誰？</h2>
    <p class="muted">自分の名前をタップしてください。この端末に記憶されます。</p>
    ${people ? `<div class="people">${people}</div>` : '<p class="empty">まだ住人がいません。下から追加してください。</p>'}
    <form class="add" data-form="members">
      <input name="name" placeholder="住人を追加（名前）" maxlength="30" autocomplete="off" enterkeyhint="done" aria-label="住人の名前">
      <button class="btn">追加</button>
    </form>
  </section>`;
}

function pagerHTML(action, value, min, max, unit) {
  return `<div class="pager">
    <button class="icon-btn" data-action="${action}" data-d="-1" ${value <= min ? 'disabled' : ''} aria-label="前の${unit}">${ICON.left}</button>
    <button class="icon-btn" data-action="${action}" data-d="1" ${value >= max ? 'disabled' : ''} aria-label="次の${unit}">${ICON.right}</button>
  </div>`;
}

function laundryHTML() {
  const { from, to } = laundryRange();
  const now = new Date();
  const t = ymd(now);
  const byCell = {};
  for (const r of state.reservations) (byCell[`${r.date}|${r.slot}`] ??= []).push(r);

  let rows = '';
  for (let i = 0; i < 7; i++) {
    const d = addDays(from, i);
    const key = ymd(d);
    const isToday = key === t;
    const dow = d.getDay();
    rows += `<div class="day ${isToday ? 'today' : ''} ${dow === 0 ? 'sun' : dow === 6 ? 'sat' : ''}">
      ${md(d)}<small>${isToday ? '今日' : WD[dow]}</small></div>`;
    SLOTS.forEach((slot, s) => {
      const list = (byCell[`${key}|${s}`] ?? []).sort(byLevel);
      const past = key < t || (isToday && now.getHours() >= slot.end);
      const musts = list.filter((r) => r.level === 'must').length;
      const cls = ['cell', past && 'past', musts && 'has-must'].filter(Boolean).join(' ');
      const chips = list
        .map(
          (r) =>
            `<span class="chip ${r.level} ${r.member_id === state.me.id ? 'mine' : ''}">${esc(memberName(r.member_id))}</span>`,
        )
        .join('');
      const said = list.length
        ? list.map((r) => `${memberName(r.member_id)} ${LEVEL[r.level]}`).join('、')
        : past
          ? '終了'
          : '空き';
      rows += `<button class="${cls}" data-action="slot" data-date="${key}" data-slot="${s}" ${past ? 'disabled' : ''}
        aria-label="${esc(`${mdw(d)} ${slot.label}：${said}`)}">${chips || (past ? '' : '<span class="plus" aria-hidden="true">+</span>')}</button>`;
    });
  }

  return `${hintHTML()}${noticeHTML()}
    <div class="head">
      <div>
        <h2>洗濯機</h2>
        <p class="sub">${mdw(from)} 〜 ${mdw(to)}</p>
      </div>
      ${pagerHTML('laundry-week', state.laundryWeek, 0, 3, '7日')}
    </div>
    <div class="legend">
      <span><i class="swatch must"></i>絶対使う</span>
      <span><i class="swatch maybe"></i>使うかも</span>
      <span>枠をタップして予約</span>
    </div>
    <div class="grid ${state.loading ? 'is-loading' : ''}" aria-busy="${state.loading}">
      <div class="colhead"></div>
      ${SLOTS.map((s) => `<div class="colhead"><b>${s.label}</b>${s.time}</div>`).join('')}
      ${rows}
    </div>`;
}

function weekLabel(w) {
  if (w === 0) return '今週';
  if (w === 1) return '来週';
  if (w === -1) return '先週';
  return w < 0 ? `${-w}週前` : `${w}週後`;
}

function choresHTML() {
  const w = state.choresWeek;
  const mon = choresMonday();
  const sun = addDays(mon, 6);
  const rows = assignments(mon);
  const head = `${noticeHTML()}
    <div class="head">
      <div>
        <h2>掃除当番<span class="tag">${weekLabel(w)}</span></h2>
        <p class="sub">${mdw(mon)} 〜 <b>${mdw(sun)}まで</b></p>
      </div>
      ${pagerHTML('chores-week', w, -4, 4, '週')}
    </div>`;
  if (!rows.length) {
    return `${head}<div class="card empty">掃除場所か住人が登録されていません。<br><a href="#settings">設定</a>から追加してください。</div>`;
  }

  const doneBy = Object.fromEntries(state.done.map((d) => [d.area_id, d]));
  const doneCount = rows.filter((r) => doneBy[r.area.id]).length;
  const allDone = doneCount === rows.length;
  const mine = rows.filter((r) => r.member.id === state.me.id);
  const mineLeft = mine.filter((r) => !doneBy[r.area.id]).length;
  const assigned = new Set(rows.map((r) => r.member.id));
  const off = state.members.filter((m) => !assigned.has(m.id));

  let deadline = '';
  let deadlineCls = '';
  if (allDone && w <= 0) [deadline, deadlineCls] = ['ぜんぶ完了 🎉', 'clear'];
  else if (w === 0) {
    const left = Math.round((sun - today()) / 864e5);
    deadline = left === 0 ? '今日が締め切り' : left === 1 ? '明日が締め切り' : `締め切りまであと${left}日`;
    deadlineCls = left <= 1 ? 'urgent' : '';
  } else if (w < 0) [deadline, deadlineCls] = ['締め切り済み', 'urgent'];

  let myStatus;
  if (!mine.length) myStatus = 'あなたは<b>お休み</b>';
  else if (w > 0) myStatus = `あなたの担当 <b>${mine.length}件</b>`;
  else myStatus = mineLeft ? `あなたの残り <b>${mineLeft}件</b>` : 'あなたの担当は<b>完了</b>';

  const summary = `<div class="card summary">
    <div class="row"><b>${doneCount} / ${rows.length} 完了</b><span class="deadline ${deadlineCls}">${deadline}</span></div>
    <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${rows.length}" aria-valuenow="${doneCount}"><i style="width:${(doneCount / rows.length) * 100}%"></i></div>
    <div class="meta"><span>${myStatus}</span>${off.length ? `<span>お休み: ${off.map((m) => esc(m.name)).join('、')}</span>` : ''}</div>
  </div>`;

  const cards = rows
    .map(({ area, member }) => {
      const done = doneBy[area.id];
      const isMine = member.id === state.me.id;
      let note = '';
      if (done) {
        const by = done.member_id !== member.id ? `${esc(memberName(done.member_id))}さんが` : '';
        note = `<div class="note">✓ ${by}${md(parseUtc(done.done_at))}に完了</div>`;
      } else if (w < 0) note = '<div class="note late">未完了</div>';

      let btn = '';
      if (w <= 0) {
        btn = done
          ? `<button class="btn undo" data-action="chore" data-area="${area.id}" data-done="0" aria-label="${esc(area.name)}の完了を取り消す">取り消す</button>`
          : `<button class="btn ${isMine ? 'primary' : 'ghost'}" data-action="chore" data-area="${area.id}" data-done="1" aria-label="${esc(area.name)}を完了にする">完了</button>`;
      }
      return `<div class="card chore ${isMine ? 'mine' : ''} ${done ? 'is-done' : ''} ${state.justDone === area.id ? 'pop' : ''}">
        <div class="body">
          <div class="area">${esc(area.name)}</div>
          <div class="who">${avatar(member)}${esc(member.name)}${isMine ? '<span class="badge">あなた</span>' : ''}</div>
          ${note}
        </div>
        ${btn}
      </div>`;
    })
    .join('');

  return `${head}${summary}<div class="${state.loading ? 'is-loading' : ''}" aria-busy="${state.loading}">${cards}</div>`;
}

function settingsHTML() {
  const list = (items, kind, withAvatar) =>
    items.length
      ? `<ul class="list">${items
          .map(
            (x) =>
              `<li><span class="li-name">${withAvatar ? avatar(x) : ''}${esc(x.name)}</span><button class="del" data-action="delete" data-kind="${kind}" data-id="${x.id}" aria-label="${esc(x.name)}を削除">${ICON.x}</button></li>`,
          )
          .join('')}</ul>`
      : '<p class="muted small">まだありません</p>';

  const install = isStandalone()
    ? ''
    : `<section class="card">
        <h3>ホーム画面に追加</h3>
        <p class="small" style="margin:6px 0 ${installEvent ? '12px' : '0'}">${installText()}</p>
        ${installEvent ? '<button class="btn primary" data-action="install">ホーム画面に追加</button>' : ''}
      </section>`;

  return `<div class="head"><div><h2>設定</h2></div></div>
    <section class="card">
      <h3>住人</h3>
      ${list(state.members, 'members', true)}
      <form class="add" data-form="members">
        <input name="name" placeholder="名前を入力" maxlength="30" autocomplete="off" enterkeyhint="done" aria-label="住人の名前">
        <button class="btn">追加</button>
      </form>
    </section>
    <section class="card">
      <h3>掃除場所</h3>
      ${list(state.areas, 'areas', false)}
      <form class="add" data-form="areas">
        <input name="name" placeholder="例: Toilet, Entrance" maxlength="30" autocomplete="off" enterkeyhint="done" aria-label="掃除場所の名前">
        <button class="btn">追加</button>
      </form>
      <p class="muted small note-p">当番は住人の登録順で、毎週自動でローテーションします。</p>
    </section>
    ${install}
    <button class="btn ghost block" data-action="switch">ユーザーを切り替える</button>`;
}

/* ---------- 洗濯機の予約シート ---------- */
function openSlot(date, slot) {
  const list = state.reservations.filter((r) => r.date === date && r.slot === slot).sort(byLevel);
  const mine = list.find((r) => r.member_id === state.me.id);
  const others = list.filter((r) => r.member_id !== state.me.id);
  const d = new Date(`${date}T00:00:00`);

  const who = list.length
    ? list.map((r) => `<span class="chip ${r.level}">${esc(memberName(r.member_id))}・${LEVEL[r.level]}</span>`).join('')
    : '<span class="muted small">まだ誰も予約していません</span>';

  const options = ['must', 'maybe']
    .map((level) => {
      const on = mine?.level === level;
      return `<button class="opt ${level} ${on ? 'selected' : ''}" data-action="reserve" data-level="${level}" aria-pressed="${on}">
        <i class="swatch ${level}" aria-hidden="true"></i>
        <span><b>${LEVEL[level]}</b><small>${LEVEL_NOTE[level]}</small></span>
        ${on ? `<i class="tick" aria-hidden="true">${ICON.check}</i>` : ''}
      </button>`;
    })
    .join('');

  $('#sheet-body').innerHTML = `
    <h3 id="sheet-title" tabindex="-1" autofocus>${mdw(d)} ${SLOTS[slot].label}</h3>
    <div class="when">${SLOTS[slot].time}</div>
    <div class="who-list">${who}</div>
    ${others.length ? '<p class="share-note">同じ枠に何人でも予約できます</p>' : ''}
    <div class="options">${options}</div>
    ${mine ? '<button class="btn danger block" data-action="reserve" data-level="">予約を取り消す</button>' : ''}
    <button class="btn ghost block" data-action="close">閉じる</button>`;
  sheet.dataset.date = date;
  sheet.dataset.slot = slot;
  sheet.showModal();
}

// 画面を先に更新し、失敗したら元に戻す
async function reserve(level) {
  const date = sheet.dataset.date;
  const slot = Number(sheet.dataset.slot);
  const src = source();
  const prev = state.reservations;
  const current = prev.find((r) => r.date === date && r.slot === slot && r.member_id === state.me.id);
  sheet.close();
  if ((current?.level ?? '') === level) return;

  const rest = prev.filter((r) => !(r.date === date && r.slot === slot && r.member_id === state.me.id));
  state.reservations = level ? [...rest, { date, slot, member_id: state.me.id, level }] : rest;
  render();
  buzz();
  toast(level ? `「${LEVEL[level]}」で予約しました` : '予約を取り消しました');
  try {
    await api('/laundry', { method: 'PUT', body: { date, slot, member_id: state.me.id, level: level || null } });
    if (src) cache.set(src.key, state.reservations);
  } catch (e) {
    if (source()?.key === src?.key) {
      state.reservations = prev;
      render();
    }
    toast(`保存できませんでした：${e.message}`);
  }
}

async function toggleChore(areaId, done) {
  const src = source();
  const week = ymd(choresMonday());
  const prev = state.done;
  const rest = prev.filter((d) => d.area_id !== areaId);
  state.done = done ? [...rest, { area_id: areaId, member_id: state.me.id, done_at: nowUtc() }] : rest;
  state.justDone = done ? areaId : null;
  render();
  state.justDone = null;
  buzz();
  toast(done ? 'おつかれさまでした ✨' : '完了を取り消しました');
  try {
    await api('/chores', { method: 'PUT', body: { week, area_id: areaId, member_id: state.me.id, done } });
    if (src) cache.set(src.key, state.done);
  } catch (e) {
    if (source()?.key === src?.key) {
      state.done = prev;
      render();
    }
    toast(`保存できませんでした：${e.message}`);
  }
}

/* ---------- events ---------- */
// iOS Safari で :active（押した見た目）を有効にする
document.addEventListener('touchstart', () => {}, { passive: true });

document.addEventListener('click', (e) => {
  // 表示中のタブをもう一度押したら先頭へスクロール
  const tabLink = e.target.closest('#tabs a');
  if (tabLink && tabLink.dataset.tab === state.tab) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  const el = e.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action;

  if (a === 'pick') {
    state.me = state.members.find((m) => m.id === Number(el.dataset.id));
    state.picking = false;
    storage((s) => s.setItem(KEY.me, state.me.id));
    window.scrollTo(0, 0);
    return run(() => show(state.tab));
  }
  if (a === 'switch') {
    state.picking = true;
    window.scrollTo(0, 0);
    return render();
  }
  if (a === 'cancel-pick') {
    state.picking = false;
    return run(() => show(state.tab));
  }
  if (a === 'slot') return openSlot(el.dataset.date, Number(el.dataset.slot));
  if (a === 'close') return sheet.close();
  if (a === 'reserve') return reserve(el.dataset.level);
  if (a === 'laundry-week' || a === 'chores-week') {
    state[a === 'laundry-week' ? 'laundryWeek' : 'choresWeek'] += Number(el.dataset.d);
    return run(() => show(state.tab));
  }
  if (a === 'chore') return toggleChore(Number(el.dataset.area), el.dataset.done === '1');
  if (a === 'dismiss-hint') {
    storage((s) => s.setItem(KEY.hint, '1'));
    return render();
  }
  if (a === 'install' && installEvent) {
    const ev = installEvent;
    installEvent = null;
    ev.prompt();
    return ev.userChoice.finally(render);
  }
  if (a === 'delete') {
    const kind = el.dataset.kind;
    const id = Number(el.dataset.id);
    const item = state[kind].find((x) => x.id === id);
    const note =
      kind === 'members'
        ? 'この人の洗濯予約も消え、掃除当番のローテーションが変わります。'
        : 'この場所の完了記録も消えます。';
    if (!confirm(`「${item.name}」を削除しますか？\n${note}`)) return;
    return run(async () => {
      await api(`/${kind}/${id}`, { method: 'DELETE' });
      await loadBase();
      await show(state.tab);
      toast('削除しました');
    });
  }
});

document.addEventListener('submit', (e) => {
  const form = e.target.closest('[data-form]');
  if (!form) return;
  e.preventDefault();
  const kind = form.dataset.form;
  const input = form.elements.name;
  if (!input.value.trim()) return input.focus();
  run(async () => {
    const row = await api(`/${kind}`, { method: 'POST', body: { name: input.value } });
    state[kind].push(row);
    storage((s) => s.setItem(KEY.base, JSON.stringify({ members: state.members, areas: state.areas })));
    render();
    toast(`「${row.name}」を追加しました`);
    // 続けて追加できるように同じ入力欄へ戻す
    view.querySelector(`[data-form="${kind}"] input`)?.focus();
  });
});

$('#me-btn').addEventListener('click', () => {
  state.picking = true;
  window.scrollTo(0, 0);
  render();
});

// シート：背景タップで閉じる / 下にスワイプで閉じる
sheet.addEventListener('click', (e) => e.target === sheet && sheet.close());
let drag = null;
sheet.addEventListener(
  'touchstart',
  (e) => {
    if (sheet.scrollTop > 0) return;
    drag = { y: e.touches[0].clientY, dy: 0 };
    sheet.style.transition = 'none';
  },
  { passive: true },
);
sheet.addEventListener(
  'touchmove',
  (e) => {
    if (!drag) return;
    drag.dy = Math.max(0, e.touches[0].clientY - drag.y);
    sheet.style.transform = drag.dy ? `translateY(${drag.dy}px)` : '';
  },
  { passive: true },
);
function endDrag() {
  if (!drag) return;
  const shouldClose = drag.dy > 90;
  drag = null;
  sheet.style.transition = 'transform .2s ease';
  sheet.style.transform = shouldClose ? 'translateY(100%)' : '';
  setTimeout(() => {
    sheet.style.transition = '';
    if (shouldClose) {
      sheet.close();
      sheet.style.transform = '';
    }
  }, 200);
}
sheet.addEventListener('touchend', endDrag);
sheet.addEventListener('touchcancel', endDrag);

window.addEventListener('hashchange', () => {
  window.scrollTo(0, 0);
  run(() => show(location.hash.slice(1)));
});

// アプリに戻ってきた時・定期的に最新化（入力中の設定画面と予約シート表示中は除く）
function refresh() {
  if (!state.me || state.picking || state.tab === 'settings' || sheet.open) return;
  loadBase()
    .then(() => show(state.tab, { silent: true }))
    .catch(() => {
      state.offline = true;
      render();
    });
}
document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && refresh());
setInterval(() => document.visibilityState === 'visible' && refresh(), POLL_MS);

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installEvent = e;
  if (state.me && !state.picking && state.tab !== 'settings') render();
});
window.addEventListener('appinstalled', () => {
  installEvent = null;
  storage((s) => s.setItem(KEY.hint, '1'));
  render();
});

/* ---------- boot ---------- */
(async function boot() {
  const tab = location.hash.slice(1);
  const cachedBase = storage((s) => JSON.parse(s.getItem(KEY.base)));
  try {
    if (cachedBase) {
      // 前回の内容ですぐ表示し、裏で最新化する
      applyBase(cachedBase);
      await Promise.all([show(tab), loadBase()]);
      render();
    } else {
      await loadBase();
      await show(tab);
    }
  } catch (e) {
    if (cachedBase) {
      state.offline = true;
      render();
    } else {
      view.innerHTML = `<div class="empty">読み込めませんでした。<br>${esc(e.message)}<br><br><button class="btn primary" onclick="location.reload()">再読み込み</button></div>`;
    }
  }
})();
