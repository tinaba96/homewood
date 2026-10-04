-- 写真を複数・キャプション付きで持てるようにする（JSON 配列）。image 列は使わない
ALTER TABLE areas ADD COLUMN images TEXT NOT NULL DEFAULT '[]';
UPDATE areas SET images = '[{"src": "/guides/kitchen-cleaner.jpg", "ja": "クリーナー（green works）", "en": "Cleaner (green works)"}, {"src": "/guides/kitchen-sponge.jpg", "ja": "掃除用スポンジ。食器用とは別", "en": "Cleaning sponge. Not the dish sponge"}]' WHERE name = 'Kitchen';
