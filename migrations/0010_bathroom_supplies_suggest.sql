-- Bathroom のガイドに、掃除道具の提案を求める一文を追加（割り勘で買う前提）
UPDATE areas SET
  guide_ja = '## 必ず
- バスルームの床
- トイレ
- シャワーの中

## 道具
- 掃除道具は、お手洗い（手を洗う場所）の下の開きの中
- クリーナーなど、欲しい掃除道具があれば提案してほしい。必要なものは割り勘で買う

## やり方
- 使うクリーナーは、下の開きから各自で選ぶ
- シャワーの壁などは、ブラシやたわしを使うといい',
  guide_en = '## Must do
- Bathroom floor
- Toilet
- Inside the shower

## Supplies
- Cleaning supplies are in the cabinet under the sink in the washroom (where you wash your hands)
- If you want a cleaner or other supplies, suggest them. We split the cost for shared items

## How
- Pick the cleaner you want from the cabinet under the sink
- For the shower walls and similar, a brush or scrubbing pad works well'
WHERE name = 'Bathroom';
