-- 自転車は2台。1つの時間帯に2人まで予約でき、「借りる」と「借りるかも」を区別する
ALTER TABLE bike_reservations RENAME TO bike_reservations_old;

CREATE TABLE bike_reservations (
  date      TEXT    NOT NULL,
  slot      INTEGER NOT NULL CHECK (slot BETWEEN 0 AND 3),
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  level     TEXT    NOT NULL DEFAULT 'must' CHECK (level IN ('must', 'maybe')),
  PRIMARY KEY (date, slot, member_id)
);

INSERT INTO bike_reservations (date, slot, member_id, level)
SELECT date, slot, member_id, 'must' FROM bike_reservations_old;

DROP TABLE bike_reservations_old;
