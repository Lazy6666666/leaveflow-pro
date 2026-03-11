import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  createNotification,
  formatDayCount,
  getManagedEmployeeIds,
  getProfileByUserId,
  getUserRoles,
  hasRole,
  now,
  recordAudit,
  requireIdentity,
} from "./lib/auth";
import { halfDayTypeValidator, leaveRequestStatusValidator, type LeaveRequestStatus } from "./constants";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { LeaveBalanceDoc, LeaveRequestDoc } from "./lib/types";

async function serializeLeaveBalance(ctx: QueryCtx | MutationCtx, balance: LeaveBalanceDoc) {
  const leaveType = await ctx.db.get(balance.leaveTypeId);
  return {
    id: balance._id,
    balance: balance.balance,
    leave_type_id: balance.leaveTypeId,
    year: balance.year,
    leave_types: leaveType
      ? {
          name: leaveType.name,
          annual_allocation: leaveType.annualAllocation,
          carry_forward_limit: leaveType.carryForwardLimit,
        }
      : null,
  };
}

async function serializeLeaveRequest(
  ctx: QueryCtx | MutationCtx,
  leaveRequest: LeaveRequestDoc,
  options?: { includeEmployee?: boolean },
) {
  const leaveType = await ctx.db.get(leaveRequest.leaveTypeId);
  const employeeProfile = options?.includeEmployee
    ? await getProfileByUserId(ctx, leaveRequest.employeeId)
    : null;

  return {
    id: leaveRequest._id,
    start_date: leaveRequest.startDate,
    end_date: leaveRequest.endDate,
    reason: leaveRequest.reason ?? null,
    status: leaveRequest.status,
    manager_comment: leaveRequest.managerComment ?? null,
    created_at: new Date(leaveRequest.createdAt).toISOString(),
    attachment_url: leaveRequest.attachmentUrl ?? null,
    attachment_name: leaveRequest.attachmentName ?? null,
    half_day_type: leaveRequest.halfDayType ?? null,
    leave_types: leaveType ? { name: leaveType.name } : null,
    profiles: employeeProfile
      ? {
          full_name: employeeProfile.fullName ?? null,
          email: employeeProfile.email ?? null,
        }
      : null,
  };
}

async function updateBalanceForStatusChange(
  ctx: MutationCtx,
  leaveRequest: LeaveRequestDoc,
  previousStatus: LeaveRequestStatus,
  nextStatus: LeaveRequestStatus,
) {
  const year = Number(leaveRequest.startDate.slice(0, 4));
  const balance = await ctx.db
    .query("leaveBalances")
    .withIndex("by_employeeId_leaveType_year", (q) =>
      q
        .eq("employeeId", leaveRequest.employeeId)
        .eq("leaveTypeId", leaveRequest.leaveTypeId)
        .eq("year", year),
    )
    .unique();

  if (!balance) {
    return;
  }

  const delta = formatDayCount(leaveRequest.startDate, leaveRequest.endDate, leaveRequest.halfDayType);
  let nextBalance = balance.balance;

  if (previousStatus === "pending" && nextStatus === "approved") {
    nextBalance -= delta;
  }

  if (previousStatus === "approved" && (nextStatus === "rejected" || nextStatus === "cancelled")) {
    nextBalance += delta;
  }

  if (nextBalance !== balance.balance) {
    await ctx.db.patch(balance._id, { balance: nextBalance, updatedAt: now() });
    await recordAudit(ctx, {
      tableName: "leave_balances",
      recordId: String(balance._id),
      action: "UPDATE",
      changedBy: leaveRequest.employeeId,
      oldData: balance,
      newData: { ...balance, balance: nextBalance },
    });
  }
}

export const getLeaveTypes = query({
  args: {
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    const queryRef = args.includeInactive
      ? ctx.db.query("leaveTypes")
      : ctx.db.query("leaveTypes").withIndex("by_isActive", (q) => q.eq("isActive", true));
    const leaveTypes = await queryRef.collect();
    return leaveTypes
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((leaveType) => ({
        id: leaveType._id,
        name: leaveType.name,
        annual_allocation: leaveType.annualAllocation,
        carry_forward_limit: leaveType.carryForwardLimit,
        is_active: leaveType.isActive,
      }));
  },
});

export const getMyBalances = query({
  args: {
    year: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const year = args.year ?? new Date().getFullYear();
    const balances = await ctx.db
      .query("leaveBalances")
      .withIndex("by_employeeId_year", (q) => q.eq("employeeId", identity.subject).eq("year", year))
      .collect();
    return await Promise.all(balances.map((balance) => serializeLeaveBalance(ctx, balance)));
  },
});

export const getLeaveHistory = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const leaveRequests = await ctx.db
      .query("leaveRequests")
      .withIndex("by_employeeId", (q) => q.eq("employeeId", identity.subject))
      .collect();

    const sorted = leaveRequests.sort((a, b) => b.createdAt - a.createdAt);
    return await Promise.all(sorted.map((leaveRequest) => serializeLeaveRequest(ctx, leaveRequest)));
  },
});

export const getConflictSummary = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const profile = await getProfileByUserId(ctx, identity.subject);
    const roles = await getUserRoles(ctx, identity.subject);

    let candidateUserIds: string[] = [];
    if (roles.includes("hr_admin")) {
      const profiles = await ctx.db.query("profiles").collect();
      candidateUserIds = profiles.map((entry) => entry.userId);
    } else if (roles.includes("manager")) {
      candidateUserIds = await getManagedEmployeeIds(ctx, identity.subject);
    } else if (profile?.managerUserId) {
      const profiles = await ctx.db
        .query("profiles")
        .withIndex("by_managerUserId", (q) => q.eq("managerUserId", profile.managerUserId))
        .collect();
      candidateUserIds = profiles.map((entry) => entry.userId);
    }

    const approved = await ctx.db.query("leaveRequests").withIndex("by_status", (q) => q.eq("status", "approved")).collect();
    const overlapping = approved.filter(
      (leaveRequest) =>
        candidateUserIds.includes(leaveRequest.employeeId) &&
        leaveRequest.employeeId !== identity.subject &&
        leaveRequest.startDate <= args.endDate &&
        leaveRequest.endDate >= args.startDate,
    );

    const names = [];
    for (const leaveRequest of overlapping) {
      const employeeProfile = await getProfileByUserId(ctx, leaveRequest.employeeId);
      if (employeeProfile?.fullName) {
        names.push(employeeProfile.fullName);
      }
    }

    return {
      count: overlapping.length,
      names,
    };
  },
});

export const createRequest = mutation({
  args: {
    leaveTypeId: v.id("leaveTypes"),
    startDate: v.string(),
    endDate: v.string(),
    reason: v.optional(v.string()),
    attachmentStorageId: v.optional(v.id("_storage")),
    attachmentUrl: v.optional(v.string()),
    attachmentName: v.optional(v.string()),
    halfDayType: v.optional(halfDayTypeValidator),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    if (args.endDate < args.startDate) {
      throw new Error("End date must be on or after start date");
    }

    if (args.halfDayType === "single" && args.startDate !== args.endDate) {
      throw new Error("Single-date half day requests must start and end on the same date");
    }

    const timestamp = now();
    const leaveRequestId = await ctx.db.insert("leaveRequests", {
      employeeId: identity.subject,
      leaveTypeId: args.leaveTypeId,
      startDate: args.startDate,
      endDate: args.endDate,
      reason: args.reason,
      attachmentStorageId: args.attachmentStorageId,
      attachmentUrl: args.attachmentUrl,
      attachmentName: args.attachmentName,
      status: "pending",
      halfDayType: args.halfDayType,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    const leaveRequest = await ctx.db.get(leaveRequestId);
    const leaveType = await ctx.db.get(args.leaveTypeId);
    const profile = await getProfileByUserId(ctx, identity.subject);

    if (profile?.managerUserId) {
      await createNotification(ctx, {
        userId: profile.managerUserId,
        title: "New Leave Request",
        message: `${profile.fullName ?? profile.email ?? "An employee"} submitted a ${leaveType?.name ?? "leave"} request.`,
        type: "info",
      });
      await ctx.scheduler.runAfter(0, internal.leaveNotificationEmails.sendLeaveNotificationEmail, {
        requestId: leaveRequestId,
        type: "submitted",
      });
    }

    await recordAudit(ctx, {
      tableName: "leave_requests",
      recordId: String(leaveRequestId),
      action: "INSERT",
      changedBy: identity.subject,
      newData: leaveRequest,
    });

    return { id: leaveRequestId };
  },
});

export const cancelRequest = mutation({
  args: {
    requestId: v.id("leaveRequests"),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const leaveRequest = await ctx.db.get(args.requestId);
    if (!leaveRequest || leaveRequest.employeeId !== identity.subject || leaveRequest.status !== "pending") {
      throw new Error("Leave request cannot be cancelled");
    }

    await ctx.db.patch(args.requestId, {
      status: "cancelled",
      updatedAt: now(),
    });

    await recordAudit(ctx, {
      tableName: "leave_requests",
      recordId: String(args.requestId),
      action: "UPDATE",
      changedBy: identity.subject,
      oldData: leaveRequest,
      newData: { ...leaveRequest, status: "cancelled" },
    });

    return { ok: true };
  },
});

export const getPendingApprovals = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const roles = await getUserRoles(ctx, identity.subject);
    const managedEmployeeIds = roles.includes("hr_admin")
      ? null
      : await getManagedEmployeeIds(ctx, identity.subject);

    const pending = await ctx.db.query("leaveRequests").withIndex("by_status", (q) => q.eq("status", "pending")).collect();
    const visible = roles.includes("hr_admin")
      ? pending
      : pending.filter((leaveRequest) => managedEmployeeIds.includes(leaveRequest.employeeId));

    const sorted = visible.sort((a, b) => a.createdAt - b.createdAt);
    return await Promise.all(
      sorted.map((leaveRequest) => serializeLeaveRequest(ctx, leaveRequest, { includeEmployee: true })),
    );
  },
});

export const updateRequestStatus = mutation({
  args: {
    requestId: v.id("leaveRequests"),
    status: leaveRequestStatusValidator,
    managerComment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const leaveRequest = await ctx.db.get(args.requestId);
    if (!leaveRequest) {
      throw new Error("Leave request not found");
    }

    const roles = await getUserRoles(ctx, identity.subject);
    const managedEmployeeIds = roles.includes("hr_admin")
      ? []
      : await getManagedEmployeeIds(ctx, identity.subject);

    if (!roles.includes("hr_admin") && !managedEmployeeIds.includes(leaveRequest.employeeId)) {
      throw new Error("Forbidden");
    }

    await updateBalanceForStatusChange(ctx, leaveRequest, leaveRequest.status, args.status);
    await ctx.db.patch(args.requestId, {
      status: args.status,
      managerComment: args.managerComment,
      updatedAt: now(),
    });

    const leaveType = await ctx.db.get(leaveRequest.leaveTypeId);
    if (args.status === "approved" || args.status === "rejected") {
      await createNotification(ctx, {
        userId: leaveRequest.employeeId,
        title: `Leave ${args.status[0].toUpperCase()}${args.status.slice(1)}`,
        message: `Your ${leaveType?.name ?? "leave"} request has been ${args.status}.`,
        type: args.status === "approved" ? "success" : "error",
      });
      await ctx.scheduler.runAfter(0, internal.leaveNotificationEmails.sendLeaveNotificationEmail, {
        requestId: args.requestId,
        type: args.status,
      });
    }

    await recordAudit(ctx, {
      tableName: "leave_requests",
      recordId: String(args.requestId),
      action: "UPDATE",
      changedBy: identity.subject,
      oldData: leaveRequest,
      newData: { ...leaveRequest, status: args.status, managerComment: args.managerComment },
    });

    return { ok: true };
  },
});

export const getTeamCalendar = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const roles = await getUserRoles(ctx, identity.subject);
    const managedEmployeeIds = roles.includes("hr_admin")
      ? null
      : await getManagedEmployeeIds(ctx, identity.subject);

    const approved = await ctx.db.query("leaveRequests").withIndex("by_status", (q) => q.eq("status", "approved")).collect();
    const overlapping = approved.filter(
      (leaveRequest) =>
        leaveRequest.startDate <= args.endDate &&
        leaveRequest.endDate >= args.startDate &&
        (roles.includes("hr_admin") || managedEmployeeIds.includes(leaveRequest.employeeId)),
    );

    return await Promise.all(
      overlapping.map(async (leaveRequest) => {
        const employeeProfile = await getProfileByUserId(ctx, leaveRequest.employeeId);
        const leaveType = await ctx.db.get(leaveRequest.leaveTypeId);
        return {
          id: leaveRequest._id,
          start_date: leaveRequest.startDate,
          end_date: leaveRequest.endDate,
          status: leaveRequest.status,
          profiles: employeeProfile ? { full_name: employeeProfile.fullName ?? null } : null,
          leave_types: leaveType ? { name: leaveType.name } : null,
        };
      }),
    );
  },
});

export const getDashboardData = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const currentYear = new Date().getFullYear();
    const today = new Date().toISOString().slice(0, 10);
    const weekStartDate = new Date();
    const weekday = weekStartDate.getDay();
    const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
    weekStartDate.setDate(weekStartDate.getDate() + mondayOffset);
    const weekStart = weekStartDate.toISOString().slice(0, 10);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    const weekEnd = weekEndDate.toISOString().slice(0, 10);

    const balances = await ctx.db
      .query("leaveBalances")
        .withIndex("by_employeeId_year", (q) => q.eq("employeeId", identity.subject).eq("year", currentYear))
      .collect();
    const recentRequests = await ctx.db
      .query("leaveRequests")
      .withIndex("by_employeeId", (q) => q.eq("employeeId", identity.subject))
      .collect();
    const holidays = await ctx.db.query("publicHolidays").withIndex("by_date", (q) => q.gte("date", today)).collect();
    const roles = await getUserRoles(ctx, identity.subject);
    const isHrAdmin = roles.includes("hr_admin");
    const managedEmployeeIds = isHrAdmin ? [] : await getManagedEmployeeIds(ctx, identity.subject);
    const approved = await ctx.db.query("leaveRequests").withIndex("by_status", (q) => q.eq("status", "approved")).collect();
    const teamAbsences = approved.filter(
      (leaveRequest) =>
        leaveRequest.startDate <= weekEnd &&
        leaveRequest.endDate >= weekStart &&
        (isHrAdmin || managedEmployeeIds.includes(leaveRequest.employeeId)),
    );
    const pendingCount = (isHrAdmin || managedEmployeeIds.length > 0)
      ? (await ctx.db.query("leaveRequests").withIndex("by_status", (q) => q.eq("status", "pending")).collect()).filter(
          (leaveRequest) => isHrAdmin || managedEmployeeIds.includes(leaveRequest.employeeId),
        ).length
      : 0;

    const profile = await getProfileByUserId(ctx, identity.subject);

    return {
      balances: await Promise.all(balances.map((balance) => serializeLeaveBalance(ctx, balance))),
      recentRequests: await Promise.all(
        recentRequests
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 5)
          .map((leaveRequest) => serializeLeaveRequest(ctx, leaveRequest)),
      ),
      upcomingHolidays: holidays
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 5)
        .map((holiday) => ({
          id: holiday._id,
          name: holiday.name,
          date: holiday.date,
        })),
      teamAbsences: await Promise.all(
        teamAbsences.slice(0, 20).map(async (leaveRequest) => {
          const employeeProfile = await getProfileByUserId(ctx, leaveRequest.employeeId);
          const leaveType = await ctx.db.get(leaveRequest.leaveTypeId);
          return {
            id: leaveRequest._id,
            start_date: leaveRequest.startDate,
            end_date: leaveRequest.endDate,
            profiles: employeeProfile
              ? {
                  full_name: employeeProfile.fullName ?? null,
                  email: employeeProfile.email ?? null,
                }
              : null,
            leave_types: leaveType ? { name: leaveType.name } : null,
          };
        }),
      ),
      pendingCount,
      viewer: {
        firstName: profile?.fullName?.split(" ")[0] ?? identity.givenName ?? identity.email?.split("@")[0] ?? "there",
      },
    };
  },
});
