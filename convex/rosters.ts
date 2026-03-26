import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAnyRole } from "./lib/auth";

export const getEmployeeRosters = query({
  args: { employeeId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("shiftRosters")
      .withIndex("by_employeeId", (q) => q.eq("employeeId", args.employeeId))
      .order("desc")
      .collect();
  },
});

export const getShiftRosters = query({
  args: { shiftId: v.id("shifts") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("shiftRosters")
      .withIndex("by_shiftId", (q) => q.eq("shiftId", args.shiftId))
      .order("desc")
      .collect();
  },
});

export const assignRoster = mutation({
  args: {
    employeeId: v.string(),
    shiftId: v.id("shifts"),
    effectiveFrom: v.string(), // YYYY-MM-DD
  },
  handler: async (ctx, args) => {
    await requireAnyRole(ctx, ["hr_admin"]);
    
    // Check if there is a currently active roster with an overlapping effectiveFrom
    const allRosters = await ctx.db
      .query("shiftRosters")
      .withIndex("by_employeeId", (q) => q.eq("employeeId", args.employeeId))
      .collect();
      
    // Iterate over existing rosters and close any that are "open" (effectiveTo = undefined) 
    // or end after our new effectiveFrom.
    // For simplicity, we just cap the open ones to end the day before the new shift starts.
    const newStartDate = new Date(args.effectiveFrom);
    
    for (const roster of allRosters) {
      if (!roster.effectiveTo) {
        // If the new shift starts on or before an existing open shift, we just replace it.
        // But more correctly, an HR admin sets an effectiveFrom for the new shift. 
        // The old active shift's effectiveTo becomes the day before.
        const prevEndDate = new Date(newStartDate);
        prevEndDate.setDate(prevEndDate.getDate() - 1);
        const effectiveTo = prevEndDate.toISOString().split("T")[0];
        
        await ctx.db.patch(roster._id, {
          effectiveTo,
        });
      }
    }

    return await ctx.db.insert("shiftRosters", {
      employeeId: args.employeeId,
      shiftId: args.shiftId,
      effectiveFrom: args.effectiveFrom,
      createdAt: Date.now(),
    });
  },
});

export const removeRoster = mutation({
  args: { rosterId: v.id("shiftRosters") },
  handler: async (ctx, args) => {
    await requireAnyRole(ctx, ["hr_admin"]);
    await ctx.db.delete(args.rosterId);
  },
});

export const getWeeklyOffRules = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("weeklyOffRules").collect();
  },
});

export const setWeeklyOffRule = mutation({
  args: {
    scope: v.union(v.literal("employee"), v.literal("department")),
    scopeId: v.string(),
    offDays: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAnyRole(ctx, ["hr_admin"]);
    
    const existing = await ctx.db
      .query("weeklyOffRules")
      .withIndex("by_scopeId", (q) => q.eq("scopeId", args.scopeId))
      .first();

    const now = Date.now();
    if (existing) {
      // Check scope matches just in case
      if (existing.scope !== args.scope) {
        throw new Error("Scope mismatch for the same scopeId");
      }
      await ctx.db.patch(existing._id, {
        offDays: args.offDays,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("weeklyOffRules", {
        ...args,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const getEmployeeShiftByDate = query({
  args: { employeeId: v.string(), date: v.string() },
  handler: async (ctx, args) => {
    return getEmployeeShiftByDateInternal(ctx, args);
  },
});

export async function getEmployeeShiftByDateInternal(
  ctx: Parameters<typeof requireAnyRole>[0],
  args: { employeeId: string; date: string },
) {
  const targetDate = args.date; // YYYY-MM-DD
  
  const rosters = await ctx.db
    .query("shiftRosters")
    .withIndex("by_employeeId", (q) => q.eq("employeeId", args.employeeId))
    .collect();

  // Find the valid roster for this date
  const activeRoster = rosters.find((r) => {
    return r.effectiveFrom <= targetDate && (!r.effectiveTo || r.effectiveTo >= targetDate);
  });

  if (!activeRoster) {
    return null;
  }

  const shift = await ctx.db.get(activeRoster.shiftId);
  return shift;
}
