-- Floor のガイドの「必ず」に、ゴミ捨てをすることを追記（既存の文章は残す）
UPDATE areas SET
  guide_ja = replace(guide_ja, '- 玄関', '- 玄関' || char(10) || '- ゴミ捨てを必ずすること'),
  guide_en = replace(guide_en, '- Entrance', '- Entrance' || char(10) || '- Always take out the trash')
WHERE name = 'Floor';
