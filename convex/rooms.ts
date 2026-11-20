import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import {
  ASSIST_LIMIT,
  AUTO_AI_ATTEMPTS,
  HOUR,
  MAX_IDEAS,
  MAX_MEMBERS,
  auth,
  axesOf,
  closeFeedback,
  closeVoting,
  fail,
  ideasOf,
  maybeCloseCollecting,
  maybeCloseFeedback,
  maybeCloseVoting,
  membersOf,
  modelLabel,
  randomCode,
  randomToken,
  requirePhase,
  roomByCode,
  scheduleAi,
  scheduleCollectDeadline,
  sha256,
  startJudging,
  text,
} from "./model";
import { MAX_MUST_HAVES, tally, threshold } from "../src/lib/rules";

const session = { code: v.string(), token: v.string() };

export const create = mutation({
  args: {
    hostName: v.string(),
    title: v.string(),
    theme: v.string(),
    axes: v.array(v.string()),
    tieMode: v.union(v.literal("manual"), v.literal("roulette")),
    collectHours: v.number(),
    voteHours: v.number(),
  },
  handler: async (ctx, args) => {
    const axes = args.axes.map((a) => a.trim()).filter(Boolean);
    if (axes.length > 6) fail("判断軸は6つまでです");
    axes.forEach((a) => text(a, "判断軸", 40, 1));
    if (args.collectHours < 1 || args.collectHours > 336 || args.voteHours < 1 || args.voteHours > 168) fail("期間の指定が正しくありません");

    let code = randomCode();
    for (let i = 0; i < 5; i++) {
      const dup = await ctx.db
        .query("rooms")
        .withIndex("by_code", (q) => q.eq("code", code))
        .unique();
      if (!dup) break;
      code = randomCode();
    }
    const roomId = await ctx.db.insert("rooms", {
      code,
      title: text(args.title, "決めること", 60, 1),
      theme: text(args.theme, "お題", 400),
      axes,
      tieMode: args.tieMode,
      collectDeadline: Date.now() + args.collectHours * HOUR,
      voteHours: args.voteHours,
      phase: "collecting",
      round: 1,
      participants: [],
      shortlist: [],
      excluded: [],
      tieIds: [],
      aiAttempts: 0,
    });
    const token = randomToken();
    const memberId = await ctx.db.insert("members", {
      roomId,
      name: text(args.hostName, "名前", 30, 1),
      tokenHash: await sha256(token),
      isHost: true,
      mustHaves: [],
      ready: false,
      assistCount: 0,
    });
    await scheduleCollectDeadline(ctx, (await ctx.db.get(roomId))!);
    return { code, memberId, token };
  },
});

export const joinInfo = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", code.toUpperCase()))
      .unique();
    if (!room) return null;
    return { title: room.title, theme: room.theme, open: room.phase === "collecting" };
  },
});

export const join = mutation({
  args: { code: v.string(), name: v.string() },
  handler: async (ctx, { code, name }) => {
    const room = await roomByCode(ctx, code);
    if (room.phase !== "collecting") fail("案の受付が終わったので、新しく参加できません");
    if ((await membersOf(ctx, room._id)).length >= MAX_MEMBERS) fail(`参加できるのは${MAX_MEMBERS}人までです`);
    const token = randomToken();
    const memberId = await ctx.db.insert("members", {
      roomId: room._id,
      name: text(name, "名前", 30, 1),
      tokenHash: await sha256(token),
      isHost: false,
      mustHaves: [],
      ready: false,
      assistCount: 0,
    });
    return { code: room.code, memberId, token };
  },
});

export const saveIdea = mutation({
  args: { ...session, id: v.optional(v.id("ideas")), title: v.string(), body: v.string() },
  handler: async (ctx, { code, token, id, title, body }) => {
    const { room, me } = await auth(ctx, code, token);
    requirePhase(room, "collecting");
    const fields = { title: text(title, "案の名前", 40, 1), body: text(body, "案の説明", 1200) };
    if (id) {
      const idea = await ctx.db.get(id);
      if (!idea || idea.memberId !== me._id) fail("案が見つかりません");
      await ctx.db.patch(id, fields);
      return;
    }
    const mine = (await ideasOf(ctx, room._id)).filter((i) => i.memberId === me._id);
    if (mine.length >= MAX_IDEAS) fail(`案は1人${MAX_IDEAS}つまでです`);
    await ctx.db.insert("ideas", { roomId: room._id, memberId: me._id, round: 1, ...fields });
  },
});

export const deleteIdea = mutation({
  args: { ...session, id: v.id("ideas") },
  handler: async (ctx, { code, token, id }) => {
    const { room, me } = await auth(ctx, code, token);
    requirePhase(room, "collecting");
    const idea = await ctx.db.get(id);
    if (!idea || idea.memberId !== me._id) fail("案が見つかりません");
    await ctx.db.delete(id);
  },
});

export const updateMe = mutation({
  args: { ...session, mustHaves: v.optional(v.array(v.string())), ready: v.optional(v.boolean()) },
  handler: async (ctx, { code, token, mustHaves, ready }) => {
    const { room, me } = await auth(ctx, code, token);
    requirePhase(room, "collecting");
    const patch: Partial<Doc<"members">> = {};
    if (mustHaves) {
      const list = mustHaves.map((m) => m.trim()).filter(Boolean);
      if (list.length > MAX_MUST_HAVES) fail(`譲れない条件は${MAX_MUST_HAVES}つまでです`);
      patch.mustHaves = list.map((m) => text(m, "譲れない条件", 40, 1));
    }
    if (ready !== undefined) patch.ready = ready;
    await ctx.db.patch(me._id, patch);
    await maybeCloseCollecting(ctx, room);
  },
});

export const vote = mutation({
  args: { ...session, approved: v.array(v.id("ideas")) },
  handler: async (ctx, { code, token, approved }) => {
    const { room, me } = await auth(ctx, code, token);
    requirePhase(room, "voting");
    if (!room.participants.includes(me._id)) fail("この会議の参加者だけが承認できます");
    const valid = [...new Set(approved)].filter((id) => room.shortlist.includes(id));
    const existing = await ctx.db
      .query("votes")
      .withIndex("by_room_round", (q) => q.eq("roomId", room._id).eq("round", room.round).eq("memberId", me._id))
      .unique();
    if (existing) await ctx.db.patch(existing._id, { approved: valid });
    else await ctx.db.insert("votes", { roomId: room._id, round: room.round, memberId: me._id, approved: valid });
    await maybeCloseVoting(ctx, room);
  },
});

export const sendFeedback = mutation({
  args: { ...session, text: v.string() },
  handler: async (ctx, args) => {
    const { room, me } = await auth(ctx, args.code, args.token);
    requirePhase(room, "feedback");
    if (!room.participants.includes(me._id)) fail("この会議の参加者だけが送れます");
    const body = text(args.text, "意見", 400);
    const existing = await ctx.db
      .query("feedback")
      .withIndex("by_room_round", (q) => q.eq("roomId", room._id).eq("round", room.round).eq("memberId", me._id))
      .unique();
    if (existing) await ctx.db.patch(existing._id, { text: body });
    else await ctx.db.insert("feedback", { roomId: room._id, round: room.round, memberId: me._id, text: body });
    await maybeCloseFeedback(ctx, room);
  },
});

export const host = mutation({
  args: {
    ...session,
    action: v.union(v.literal("close"), v.literal("retry"), v.literal("pick")),
    ideaId: v.optional(v.id("ideas")),
  },
  handler: async (ctx, { code, token, action, ideaId }) => {
    const { room, me } = await auth(ctx, code, token);
    if (!me.isHost) fail("ホストだけができる操作です");

    if (action === "close") {
      if (room.phase === "collecting") {
        if (!(await startJudging(ctx, room))) fail("案が1つもないので締め切れません");
      } else if (room.phase === "voting") await closeVoting(ctx, room);
      else if (room.phase === "feedback") await closeFeedback(ctx, room);
      else fail("いまは締め切れません");
    }

    if (action === "retry") {
      if (room.phase !== "judging" && room.phase !== "revising") fail("やり直す処理がありません");
      await ctx.db.patch(room._id, { aiAttempts: 0, aiError: undefined });
      await scheduleAi(ctx, room._id, room.phase, room.round);
    }

    if (action === "pick") {
      if (room.phase !== "tie" || !ideaId || !room.tieIds.includes(ideaId)) fail("同数の案の中から選んでください");
      await ctx.db.patch(room._id, { phase: "decided", decidedIdeaId: ideaId, decidedBy: "manual" });
    }
  },
});

export const view = query({
  args: session,
  handler: async (ctx, { code, token }) => {
    const { room, me } = await auth(ctx, code, token);
    const [ms, list] = await Promise.all([membersOf(ctx, room._id), ideasOf(ctx, room._id)]);
    const marks = await ctx.db
      .query("marks")
      .withIndex("by_room_round", (q) => q.eq("roomId", room._id).eq("round", room.round))
      .collect();
    const allVotes = (
      await Promise.all(
        Array.from({ length: room.round }, (_, i) =>
          ctx.db
            .query("votes")
            .withIndex("by_room_round", (q) => q.eq("roomId", room._id).eq("round", i + 1))
            .collect(),
        ),
      )
    ).flat();
    const fbs = await ctx.db
      .query("feedback")
      .withIndex("by_room_round", (q) => q.eq("roomId", room._id).eq("round", room.round))
      .collect();

    const collecting = room.phase === "collecting";
    const decided = room.phase === "decided";
    const axes = collecting ? [] : await axesOf(ctx, room);
    const nameOf = new Map(ms.map((m) => [m._id as string, m.name]));

    const results = [];
    for (let r = 1; r <= room.round; r++) {
      const closed = r < room.round || ["feedback", "revising", "tie", "decided"].includes(room.phase);
      const rv = allVotes.filter((x) => x.round === r);
      if (!closed || rv.length === 0) continue;
      const candidates: Id<"ideas">[] =
        r === room.round ? room.shortlist : list.filter((i) => i.round === r + 1 && i.parentId).map((i) => i.parentId!);
      results.push({
        round: r,
        voters: rv.length,
        threshold: threshold(rv.length),
        counts: tally(
          candidates,
          rv.map((x) => ({ memberId: x.memberId, approved: x.approved })),
        ),
      });
    }

    return {
      room: {
        code: room.code,
        title: room.title,
        theme: room.theme,
        teamAxes: room.axes,
        tieMode: room.tieMode,
        collectDeadline: room.collectDeadline,
        voteHours: room.voteHours,
        phase: room.phase,
        round: room.round,
        phaseDeadline: room.phaseDeadline ?? null,
        shortlist: room.shortlist as string[],
        excluded: room.excluded.map((e) => ({ id: e.ideaId as string, axisIds: e.axisIds })),
        tieIds: room.tieIds as string[],
        decidedIdeaId: room.decidedIdeaId ?? null,
        decidedBy: room.decidedBy ?? null,
        model: room.modelUsed ?? modelLabel(),
        aiError: room.aiError ?? null,
        aiNeedsRetry: (room.phase === "judging" || room.phase === "revising") && room.aiAttempts >= AUTO_AI_ATTEMPTS,
      },
      me: {
        id: me._id as string,
        name: me.name,
        isHost: me.isHost,
        mustHaves: me.mustHaves,
        ready: me.ready,
        assistLeft: Math.max(0, ASSIST_LIMIT - me.assistCount),
      },
      members: ms.map((m) => ({
        id: m._id as string,
        name: m.name,
        isHost: m.isHost,
        ready: m.ready,
        participant: room.participants.includes(m._id),
        ideaCount: list.filter((i) => i.memberId === m._id && i.round === 1).length,
        voted: allVotes.some((x) => x.memberId === m._id && x.round === room.round),
        feedbackSent: fbs.some((f) => f.memberId === m._id),
      })),
      axes: axes.map((a) => ({ ...a, ownerName: a.ownerId ? (nameOf.get(a.ownerId) ?? "") : undefined })),
      ideas: list
        .filter((i) => !collecting || i.memberId === me._id)
        .map((i) => ({
          id: i._id as string,
          round: i.round,
          parentId: (i.parentId as string | undefined) ?? null,
          title: i.title,
          body: i.body,
          summary: i.summary ?? null,
          mine: i.memberId === me._id,
          author: decided && i.memberId ? (nameOf.get(i.memberId) ?? null) : null,
        })),
      marks: marks.map((m) => ({ ideaId: m.ideaId as string, axisId: m.axisId, mark: m.mark, reason: m.reason })),
      myVote: (allVotes.find((x) => x.memberId === me._id && x.round === room.round)?.approved as string[] | undefined) ?? null,
      results,
    };
  },
});
