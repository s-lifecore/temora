import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const phase = v.union(
  v.literal("collecting"),
  v.literal("judging"),
  v.literal("voting"),
  v.literal("feedback"),
  v.literal("revising"),
  v.literal("tie"),
  v.literal("decided"),
);

export const mark = v.union(v.literal("o"), v.literal("d"), v.literal("x"));

export const plan = v.literal("free");

export const design = v.union(v.literal("simple"), v.literal("fun"), v.literal("calm"), v.literal("cool"));

export default defineSchema({
  users: defineTable({
    plan: v.optional(plan),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
  }),

  aiUsage: defineTable({
    day: v.string(),
    count: v.number(),
  }).index("by_day", ["day"]),

  rooms: defineTable({
    ownerId: v.optional(v.id("users")),
    plan: v.optional(plan),
    code: v.string(),
    title: v.string(),
    theme: v.string(),
    axes: v.array(v.string()),
    tieMode: v.union(v.literal("manual"), v.literal("roulette")),
    design: v.optional(design),
    collectDeadline: v.number(),
    voteHours: v.number(),
    phase,
    round: v.number(),
    participants: v.array(v.id("members")),
    shortlist: v.array(v.id("ideas")),
    excluded: v.array(v.object({ ideaId: v.id("ideas"), axisIds: v.array(v.string()) })),
    phaseDeadline: v.optional(v.number()),
    tieIds: v.array(v.id("ideas")),
    decidedIdeaId: v.optional(v.id("ideas")),
    decidedBy: v.optional(
      v.union(v.literal("approval"), v.literal("most"), v.literal("manual"), v.literal("roulette")),
    ),
    modelUsed: v.optional(v.string()),
    aiError: v.optional(v.string()),
    aiAttempts: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_owner", ["ownerId"]),

  members: defineTable({
    roomId: v.id("rooms"),
    name: v.string(),
    tokenHash: v.string(),
    isHost: v.boolean(),
    mustHaves: v.array(v.string()),
    ready: v.boolean(),
    assistCount: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_room_token", ["roomId", "tokenHash"]),

  ideas: defineTable({
    roomId: v.id("rooms"),
    memberId: v.optional(v.id("members")),
    round: v.number(),
    parentId: v.optional(v.id("ideas")),
    title: v.string(),
    body: v.string(),
    summary: v.optional(v.string()),
  }).index("by_room", ["roomId"]),

  marks: defineTable({
    roomId: v.id("rooms"),
    round: v.number(),
    ideaId: v.id("ideas"),
    axisId: v.string(),
    mark,
    reason: v.string(),
  }).index("by_room_round", ["roomId", "round"]),

  votes: defineTable({
    roomId: v.id("rooms"),
    round: v.number(),
    memberId: v.id("members"),
    approved: v.array(v.id("ideas")),
  }).index("by_room_round", ["roomId", "round", "memberId"]),

  feedback: defineTable({
    roomId: v.id("rooms"),
    round: v.number(),
    memberId: v.id("members"),
    text: v.string(),
  }).index("by_room_round", ["roomId", "round", "memberId"]),
});
