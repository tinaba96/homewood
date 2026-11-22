-- Bathroom のガイドの「必ず」で、シャワーのタイルの床・壁と角の隙間も洗うことを明記（既存の文章は残す）
UPDATE areas SET
  guide_ja = replace(guide_ja, '- シャワーの中', '- シャワーの中' || char(10) || '- シャワーのタイルの床と壁、その角の隙間も洗う'),
  guide_en = replace(guide_en, '- Inside the shower', '- Inside the shower' || char(10) || '- Shower tile floor and walls, including the gaps in the corners')
WHERE name = 'Bathroom';
