import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAnyRole } from "./lib/auth";

export const getShifts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("shifts").order("desc").collect();
  },
});

export const getActiveShifts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("shifts")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .order("desc")
      .collect();
  },
});

export const createShift = mutation({
  args: {
    name: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    gracePeriodMinutes: v.number(),
    overtimeThresholdMinutes: v.number(),
    workDays: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAnyRole(ctx, ["hr_admin"]);
    
    const now = Date.now();
    return await ctx.db.insert("shifts", {
      ...args,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateShift = mutation({
  args: {
    shiftId: v.id("shifts"),
    name: v.optional(v.string()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    gracePeriodMinutes: v.optional(v.number()),
    overtimeThresholdMinutes: v.optional(v.number()),
    workDays: v.optional(v.array(v.number())),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAnyRole(ctx, ["hr_admin"]);
    
    const { shiftId, ...updates } = args;
    const existing = await ctx.db.get(shiftId);
    if (!existing) {
      throw new Error("Shift not found");
    }

    await ctx.db.patch(shiftId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const deleteShift = mutation({
  args: {
    shiftId: v.id("shifts"),
  },
  handler: async (ctx, args) => {
    await requireAnyRole(ctx, ["hr_admin"]);
    
    const existing = await ctx.db.get(args.shiftId);
    if (!existing) {
      throw new Error("Shift not found");
    }

    // Check if shift is in use
    const rosters = await ctx.db
      .query("shiftRosters")
      .withIndex("by_shiftId", (q) => q.eq("shiftId", args.shiftId))
      .first();
      
    if (rosters) {
      throw new Error("Cannot delete shift: it is assigned to one or more employees. Please deactivate it instead.");
    }

    await ctx.db.delete(args.shiftId);
  },
});
