-- 自転車の予約: 1台のため、日付と時間帯ごとに1人だけ予約できる
CREATE TABLE bike_reservations (
  date      TEXT    NOT NULL,
  slot      INTEGER NOT NULL CHECK (slot BETWEEN 0 AND 3),
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  PRIMARY KEY (date, slot)
);
