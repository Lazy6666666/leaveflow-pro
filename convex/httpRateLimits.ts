import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

import { now } from "./lib/auth";

export const HTTP_RATE_LIMITS = {
  biometrics_webhook_ip: {
    limit: 120,
    windowMs: 5 * 60 * 1000,
  },
  biometrics_webhook_replay: {
    limit: 1,
    windowMs: 10 * 60 * 1000,
  },
  clerk_onboarding_ip: {
    limit: 60,
    windowMs: 5 * 60 * 1000,
  },
  clerk_onboarding_replay: {
    limit: 1,
    windowMs: 24 * 60 * 60 * 1000,
  },
} as const;

export type HttpRateLimitScope = keyof typeof HTTP_RATE_LIMITS;

type RateLimitRecord = {
  count: number;
  windowStartedAt: number;
};

export function applyHttpRateLimitWindow(
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
    bucketKey: v.string(),
    scope: v.union(
      v.literal("biometrics_webhook_ip"),
      v.literal("biometrics_webhook_replay"),
      v.literal("clerk_onboarding_ip"),
      v.literal("clerk_onboarding_replay"),
    ),
  },
  handler: async (ctx, args) => {
    const currentTime = now();
    const config = HTTP_RATE_LIMITS[args.scope];
    const existing = await ctx.db
      .query("httpRateLimits")
      .withIndex("by_bucketKey_scope", (q) => q.eq("bucketKey", args.bucketKey).eq("scope", args.scope))
      .unique();
    const decision = applyHttpRateLimitWindow(
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
      await ctx.db.insert("httpRateLimits", {
        bucketKey: args.bucketKey,
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
