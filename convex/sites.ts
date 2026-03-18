import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAnyRole, requireIdentity, now } from "./lib/auth";
import { locationValidator } from "./constants";

export const listSites = query({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx);
    return ctx.db.query("sites").collect();
  },
});

export const getSiteForSupervisor = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    const sup = await ctx.db.query("siteSupervisors").withIndex("by_userId", (q) => q.eq("userId", args.userId)).first();
    if (!sup) return null;
    return ctx.db.get(sup.siteId);
  },
});

export const getSitesForSupervisor = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    const assignments = await ctx.db
      .query("siteSupervisors")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const sites = await Promise.all(assignments.map((assignment) => ctx.db.get(assignment.siteId)));
    return sites.filter((site): site is NonNullable<typeof site> => site !== null);
  },
});

export const createSite = mutation({
  args: {
    name: v.string(),
    address: v.optional(v.string()),
    geofenceCenter: v.optional(locationValidator),
    geofenceRadiusMeters: v.optional(v.number()),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAnyRole(ctx, ["hr_admin"]);
    return ctx.db.insert("sites", { ...args, isActive: true, createdAt: now(), updatedAt: now() });
  },
});

export const updateSite = mutation({
  args: {
    siteId: v.id("sites"),
    name: v.optional(v.string()),
    address: v.optional(v.string()),
    geofenceCenter: v.optional(locationValidator),
    geofenceRadiusMeters: v.optional(v.number()),
    timezone: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAnyRole(ctx, ["hr_admin"]);
    const { siteId, ...fields } = args;
    await ctx.db.patch(siteId, { ...fields, updatedAt: now() });
  },
});

export const deleteSite = mutation({
  args: { siteId: v.id("sites") },
  handler: async (ctx, args) => {
    await requireAnyRole(ctx, ["hr_admin"]);
    await ctx.db.delete(args.siteId);
  },
});

export const addSiteSupervisor = mutation({
  args: { siteId: v.id("sites"), userId: v.string() },
  handler: async (ctx, args) => {
    await requireAnyRole(ctx, ["hr_admin"]);
    const existing = await ctx.db
      .query("siteSupervisors")
      .withIndex("by_siteId", (q) => q.eq("siteId", args.siteId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    if (existing) return;
    await ctx.db.insert("siteSupervisors", { siteId: args.siteId, userId: args.userId, createdAt: now() });
  },
});

export const removeSiteSupervisor = mutation({
  args: { siteId: v.id("sites"), userId: v.string() },
  handler: async (ctx, args) => {
    await requireAnyRole(ctx, ["hr_admin"]);
    const rec = await ctx.db.query("siteSupervisors").withIndex("by_siteId", (q) => q.eq("siteId", args.siteId)).filter((q) => q.eq(q.field("userId"), args.userId)).first();
    if (rec) await ctx.db.delete(rec._id);
  },
});

export const getSiteSupervisors = query({
  args: { siteId: v.id("sites") },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    return ctx.db.query("siteSupervisors").withIndex("by_siteId", (q) => q.eq("siteId", args.siteId)).collect();
  },
});
