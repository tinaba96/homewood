-- 洗濯の枠を3つ → 4つに（朝 9-12 / 昼 12-15 / 夕方 15-19 / 夜 19-23）
-- 旧: 0=午前(〜12), 1=午後(12-18), 2=夜(18〜) → 新: 0=朝, 1=昼, 3=夜
CREATE TABLE reservations_new (
  date      TEXT    NOT NULL,
  slot      INTEGER NOT NULL CHECK (slot BETWEEN 0 AND 3),
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  level     TEXT    NOT NULL CHECK (level IN ('must', 'maybe')),
  PRIMARY KEY (date, slot, member_id)
);
INSERT INTO reservations_new (date, slot, member_id, level)
  SELECT date, CASE slot WHEN 2 THEN 3 ELSE slot END, member_id, level FROM reservations;
DROP TABLE reservations;
ALTER TABLE reservations_new RENAME TO reservations;
