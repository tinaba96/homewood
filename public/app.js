// homewood — シェアハウス用 洗濯機予約 & 掃除当番（スマホ前提）

const SLOT_END = [12, 18, 24]; // 午前 / 午後 / 夜 の終わりの時刻
const TABS = ['board', 'laundry', 'chores', 'settings'];
const POST_MAX = 280;
const KEY = {
  me: 'homewood.me',
  lang: 'homewood.lang',
  hint: 'homewood.hint-dismissed',
  base: 'homewood.base',
  cache: 'homewood.cache',
};

/* ---------- 表示言語（日本語がデフォルト） ---------- */
const I18N = {
  ja: {
    langName: '日本語',
    slots: [
      ['午前', '〜12時'],
      ['午後', '12〜18時'],
      ['夜', '18時〜'],
    ],
    level: { must: '絶対使う', maybe: '使うかも' },
    levelNote: { must: 'この時間に必ず使う', maybe: '使う可能性がある' },
    wd: ['日', '月', '火', '水', '木', '金', '土'],
    dayFmt: (md, wd) => `${md}(${wd})`,
    sep: '、',
    range: (a, b) => `${a} 〜 ${b}`,
    colon: '：',
    tabs: { board: '掲示板', laundry: '洗濯', chores: '掃除', settings: '設定' },
    menu: 'メニュー',
    switchUser: 'ユーザーを切り替える',
    shareIcon: '共有',
    moved: '退去済み',
    netErr: '通信できませんでした。電波を確認してください',
    httpErr: (s) => `エラーが発生しました (${s})`,
    installLead: 'ホーム画面に追加',
    installRest: 'すると、アプリのように開けます。',
    installHow: (icon, ios) => (ios ? `共有ボタン${icon}→「ホーム画面に追加」` : 'ブラウザのメニュー →「ホーム画面に追加」'),
    add: '追加',
    close: '閉じる',
    offline: 'オフラインです。最後に読み込んだ内容を表示しています',
    back: '戻る',
    whoAreYou: 'あなたは誰？',
    pickNote: '自分の名前をタップしてください。この端末に記憶されます。',
    noMembers: 'まだ住人がいません。下から追加してください。',
    addMemberPh: '住人を追加（名前）',
    memberNameLabel: '住人の名前',
    prev: (u) => `前の${u}`,
    next: (u) => `次の${u}`,
    unitDays: '7日',
    unitWeek: '週',
    today: '今日',
    ended: '終了',
    free: '空き',
    laundry: '洗濯機',
    tapToBook: '枠をタップして予約',
    weekLabel: (w) => (w === 0 ? '今週' : w === 1 ? '来週' : w === -1 ? '先週' : w < 0 ? `${-w}週前` : `${w}週後`),
    chores: '掃除当番',
    until: (d) => `${d}まで`,
    noAreas: '掃除場所か住人が登録されていません。',
    goSettings: (link) => `${link}から追加してください。`,
    allDone: 'ぜんぶ完了 🎉',
    dueToday: '今日が締め切り',
    dueTomorrow: '明日が締め切り',
    dueIn: (n) => `締め切りまであと${n}日`,
    closed: '締め切り済み',
    youOff: 'あなたは<b>お休み</b>',
    yourCount: (n) => `あなたの担当 <b>${n}件</b>`,
    yourLeft: (n) => `あなたの残り <b>${n}件</b>`,
    yourDone: 'あなたの担当は<b>完了</b>',
    doneOf: (a, b) => `${a} / ${b} 完了`,
    offList: (names) => `お休み: ${names}`,
    doneOn: (by, date) => `✓ ${by ? `${by}さんが` : ''}${date}に完了`,
    notDone: '未完了',
    undo: '取り消す',
    undoLabel: (n) => `${n}の完了を取り消す`,
    done: '完了',
    doneLabel: (n) => `${n}を完了にする`,
    you: 'あなた',
    deleteLabel: (n) => `${n}を削除`,
    none: 'まだありません',
    settings: '設定',
    members: '住人',
    namePh: '名前を入力',
    areas: '掃除場所',
    areaPh: '例: Toilet, Entrance',
    areaNameLabel: '掃除場所の名前',
    rotation: '当番は住人の登録順で、毎週自動でローテーションします。',
    language: '表示言語',
    nobody: 'まだ誰も予約していません',
    shareNote: '同じ枠に何人でも予約できます',
    mustNote: (names) => `${names}さんが「絶対使う」予定です。使っても大丈夫です。早めに取り出すなど、少しだけ気づかいを。`,
    legendNote: '予約は予定の共有です。「絶対使う」の人がいても洗濯機は使えます。',
    cancelBooking: '予約を取り消す',
    booked: (l) => `「${l}」で予約しました`,
    canceled: '予約を取り消しました',
    saveFail: (m) => `保存できませんでした：${m}`,
    thanks: 'おつかれさまでした ✨',
    undone: '完了を取り消しました',
    confirmDelete: (n, kind) =>
      `「${n}」を削除しますか？\n${kind === 'members' ? 'この人の洗濯予約と掲示板の投稿も消え、掃除当番のローテーションが変わります。' : 'この場所の完了記録も消えます。'}`,
    deleted: '削除しました',
    added: (n) => `「${n}」を追加しました`,
    loadFail: '読み込めませんでした。',
    reload: '再読み込み',
    board: '掲示板',
    boardNote: 'ひとり1枚のスペース。書き直すと前の内容は消えます。',
    yourSpace: 'あなたのスペース',
    postPh: 'いま思っていること、お知らせ、なんでも',
    postEmpty: 'まだ何も書いていません',
    postEmptyOther: 'まだ書いていません',
    write: '書く',
    edit: '書き直す',
    save: '保存',
    cancel: 'やめる',
    clear: '消す',
    charsLeft: (n) => `あと${n}文字`,
    charsOver: (n) => `${n}文字オーバー`,
    saved: '保存しました',
    cleared: '消しました',
    likeLabel: (n) => `${n}さんの投稿にいいね`,
    unlikeLabel: (n) => `${n}さんの投稿のいいねを取り消す`,
    likedBy: (names) => `${names}がいいね`,
    ago: (m) => (m < 1 ? 'たった今' : m < 60 ? `${m}分前` : m < 1440 ? `${Math.floor(m / 60)}時間前` : `${Math.floor(m / 1440)}日前`),
    confirmClear: '投稿を消しますか？',
    relikeNote: '書き直すと、いいねはリセットされます',
    howTo: 'やり方を見る',
    guideTitle: (n) => `${n} の掃除`,
    noGuide: 'まだガイドがありません。設定から書けます。',
    guideOtherLang: '（英語版のみあります）',
    editGuide: 'ガイドを編集',
    guideHelp: '「## 見出し」と「- 項目」が使えます',
    guideJa: '日本語',
    guideEn: 'English',
    guideSaved: 'ガイドを保存しました',
  },
  en: {
    langName: 'English',
    slots: [
      ['Morning', 'until 12:00'],
      ['Afternoon', '12:00–18:00'],
      ['Evening', 'from 18:00'],
    ],
    level: { must: 'Definitely', maybe: 'Maybe' },
    levelNote: { must: 'I will use it in this slot', maybe: 'I might use it' },
    wd: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    dayFmt: (md, wd) => `${wd} ${md}`,
    sep: ', ',
    range: (a, b) => `${a} – ${b}`,
    colon: ': ',
    tabs: { board: 'Board', laundry: 'Laundry', chores: 'Cleaning', settings: 'Settings' },
    menu: 'Menu',
    switchUser: 'Switch user',
    shareIcon: 'Share',
    moved: 'Former resident',
    netErr: "Couldn't connect. Check your connection.",
    httpErr: (s) => `Something went wrong (${s})`,
    installLead: 'Add to Home Screen',
    installRest: ' to open it like an app.',
    installHow: (icon, ios) => (ios ? `Share ${icon} → "Add to Home Screen"` : 'Browser menu → "Add to Home screen"'),
    add: 'Add',
    close: 'Close',
    offline: "You're offline. Showing the last loaded data.",
    back: 'Back',
    whoAreYou: 'Who are you?',
    pickNote: 'Tap your name. This device will remember it.',
    noMembers: 'No residents yet. Add one below.',
    addMemberPh: 'Add a resident (name)',
    memberNameLabel: 'Resident name',
    prev: (u) => `Previous ${u}`,
    next: (u) => `Next ${u}`,
    unitDays: '7 days',
    unitWeek: 'week',
    today: 'Today',
    ended: 'Over',
    free: 'Free',
    laundry: 'Laundry',
    tapToBook: 'Tap a slot to book',
    weekLabel: (w) =>
      w === 0 ? 'This week' : w === 1 ? 'Next week' : w === -1 ? 'Last week' : w < 0 ? `${-w} weeks ago` : `In ${w} weeks`,
    chores: 'Cleaning',
    until: (d) => `due ${d}`,
    noAreas: 'No cleaning areas or residents yet.',
    goSettings: (link) => `Add them in ${link}.`,
    allDone: 'All done 🎉',
    dueToday: 'Due today',
    dueTomorrow: 'Due tomorrow',
    dueIn: (n) => `${n} days left`,
    closed: 'Closed',
    youOff: "You're <b>off</b> this week",
    yourCount: (n) => `Your tasks: <b>${n}</b>`,
    yourLeft: (n) => `<b>${n}</b> left for you`,
    yourDone: 'Your tasks are <b>done</b>',
    doneOf: (a, b) => `${a} / ${b} done`,
    offList: (names) => `Off: ${names}`,
    doneOn: (by, date) => `✓ Done${by ? ` by ${by}` : ''} on ${date}`,
    notDone: 'Not done',
    undo: 'Undo',
    undoLabel: (n) => `Mark ${n} as not done`,
    done: 'Done',
    doneLabel: (n) => `Mark ${n} as done`,
    you: 'You',
    deleteLabel: (n) => `Delete ${n}`,
    none: 'Nothing yet',
    settings: 'Settings',
    members: 'Residents',
    namePh: 'Name',
    areas: 'Cleaning areas',
    areaPh: 'e.g. Toilet, Entrance',
    areaNameLabel: 'Cleaning area name',
    rotation: 'Duties rotate every week, in the order residents were added.',
    language: 'Language',
    nobody: 'No one has booked yet',
    shareNote: 'Any number of people can book the same slot',
    mustNote: (names) => `${names} definitely plans to use it. You can still use it. Just be considerate, like taking your laundry out promptly.`,
    legendNote: 'Bookings just share plans. You can still use the machine when someone picked "Definitely".',
    cancelBooking: 'Cancel booking',
    booked: (l) => `Booked as "${l}"`,
    canceled: 'Booking canceled',
    saveFail: (m) => `Couldn't save: ${m}`,
    thanks: 'Thanks for cleaning ✨',
    undone: 'Marked as not done',
    confirmDelete: (n, kind) =>
      `Delete "${n}"?\n${kind === 'members' ? "Their laundry bookings and board post will be removed, and the cleaning rotation will change." : 'Its completion history will be removed.'}`,
    deleted: 'Deleted',
    added: (n) => `Added "${n}"`,
    loadFail: "Couldn't load the app.",
    reload: 'Reload',
    board: 'Board',
    boardNote: 'One space per person. Rewriting replaces what was there.',
    yourSpace: 'Your space',
    postPh: "What's on your mind, a heads-up, anything",
    postEmpty: "You haven't written anything yet",
    postEmptyOther: 'Nothing yet',
    write: 'Write',
    edit: 'Rewrite',
    save: 'Save',
    cancel: 'Cancel',
    clear: 'Clear',
    charsLeft: (n) => `${n} left`,
    charsOver: (n) => `${n} over`,
    saved: 'Saved',
    cleared: 'Cleared',
    likeLabel: (n) => `Like ${n}'s post`,
    unlikeLabel: (n) => `Unlike ${n}'s post`,
    likedBy: (names) => `Liked by ${names}`,
    ago: (m) => (m < 1 ? 'just now' : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m / 60)}h ago` : `${Math.floor(m / 1440)}d ago`),
    confirmClear: 'Clear your post?',
    relikeNote: 'Rewriting resets likes',
    howTo: 'How to clean',
    guideTitle: (n) => `Cleaning the ${n}`,
    noGuide: 'No guide yet. You can write one in Settings.',
    guideOtherLang: '(Japanese version only)',
    editGuide: 'Edit guide',
    guideHelp: 'You can use "## Heading" and "- item"',
    guideJa: '日本語',
    guideEn: 'English',
    guideSaved: 'Guide saved',
  },
};
let lang = 'ja';
let t = I18N.ja;
function setLang(next) {
  lang = I18N[next] ? next : 'ja';
  t = I18N[lang];
  document.documentElement.lang = lang;
  document.querySelectorAll('#tabs a').forEach((a) => (a.querySelector('span').textContent = t.tabs[a.dataset.tab]));
  $('#tabs').setAttribute('aria-label', t.menu);
  $('#me-btn').setAttribute('aria-label', t.switchUser);
}
const POLL_MS = 60_000;

const ICON = {
  left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  right: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2 2 0 0 1 6 3.5h5v16H6a2 2 0 0 0-2 2z"/><path d="M20 5.5a2 2 0 0 0-2-2h-5v16h5a2 2 0 0 1 2 2z"/></svg>',
  heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 8a4.2 4.2 0 0 1 7.5 2.5c0 5.4-7.5 10-7.5 10z"/></svg>',
  share:
    '<svg class="inline-icon" viewBox="0 0 24 24" role="img"><path d="M12 15V3M7.5 7.5L12 3l4.5 4.5M7 10H5.5v11h13V10H17"/></svg>',
};

const $ = (s) => document.querySelector(s);
const view = $('#view');
const sheet = $('#sheet');

const state = {
  members: [],
  areas: [],
  me: null,
  picking: false, // ユーザー選択画面を表示中
  tab: 'board',
  laundryWeek: 0, // 今日から何週先か
  choresWeek: 0, // 今週から何週先か
  reservations: [],
  done: [],
  loading: false,
  offline: false,
  justDone: null, // 完了アニメーションを付ける場所 id
  board: { posts: [], likes: [] },
  editing: false, // 掲示板の自分のスペースを編集中
  draft: '',
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
const mdw = (d) => t.dayFmt(md(d), t.wd[d.getDay()]);
const weekIndex = (mon) => Math.floor(Date.UTC(mon.getFullYear(), mon.getMonth(), mon.getDate()) / 864e5 / 7);
const memberName = (id) => state.members.find((m) => m.id === id)?.name ?? t.moved;
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
      headers: { 'x-lang': lang, ...(opts.body ? { 'content-type': 'application/json' } : {}) },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new Error(t.netErr);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || t.httpErr(res.status));
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
  if (state.tab === 'board') return { key: 'board', url: '/board', field: 'board' };
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
  const nextTab = TABS.includes(tab) ? tab : TABS[0];
  if (nextTab !== state.tab) {
    state.editing = false;
    state.draft = '';
  }
  state.tab = nextTab;
  const src = state.me && !state.picking ? source() : null;
  if (!src) return render();

  const token = ++seq;
  const cached = cache.get(src.key);
  if (cached) state[src.field] = cached;
  else if (!silent) state[src.field] = src.field === 'board' ? { posts: [], likes: [] } : [];
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
const shareIcon = () => ICON.share.replace('role="img"', `role="img" aria-label="${t.shareIcon}"`);
const installHow = () => t.installHow(shareIcon(), isIOS());
const installText = () => `${t.installLead}${t.installRest}${installEvent ? '' : ` ${installHow()}`}`;

function hintHTML() {
  if (isStandalone() || !isTouch() || storage((s) => s.getItem(KEY.hint))) return '';
  return `<div class="hint">
    <div><b>${t.installLead}</b>${t.installRest}${installEvent ? '' : `<span class="how">${installHow()}</span>`}</div>
    ${installEvent ? `<button class="btn primary sm" data-action="install">${t.add}</button>` : ''}
    <button class="x" data-action="dismiss-hint" aria-label="${t.close}">${ICON.x}</button>
  </div>`;
}

const noticeHTML = () =>
  state.offline ? `<div class="notice">${t.offline}</div>` : '';

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
  view.innerHTML = picking ? pickerHTML() : { laundry: laundryHTML, chores: choresHTML, board: boardHTML, settings: settingsHTML }[state.tab]();
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
    <div class="picker-top">
      ${state.me ? `<button class="back" data-action="cancel-pick">${ICON.left}${t.back}</button>` : '<span></span>'}
      ${langToggleHTML()}
    </div>
    <h2>${t.whoAreYou}</h2>
    <p class="muted">${t.pickNote}</p>
    ${people ? `<div class="people">${people}</div>` : `<p class="empty">${t.noMembers}</p>`}
    <form class="add" data-form="members">
      <input name="name" placeholder="${t.addMemberPh}" maxlength="30" autocomplete="off" enterkeyhint="done" aria-label="${t.memberNameLabel}">
      <button class="btn">${t.add}</button>
    </form>
  </section>`;
}

// 日本語 / English の切り替え
function langToggleHTML() {
  return `<div class="seg" role="group" aria-label="${t.language}">${Object.keys(I18N)
    .map(
      (k) =>
        `<button type="button" class="${k === lang ? 'on' : ''}" data-action="lang" data-lang="${k}" aria-pressed="${k === lang}">${I18N[k].langName}</button>`,
    )
    .join('')}</div>`;
}

function pagerHTML(action, value, min, max, unit) {
  return `<div class="pager">
    <button class="icon-btn" data-action="${action}" data-d="-1" ${value <= min ? 'disabled' : ''} aria-label="${t.prev(unit)}">${ICON.left}</button>
    <button class="icon-btn" data-action="${action}" data-d="1" ${value >= max ? 'disabled' : ''} aria-label="${t.next(unit)}">${ICON.right}</button>
  </div>`;
}

function laundryHTML() {
  const { from, to } = laundryRange();
  const now = new Date();
  const todayKey = ymd(now);
  const byCell = {};
  for (const r of state.reservations) (byCell[`${r.date}|${r.slot}`] ??= []).push(r);

  let rows = '';
  for (let i = 0; i < 7; i++) {
    const d = addDays(from, i);
    const key = ymd(d);
    const isToday = key === todayKey;
    const dow = d.getDay();
    rows += `<div class="day ${isToday ? 'today' : ''} ${dow === 0 ? 'sun' : dow === 6 ? 'sat' : ''}">
      ${md(d)}<small>${isToday ? t.today : t.wd[dow]}</small></div>`;
    SLOT_END.forEach((end, s) => {
      const list = (byCell[`${key}|${s}`] ?? []).sort(byLevel);
      const past = key < todayKey || (isToday && now.getHours() >= end);
      const musts = list.filter((r) => r.level === 'must').length;
      const cls = ['cell', past && 'past', musts && 'has-must'].filter(Boolean).join(' ');
      const chips = list
        .map(
          (r) =>
            `<span class="chip ${r.level} ${r.member_id === state.me.id ? 'mine' : ''}">${esc(memberName(r.member_id))}</span>`,
        )
        .join('');
      const said = list.length
        ? list.map((r) => `${memberName(r.member_id)} ${t.level[r.level]}`).join(t.sep)
        : past
          ? t.ended
          : t.free;
      rows += `<button class="${cls}" data-action="slot" data-date="${key}" data-slot="${s}" ${past ? 'disabled' : ''}
        aria-label="${esc(`${mdw(d)} ${t.slots[s][0]}${t.colon}${said}`)}">${chips || (past ? '' : '<span class="plus" aria-hidden="true">+</span>')}</button>`;
    });
  }

  return `${noticeHTML()}
    <div class="head">
      <div>
        <h2>${t.laundry}</h2>
        <p class="sub">${t.range(mdw(from), mdw(to))}</p>
      </div>
      ${pagerHTML('laundry-week', state.laundryWeek, 0, 3, t.unitDays)}
    </div>
    <div class="legend">
      <span><i class="swatch must"></i>${t.level.must}</span>
      <span><i class="swatch maybe"></i>${t.level.maybe}</span>
      <span>${t.tapToBook}</span>
    </div>
    <p class="legend-note">${t.legendNote}</p>
    <div class="grid ${state.loading ? 'is-loading' : ''}" aria-busy="${state.loading}">
      <div class="colhead"></div>
      ${t.slots.map(([label, time]) => `<div class="colhead"><b>${label}</b>${time}</div>`).join('')}
      ${rows}
    </div>`;
}

function choresHTML() {
  const w = state.choresWeek;
  const mon = choresMonday();
  const sun = addDays(mon, 6);
  const rows = assignments(mon);
  const head = `${noticeHTML()}
    <div class="head">
      <div>
        <h2>${t.chores}<span class="tag">${t.weekLabel(w)}</span></h2>
        <p class="sub">${t.range(mdw(mon), `<b>${t.until(mdw(sun))}</b>`)}</p>
      </div>
      ${pagerHTML('chores-week', w, -4, 4, t.unitWeek)}
    </div>`;
  if (!rows.length) {
    return `${head}<div class="card empty">${t.noAreas}<br>${t.goSettings(`<a href="#settings">${t.settings}</a>`)}</div>`;
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
  if (allDone && w <= 0) [deadline, deadlineCls] = [t.allDone, 'clear'];
  else if (w === 0) {
    const left = Math.round((sun - today()) / 864e5);
    deadline = left === 0 ? t.dueToday : left === 1 ? t.dueTomorrow : t.dueIn(left);
    deadlineCls = left <= 1 ? 'urgent' : '';
  } else if (w < 0) [deadline, deadlineCls] = [t.closed, 'urgent'];

  let myStatus;
  if (!mine.length) myStatus = t.youOff;
  else if (w > 0) myStatus = t.yourCount(mine.length);
  else myStatus = mineLeft ? t.yourLeft(mineLeft) : t.yourDone;

  const summary = `<div class="card summary">
    <div class="row"><b>${t.doneOf(doneCount, rows.length)}</b><span class="deadline ${deadlineCls}">${deadline}</span></div>
    <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${rows.length}" aria-valuenow="${doneCount}"><i style="width:${(doneCount / rows.length) * 100}%"></i></div>
    <div class="meta"><span>${myStatus}</span>${off.length ? `<span>${t.offList(off.map((m) => esc(m.name)).join(t.sep))}</span>` : ''}</div>
  </div>`;

  const cards = rows
    .map(({ area, member }) => {
      const done = doneBy[area.id];
      const isMine = member.id === state.me.id;
      let note = '';
      if (done) {
        const by = done.member_id !== member.id ? esc(memberName(done.member_id)) : '';
        note = `<div class="note">${t.doneOn(by, md(parseUtc(done.done_at)))}</div>`;
      } else if (w < 0) note = `<div class="note late">${t.notDone}</div>`;

      let btn = '';
      if (w <= 0) {
        btn = done
          ? `<button class="btn undo" data-action="chore" data-area="${area.id}" data-done="0" aria-label="${esc(t.undoLabel(area.name))}">${t.undo}</button>`
          : `<button class="btn ${isMine ? 'primary' : 'ghost'}" data-action="chore" data-area="${area.id}" data-done="1" aria-label="${esc(t.doneLabel(area.name))}">${t.done}</button>`;
      }
      return `<div class="card chore ${isMine ? 'mine' : ''} ${done ? 'is-done' : ''} ${state.justDone === area.id ? 'pop' : ''}">
        <div class="body">
          <div class="area">${esc(area.name)}</div>
          <div class="who">${avatar(member)}${esc(member.name)}${isMine ? `<span class="badge">${t.you}</span>` : ''}</div>
          ${note}
          ${hasGuide(area) ? `<button class="howto" data-action="guide" data-area="${area.id}">${ICON.book}${t.howTo}</button>` : ''}
        </div>
        ${btn}
      </div>`;
    })
    .join('');

  return `${head}${summary}<div class="${state.loading ? 'is-loading' : ''}" aria-busy="${state.loading}">${cards}</div>`;
}

/* ---------- 掲示板（ひとり1枚、上書きのみ） ---------- */
const minutesAgo = (s) => Math.max(0, Math.floor((Date.now() - parseUtc(s)) / 60000));
// 改行を残しつつ安全に表示
const multiline = (text) => esc(text).replace(/\n/g, '<br>');

function postCardHTML(m, post, likes) {
  const isMine = m.id === state.me.id;
  const likers = likes.filter((l) => l.owner_id === m.id).map((l) => l.liker_id);
  const liked = likers.includes(state.me.id);
  const likerNames = likers.map((id) => esc(memberName(id))).join(t.sep);

  let body;
  if (isMine && state.editing) {
    const len = [...state.draft].length;
    const over = len - POST_MAX;
    body = `<form class="post-edit" data-form="post">
      <textarea name="body" rows="4" maxlength="${POST_MAX * 2}" placeholder="${t.postPh}" aria-label="${t.yourSpace}" autofocus>${esc(state.draft)}</textarea>
      <div class="edit-row">
        <span class="count ${over > 0 ? 'over' : ''}" aria-live="polite">${over > 0 ? t.charsOver(over) : t.charsLeft(-over)}</span>
        <span class="spacer"></span>
        <button type="button" class="btn ghost sm" data-action="post-cancel">${t.cancel}</button>
        <button class="btn primary sm" ${over > 0 ? 'disabled' : ''}>${t.save}</button>
      </div>
      ${post && likers.length ? `<p class="muted small" style="margin:8px 0 0">${t.relikeNote}</p>` : ''}
    </form>`;
  } else if (post) {
    body = `<p class="post-body">${multiline(post.body)}</p>`;
  } else {
    body = `<p class="post-body empty-post">${isMine ? t.postEmpty : t.postEmptyOther}</p>`;
  }

  let foot = '';
  if (!(isMine && state.editing)) {
    const likeBtn = isMine
      ? likers.length
        ? `<span class="like static on" aria-hidden="true">${ICON.heart}${likers.length}</span>`
        : ''
      : post
        ? `<button class="like ${liked ? 'on' : ''}" data-action="like" data-owner="${m.id}" data-on="${liked ? 0 : 1}" aria-pressed="${liked}" aria-label="${esc(liked ? t.unlikeLabel(m.name) : t.likeLabel(m.name))}">${ICON.heart}${likers.length || ''}</button>`
        : '';
    const mineBtns = isMine
      ? `<span class="spacer"></span>
         ${post ? `<button class="btn ghost sm" data-action="post-clear">${t.clear}</button>` : ''}
         <button class="btn ${post ? 'ghost' : 'primary'} sm" data-action="post-edit">${post ? t.edit : t.write}</button>`
      : '';
    foot = `<div class="post-foot">${likeBtn}${likerNames ? `<span class="likers">${t.likedBy(likerNames)}</span>` : ''}${mineBtns}</div>`;
  }

  return `<article class="card post ${isMine ? 'mine' : ''}" aria-label="${esc(m.name)}">
    <header class="post-head">${avatar(m)}<b>${esc(m.name)}</b>${isMine ? `<span class="badge">${t.you}</span>` : ''}
      ${post ? `<time class="muted small" datetime="${post.updated_at}">${t.ago(minutesAgo(post.updated_at))}</time>` : ''}</header>
    ${body}${foot}
  </article>`;
}

function boardHTML() {
  const { posts, likes } = state.board;
  const byMember = Object.fromEntries(posts.map((p) => [p.member_id, p]));
  // 自分を先頭に、あとは登録順
  const order = [state.me, ...state.members.filter((m) => m.id !== state.me.id)];
  return `${hintHTML()}${noticeHTML()}
    <div class="head"><div><h2>${t.board}</h2><p class="sub">${t.boardNote}</p></div></div>
    <div class="${state.loading ? 'is-loading' : ''}" aria-busy="${state.loading}">
      ${order.map((m) => postCardHTML(m, byMember[m.id], likes)).join('')}
    </div>`;
}

// 投稿の保存（空なら削除）。画面を先に更新し、失敗したら戻す
async function savePost(text) {
  const prev = state.board;
  const posts = prev.posts.filter((p) => p.member_id !== state.me.id);
  if (text) posts.push({ member_id: state.me.id, body: text, updated_at: nowUtc() });
  state.board = { posts, likes: prev.likes.filter((l) => l.owner_id !== state.me.id) };
  state.editing = false;
  state.draft = '';
  render();
  buzz();
  toast(text ? t.saved : t.cleared);
  try {
    await api(`/board/${state.me.id}`, { method: 'PUT', body: { body: text } });
    cache.set('board', state.board);
  } catch (e) {
    if (state.tab === 'board') {
      state.board = prev;
      if (text) {
        state.editing = true;
        state.draft = text;
      }
      render();
    }
    toast(t.saveFail(e.message));
  }
}

async function toggleLike(owner, on) {
  const prev = state.board;
  const likes = prev.likes.filter((l) => !(l.owner_id === owner && l.liker_id === state.me.id));
  if (on) likes.push({ owner_id: owner, liker_id: state.me.id });
  state.board = { ...prev, likes };
  render();
  buzz();
  try {
    await api(`/board/${owner}/like`, { method: 'PUT', body: { liker_id: state.me.id, on } });
    cache.set('board', state.board);
  } catch (e) {
    if (state.tab === 'board') {
      state.board = prev;
      render();
    }
    toast(t.saveFail(e.message));
  }
}

/* ---------- 掃除ガイド ---------- */
const guideText = (area) => (lang === 'en' ? area.guide_en || area.guide_ja : area.guide_ja || area.guide_en) || '';
const guideImages = (area) => {
  try {
    const list = JSON.parse(area.images || '[]');
    return Array.isArray(list) ? list.filter((i) => i && typeof i.src === 'string') : [];
  } catch {
    return [];
  }
};
const hasGuide = (area) => !!(area.guide_ja || area.guide_en || guideImages(area).length);

function guideHTML(text) {
  const out = [];
  let list = null;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('- ') || line.startsWith('・')) {
      if (!list) out.push((list = []));
      list.push(`<li>${esc(line.replace(/^(- |・)/, ''))}</li>`);
      continue;
    }
    list = null;
    if (!line) continue;
    if (line.startsWith('## ')) out.push(`<h4>${esc(line.slice(3))}</h4>`);
    else out.push(`<p>${esc(line)}</p>`);
  }
  return out.map((x) => (Array.isArray(x) ? `<ul>${x.join('')}</ul>` : x)).join('');
}

function openGuide(areaId) {
  const area = state.areas.find((a) => a.id === areaId);
  if (!area) return;
  const text = guideText(area);
  const onlyOther = text && !(lang === 'en' ? area.guide_en : area.guide_ja);
  $('#sheet-body').innerHTML = `
    <h3 id="sheet-title" tabindex="-1" autofocus>${esc(t.guideTitle(area.name))}</h3>
    ${onlyOther ? `<div class="when">${t.guideOtherLang}</div>` : ''}
    <div class="guide">${text ? guideHTML(text) : `<p class="muted">${t.noGuide}</p>`}</div>
    ${guideImages(area)
      .map((i) => {
        const cap = (lang === 'en' ? i.en || i.ja : i.ja || i.en) || '';
        return `<figure class="guide-fig"><img class="guide-img" src="${esc(i.src)}" alt="${esc(cap)}" loading="lazy">${cap ? `<figcaption>${esc(cap)}</figcaption>` : ''}</figure>`;
      })
      .join('')}
    <button class="btn ghost block" data-action="close">${t.close}</button>`;
  sheet.showModal();
}

function openGuideEditor(areaId) {
  const area = state.areas.find((a) => a.id === areaId);
  if (!area) return;
  $('#sheet-body').innerHTML = `
    <h3 id="sheet-title" tabindex="-1" autofocus>${esc(t.guideTitle(area.name))}</h3>
    <div class="when">${t.guideHelp}</div>
    <form class="guide-edit" data-form="guide" data-area="${area.id}">
      <label>${t.guideJa}<textarea name="guide_ja" rows="7" maxlength="2000">${esc(area.guide_ja || '')}</textarea></label>
      <label>${t.guideEn}<textarea name="guide_en" rows="7" maxlength="2000">${esc(area.guide_en || '')}</textarea></label>
      <button class="btn primary block">${t.save}</button>
      <button type="button" class="btn ghost block" data-action="close">${t.cancel}</button>
    </form>`;
  sheet.showModal();
}

async function saveGuide(areaId, guide_ja, guide_en) {
  await api(`/areas/${areaId}/guide`, { method: 'PUT', body: { guide_ja, guide_en } });
  const area = state.areas.find((a) => a.id === areaId);
  if (area) Object.assign(area, { guide_ja, guide_en });
  storage((s) => s.setItem(KEY.base, JSON.stringify({ members: state.members, areas: state.areas })));
  sheet.close();
  toast(t.guideSaved);
  render();
}

function settingsHTML() {
  const list = (items, kind, withAvatar) =>
    items.length
      ? `<ul class="list">${items
          .map(
            (x) =>
              `<li><span class="li-name">${withAvatar ? avatar(x) : ''}${esc(x.name)}</span><span class="li-actions">${kind === 'areas' ? `<button class="btn ghost sm" data-action="guide-edit" data-area="${x.id}">${t.editGuide}</button>` : ''}<button class="del" data-action="delete" data-kind="${kind}" data-id="${x.id}" aria-label="${esc(t.deleteLabel(x.name))}">${ICON.x}</button></span></li>`,
          )
          .join('')}</ul>`
      : `<p class="muted small">${t.none}</p>`;

  const install = isStandalone()
    ? ''
    : `<section class="card">
        <h3>${t.installLead}</h3>
        <p class="small" style="margin:6px 0 ${installEvent ? '12px' : '0'}">${installText()}</p>
        ${installEvent ? `<button class="btn primary" data-action="install">${t.installLead}</button>` : ''}
      </section>`;

  return `<div class="head"><div><h2>${t.settings}</h2></div></div>
    <section class="card lang-card">
      <h3>${t.language} / Language</h3>
      ${langToggleHTML()}
    </section>
    <section class="card">
      <h3>${t.members}</h3>
      ${list(state.members, 'members', true)}
      <form class="add" data-form="members">
        <input name="name" placeholder="${t.namePh}" maxlength="30" autocomplete="off" enterkeyhint="done" aria-label="${t.memberNameLabel}">
        <button class="btn">${t.add}</button>
      </form>
    </section>
    <section class="card">
      <h3>${t.areas}</h3>
      ${list(state.areas, 'areas', false)}
      <form class="add" data-form="areas">
        <input name="name" placeholder="${t.areaPh}" maxlength="30" autocomplete="off" enterkeyhint="done" aria-label="${t.areaNameLabel}">
        <button class="btn">${t.add}</button>
      </form>
      <p class="muted small note-p">${t.rotation}</p>
    </section>
    ${install}
    <button class="btn ghost block" data-action="switch">${t.switchUser}</button>`;
}

/* ---------- 洗濯機の予約シート ---------- */
function openSlot(date, slot) {
  const list = state.reservations.filter((r) => r.date === date && r.slot === slot).sort(byLevel);
  const mine = list.find((r) => r.member_id === state.me.id);
  const others = list.filter((r) => r.member_id !== state.me.id);
  const othersMust = others.filter((r) => r.level === 'must');
  const d = new Date(`${date}T00:00:00`);

  const who = list.length
    ? list.map((r) => `<span class="chip ${r.level}">${esc(memberName(r.member_id))} · ${t.level[r.level]}</span>`).join('')
    : `<span class="muted small">${t.nobody}</span>`;

  const options = ['must', 'maybe']
    .map((level) => {
      const on = mine?.level === level;
      return `<button class="opt ${level} ${on ? 'selected' : ''}" data-action="reserve" data-level="${level}" aria-pressed="${on}">
        <i class="swatch ${level}" aria-hidden="true"></i>
        <span><b>${t.level[level]}</b><small>${t.levelNote[level]}</small></span>
        ${on ? `<i class="tick" aria-hidden="true">${ICON.check}</i>` : ''}
      </button>`;
    })
    .join('');

  $('#sheet-body').innerHTML = `
    <h3 id="sheet-title" tabindex="-1" autofocus>${mdw(d)} ${t.slots[slot][0]}</h3>
    <div class="when">${t.slots[slot][1]}</div>
    <div class="who-list">${who}</div>
    ${
      othersMust.length
        ? `<p class="share-note must-note">${t.mustNote(othersMust.map((r) => esc(memberName(r.member_id))).join(t.sep))}</p>`
        : others.length
          ? `<p class="share-note">${t.shareNote}</p>`
          : ''
    }
    <div class="options">${options}</div>
    ${mine ? `<button class="btn danger block" data-action="reserve" data-level="">${t.cancelBooking}</button>` : ''}
    <button class="btn ghost block" data-action="close">${t.close}</button>`;
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
  toast(level ? t.booked(t.level[level]) : t.canceled);
  try {
    await api('/laundry', { method: 'PUT', body: { date, slot, member_id: state.me.id, level: level || null } });
    if (src) cache.set(src.key, state.reservations);
  } catch (e) {
    if (source()?.key === src?.key) {
      state.reservations = prev;
      render();
    }
    toast(t.saveFail(e.message));
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
  toast(done ? t.thanks : t.undone);
  try {
    await api('/chores', { method: 'PUT', body: { week, area_id: areaId, member_id: state.me.id, done } });
    if (src) cache.set(src.key, state.done);
  } catch (e) {
    if (source()?.key === src?.key) {
      state.done = prev;
      render();
    }
    toast(t.saveFail(e.message));
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
  if (a === 'lang') {
    setLang(el.dataset.lang);
    storage((s) => s.setItem(KEY.lang, lang));
    return render();
  }
  if (a === 'guide') return openGuide(Number(el.dataset.area));
  if (a === 'guide-edit') return openGuideEditor(Number(el.dataset.area));
  if (a === 'post-edit') {
    state.editing = true;
    state.draft = state.board.posts.find((p) => p.member_id === state.me.id)?.body ?? '';
    render();
    const ta = view.querySelector('textarea');
    ta?.focus();
    ta?.setSelectionRange(ta.value.length, ta.value.length);
    return;
  }
  if (a === 'post-cancel') {
    state.editing = false;
    state.draft = '';
    return render();
  }
  if (a === 'post-clear') {
    if (!confirm(t.confirmClear)) return;
    return savePost('');
  }
  if (a === 'like') return toggleLike(Number(el.dataset.owner), el.dataset.on === '1');
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
    if (!confirm(t.confirmDelete(item.name, kind))) return;
    return run(async () => {
      await api(`/${kind}/${id}`, { method: 'DELETE' });
      await loadBase();
      await show(state.tab);
      toast(t.deleted);
    });
  }
});

document.addEventListener('submit', (e) => {
  const form = e.target.closest('[data-form]');
  if (!form) return;
  e.preventDefault();
  if (form.dataset.form === 'guide') {
    const btn = form.querySelector('.btn.primary');
    btn.disabled = true;
    return run(() => saveGuide(Number(form.dataset.area), form.elements.guide_ja.value, form.elements.guide_en.value)).finally(() => (btn.disabled = false));
  }
  if (form.dataset.form === 'post') {
    const text = form.elements.body.value.trim();
    if ([...text].length > POST_MAX) return;
    return savePost(text);
  }
  const kind = form.dataset.form;
  const input = form.elements.name;
  if (!input.value.trim()) return input.focus();
  run(async () => {
    const row = await api(`/${kind}`, { method: 'POST', body: { name: input.value } });
    state[kind].push(row);
    storage((s) => s.setItem(KEY.base, JSON.stringify({ members: state.members, areas: state.areas })));
    render();
    toast(t.added(row.name));
    // 続けて追加できるように同じ入力欄へ戻す
    view.querySelector(`[data-form="${kind}"] input`)?.focus();
  });
});

// 掲示板の文字数カウンター（入力中は再描画しない）
document.addEventListener('input', (e) => {
  const ta = e.target.closest('[data-form="post"] textarea');
  if (!ta) return;
  state.draft = ta.value;
  const over = [...ta.value].length - POST_MAX;
  const count = ta.form.querySelector('.count');
  count.textContent = over > 0 ? t.charsOver(over) : t.charsLeft(-over);
  count.classList.toggle('over', over > 0);
  ta.form.querySelector('.btn.primary').disabled = over > 0;
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
  if (!state.me || state.picking || state.tab === 'settings' || sheet.open || state.editing) return;
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
  setLang(storage((s) => s.getItem(KEY.lang)) ?? 'ja');
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
      view.innerHTML = `<div class="empty">${t.loadFail}<br>${esc(e.message)}<br><br><button class="btn primary" onclick="location.reload()">${t.reload}</button></div>`;
    }
  }
})();
