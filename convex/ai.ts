"use node";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { v } from "convex/values";
import { z } from "zod";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, internalAction } from "./_generated/server";
import { MOCK_MODEL, MODEL, aiMock } from "./model";
import type { Axis, Mark } from "../src/lib/rules";

const SYSTEM = [
  "あなたは、少人数のチームが自分たちの案から1つを選ぶのを手伝う、中立な整理役です。",
  "案を書いた人の名前は伏せてあります。文章の長さや熱量ではなく、書かれている中身だけで判断してください。",
  "どの案を推すかは決めません。人間が比べやすいように材料をそろえるのが役割です。",
  "出力は日本語で、短く具体的に書いてください。",
].join("\n");

let client: Anthropic | null = null;

async function call<T extends z.ZodType>(schema: T, prompt: string): Promise<{ data: z.infer<T>; model: string }> {
  client ??= new Anthropic();
  const res = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: betaZodOutputFormat(schema) },
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });
  if (res.stop_reason === "refusal") throw new Error("AI が応答を断りました");
  if (res.stop_reason === "max_tokens") throw new Error("AI の出力が長すぎて途中で切れました");
  if (!res.parsed_output) throw new Error("AI の出力を読み取れませんでした");
  return { data: res.parsed_output, model: res.model };
}

const message = (e: unknown) => (e instanceof Error ? e.message : "AI の処理に失敗しました");

const AssistSchema = z.object({ title: z.string(), what: z.string(), who: z.string(), how: z.string(), risk: z.string() });

const templated = (x: { what: string; who: string; how: string; risk: string }) =>
  [`何を作る: ${x.what}`, `誰のため: ${x.who}`, `どう作る: ${x.how}`, `不安な点: ${x.risk}`].join("\n");

export const assist = action({
  args: { code: v.string(), token: v.string(), text: v.string() },
  handler: async (ctx, { code, token, text }): Promise<{ title: string; body: string }> => {
    const memo = text.trim().slice(0, 1200);
    const { memberId, theme } = await ctx.runMutation(internal.engine.claimAssist, { code, token });
    try {
      if (aiMock()) {
        return {
          title: memo.split("\n")[0].slice(0, 20) || "無題の案",
          body: templated({ what: memo.slice(0, 60), who: "（未記入）", how: "（未記入）", risk: "（未記入）" }),
        };
      }
      const { data } = await call(
        AssistSchema,
        [
          `お題: ${theme || "（未設定）"}`,
          "",
          "次のメモを、案として同じ型にそろえてください。",
          "- title: 20字以内の案の名前",
          "- what / who / how / risk: それぞれ60字以内。メモに書かれていないことは足さず「（未記入）」とする",
          "",
          "<memo>",
          memo,
          "</memo>",
        ].join("\n"),
      );
      return { title: data.title, body: templated(data) };
    } catch (e) {
      await ctx.runMutation(internal.engine.refundAssist, { memberId });
      throw e;
    }
  },
});

const JudgeSchema = z.object({
  items: z.array(
    z.object({
      idea: z.string(),
      summary: z.string(),
      marks: z.array(z.object({ axis: z.string(), mark: z.enum(["o", "d", "x"]), reason: z.string() })),
    }),
  ),
});

type JudgedItem = { ideaId: Id<"ideas">; summary: string; marks: { axisId: string; mark: Mark; reason: string }[] };

function mockJudge(axes: Axis[], ideas: { id: Id<"ideas">; title: string; body: string }[]): JudgedItem[] {
  const cycle: Mark[] = ["o", "d", "x"];
  return ideas.map((idea) => ({
    ideaId: idea.id,
    summary: `${idea.title}：${idea.body.replace(/\s+/g, " ").slice(0, 60)}`,
    marks: axes.map((axis) => {
      const h = [...(idea.id + axis.id)].reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 7);
      const mark: Mark = axis.kind === "must" ? (h % 5 === 0 ? "x" : h % 2 ? "o" : "d") : cycle[h % 3];
      return { axisId: axis.id, mark, reason: "見本モードの判定" };
    }),
  }));
}

export const judge = internalAction({
  args: { roomId: v.id("rooms"), round: v.number() },
  handler: async (ctx, { roomId, round }) => {
    const input = await ctx.runQuery(internal.engine.judgeInput, { roomId, round });
    if (!input) return;
    try {
      let items: JudgedItem[];
      let model = MOCK_MODEL;
      if (aiMock()) {
        items = mockJudge(input.axes, input.ideas);
      } else {
        const ideaKey = new Map(input.ideas.map((idea, i) => [`I${i + 1}`, idea.id]));
        const axisKey = new Map(input.axes.map((axis, i) => [`A${i + 1}`, axis.id]));
        const res = await call(
          JudgeSchema,
          [
            `お題: ${input.theme || "（未設定）"}`,
            "",
            "<axes>",
            ...input.axes.map((a, i) => `A${i + 1}: ${a.label}${a.kind === "must" ? "（メンバーの譲れない条件）" : ""}`),
            "</axes>",
            "",
            "<ideas>",
            ...input.ideas.map((idea, i) => `[I${i + 1}] ${idea.title}\n${idea.body}`),
            "</ideas>",
            "",
            "すべての案について、次を出してください。",
            "- summary: 案の中身を「何を作る／誰のため／どう作る」の順に80字以内でまとめる。どの案も同じ長さ・同じ書き方にそろえる",
            "- marks: すべての軸について、その案が軸を満たすか",
            '  - "o": 満たす / "d": 一部満たす・書かれていなくて判断できない / "x": 満たさない',
            "  - reason: 案のどの記述からそう判断したかを30字以内で。書かれていないことは推測せず「記述なし」として d にする",
            "idea には I1 のような記号、axis には A1 のような記号を入れてください。",
          ].join("\n"),
        );
        model = res.model;
        items = [];
        for (const it of res.data.items) {
          const ideaId = ideaKey.get(it.idea);
          if (!ideaId || items.some((x) => x.ideaId === ideaId)) continue;
          const marks = new Map<string, { mark: Mark; reason: string }>();
          for (const m of it.marks) {
            const axisId = axisKey.get(m.axis);
            if (axisId) marks.set(axisId, { mark: m.mark, reason: m.reason });
          }
          items.push({
            ideaId,
            summary: it.summary,
            marks: [...axisKey.values()].map((axisId) => ({ axisId, ...(marks.get(axisId) ?? { mark: "d" as Mark, reason: "判定なし" }) })),
          });
        }
        if (items.length !== input.ideas.length) throw new Error("AI がすべての案を判定しませんでした");
      }
      await ctx.runMutation(internal.engine.applyJudgement, { roomId, round, model, items });
    } catch (e) {
      console.error(e);
      await ctx.runMutation(internal.engine.aiFailed, { roomId, phase: "judging", round, error: message(e) });
    }
  },
});

const ReviseSchema = z.object({
  items: z.array(z.object({ idea: z.string(), title: z.string(), body: z.string(), change: z.string() })),
});

export const revise = internalAction({
  args: { roomId: v.id("rooms"), round: v.number() },
  handler: async (ctx, { roomId, round }) => {
    const input = await ctx.runQuery(internal.engine.reviseInput, { roomId, round });
    if (!input) return;
    try {
      let items: { ideaId: Id<"ideas">; title: string; body: string }[];
      let model = MOCK_MODEL;
      if (aiMock()) {
        items = input.ideas.map((idea) => ({
          ideaId: idea.id,
          title: `${idea.title}（改）`.slice(0, 40),
          body: `${idea.body}\n変えた点: ${input.feedback[0] ?? "意見なし"}`,
        }));
      } else {
        const ideaKey = new Map(input.ideas.map((idea, i) => [`I${i + 1}`, idea.id]));
        const res = await call(
          ReviseSchema,
          [
            `お題: ${input.theme || "（未設定）"}`,
            "",
            "1回目の承認で、どの案も決定に必要な承認数に届きませんでした。",
            "メンバーから「何が変われば承認できるか」が集まっています。",
            "",
            "<axes>",
            ...input.axes.map((a) => `- ${a.label}`),
            "</axes>",
            "",
            "<ideas>",
            ...input.ideas.map((idea, i) => `[I${i + 1}] ${idea.title}\n${idea.body}`),
            "</ideas>",
            "",
            "<feedback>",
            ...(input.feedback.length ? input.feedback.map((f) => `- ${f}`) : ["（意見なし）"]),
            "</feedback>",
            "",
            "各案について、元の案の芯は残したまま、意見をできるだけ取り込んだ改訂版を作ってください。",
            "- title: 20字以内",
            "- body: 「何を作る／誰のため／どう作る／不安な点」の4行。元の案と同じ型",
            "- change: 元の案から何を変えたかを40字以内で",
            "すべての案を出し、idea には I1 のような記号を入れてください。",
          ].join("\n"),
        );
        model = res.model;
        items = res.data.items
          .map((it) => ({ ideaId: ideaKey.get(it.idea), title: it.title, body: `${it.body}\n変えた点: ${it.change}` }))
          .filter((it): it is { ideaId: Id<"ideas">; title: string; body: string } => !!it.ideaId);
        if (new Set(items.map((i) => i.ideaId)).size !== input.ideas.length) throw new Error("AI がすべての案を改訂しませんでした");
      }
      await ctx.runMutation(internal.engine.applyRevision, { roomId, round, model, items });
    } catch (e) {
      console.error(e);
      await ctx.runMutation(internal.engine.aiFailed, { roomId, phase: "revising", round, error: message(e) });
    }
  },
});
