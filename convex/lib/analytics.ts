import type { MutationCtx } from "../_generated/server";

export async function insertAnalyticsEvent(
  ctx: MutationCtx,
  input: {
    eventName: string;
    sessionId: string;
    userId?: string;
    roleScope?: string;
    path?: string;
    surface: string;
    properties?: Record<string, unknown>;
    timestamp?: string;
  },
) {
  const timestamp = input.timestamp ?? new Date().toISOString();

  await ctx.db.insert("analyticsEvents", {
    eventName: input.eventName,
    sessionId: input.sessionId,
    userId: input.userId,
    roleScope: input.roleScope,
    path: input.path,
    surface: input.surface,
    properties: input.properties,
    timestamp,
    createdAt: Date.now(),
  });
}
