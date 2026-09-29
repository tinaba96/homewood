// homewood — シェアハウス用 洗濯予約 & 掃除当番

const SLOTS = [
  { label: '午前', time: '〜12時' },
  { label: '午後', time: '12〜18時' },
  { label: '夜', time: '18時〜' },
];
const LEVEL = { must: '絶対使う', maybe: '使うかも' };
const WD = ['日', '月', '火', '水', '木', '金', '土'];
const ME_KEY = 'homewood.me';

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
const weekIndex = (mon) => Math.floor(Date.UTC(mon.getFullYear(), mon.getMonth(), mon.getDate()) / 864e5 / 7);
const memberName = (id) => state.members.find((m) => m.id === id)?.name ?? '（退去済み）';

function storage(fn) {
  try {
    return fn(localStorage);
  } catch {
    return null;
  }
}

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 2400);
}

async function api(path, opts = {}) {
  const res = await fetch(`/api${path}`, {
    ...opts,
    headers: opts.body ? { 'content-type': 'application/json' } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `エラー (${res.status})`);
  return data;
}

async function run(fn) {
  try {
    await fn();
  } catch (e) {
    toast(e.message);
  }
}

/* ---------- 掃除当番の割り当て (週ごとにローテーション) ---------- */
function assignments(monday) {
  const n = state.members.length;
  if (!n) return [];
  const w = weekIndex(monday);
  return state.areas.map((area, i) => ({ area, member: state.members[(((i + w) % n) + n) % n] }));
}

/* ---------- data ---------- */
async function loadBase() {
  const data = await api('/bootstrap');
  state.members = data.members;
  state.areas = data.areas;
  const saved = Number(storage((s) => s.getItem(ME_KEY)));
  state.me = state.members.find((m) => m.id === saved) ?? null;
}

function laundryRange() {
  const from = addDays(today(), state.laundryWeek * 7);
  return { from, to: addDays(from, 6) };
}

function choresMonday() {
  return addDays(mondayOf(today()), state.choresWeek * 7);
}

/* ---------- render ---------- */
function render() {
  const picking = !state.me || state.picking;
  $('#tabs').hidden = picking;
  const meBtn = $('#me-btn');
  meBtn.hidden = picking;
  if (state.me) meBtn.textContent = state.me.name;

  if (picking) return renderPicker();
  document.querySelectorAll('#tabs a').forEach((a) => a.classList.toggle('active', a.dataset.tab === state.tab));
  ({ laundry: renderLaundry, chores: renderChores, settings: renderSettings })[state.tab]();
}

function renderPicker() {
  const people = state.members
    .map(
      (m) =>
        `<button class="person ${state.me?.id === m.id ? 'current' : ''}" data-action="pick" data-id="${m.id}">${esc(m.name)}</button>`,
    )
    .join('');
  view.innerHTML = `
    <section class="picker">
      <h2>あなたは誰？</h2>
      <p class="muted">名前を選んでください。この端末に記憶されます。</p>
      ${state.me ? '<button class="link" data-action="cancel-pick">← 戻る</button>' : ''}
      ${people ? `<div class="people">${people}</div>` : '<p class="empty">まだメンバーがいません。まず住人を追加してください。</p>'}
      <form class="add" data-form="member">
        <input name="name" placeholder="住人を追加（名前）" maxlength="30" autocomplete="off">
        <button class="btn">追加</button>
      </form>
    </section>`;
}

function renderLaundry() {
  const { from, to } = laundryRange();
  const t = ymd(today());
  const byCell = {};
  for (const r of state.reservations) (byCell[`${r.date}|${r.slot}`] ??= []).push(r);

  let rows = '';
  for (let i = 0; i < 7; i++) {
    const d = addDays(from, i);
    const key = ymd(d);
    rows += `<div class="day ${key === t ? 'today' : ''} ${d.getDay() === 0 ? 'sun' : ''}">
      ${md(d)}<small>${key === t ? '今日' : WD[d.getDay()]}</small></div>`;
    SLOTS.forEach((_, s) => {
      const list = byCell[`${key}|${s}`] ?? [];
      const chips = list
        .map(
          (r) =>
            `<span class="chip ${r.level} ${r.member_id === state.me.id ? 'mine' : ''}">${esc(memberName(r.member_id))}</span>`,
        )
        .join('');
      const hasMust = list.some((r) => r.level === 'must');
      rows += `<button class="cell ${hasMust ? 'has-must' : ''}" data-action="slot" data-date="${key}" data-slot="${s}"
        aria-label="${md(d)} ${SLOTS[s].label}">${chips || '<span class="plus">+</span>'}</button>`;
    });
  }

  view.innerHTML = `
    <div class="head">
      <h2>洗濯機の予約</h2>
      <div class="pager">
        <button class="icon-btn" data-action="laundry-week" data-d="-1" ${state.laundryWeek <= 0 ? 'disabled' : ''} aria-label="前の週">‹</button>
        <button class="icon-btn" data-action="laundry-week" data-d="1" ${state.laundryWeek >= 3 ? 'disabled' : ''} aria-label="次の週">›</button>
      </div>
    </div>
    <p class="muted small" style="margin:-8px 0 10px">${md(from)}(${WD[from.getDay()]}) 〜 ${md(to)}(${WD[to.getDay()]})・枠をタップして予約</p>
    <div class="legend">
      <span><i class="dot must"></i>絶対使う</span>
      <span><i class="dot maybe"></i>使うかも</span>
    </div>
    <div class="grid">
      <div></div>
      ${SLOTS.map((s) => `<div class="colhead"><b>${s.label}</b>${s.time}</div>`).join('')}
      ${rows}
    </div>`;
}

function openSlot(date, slot) {
  const list = state.reservations.filter((r) => r.date === date && r.slot === slot);
  const mine = list.find((r) => r.member_id === state.me.id);
  const othersMust = list.filter((r) => r.level === 'must' && r.member_id !== state.me.id);
  const d = new Date(`${date}T00:00:00`);

  const who = list.length
    ? list
        .map((r) => `<span class="chip ${r.level}">${esc(memberName(r.member_id))}・${LEVEL[r.level]}</span>`)
        .join('')
    : '<span class="muted small">まだ誰も予約していません</span>';

  $('#sheet-body').innerHTML = `
    <h3>${md(d)}(${WD[d.getDay()]}) ${SLOTS[slot].label}</h3>
    <div class="muted small">${SLOTS[slot].time}</div>
    <div class="who-list">${who}</div>
    ${othersMust.length ? `<div class="warn">⚠ ${othersMust.map((r) => esc(memberName(r.member_id))).join('、')}さんが「絶対使う」で予約しています</div>` : ''}
    <div class="actions">
      <button class="btn primary block" data-action="reserve" data-level="must" ${mine?.level === 'must' ? 'disabled' : ''}>
        ${mine?.level === 'must' ? '✓ ' : ''}絶対使う</button>
      <button class="btn soft block" data-action="reserve" data-level="maybe" ${mine?.level === 'maybe' ? 'disabled' : ''}>
        ${mine?.level === 'maybe' ? '✓ ' : ''}使うかも</button>
      ${mine ? '<button class="btn ghost block" data-action="reserve" data-level="">予約を取り消す</button>' : ''}
      <button class="link" data-action="close">閉じる</button>
    </div>`;
  sheet.dataset.date = date;
  sheet.dataset.slot = slot;
  sheet.showModal();
}

function renderChores() {
  const mon = choresMonday();
  const sun = addDays(mon, 6);
  const rows = assignments(mon);
  const doneBy = Object.fromEntries(state.done.map((d) => [d.area_id, d]));
  const doneCount = rows.filter((r) => doneBy[r.area.id]).length;
  const mineTotal = rows.filter((r) => r.member.id === state.me.id).length;
  const mineLeft = rows.filter((r) => r.member.id === state.me.id && !doneBy[r.area.id]).length;
  const assigned = new Set(rows.map((r) => r.member.id));
  const off = state.members.filter((m) => !assigned.has(m.id));
  const label = ['今週', '来週'][state.choresWeek] ?? (state.choresWeek < 0 ? `${-state.choresWeek}週前` : `${state.choresWeek}週後`);

  let body;
  if (!state.members.length || !state.areas.length) {
    body = `<div class="card empty">掃除場所が登録されていません。<br><a href="#settings">設定</a>から追加してください。</div>`;
  } else {
    body = `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <b>${doneCount} / ${rows.length} 完了</b>
          <span class="muted small">${!mineTotal ? 'あなたはお休み' : mineLeft ? `あなたの残り ${mineLeft} 件` : 'あなたの担当は完了 🎉'}</span>
        </div>
        <div class="progress"><i style="width:${rows.length ? (doneCount / rows.length) * 100 : 0}%"></i></div>
        ${off.length ? `<div class="muted small">お休み: ${off.map((m) => esc(m.name)).join('、')}</div>` : ''}
      </div>
      ${rows
        .map(({ area, member }) => {
          const done = doneBy[area.id];
          const mine = member.id === state.me.id;
          const doneNote = done
            ? `✓ ${esc(done.member_id === member.id ? '完了' : `${memberName(done.member_id)}さんが完了`)}`
            : '';
          return `
          <div class="card chore ${mine ? 'mine' : ''} ${done ? 'is-done' : ''}">
            <div class="body">
              <div class="area">${esc(area.name)}</div>
              <div class="who">${esc(member.name)}${mine ? '<span class="badge">あなた</span>' : ''} ${doneNote ? `・${doneNote}` : ''}</div>
            </div>
            ${
              done
                ? `<button class="btn done" data-action="chore" data-area="${area.id}" data-done="0">取り消す</button>`
                : `<button class="btn ${mine ? 'primary' : 'ghost'}" data-action="chore" data-area="${area.id}" data-done="1">完了</button>`
            }
          </div>`;
        })
        .join('')}`;
  }

  view.innerHTML = `
    <div class="head">
      <h2>掃除当番 <span class="muted small">${label}</span></h2>
      <div class="pager">
        <button class="icon-btn" data-action="chores-week" data-d="-1" ${state.choresWeek <= -4 ? 'disabled' : ''} aria-label="前の週">‹</button>
        <button class="icon-btn" data-action="chores-week" data-d="1" ${state.choresWeek >= 4 ? 'disabled' : ''} aria-label="次の週">›</button>
      </div>
    </div>
    <p class="muted small" style="margin:-8px 0 12px">${md(mon)}(月) 〜 <b>${md(sun)}(日)まで</b></p>
    ${body}`;
}

function renderSettings() {
  const list = (items, kind) =>
    items.length
      ? `<ul class="list">${items
          .map(
            (x) =>
              `<li><span>${esc(x.name)}</span><button class="del" data-action="delete" data-kind="${kind}" data-id="${x.id}" aria-label="${esc(x.name)}を削除">×</button></li>`,
          )
          .join('')}</ul>`
      : '<p class="muted small">まだありません</p>';

  view.innerHTML = `
    <section class="card">
      <h3>住人</h3>
      ${list(state.members, 'members')}
      <form class="add" data-form="member">
        <input name="name" placeholder="名前" maxlength="30" autocomplete="off">
        <button class="btn">追加</button>
      </form>
    </section>
    <section class="card">
      <h3>掃除場所</h3>
      ${list(state.areas, 'areas')}
      <form class="add" data-form="area">
        <input name="name" placeholder="例: Toilet, Entrance" maxlength="30" autocomplete="off">
        <button class="btn">追加</button>
      </form>
      <p class="muted small" style="margin:10px 0 0">当番は住人の登録順で毎週自動的にローテーションします。</p>
    </section>
    <button class="btn ghost block" data-action="switch">ユーザーを切り替える</button>`;
}

/* ---------- navigation ---------- */
async function show(tab) {
  state.tab = ['laundry', 'chores', 'settings'].includes(tab) ? tab : 'laundry';
  if (state.me && state.tab === 'laundry') {
    const { from, to } = laundryRange();
    state.reservations = await api(`/laundry?from=${ymd(from)}&to=${ymd(to)}`);
  } else if (state.me && state.tab === 'chores') {
    state.done = await api(`/chores?week=${ymd(choresMonday())}`);
  }
  render();
}
const refresh = () => run(() => show(state.tab));

/* ---------- events ---------- */
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action;

  if (a === 'pick') {
    state.me = state.members.find((m) => m.id === Number(el.dataset.id));
    state.picking = false;
    storage((s) => s.setItem(ME_KEY, state.me.id));
    return refresh();
  }
  if (a === 'switch') {
    state.picking = true;
    return render();
  }
  if (a === 'cancel-pick') {
    state.picking = false;
    return render();
  }
  if (a === 'slot') return openSlot(el.dataset.date, Number(el.dataset.slot));
  if (a === 'close') return sheet.close();
  if (a === 'reserve') {
    const { date, slot } = sheet.dataset;
    return run(async () => {
      await api('/laundry', {
        method: 'PUT',
        body: { date, slot: Number(slot), member_id: state.me.id, level: el.dataset.level || null },
      });
      sheet.close();
      toast(el.dataset.level ? `「${LEVEL[el.dataset.level]}」で予約しました` : '予約を取り消しました');
      await show('laundry');
    });
  }
  if (a === 'laundry-week') {
    state.laundryWeek += Number(el.dataset.d);
    return refresh();
  }
  if (a === 'chores-week') {
    state.choresWeek += Number(el.dataset.d);
    return refresh();
  }
  if (a === 'chore') {
    const done = el.dataset.done === '1';
    el.disabled = true;
    return run(async () => {
      await api('/chores', {
        method: 'PUT',
        body: { week: ymd(choresMonday()), area_id: Number(el.dataset.area), member_id: state.me.id, done },
      });
      if (done) toast('おつかれさまでした ✨');
      await show('chores');
    }).finally(() => (el.disabled = false));
  }
  if (a === 'delete') {
    const kind = el.dataset.kind;
    const id = Number(el.dataset.id);
    const item = state[kind].find((x) => x.id === id);
    const note = kind === 'members' ? 'この人の洗濯予約も消え、当番のローテーションが変わります。' : 'この場所の完了記録も消えます。';
    if (!confirm(`「${item.name}」を削除しますか？\n${note}`)) return;
    return run(async () => {
      await api(`/${kind}/${id}`, { method: 'DELETE' });
      await loadBase();
      await show(state.tab);
    });
  }
});

document.addEventListener('submit', (e) => {
  const form = e.target.closest('[data-form]');
  if (!form) return;
  e.preventDefault();
  const input = form.elements.name;
  const kind = form.dataset.form === 'member' ? 'members' : 'areas';
  run(async () => {
    const row = await api(`/${kind}`, { method: 'POST', body: { name: input.value } });
    state[kind].push(row);
    input.value = '';
    render();
    form.isConnected || view.querySelector(`[data-form="${form.dataset.form}"] input`)?.focus();
  });
});

$('#me-btn').addEventListener('click', () => {
  state.picking = true;
  render();
});
sheet.addEventListener('click', (e) => e.target === sheet && sheet.close());
window.addEventListener('hashchange', () => run(() => show(location.hash.slice(1))));
document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && state.me && refresh());

/* ---------- boot ---------- */
run(async () => {
  await loadBase();
  await show(location.hash.slice(1));
});
