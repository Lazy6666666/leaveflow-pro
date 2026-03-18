import { query } from "./_generated/server";
import { v } from "convex/values";

import { assertRequestedSiteInScope, getAccessibleSiteIds, requireAnyRole } from "./lib/auth";
import type { QueryCtx } from "./_generated/server";
import type { AttendanceLogDoc, LeaveRequestDoc, ProfileDoc } from "./lib/types";
import { collectEmployeeIdsForSiteScope, filterRecordsBySiteScope } from "./siteScope";

async function requireAdmin(ctx: QueryCtx) {
  return await requireAnyRole(ctx, ["hr_admin"]);
}

const monthFormatter = new Intl.DateTimeFormat("default", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const dayFormatter = new Intl.DateTimeFormat("default", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export const getAuditLogData = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_createdAt")
      .order("desc")
      .take(500);

    return logs
      .map((log) => ({
        id: log._id,
        table_name: log.tableName,
        record_id: log.recordId,
        action: log.action,
        changed_by: log.changedBy ?? null,
        old_data: log.oldData ?? null,
        new_data: log.newData ?? null,
        created_at: new Date(log.createdAt).toISOString(),
      }));
  },
});

export const getReportsData = query({
  args: {
    siteId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { identity, roles } = await requireAdmin(ctx);
    const accessibleSiteIds = await getAccessibleSiteIds(ctx, identity.subject, roles);
    assertRequestedSiteInScope(args.siteId, accessibleSiteIds);
    const [profiles, leaveRequests, attendanceLogs, leaveTypes, analyticsEvents] = await Promise.all([
      ctx.db.query("profiles").collect() as Promise<ProfileDoc[]>,
      ctx.db.query("leaveRequests").collect(),
      ctx.db.query("attendanceLogs").collect(),
      ctx.db.query("leaveTypes").collect(),
      ctx.db.query("analyticsEvents").withIndex("by_createdAt").order("desc").take(4000),
    ]);
    const scopedEmployeeIds = collectEmployeeIdsForSiteScope(
      profiles,
      attendanceLogs as AttendanceLogDoc[],
      accessibleSiteIds,
      args.siteId,
    );
    const scopedLeaveRequests = (leaveRequests as LeaveRequestDoc[]).filter((leaveRequest) => scopedEmployeeIds.has(leaveRequest.employeeId));
    const scopedAttendanceLogs = filterRecordsBySiteScope(attendanceLogs as AttendanceLogDoc[], accessibleSiteIds, args.siteId);
    const leaveTypeById = new Map(leaveTypes.map((leaveType) => [String(leaveType._id), leaveType.name] as const));

    const statusMap: Record<string, number> = {};
    const typeMap: Record<string, number> = {};
    const monthMap: Record<string, number> = {};
    const attendanceMap: Record<string, number> = {};
    const analyticsEventMap: Record<string, number> = {};
    const analyticsSurfaceMap: Record<string, number> = {};

    for (const leaveRequest of scopedLeaveRequests) {
      statusMap[leaveRequest.status] = (statusMap[leaveRequest.status] ?? 0) + 1;
      const leaveTypeName = leaveTypeById.get(String(leaveRequest.leaveTypeId)) ?? "Unknown";
      typeMap[leaveTypeName] = (typeMap[leaveTypeName] ?? 0) + 1;
      const month = monthFormatter.format(new Date(leaveRequest.createdAt));
      monthMap[month] = (monthMap[month] ?? 0) + 1;
    }

    for (const log of scopedAttendanceLogs) {
      const status = log.status.replace("_", " ");
      attendanceMap[status] = (attendanceMap[status] ?? 0) + 1;
    }

    const now = Date.now();
    const analyticsWindowDays = 30;
    const analyticsWindowMs = analyticsWindowDays * 24 * 60 * 60 * 1000;
    const analyticsWindowStart = now - analyticsWindowMs;
    const analyticsWindowEvents = analyticsEvents.filter((event) => event.createdAt >= analyticsWindowStart);

    const analyticsDailyMap = new Map<string, { label: string; events: number; userIds: Set<string> }>();
    for (let index = analyticsWindowDays - 1; index >= 0; index -= 1) {
      const date = new Date(now - index * 24 * 60 * 60 * 1000);
      const key = date.toISOString().slice(0, 10);
      analyticsDailyMap.set(key, {
        label: dayFormatter.format(date),
        events: 0,
        userIds: new Set<string>(),
      });
    }

    for (const event of analyticsWindowEvents) {
      analyticsEventMap[event.eventName] = (analyticsEventMap[event.eventName] ?? 0) + 1;
      analyticsSurfaceMap[event.surface] = (analyticsSurfaceMap[event.surface] ?? 0) + 1;

      const key = new Date(event.createdAt).toISOString().slice(0, 10);
      const bucket = analyticsDailyMap.get(key);
      if (bucket) {
        bucket.events += 1;
        if (event.userId) {
          bucket.userIds.add(event.userId);
        }
      }
    }

    const funnelEventNames = [
      { key: "landing_page_viewed", label: "Landing Viewed" },
      { key: "auth_viewed", label: "Auth Viewed" },
      { key: "auth_completed", label: "Auth Completed" },
      { key: "admin_setup_completed", label: "Admin Setup Completed" },
      { key: "leave_request_submitted", label: "Leave Submitted" },
    ];

    return {
      statusData: Object.entries(statusMap).map(([name, count]) => ({ name, count })),
      typeData: Object.entries(typeMap).map(([name, count]) => ({ name, count })),
      monthlyData: Object.entries(monthMap).map(([month, requests]) => ({ month, requests })),
      attendanceData: Object.entries(attendanceMap).map(([name, count]) => ({ name, count })),
      analyticsSummary: {
        recentWindowStart: new Date(analyticsWindowStart).toISOString(),
        recentWindowEnd: new Date(now).toISOString(),
        totalEvents: analyticsWindowEvents.length,
        uniqueUsers: new Set(analyticsWindowEvents.map((event) => event.userId).filter(Boolean)).size,
        uniqueSessions: new Set(analyticsWindowEvents.map((event) => event.sessionId)).size,
        topEvents: Object.entries(analyticsEventMap)
          .map(([name, count]) => ({ name, count }))
          .sort((left, right) => right.count - left.count)
          .slice(0, 8),
        surfaceData: Object.entries(analyticsSurfaceMap)
          .map(([name, count]) => ({ name, count }))
          .sort((left, right) => right.count - left.count),
        dailyData: Array.from(analyticsDailyMap.entries()).map(([date, bucket]) => ({
          date,
          label: bucket.label,
          events: bucket.events,
          uniqueUsers: bucket.userIds.size,
        })),
        funnelData: funnelEventNames.map((step) => ({
          name: step.label,
          count: analyticsEventMap[step.key] ?? 0,
        })),
      },
    };
  },
});
