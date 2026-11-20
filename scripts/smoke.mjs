import { execFileSync } from "node:child_process";
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";

const url = process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;
if (!url) throw new Error("CONVEX_URL を指定してください");
const client = new ConvexHttpClient(url);
const api = anyApi;
const size = Number(process.argv[2] ?? 3);
const mode = process.argv[3] ?? "split";

async function waitPhase(s, phases) {
  for (let i = 0; i < 120; i++) {
    const v = await client.query(api.rooms.view, s);
    if (phases.includes(v.room.phase)) return v;
    if (v.room.aiError) console.log("  aiError:", v.room.aiError);
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`timeout waiting for ${phases}`);
}

// 会議の作成はログインが必要なので、テスト用の内部関数を CLI から呼ぶ
const createArgs = {
  hostName: "メンバーA",
  title: "ハッカソンのテーマ決め",
  theme: "かゆいところに手が届くアプリ",
  axes: ["スマホで動く", "2日で作れる", "デモ映えする"],
  tieMode: "roulette",
  collectHours: 24,
  voteHours: 24,
};
const host = JSON.parse(
  execFileSync("npx", ["convex", "run", "rooms:createForTest", JSON.stringify(createArgs)], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }),
);
const code = host.code;
console.log("room", code);
const people = [host];
for (let i = 1; i < size; i++)
  people.push(await client.mutation(api.rooms.join, { code, name: `メンバー${"ABCDEFGH"[i]}` }));
const S = (p) => ({ code, token: p.token });

const ideas = [
  ["忘れ物リマインダー", "家を出る前に位置情報と天気で持ち物を通知する。大学生向け。PWA で作る"],
  ["学食の混雑予報", "学食の混み具合を過去データから予測して表示する。Next.js と Convex"],
  ["ゼミ発表の練習相手", "発表の録音を AI が聞いて質問を返す。Web アプリ"],
  ["サークル備品の貸出管理", "QR コードで備品の貸出と返却を記録する"],
];
for (const [i, p] of people.entries()) {
  const [title, body] = ideas[i % ideas.length];
  await client.mutation(api.rooms.saveIdea, { ...S(p), title, body });
  if (i === 1) await client.mutation(api.rooms.updateMe, { ...S(p), mustHaves: ["AI を使う"] });
  await client.mutation(api.rooms.updateMe, { ...S(p), ready: true });
}

let s = await waitPhase(S(host), ["voting"]);
console.log("model:", s.room.model);
console.log("axes:", s.axes.map((a) => a.label + (a.ownerName ? `(${a.ownerName})` : "")).join(" / "));
const title = (id) => s.ideas.find((i) => i.id === id)?.title;
for (const id of s.room.shortlist) {
  const row = s.axes.map((a) => s.marks.find((m) => m.ideaId === id && m.axisId === a.id)?.mark ?? "-").join(" ");
  console.log(`  候補: ${title(id)}  [${row}]`);
}
for (const ex of s.room.excluded) console.log(`  除外: ${title(ex.id)}`);

for (const [i, p] of people.entries()) {
  const approved = mode === "all" ? [s.room.shortlist[0]] : [s.room.shortlist[i % s.room.shortlist.length]];
  await client.mutation(api.rooms.vote, { ...S(p), approved });
}

s = await waitPhase(S(host), ["feedback", "decided", "tie"]);
console.log("round1 ->", s.room.phase, JSON.stringify(s.results.at(-1)?.counts));
if (s.room.phase === "feedback") {
  for (const p of people)
    await client.mutation(api.rooms.sendFeedback, { ...S(p), text: "もう少し小さく作れるなら賛成" });
  s = await waitPhase(S(host), ["voting"]);
  console.log("round", s.room.round, "候補:", s.room.shortlist.map(title).join(" / "));
  for (const [i, p] of people.entries()) {
    await client.mutation(api.rooms.vote, { ...S(p), approved: [s.room.shortlist[i % s.room.shortlist.length]] });
  }
  s = await waitPhase(S(host), ["decided", "tie"]);
}
console.log("結果:", s.room.phase, s.room.decidedBy, title(s.room.decidedIdeaId), "tie:", s.room.tieIds.map(title));
