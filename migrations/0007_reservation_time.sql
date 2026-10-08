-- 洗濯の予約に任意の開始時刻（HH:MM）を付けられるようにする
ALTER TABLE reservations ADD COLUMN time TEXT;
