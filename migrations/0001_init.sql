CREATE TABLE members (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);

CREATE TABLE areas (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);

-- 洗濯機の予約。level: 'must' = 絶対使う / 'maybe' = 使うかも
-- slot: 0 = 午前, 1 = 午後, 2 = 夜
CREATE TABLE reservations (
  date      TEXT    NOT NULL,
  slot      INTEGER NOT NULL CHECK (slot BETWEEN 0 AND 2),
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  level     TEXT    NOT NULL CHECK (level IN ('must', 'maybe')),
  PRIMARY KEY (date, slot, member_id)
);

-- 掃除の完了記録。week = その週の月曜日 (YYYY-MM-DD)
CREATE TABLE chores_done (
  week      TEXT    NOT NULL,
  area_id   INTEGER NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
  done_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (week, area_id)
);
