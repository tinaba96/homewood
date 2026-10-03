-- 掲示板: 住人ごとに1つのスペース（上書きのみ、履歴なし）
CREATE TABLE posts (
  member_id  INTEGER PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE,
  body       TEXT    NOT NULL,
  updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- いいね: 投稿を書き換えるとリセットされる
CREATE TABLE likes (
  owner_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  liker_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  PRIMARY KEY (owner_id, liker_id)
);
