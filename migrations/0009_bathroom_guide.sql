-- Bathroom のガイド（バスルームの床・トイレ・シャワーの中。道具はお手洗いの下の開きの中）
UPDATE areas SET
  guide_ja = '## 必ず
- バスルームの床
- トイレ
- シャワーの中

## 道具
- 掃除道具は、お手洗い（手を洗う場所）の下の開きの中

## やり方
- 使うクリーナーは、下の開きから各自で選ぶ
- シャワーの壁などは、ブラシやたわしを使うといい',
  guide_en = '## Must do
- Bathroom floor
- Toilet
- Inside the shower

## Supplies
- Cleaning supplies are in the cabinet under the sink in the washroom (where you wash your hands)

## How
- Pick the cleaner you want from the cabinet under the sink
- For the shower walls and similar, a brush or scrubbing pad works well'
WHERE name = 'Bathroom';
