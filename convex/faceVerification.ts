import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAnyRole, requireIdentity, now } from "./lib/auth";

export const enrollFace = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const employeeId = identity.subject;
    // Revoke any existing active enrollment
    const existing = await ctx.db.query("faceEnrollments").withIndex("by_employeeId", (q) => q.eq("employeeId", employeeId)).collect();
    for (const e of existing.filter((e) => e.status === "active")) {
      await ctx.db.patch(e._id, { status: "revoked", updatedAt: now() });
    }
    return ctx.db.insert("faceEnrollments", {
      employeeId,
      storageId: args.storageId,
      enrolledAt: now(),
      status: "pending",
      createdAt: now(),
      updatedAt: now(),
    });
  },
});

export const getEnrollmentStatus = query({
  args: { employeeId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const targetId = args.employeeId ?? identity.subject;
    return ctx.db.query("faceEnrollments").withIndex("by_employeeId", (q) => q.eq("employeeId", targetId)).order("desc").first();
  },
});

export const ingestVerificationResult = mutation({
  args: {
    attendanceLogId: v.id("attendanceLogs"),
    confidence: v.number(),
    result: v.union(v.literal("match"), v.literal("no_match"), v.literal("manual")),
  },
  handler: async (ctx, args) => {
    await requireAnyRole(ctx, ["hr_admin"]);
    await ctx.db.insert("verificationResults", {
      attendanceLogId: args.attendanceLogId,
      confidence: args.confidence,
      result: args.result,
      processedAt: now(),
      createdAt: now(),
    });
    // Update trustState on the attendance log
    const trustState = args.result === "match" ? "verified" : args.result === "no_match" ? "flagged" : "supervised";
    await ctx.db.patch(args.attendanceLogId, { trustState, updatedAt: now() });
  },
});

export const getVerificationResult = query({
  args: { attendanceLogId: v.id("attendanceLogs") },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    return ctx.db.query("verificationResults").withIndex("by_attendanceLogId", (q) => q.eq("attendanceLogId", args.attendanceLogId)).order("desc").first();
  },
});
