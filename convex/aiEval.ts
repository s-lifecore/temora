"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { JudgeSchema, call, judgePrompt, symbol } from "./ai";
import type { Axis, Mark } from "../src/lib/rules";

type Case = {
  name: string;
  theme: string;
  axes: Axis[];
  ideas: { title: string; body: string }[];
  expected: Record<string, Mark>;
};

const team = (labels: string[]): Axis[] => labels.map((label, i) => ({ id: `t${i}`, label, kind: "team" }));
const must = (labels: string[]): Axis[] => labels.map((label, i) => ({ id: `m${i}`, label, kind: "must" }));

const CASES: Case[] = [
  {
    name: "ハッカソン",
    theme: "テーマは「かゆいところに手が届くアプリ」。開発期間は2日、4人チーム。",
    axes: [...team(["スマホで動く", "2日で作れる", "デモで見せ場がある"]), ...must(["AIを使う", "個人情報を扱わない"])],
    ideas: [
      {
        title: "学食の混雑予報",
        body: "学食の混み具合を、過去の混雑データと時間帯から機械学習で予測して、スマホで見られるWebアプリ（PWA）。データは学食の入口に置いたカウンターから集める。",
      },
      {
        title: "忘れ物リマインダー",
        body: "家を出るときに、天気とGoogleカレンダーの予定、位置情報を見て、持ち物をプッシュ通知するAndroidアプリ（Kotlin）。",
      },
      {
        title: "ゼミ発表の練習相手",
        body: "発表を録音すると、Claude が聞き手役になって質問を3つ返すWebアプリ。PCのブラウザで使う想定。",
      },
      {
        title: "サークル備品の貸出管理",
        body: "備品にQRコードを貼り、スマホで読み取ると貸出・返却が記録される。Next.js と Supabase で、1日で作れる規模。",
      },
    ],
    expected: {
      "I1:t0": "o",
      "I1:m0": "o",
      "I1:m1": "o",
      "I2:t0": "o",
      "I2:m1": "x",
      "I3:m0": "o",
      "I4:t0": "o",
      "I4:t1": "o",
    },
  },
  {
    name: "勉強会",
    theme: "GDGoC の次回勉強会のテーマを決める。参加者は情報系の学部1〜3年、20人程度。",
    axes: [
      ...team(["初心者でも参加できる", "2時間で終わる", "講師を外部に頼まない"]),
      ...must(["オンラインでも参加できる"]),
    ],
    ideas: [
      { title: "Gitハンズオン", body: "Gitの基本操作を手を動かして学ぶ。運営メンバーが講師。対面でPCを持参。90分。" },
      { title: "Kaggle入門", body: "1日かけてチームでKaggleのタイタニックに取り組む。Pythonが書ける人向け。" },
      {
        title: "現役エンジニアに聞くキャリア座談会",
        body: "企業のエンジニア3名を招いてパネルディスカッション。Zoomでも配信する。2時間。",
      },
    ],
    expected: {
      "I1:t0": "o",
      "I1:t1": "o",
      "I1:t2": "o",
      "I2:t0": "x",
      "I2:t1": "x",
      "I3:t1": "o",
      "I3:t2": "x",
      "I3:m0": "o",
    },
  },
  {
    name: "新歓",
    theme: "サークルの新歓イベントの企画。予算は全体で1万円。",
    axes: [...team(["予算1万円以内", "雨でもできる", "新入生が話しやすい"]), ...must(["お酒を出さない"])],
    ideas: [
      { title: "河川敷BBQ", body: "河川敷でBBQ。食材と道具のレンタルで2万円ほどかかる。" },
      {
        title: "ボードゲーム会",
        body: "部室でボードゲーム。ゲームは部員の私物を使う。お菓子代3千円。少人数の卓に分かれて遊ぶ。",
      },
      { title: "居酒屋で歓迎会", body: "駅前の居酒屋で飲み会。新入生は無料、部費から1万円補助。" },
    ],
    expected: { "I1:t0": "x", "I1:t1": "x", "I2:t0": "o", "I2:t1": "o", "I2:t2": "o", "I3:t1": "o", "I3:m0": "x" },
  },
  {
    name: "LT会",
    theme: "社外の人も呼ぶLT会の企画。",
    axes: [...team(["会場費がかからない", "30人以上集まる見込みがある"]), ...must(["録画を公開しない"])],
    ideas: [
      { title: "オンラインLT会", body: "Zoomで開催する。登壇は5人。告知はXで行う。" },
      {
        title: "コワーキングでLT",
        body: "駅前のコワーキングスペースを有料で借りて開催する。録画してYouTubeに公開する。",
      },
    ],
    expected: { "I1:t0": "o", "I1:t1": "d", "I1:m0": "d", "I2:t0": "x", "I2:t1": "d", "I2:m0": "x" },
  },
];

const MODELS = ["claude-haiku-5-5"];

export const compare = internalAction({
  args: { runs: v.optional(v.number()), models: v.optional(v.array(v.string())) },
  handler: async (_ctx, { runs = 2, models = MODELS }) => {
    const jobs = models.flatMap((model) =>
      CASES.flatMap((c) => Array.from({ length: runs }, (_, run) => ({ model, c, run }))),
    );
    return Promise.all(
      jobs.map(async ({ model, c, run }) => {
        try {
          const res = await call(JudgeSchema, judgePrompt(c), model);
          const marks: Record<string, { mark: Mark; reason: string }> = {};
          for (const it of res.data.items) {
            for (const m of it.marks) {
              const idx = Number(symbol(m.axis, "A").slice(1)) - 1;
              const axis = c.axes[idx];
              if (axis) marks[`${symbol(it.idea, "I")}:${axis.id}`] = { mark: m.mark, reason: m.reason };
            }
          }
          return {
            model,
            servedBy: res.model,
            case: c.name,
            run,
            ms: res.ms,
            usage: res.usage,
            marks,
            summaries: res.data.items.map((it) => `${symbol(it.idea, "I")}: ${it.summary}`),
            expected: c.expected,
            cells: c.ideas.length * c.axes.length,
          };
        } catch (e) {
          return { model, case: c.name, run, error: e instanceof Error ? e.message : String(e) };
        }
      }),
    );
  },
});
