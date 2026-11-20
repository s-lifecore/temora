import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { mark, phase } from "./schema";
import {
  AI_RETRY_DELAY_MS,
  ASSIST_LIMIT,
  AUTO_AI_ATTEMPTS,
  auth,
  axesOf,
  closeFeedback,
  closeVoting,
  fail,
  feedbackOf,
  ideasOf,
  openVoting,
  requirePhase,
  scheduleAi,
  startJudging,
} from "./model";

export const deadline = internalMutation({
  args: { roomId: v.id("rooms"), phase, round: v.number() },
  handler: async (ctx, { roomId, phase, round }) => {
    const room = await ctx.db.get(roomId);
    if (!room || room.phase !== phase || room.round !== round) return;
    if (phase === "collecting") await startJudging(ctx, room);
    if (phase === "voting") await closeVoting(ctx, room);
    if (phase === "feedback") await closeFeedback(ctx, room);
  },
});

export const judgeInput = internalQuery({
  args: { roomId: v.id("rooms"), round: v.number() },
  handler: async (ctx, { roomId, round }) => {
    const room = await ctx.db.get(roomId);
    if (!room || room.phase !== "judging" || room.round !== round) return null;
    const ideas = (await ideasOf(ctx, roomId)).filter((i) => i.round === round);
    return {
      theme: room.theme,
      axes: await axesOf(ctx, room),
      ideas: ideas.map((i) => ({ id: i._id, title: i.title, body: i.body })),
    };
  },
});

export const applyJudgement = internalMutation({
  args: {
    roomId: v.id("rooms"),
    round: v.number(),
    model: v.string(),
    items: v.array(
      v.object({
        ideaId: v.id("ideas"),
        summary: v.string(),
        marks: v.array(v.object({ axisId: v.string(), mark, reason: v.string() })),
      }),
    ),
  },
  handler: async (ctx, { roomId, round, model, items }) => {
    const room = await ctx.db.get(roomId);
    if (!room || room.phase !== "judging" || room.round !== round) return;
    for (const it of items) {
      await ctx.db.patch(it.ideaId, { summary: it.summary });
      for (const m of it.marks) {
        await ctx.db.insert("marks", { roomId, round, ideaId: it.ideaId, axisId: m.axisId, mark: m.mark, reason: m.reason });
      }
    }
    await ctx.db.patch(roomId, { modelUsed: model });
    await openVoting(
      ctx,
      room,
      items.map((it) => ({ ideaId: it.ideaId, marks: Object.fromEntries(it.marks.map((m) => [m.axisId, m.mark])) })),
    );
  },
});

export const reviseInput = internalQuery({
  args: { roomId: v.id("rooms"), round: v.number() },
  handler: async (ctx, { roomId, round }) => {
    const room = await ctx.db.get(roomId);
    if (!room || room.phase !== "revising" || room.round !== round) return null;
    const ideas = await ideasOf(ctx, roomId);
    const fb = await feedbackOf(ctx, roomId, round);
    return {
      theme: room.theme,
      axes: await axesOf(ctx, room),
      ideas: room.shortlist
        .map((id) => ideas.find((i) => i._id === id))
        .filter((i) => !!i)
        .map((i) => ({ id: i._id, title: i.title, body: i.body })),
      feedback: fb.map((f) => f.text.trim()).filter(Boolean),
    };
  },
});

export const applyRevision = internalMutation({
  args: {
    roomId: v.id("rooms"),
    round: v.number(),
    model: v.string(),
    items: v.array(v.object({ ideaId: v.id("ideas"), title: v.string(), body: v.string() })),
  },
  handler: async (ctx, { roomId, round, model, items }) => {
    const room = await ctx.db.get(roomId);
    if (!room || room.phase !== "revising" || room.round !== round) return;
    const next = round + 1;
    for (const it of items) {
      const parent = await ctx.db.get(it.ideaId);
      await ctx.db.insert("ideas", {
        roomId,
        memberId: parent?.memberId,
        round: next,
        parentId: it.ideaId,
        title: it.title,
        body: it.body,
      });
    }
    await ctx.db.patch(roomId, { phase: "judging", round: next, modelUsed: model, aiAttempts: 0, aiError: undefined });
    await scheduleAi(ctx, roomId, "judging", next);
  },
});

export const aiFailed = internalMutation({
  args: { roomId: v.id("rooms"), phase: v.union(v.literal("judging"), v.literal("revising")), round: v.number(), error: v.string() },
  handler: async (ctx, { roomId, phase, round, error }) => {
    const room = await ctx.db.get(roomId);
    if (!room || room.phase !== phase || room.round !== round) return;
    const aiAttempts = room.aiAttempts + 1;
    await ctx.db.patch(roomId, { aiAttempts, aiError: error });
    if (aiAttempts < AUTO_AI_ATTEMPTS) await scheduleAi(ctx, roomId, phase, round, AI_RETRY_DELAY_MS);
  },
});

export const claimAssist = internalMutation({
  args: { code: v.string(), token: v.string() },
  handler: async (ctx, { code, token }) => {
    const { room, me } = await auth(ctx, code, token);
    requirePhase(room, "collecting");
    if (me.assistCount >= ASSIST_LIMIT) fail(`AI で整えられるのは1人${ASSIST_LIMIT}回までです`);
    await ctx.db.patch(me._id, { assistCount: me.assistCount + 1 });
    return { memberId: me._id, theme: room.theme };
  },
});

export const refundAssist = internalMutation({
  args: { memberId: v.id("members") },
  handler: async (ctx, { memberId }) => {
    const me = await ctx.db.get(memberId);
    if (me && me.assistCount > 0) await ctx.db.patch(memberId, { assistCount: me.assistCount - 1 });
  },
});
