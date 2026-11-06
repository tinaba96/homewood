-- Kitchen のガイドの「必ず」に、生ゴミを捨てることを追記（既存の文章は残す）
UPDATE areas SET
  guide_ja = replace(guide_ja, '- キッチンカウンター', '- 生ゴミは必ず捨てること' || char(10) || '- キッチンカウンター'),
  guide_en = replace(guide_en, '- Kitchen counter', '- Throw away food waste (always)' || char(10) || '- Kitchen counter')
WHERE name = 'Kitchen';
