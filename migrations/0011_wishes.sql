-- ほしい物リスト: 住人なら誰でも追加できる共有リスト（自分が追加したものだけ削除できる）
CREATE TABLE wishes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  body       TEXT    NOT NULL,
  member_id  INTEGER REFERENCES members(id) ON DELETE SET NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
