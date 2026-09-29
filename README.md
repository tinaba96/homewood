# homewood

シェアハウス用のシンプルな Web アプリ。ログイン不要で、最初に自分の名前を選ぶだけで使えます。

- **洗濯機の予約**: 7日分 × 3枠（午前 / 午後 / 夜）に「絶対使う」「使うかも」の2段階で予約。同じ枠に何人でも入れられ、お互いの予定を把握するためのもの
- **掃除当番**: 毎週日曜までの当番表。住人の登録順で毎週自動ローテーションし、終わったら「完了」

住人と掃除場所は「設定」タブから追加・削除できます（初期値: Taka / Leo / Rieru / Ren、Floor / Bathroom / Kitchen）。

画面は日本語と英語に対応しています（初期は日本語、設定または最初の画面で切り替え）。

スマホでの利用が前提です。ホーム画面に追加すると、アプリのように全画面で開けます。

## 構成

すべて Cloudflare の無料枠で動きます。

| 役割 | 技術 |
| --- | --- |
| ホスティング + API | Cloudflare Workers（Static Assets で `public/` を配信） |
| データベース | Cloudflare D1（SQLite） |
| フロント | 素の HTML / CSS / JS（ビルド不要） |

```
public/        画面 (index.html, app.js, style.css)
src/worker.js  API (/api/*)
migrations/    D1 のスキーマと初期データ
```

## 開発

Node.js 22 以上が必要です（`nvm use` で `.nvmrc` のバージョンになります）。

```sh
nvm use
npm install
npm run db:migrate:local   # ローカル D1 にテーブルと初期データを作成
npm run dev                # http://localhost:8787
```

## デプロイ

Cloudflare の Workers Builds（GitHub 連携）で、`main` に push するたびに自動デプロイされます。
ダッシュボードの設定は次のとおりです。

| 項目 | 値 |
| --- | --- |
| Project name | `homewood`（`wrangler.jsonc` の `name` と一致させる） |
| Build command | 空欄 |
| Deploy command | `npm run deploy` |
| Preview builds | オフ |

`npm run deploy` は Worker をデプロイしてから、D1 に未適用のマイグレーションを当てます。
D1 データベース `homewood` は初回デプロイ時に自動で作成されます。

手元から直接デプロイする場合は `npx wrangler login` のあとに `npm run deploy` を実行します。

## 補足

- ログインが無いので、URL を知っている人は誰でも閲覧・編集できます。URL は住人の間だけで共有してください。
- 日付と「今週」の判定は各端末のタイムゾーンで行います。
