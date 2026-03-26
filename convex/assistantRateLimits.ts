import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { now } from "./lib/auth";

export const ASSISTANT_RATE_LIMITS = {
  assistant_chat: {
    limit: 12,
    windowMs: 5 * 60 * 1000,
  },
  assistant_tool: {
    limit: 48,
    windowMs: 5 * 60 * 1000,
  },
} as const;

export type AssistantRateLimitScope = keyof typeof ASSISTANT_RATE_LIMITS;

type RateLimitRecord = {
  count: number;
  windowStartedAt: number;
};

export function applyRateLimitWindow(
  record: RateLimitRecord | null,
  config: { limit: number; windowMs: number },
  currentTime: number,
) {
  if (!record || currentTime - record.windowStartedAt >= config.windowMs) {
    return {
      allowed: true,
      nextCount: 1,
      nextWindowStartedAt: currentTime,
      retryAfterMs: 0,
      remaining: config.limit - 1,
    } as const;
  }

  if (record.count >= config.limit) {
    return {
      allowed: false,
      nextCount: record.count,
      nextWindowStartedAt: record.windowStartedAt,
      retryAfterMs: Math.max(0, config.windowMs - (currentTime - record.windowStartedAt)),
      remaining: 0,
    } as const;
  }

  const nextCount = record.count + 1;
  return {
    allowed: true,
    nextCount,
    nextWindowStartedAt: record.windowStartedAt,
    retryAfterMs: 0,
    remaining: Math.max(0, config.limit - nextCount),
  } as const;
}

export const consume = internalMutation({
  args: {
    userId: v.string(),
    scope: v.union(v.literal("assistant_chat"), v.literal("assistant_tool")),
  },
  handler: async (ctx, args) => {
    const currentTime = now();
    const config = ASSISTANT_RATE_LIMITS[args.scope];
    const existing = await ctx.db
      .query("assistantRateLimits")
      .withIndex("by_userId_scope", (q) => q.eq("userId", args.userId).eq("scope", args.scope))
      .unique();
    const decision = applyRateLimitWindow(
      existing
        ? {
            count: existing.count,
            windowStartedAt: existing.windowStartedAt,
          }
        : null,
      config,
      currentTime,
    );

    if (!existing) {
      await ctx.db.insert("assistantRateLimits", {
        userId: args.userId,
        scope: args.scope,
        count: decision.nextCount,
        windowStartedAt: decision.nextWindowStartedAt,
        updatedAt: currentTime,
      });
    } else if (
      existing.count !== decision.nextCount ||
      existing.windowStartedAt !== decision.nextWindowStartedAt ||
      existing.updatedAt !== currentTime
    ) {
      await ctx.db.patch(existing._id, {
        count: decision.nextCount,
        windowStartedAt: decision.nextWindowStartedAt,
        updatedAt: currentTime,
      });
    }

    return {
      ok: decision.allowed,
      limit: config.limit,
      remaining: decision.remaining,
      retryAfterMs: decision.retryAfterMs,
      scope: args.scope,
      windowMs: config.windowMs,
    };
  },
});
