-- 割り勘: 買った人が品名・金額・メアドを登録し、ほかの住人が自分の分を送ったらチェックする（全員均等）
-- buyer_id が NULL になるのは購入者を削除したとき。完了判定は画面側で「購入者以外が全員チェック済み」
CREATE TABLE splits (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  item       TEXT    NOT NULL,
  amount     INTEGER NOT NULL CHECK (amount > 0),
  email      TEXT    NOT NULL,
  buyer_id   INTEGER REFERENCES members(id) ON DELETE SET NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- 送金済みの記録（この行がある人は送った）
CREATE TABLE split_paid (
  split_id  INTEGER NOT NULL REFERENCES splits(id) ON DELETE CASCADE,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  PRIMARY KEY (split_id, member_id)
);
