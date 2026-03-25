import { mutation } from "./_generated/server";
import { v } from "convex/values";

import { insertAnalyticsEvent } from "./lib/analytics";

export const track = mutation({
  args: {
    eventName: v.string(),
    sessionId: v.string(),
    roleScope: v.optional(v.string()),
    path: v.optional(v.string()),
    surface: v.string(),
    properties: v.optional(v.any()),
    timestamp: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    await insertAnalyticsEvent(ctx, {
      eventName: args.eventName,
      sessionId: args.sessionId,
      userId: identity?.subject,
      roleScope: args.roleScope,
      path: args.path,
      surface: args.surface,
      properties: args.properties,
      timestamp: args.timestamp,
    });
    return { ok: true };
  },
});
