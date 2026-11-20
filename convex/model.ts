import { ConvexError } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { buildAxes, decide, shortlist, type MarkTable, type Outcome } from "../src/lib/rules";

export const HOUR = 3_600_000;
export const AUTO_AI_ATTEMPTS = 2;
export const AI_RETRY_DELAY_MS = 5_000;
export const DEFAULT_MODEL = "claude-haiku-5-5";
export const MOCK_MODEL = "mock（見本の判定）";

export const aiMock = () => process.env.AI_MOCK === "1";
export const aiModel = () => process.env.AI_MODEL?.trim() || DEFAULT_MODEL;
export const modelLabel = () => (aiMock() ? MOCK_MODEL : aiModel());

export const MANUAL_MODEL = "手動（ホストが判定）";
export const aiDailyLimit = () => {
  const raw = process.env.AI_DAILY_LIMIT?.trim();
  const n = Number(raw);
  return raw && Number.isFinite(n) && n >= 0 ? n : 300;
};
export const AI_LIMIT_MESSAGE = "今日の AI の利用上限に達しました。ホストが手動で進められます";
export const AI_LIMIT_ASSIST_MESSAGE = "今日の AI の利用上限に達しました。案は手で書いて出してください";

const jstDay = (t = Date.now()) => new Date(t + 9 * HOUR).toISOString().slice(0, 10);

export async function claimAiCall(ctx: MutationCtx): Promise<boolean> {
  if (aiMock()) return true;
  const day = jstDay();
  const row = await ctx.db
    .query("aiUsage")
    .withIndex("by_day", (q) => q.eq("day", day))
    .unique();
  const count = row?.count ?? 0;
  if (count >= aiDailyLimit()) return false;
  if (row) await ctx.db.patch(row._id, { count: count + 1 });
  else await ctx.db.insert("aiUsage", { day, count: 1 });
  return true;
}

export async function roomsCreatedToday(ctx: QueryCtx, ownerId: Id<"users">): Promise<number> {
  const since = Date.now() - 24 * HOUR;
  const rooms = await ctx.db
    .query("rooms")
    .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
    .order("desc")
    .take(50);
  return rooms.filter((r) => r._creationTime >= since).length;
}

export function fail(message: string): never {
  throw new ConvexError(message);
}

export function text(value: string, label: string, max: number, min = 0): string {
  const t = value.trim();
  if (t.length < min) fail(`${label}を入力してください`);
  if (t.length > max) fail(`${label}は${max}文字以内にしてください`);
  return t;
}

export async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function randomCode(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => CODE_CHARS[b % CODE_CHARS.length]).join("");
}

export async function roomByCode(ctx: QueryCtx, code: string): Promise<Doc<"rooms">> {
  const room = await ctx.db
    .query("rooms")
    .withIndex("by_code", (q) => q.eq("code", code.toUpperCase()))
    .unique();
  if (!room) fail("会議が見つかりません");
  return room;
}

export async function auth(ctx: QueryCtx, code: string, token: string) {
  const room = await roomByCode(ctx, code);
  const tokenHash = await sha256(token);
  const me = await ctx.db
    .query("members")
    .withIndex("by_room_token", (q) => q.eq("roomId", room._id).eq("tokenHash", tokenHash))
    .unique();
  if (!me) fail("参加情報が見つかりません。招待リンクから参加し直してください");
  return { room, me };
}

export function requirePhase(room: Doc<"rooms">, ...phases: Doc<"rooms">["phase"][]) {
  if (!phases.includes(room.phase)) fail("いまはこの操作はできません");
}

export const membersOf = (ctx: QueryCtx, roomId: Id<"rooms">) =>
  ctx.db
    .query("members")
    .withIndex("by_room", (q) => q.eq("roomId", roomId))
    .collect();

export const ideasOf = (ctx: QueryCtx, roomId: Id<"rooms">) =>
  ctx.db
    .query("ideas")
    .withIndex("by_room", (q) => q.eq("roomId", roomId))
    .collect();

export const votesOf = (ctx: QueryCtx, roomId: Id<"rooms">, round: number) =>
  ctx.db
    .query("votes")
    .withIndex("by_room_round", (q) => q.eq("roomId", roomId).eq("round", round))
    .collect();

export const feedbackOf = (ctx: QueryCtx, roomId: Id<"rooms">, round: number) =>
  ctx.db
    .query("feedback")
    .withIndex("by_room_round", (q) => q.eq("roomId", roomId).eq("round", round))
    .collect();

export async function axesOf(ctx: QueryCtx, room: Doc<"rooms">) {
  const ms = (await membersOf(ctx, room._id)).filter((m) => room.participants.includes(m._id));
  return buildAxes(
    room.axes,
    ms.map((m) => ({ id: m._id, must_haves: m.mustHaves })),
  );
}

async function scheduleDeadline(ctx: MutationCtx, room: Doc<"rooms">, at: number) {
  await ctx.scheduler.runAt(at, internal.engine.deadline, { roomId: room._id, phase: room.phase, round: room.round });
}

export async function scheduleAi(
  ctx: MutationCtx,
  roomId: Id<"rooms">,
  phase: "judging" | "revising",
  round: number,
  delay = 0,
) {
  await ctx.scheduler.runAfter(delay, phase === "judging" ? internal.ai.judge : internal.ai.revise, { roomId, round });
}

export async function startJudging(ctx: MutationCtx, room: Doc<"rooms">): Promise<boolean> {
  const ideas = await ideasOf(ctx, room._id);
  if (ideas.length === 0) return false;
  const withIdeas = new Set(ideas.map((i) => i.memberId));
  const participants = (await membersOf(ctx, room._id))
    .filter((m) => m.ready || withIdeas.has(m._id))
    .map((m) => m._id);
  await ctx.db.patch(room._id, { phase: "judging", participants, aiAttempts: 0, aiError: undefined });
  await scheduleAi(ctx, room._id, "judging", room.round);
  return true;
}

export async function maybeCloseCollecting(ctx: MutationCtx, room: Doc<"rooms">) {
  if (room.phase !== "collecting") return;
  const ms = await membersOf(ctx, room._id);
  if (ms.length >= 2 && ms.every((m) => m.ready)) await startJudging(ctx, room);
}

export async function openVoting(
  ctx: MutationCtx,
  room: Doc<"rooms">,
  judged: { ideaId: Id<"ideas">; marks: Record<string, "o" | "d" | "x"> }[],
) {
  const axes = await axesOf(ctx, room);
  const table: MarkTable = Object.fromEntries(judged.map((j) => [j.ideaId, j.marks]));
  const sl = shortlist(
    judged.map((j) => ({ id: j.ideaId })),
    axes,
    table,
  );
  const phaseDeadline = Date.now() + room.voteHours * HOUR;
  await ctx.db.patch(room._id, {
    phase: "voting",
    shortlist: sl.ids as Id<"ideas">[],
    excluded: sl.excluded.map((e) => ({ ideaId: e.id as Id<"ideas">, axisIds: e.axisIds })),
    phaseDeadline,
    aiError: undefined,
  });
  await scheduleDeadline(ctx, { ...room, phase: "voting" }, phaseDeadline);
}

export async function applyOutcome(ctx: MutationCtx, room: Doc<"rooms">, outcome: Outcome) {
  if (outcome.kind === "decided") {
    await ctx.db.patch(room._id, {
      phase: "decided",
      decidedIdeaId: outcome.ideaId as Id<"ideas">,
      decidedBy: outcome.by,
      phaseDeadline: undefined,
    });
    return;
  }
  if (outcome.kind === "tie") {
    const ids = outcome.ids as Id<"ideas">[];
    if (room.tieMode === "roulette") {
      await ctx.db.patch(room._id, {
        phase: "decided",
        tieIds: ids,
        decidedIdeaId: ids[Math.floor(Math.random() * ids.length)],
        decidedBy: "roulette",
        phaseDeadline: undefined,
      });
    } else {
      await ctx.db.patch(room._id, { phase: "tie", tieIds: ids, phaseDeadline: undefined });
    }
    return;
  }
  const phaseDeadline = Date.now() + room.voteHours * HOUR;
  await ctx.db.patch(room._id, { phase: "feedback", phaseDeadline });
  await scheduleDeadline(ctx, { ...room, phase: "feedback" }, phaseDeadline);
}

async function decideRound(ctx: MutationCtx, room: Doc<"rooms">, finalRound: boolean) {
  const votes = await votesOf(ctx, room._id, room.round);
  const outcome = decide(
    room.shortlist,
    votes.map((v) => ({ memberId: v.memberId, approved: v.approved })),
    finalRound,
  );
  await applyOutcome(ctx, room, outcome);
}

export async function closeVoting(ctx: MutationCtx, room: Doc<"rooms">) {
  if (room.phase !== "voting") return;
  await decideRound(ctx, room, room.round >= 2);
}

export async function decideWithoutRevision(ctx: MutationCtx, room: Doc<"rooms">) {
  if (room.phase !== "revising") return;
  await decideRound(ctx, room, true);
}

export async function maybeCloseVoting(ctx: MutationCtx, room: Doc<"rooms">) {
  const votes = await votesOf(ctx, room._id, room.round);
  if (room.participants.every((id) => votes.some((v) => v.memberId === id))) await closeVoting(ctx, room);
}

export async function closeFeedback(ctx: MutationCtx, room: Doc<"rooms">) {
  if (room.phase !== "feedback") return;
  await ctx.db.patch(room._id, { phase: "revising", aiAttempts: 0, aiError: undefined, phaseDeadline: undefined });
  await scheduleAi(ctx, room._id, "revising", room.round);
}

export async function maybeCloseFeedback(ctx: MutationCtx, room: Doc<"rooms">) {
  const fb = await feedbackOf(ctx, room._id, room.round);
  if (room.participants.every((id) => fb.some((f) => f.memberId === id))) await closeFeedback(ctx, room);
}

export async function scheduleCollectDeadline(ctx: MutationCtx, room: Doc<"rooms">) {
  await scheduleDeadline(ctx, room, room.collectDeadline);
}
