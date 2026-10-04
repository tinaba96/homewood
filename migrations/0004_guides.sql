-- 掃除場所ごとのガイド（やり方・範囲）。日本語 / 英語、写真は public/guides/ のパス
ALTER TABLE areas ADD COLUMN guide_ja TEXT NOT NULL DEFAULT '';
ALTER TABLE areas ADD COLUMN guide_en TEXT NOT NULL DEFAULT '';
ALTER TABLE areas ADD COLUMN image TEXT NOT NULL DEFAULT '';

UPDATE areas SET
  image = '/guides/kitchen-cleaner.jpg',
  guide_ja = '目安: 20分くらい

## 必ず
- キッチンカウンター
- シンク
- 電子レンジ（中と外）

## できれば
- オーブン
- トースター
- 水切りラック

## やり方
- 具体的なやり方は自由。キッチンペーパーを使ってもOK
- 写真のクリーナー（green works）をスプレーして拭いてもOK
- スポンジは「掃除用」を使う。食器用とは別なので注意',
  guide_en = 'Takes about 20 minutes

## Must do
- Kitchen counter
- Sink
- Microwave (inside and out)

## If you can
- Oven
- Toaster
- Dish rack

## How
- Any method is fine. Paper towels are OK
- You can spray and wipe with the cleaner in the photo (green works)
- Use the cleaning sponge, not the dish sponge'
WHERE name = 'Kitchen';
