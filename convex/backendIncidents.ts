import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

import { now, requireAnyRole } from "./lib/auth";

export const recordIssue = internalMutation({
  args: {
    source: v.string(),
    message: v.string(),
    severity: v.optional(v.union(v.literal("error"), v.literal("warning"), v.literal("info"))),
    details: v.optional(v.any()),
    fingerprint: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const incidentId = await ctx.db.insert("backendIncidents", {
      source: args.source,
      message: args.message,
      severity: args.severity ?? "error",
      details: args.details,
      fingerprint: args.fingerprint,
      createdAt: now(),
    });

    return { ok: true, id: incidentId };
  },
});

export const listRecent = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAnyRole(ctx, ["hr_admin"]);

    const limit = Math.min(Math.max(args.limit ?? 50, 1), 200);
    const incidents = await ctx.db.query("backendIncidents").withIndex("by_createdAt").order("desc").take(limit);

    return incidents.map((incident) => ({
      id: incident._id,
      source: incident.source,
      message: incident.message,
      severity: incident.severity,
      details: incident.details ?? null,
      fingerprint: incident.fingerprint ?? [],
      createdAt: new Date(incident.createdAt).toISOString(),
    }));
  },
});
