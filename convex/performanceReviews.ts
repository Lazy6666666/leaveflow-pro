import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";

import { now, recordAudit, requireAnyRole } from "./lib/auth";

const reviewStatusValidator = v.union(v.literal("draft"), v.literal("active"), v.literal("closed"));

async function requireReviewAdmin(ctx: QueryCtx | MutationCtx) {
  return await requireAnyRole(ctx, ["hr_admin"]);
}

export const getPerformanceReviewData = query({
  args: {},
  handler: async (ctx) => {
    await requireReviewAdmin(ctx);
    const [cycles, assignments, profiles] = await Promise.all([
      ctx.db.query("performanceReviewCycles").collect(),
      ctx.db.query("performanceReviewAssignments").collect(),
      ctx.db.query("profiles").collect(),
    ]);
    const profileMap = new Map(profiles.map((profile) => [profile.userId, profile.fullName ?? profile.userId]));

    return {
      assignments: assignments.map((assignment) => ({
        assigneeName: profileMap.get(assignment.employeeUserId) ?? assignment.employeeUserId,
        cycleId: assignment.cycleId,
        employeeUserId: assignment.employeeUserId,
        id: assignment._id,
        managerUserId: assignment.managerUserId ?? null,
        notes: assignment.notes ?? "",
        rating: assignment.rating ?? null,
        status: assignment.status,
      })),
      cycles: cycles.map((cycle) => ({
        id: cycle._id,
        name: cycle.name,
        status: cycle.status,
      })),
      profiles: profiles.map((profile) => ({
        fullName: profile.fullName ?? profile.userId,
        userId: profile.userId,
      })),
    };
  },
});

export const saveReviewCycle = mutation({
  args: {
    cycleId: v.optional(v.id("performanceReviewCycles")),
    name: v.string(),
    status: reviewStatusValidator,
  },
  handler: async (ctx, args) => {
    const { identity } = await requireReviewAdmin(ctx);
    const payload = { name: args.name, status: args.status, updatedAt: now() };

    if (!args.cycleId) {
      const cycleId = await ctx.db.insert("performanceReviewCycles", { ...payload, createdAt: now(), createdBy: identity.subject });
      await recordAudit(ctx, {
        action: "INSERT",
        changedBy: identity.subject,
        newData: await ctx.db.get(cycleId),
        recordId: String(cycleId),
        tableName: "performance_review_cycles",
      });
      return { id: cycleId };
    }

    const current = await ctx.db.get(args.cycleId);
    await ctx.db.patch(args.cycleId, payload);
    await recordAudit(ctx, {
      action: "UPDATE",
      changedBy: identity.subject,
      newData: { ...current, ...payload },
      oldData: current,
      recordId: String(args.cycleId),
      tableName: "performance_review_cycles",
    });
    return { id: args.cycleId };
  },
});

export const assignReview = mutation({
  args: {
    cycleId: v.id("performanceReviewCycles"),
    employeeUserId: v.string(),
    managerUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireReviewAdmin(ctx);
    const assignmentId = await ctx.db.insert("performanceReviewAssignments", {
      createdAt: now(),
      createdBy: identity.subject,
      cycleId: args.cycleId,
      employeeUserId: args.employeeUserId,
      managerUserId: args.managerUserId,
      notes: undefined,
      rating: undefined,
      status: "assigned",
      updatedAt: now(),
    });
    await recordAudit(ctx, {
      action: "INSERT",
      changedBy: identity.subject,
      newData: await ctx.db.get(assignmentId),
      recordId: String(assignmentId),
      tableName: "performance_review_assignments",
    });
    return { id: assignmentId };
  },
});
