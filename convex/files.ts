import { internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getManagedEmployeeIds, getProfileByUserId, hasRole, requireIdentity } from "./lib/auth";
import { storageFileClassValidator } from "./constants";
import { getStorageFileRecord } from "./lib/storage";

export const generateUploadUrl = mutation({
  args: {
    fileClass: storageFileClassValidator,
  },
  handler: async (ctx) => {
    await requireIdentity(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const registerUploadedFile = mutation({
  args: {
    storageId: v.id("_storage"),
    fileClass: storageFileClassValidator,
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const existing = await getStorageFileRecord(ctx, args.storageId);
    if (existing) {
      if (existing.ownerUserId !== identity.subject || existing.fileClass !== args.fileClass) {
        throw new Error("Forbidden");
      }
      return { id: existing._id };
    }

    const fileId = await ctx.db.insert("storageFiles", {
      storageId: args.storageId,
      fileClass: args.fileClass,
      ownerUserId: identity.subject,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { id: fileId };
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
    const storageFile = await getStorageFileRecord(ctx, args.storageId);

    if (storageFile?.fileClass === "avatar") {
      const avatarOwner = await ctx.db
        .query("profiles")
        .withIndex("by_avatarStorageId", (q) => q.eq("avatarStorageId", args.storageId))
        .unique();
      if (avatarOwner) {
        return await ctx.storage.getUrl(args.storageId);
      }
    }

    if (storageFile?.fileClass === "leave_attachment") {
      const requests = await ctx.db
        .query("leaveRequests")
        .withIndex("by_attachmentStorageId", (q) => q.eq("attachmentStorageId", args.storageId))
        .collect();
      const matchedRequest = requests[0];
      if (matchedRequest) {
        if (isHrAdmin || matchedRequest.employeeId === viewerId) {
          return await ctx.storage.getUrl(args.storageId);
        }

        const managedEmployeeIds = await getManagedEmployeeIds(ctx, viewerId);
        if (managedEmployeeIds.includes(matchedRequest.employeeId)) {
          return await ctx.storage.getUrl(args.storageId);
        }
      }
    }

    if (storageFile?.fileClass === "attendance_selfie") {
      const [clockInLog, clockOutLog] = await Promise.all([
        ctx.db
          .query("attendanceLogs")
          .withIndex("by_selfieClockInStorageId", (q) => q.eq("selfieClockInStorageId", args.storageId))
          .unique(),
        ctx.db
          .query("attendanceLogs")
          .withIndex("by_selfieClockOutStorageId", (q) => q.eq("selfieClockOutStorageId", args.storageId))
          .unique(),
      ]);
      const matchedLog = clockInLog ?? clockOutLog;
      if (matchedLog && (isHrAdmin || matchedLog.employeeId === viewerId)) {
        return await ctx.storage.getUrl(args.storageId);
      }
    }

    if (storageFile?.fileClass === "policy_document") {
      throw new Error("Forbidden");
    }

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

export const getOwnedPolicyDocumentUrlForOcr = internalQuery({
  args: {
    storageId: v.id("_storage"),
    ownerUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const storageFile = await getStorageFileRecord(ctx, args.storageId);
    if (!storageFile) {
      throw new Error("Uploaded file metadata was not found");
    }

    if (storageFile.fileClass !== "policy_document" || storageFile.ownerUserId !== args.ownerUserId) {
      throw new Error("Forbidden");
    }

    return await ctx.storage.getUrl(args.storageId);
  },
});
