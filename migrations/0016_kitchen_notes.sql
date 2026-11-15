-- Kitchen のガイドの末尾に「注意」を追記（既存の文章は残す）
UPDATE areas SET
  guide_ja = guide_ja || char(10) || char(10) || '## 注意' || char(10)
    || '- 電気ケトルの水はBritaの水を使う（カルキが残りやすくなるため）' || char(10)
    || '- キッチンにはリサイクルの黒いゴミ箱しかないので、燃えるゴミは各自で用意する（分別方法は壁に貼ってあります）',
  guide_en = guide_en || char(10) || char(10) || '## Notes' || char(10)
    || '- Use Brita-filtered water in the electric kettle (limescale builds up otherwise)' || char(10)
    || '- The kitchen only has the black recycling bin, so each person brings their own bin for burnable trash (the sorting guide is posted on the wall)'
WHERE name = 'Kitchen';
