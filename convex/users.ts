import { getAuthUserId } from "@convex-dev/auth/server";
import { vGoogleProfile } from "@convex-dev/auth/methods/google/server";
import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

export const createUserGoogle = internalMutation({
  args: { method: v.object({ name: v.literal("google"), profile: vGoogleProfile }) },
  returns: v.id("users"),
  handler: async (ctx, { method }) => {
    const { profile } = method;
    return await ctx.db.insert("users", {
      name: profile.name,
      email: profile.emailVerified ? profile.email : undefined,
      image: profile.picture,
    });
  },
});

export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    return user ? { name: user.name ?? null, image: user.image ?? null } : null;
  },
});
