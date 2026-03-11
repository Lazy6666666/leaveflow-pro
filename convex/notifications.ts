import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { createNotification, requireIdentity } from "./lib/auth";

type DigestRequest = {
  employeeName: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
};

type DigestManagerGroup = {
  managerId: string;
  managerName: string;
  managerEmail: string | null;
  requests: DigestRequest[];
};

export const listCurrent = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", identity.subject))
      .collect();

    return notifications
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 20)
      .map((notification) => ({
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        is_read: notification.isRead,
        created_at: new Date(notification.createdAt).toISOString(),
        user_id: notification.userId,
      }));
  },
});

export const markRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== identity.subject) {
      throw new Error("Notification not found");
    }

    await ctx.db.patch(args.notificationId, { isRead: true });
    return { ok: true };
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId_isRead", (q) => q.eq("userId", identity.subject).eq("isRead", false))
      .collect();

    await Promise.all(notifications.map((notification) => ctx.db.patch(notification._id, { isRead: true })));
    return { ok: true };
  },
});

export const getPendingApprovalDigestPayload = internalQuery({
  args: {},
  handler: async (ctx) => {
    const pendingRequests = await ctx.db
      .query("leaveRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    if (pendingRequests.length === 0) {
      return {
        generatedAt: new Date().toISOString(),
        totalPendingRequests: 0,
        groups: [] as DigestManagerGroup[],
      };
    }

    const profiles = await ctx.db.query("profiles").collect();
    const profileByUserId = new Map(profiles.map((profile) => [profile.userId, profile]));
    const leaveTypes = await ctx.db.query("leaveTypes").collect();
    const leaveTypeById = new Map(leaveTypes.map((leaveType) => [String(leaveType._id), leaveType]));

    const grouped = new Map<string, DigestManagerGroup>();

    for (const request of pendingRequests) {
      const employeeProfile = profileByUserId.get(request.employeeId);
      const managerId = employeeProfile?.managerUserId;
      if (!managerId) {
        continue;
      }

      const managerProfile = profileByUserId.get(managerId);
      const existing = grouped.get(managerId) ?? {
        managerId,
        managerName: managerProfile?.fullName ?? managerProfile?.email ?? "Manager",
        managerEmail: managerProfile?.email ?? null,
        requests: [],
      };

      existing.requests.push({
        employeeName: employeeProfile?.fullName ?? employeeProfile?.email ?? "Employee",
        leaveTypeName: leaveTypeById.get(String(request.leaveTypeId))?.name ?? "Leave",
        startDate: request.startDate,
        endDate: request.endDate,
      });

      grouped.set(managerId, existing);
    }

    return {
      generatedAt: new Date().toISOString(),
      totalPendingRequests: pendingRequests.length,
      groups: Array.from(grouped.values()).sort((a, b) => a.managerName.localeCompare(b.managerName)),
    };
  },
});

export const createScheduledNotification = internalMutation({
  args: {
    userId: v.string(),
    title: v.string(),
    message: v.string(),
    type: v.union(v.literal("info"), v.literal("success"), v.literal("warning"), v.literal("error")),
  },
  handler: async (ctx, args) => {
    await createNotification(ctx, args);
    return { ok: true };
  },
});
