# 開発・運用メモ

作業の前に知っておきたいこと。新しく分かったことや、状況が変わったことがあれば更新する。

## デプロイ先

| 環境         | Convex デプロイ     | 画面                                 | 備考                                             |
| ------------ | ------------------- | ------------------------------------ | ------------------------------------------------ |
| 開発（dev）  | `rapid-falcon-985`  | ローカルの `next dev`（3000 番など） | `.env.local` の `CONVEX_DEPLOYMENT` で接続       |
| 本番（prod） | `next-scorpion-488` | Vercel → https://temora.lifecore.jp  | Vercel のビルドコマンドは `npm run build:deploy` |

- Convex のプロジェクト：チーム `sudo` の `temora`
- GitHub：`s-lifecore/temora`（private）。push と PR ごとに GitHub Actions（`.github/workflows/ci.yml`）で check とビルドを実行
- `main` に push すると Vercel が本番を自動でデプロイし、そのビルドの中で Convex の本番にも関数が反映される

## 環境変数

一覧と置き場所は README の「環境変数」と、手元の `.env.prod`（git 対象外）を参照。要点だけ：

- Vercel に置くのは `CONVEX_DEPLOY_KEY` だけ（権限は `deployment:deploy` のみ）。ほかはすべて Convex 側
- dev と本番の Convex の環境変数は別物。片方に入れても、もう片方には入らない
- `AUTH_GOOGLE_CLIENT_ID` / `AUTH_GOOGLE_CLIENT_SECRET` は `convex/convex.config.ts` で必須と宣言している。**未設定だとデプロイ自体が失敗する**
- `AUTH_ALLOWED_ORIGINS` はポート番号まで含めて比較される。`http://localhost` では `http://localhost:3000` が通らない。未設定だと localhost（3000・3001・3100）だけが許可される
- Google のリダイレクト URI は環境ごとに登録が必要：`https://<デプロイ名>.convex.site/oauth/google/callback`

## 実際に踏んだ落とし穴

- **`Date.now()` を描画中に使わない**：`cacheComponents` が有効なので、事前生成の時点の時刻で固定されてしまい、Next.js が警告を出す。時刻に依存する初期値は、ログイン後にだけ表示される部品の中など、ブラウザで初めて描画される場所で計算する
- **Next.js 16 は学習データと API が違うことがある**：コードを書く前に `node_modules/next/dist/docs/` の該当ページを読む（`AGENTS.md` 参照）
- **Convex Auth は 2.x（コンポーネント方式）**：古い Convex Auth の書き方（`convexAuth()` など）とは違う。`node_modules/@convex-dev/auth/src` のコメントが一番正確
- **AI が記号に名前を付けて返すことがある**：`I1` ではなく `I1 学食の混雑予報` のように返ってくるので、記号部分だけを取り出して照合している（`convex/ai.ts` の `symbol`）
- **画面に仕組みの話を出さない**：モデル名・「サーバーで実行」・利用上限・AI の生のエラー文は表示しない。生のエラーは Convex のログで確認する

## テストと確認

- `npm run check`：型チェック・lint・フォーマット・テスト（通ったら自動でコミットする）
- `npm run smoke -- 4 split`：dev デプロイで一連の流れを通す。**本物の AI を呼ぶので少し費用がかかる**（Haiku で1回1円前後）
- AI が止まったときの動きを試すには、dev で `AI_DAILY_LIMIT` を一時的に `0` にする。終わったら必ず `npx convex env remove AI_DAILY_LIMIT` で戻す
- テストで dev デプロイに残ったデータは、各テーブルを空の JSONL で置き換えて消す（`npx convex import --table <名前> --replace -y empty.jsonl`）。対象：`votes` `feedback` `marks` `ideas` `members` `rooms`（必要なら `aiUsage`）

## 費用と上限

- 判定は Claude Haiku 5.5（1回約0.15円）。会議1つあたり、やり直しを含めても1円前後
- 上限：アカウントごとに1日5会議（`src/lib/plans.ts`）、サイト全体で1日300回の AI 呼び出し（`AI_DAILY_LIMIT`）
- 今の AI 費用はすべて運営（開発者）の負担

## まだ終わっていないこと・確認待ち

- Anthropic Console で月の利用額の上限を設定する（開発者が行う）
- dev の Google ログインの値が仮のまま。本番と同じ OAuth クライアントを使い、リダイレクト URI に `https://rapid-falcon-985.convex.site/oauth/google/callback` を追加して、dev にも ID とシークレットを入れる
- 料金プランは検討中（[pricing-ideas.md](pricing-ideas.md)）。個人プランと法人・団体プランに分ける案で、試作への反映は未着手
- 試してもらう計画（[trial-plan.md](trial-plan.md)）は未着手
- 税金まわりの「要確認」の項目（[tax-notes.md](tax-notes.md)）

## 関連ドキュメント

- [decisions.md](decisions.md)：決めたことと理由
- [prototypes.md](prototypes.md)：試作・開発環境のみのもの
- [model-eval.md](model-eval.md)：判定モデルの比較
- [db-choice.md](db-choice.md)：Convex を選んだ理由
