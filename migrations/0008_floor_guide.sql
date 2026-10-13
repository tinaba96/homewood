-- Floor のガイド（掃除機 → モップ。バスルーム以外の床・階段・玄関）
UPDATE areas SET
  guide_ja = '## 必ず
- バスルーム以外の床全体
- 階段
- 玄関

## できれば
- ゴミ箱の掃除
- 乾燥機のフィルタの掃除

## やり方
- 掃除機をかけてから、モップで拭く
- モップは水道水やお湯でもOK。Lysol を使ってもOK',
  guide_en = '## Must do
- All floors except the bathroom
- Stairs
- Entrance

## If you can
- Clean the trash bins
- Clean the dryer filter

## How
- Vacuum first, then mop
- Tap water or warm water is fine for mopping. Lysol is also OK'
WHERE name = 'Floor';
