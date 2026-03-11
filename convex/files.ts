import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getManagedEmployeeIds, getProfileByUserId, hasRole, requireIdentity } from "./lib/auth";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const getFileUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const viewerId = identity.subject;
    const isHrAdmin = await hasRole(ctx, viewerId, "hr_admin");

    const ownProfile = await getProfileByUserId(ctx, viewerId);
    if (ownProfile?.avatarStorageId === args.storageId) {
      return await ctx.storage.getUrl(args.storageId);
    }

    if (isHrAdmin) {
      return await ctx.storage.getUrl(args.storageId);
    }

    const ownLeaveRequests = await ctx.db.query("leaveRequests").withIndex("by_employeeId", (q) => q.eq("employeeId", viewerId)).collect();
    if (ownLeaveRequests.some((request) => request.attachmentStorageId === args.storageId)) {
      return await ctx.storage.getUrl(args.storageId);
    }

    const ownAttendanceLogs = await ctx.db.query("attendanceLogs").withIndex("by_employeeId", (q) => q.eq("employeeId", viewerId)).collect();
    if (
      ownAttendanceLogs.some(
        (log) => log.selfieClockInStorageId === args.storageId || log.selfieClockOutStorageId === args.storageId,
      )
    ) {
      return await ctx.storage.getUrl(args.storageId);
    }

    const managedEmployeeIds = await getManagedEmployeeIds(ctx, viewerId);
    if (managedEmployeeIds.length > 0) {
      const managedLeaveRequests = await ctx.db.query("leaveRequests").collect();
      if (
        managedLeaveRequests.some(
          (request) => managedEmployeeIds.includes(request.employeeId) && request.attachmentStorageId === args.storageId,
        )
      ) {
        return await ctx.storage.getUrl(args.storageId);
      }
    }

    throw new Error("Forbidden");
  },
});
