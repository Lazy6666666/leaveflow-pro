import { query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import type { AppRole } from "./constants";
import { assertRequestedSiteInScope, getAccessibleSiteIds, getManagedEmployeeIds, getProfileByUserId, requireAnyRole, requireIdentity, getUserRoles } from "./lib/auth";
import type { AttendanceLogDoc, ProfileDoc } from "./lib/types";
import { addDays, assessBurnoutRisk, getDateRange, getOverlapRange, getStandardDailyHours, isWeekend } from "./lib/aiScaling";
import { filterProfilesBySiteScope, filterRecordsBySiteScope } from "./siteScope";

async function getProfilesByUserIdList(ctx: QueryCtx, userIds: string[]) {
  const uniqueUserIds = Array.from(new Set(userIds));
  if (uniqueUserIds.length === 0) {
    return [] as ProfileDoc[];
  }

  const profiles = await Promise.all(uniqueUserIds.map((userId) => getProfileByUserId(ctx, userId)));
  return profiles.filter((profile): profile is ProfileDoc => profile !== null);
}

async function getVisibleProfiles(ctx: QueryCtx, userId: string, roles: AppRole[]) {
  if (roles.includes("hr_admin")) {
    return await ctx.db.query("profiles").collect();
  }

  if (roles.includes("manager")) {
    const managedEmployeeIds = await getManagedEmployeeIds(ctx, userId);
    return await getProfilesByUserIdList(ctx, managedEmployeeIds);
  }

  const profile = await getProfileByUserId(ctx, userId);
  return profile ? [profile] : [];
}

async function getVisibleAttendanceLogs(ctx: QueryCtx, profiles: ProfileDoc[], roles: AppRole[]) {
  const endDate = new Date().toISOString().slice(0, 10);
  const startDate = addDays(endDate, -29);

  if (roles.includes("hr_admin")) {
    return await ctx.db
      .query("attendanceLogs")
      .withIndex("by_date", (q) => q.gte("date", startDate).lte("date", endDate))
      .collect();
  }

  const logs = await Promise.all(
    profiles.map((profile) =>
      ctx.db
        .query("attendanceLogs")
        .withIndex("by_employeeId_date", (q) => q.eq("employeeId", profile.userId).gte("date", startDate).lte("date", endDate))
        .collect()
    ),
  );
  return logs.flat() as AttendanceLogDoc[];
}

async function getVisibleApprovedLeave(ctx: QueryCtx, profiles: ProfileDoc[], roles: AppRole[], startDate: string, endDate: string) {
  if (roles.includes("hr_admin")) {
    const approved = await ctx.db
      .query("leaveRequests")
      .withIndex("by_status_startDate", (q) => q.eq("status", "approved").lte("startDate", endDate))
      .collect();
    return approved.filter((leaveRequest) => leaveRequest.endDate >= startDate);
  }

  const approvedLeave = await Promise.all(
    profiles.map((profile) =>
      ctx.db
        .query("leaveRequests")
        .withIndex("by_employeeId_status_startDate", (q) => q.eq("employeeId", profile.userId).eq("status", "approved").lte("startDate", endDate))
        .collect()
    ),
  );
  return approvedLeave.flat().filter((leaveRequest) => leaveRequest.endDate >= startDate);
}

export const detectBurnout = query({
  args: {
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const roles = await getUserRoles(ctx, identity.subject);
    const targetUserId = args.userId ?? identity.subject;

    if (targetUserId !== identity.subject) {
      if (roles.includes("hr_admin")) {
        // HR can inspect any employee.
      } else if (roles.includes("manager")) {
        const managedEmployeeIds = await getManagedEmployeeIds(ctx, identity.subject);
        if (!managedEmployeeIds.includes(targetUserId)) {
          throw new Error("Forbidden");
        }
      } else {
        throw new Error("Forbidden");
      }
    }

    const [profile, settings] = await Promise.all([
      getProfileByUserId(ctx, targetUserId),
      ctx.db.query("attendanceSettings").withIndex("by_singleton", (q) => q.eq("singleton", "default")).unique(),
    ]);

    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = addDays(endDate, -29);
    const logs = await ctx.db
      .query("attendanceLogs")
      .withIndex("by_employeeId_date", (q) => q.eq("employeeId", targetUserId).gte("date", startDate).lte("date", endDate))
      .collect();

    const standardDailyHours = getStandardDailyHours(settings?.workStartTime ?? "09:00", settings?.workEndTime ?? "17:00");
    const halfDayHours = settings?.halfDayHours ?? standardDailyHours / 2;
    const assessment = assessBurnoutRisk(logs, startDate, endDate, standardDailyHours, halfDayHours);

    return {
      userId: targetUserId,
      employeeName: profile?.fullName ?? profile?.email ?? targetUserId,
      departmentId: profile?.departmentId ?? null,
      startDate,
      endDate,
      ...assessment,
    };
  },
});

export const getBurnoutSummary = query({
  args: {
    siteId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const roles = await getUserRoles(ctx, identity.subject);
    const accessibleSiteIds = args.siteId ? await getAccessibleSiteIds(ctx, identity.subject, roles) : null;
    assertRequestedSiteInScope(args.siteId, accessibleSiteIds);
    const profiles = await getVisibleProfiles(ctx, identity.subject, roles);
    const settings = await ctx.db.query("attendanceSettings").withIndex("by_singleton", (q) => q.eq("singleton", "default")).unique();
    const standardDailyHours = getStandardDailyHours(settings?.workStartTime ?? "09:00", settings?.workEndTime ?? "17:00");
    const halfDayHours = settings?.halfDayHours ?? standardDailyHours / 2;
    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = addDays(endDate, -29);
    const allLogs = await getVisibleAttendanceLogs(ctx, profiles, roles);
    const scopedProfiles = filterProfilesBySiteScope(profiles, allLogs, accessibleSiteIds, args.siteId);
    const scopedLogs = filterRecordsBySiteScope(allLogs, accessibleSiteIds, args.siteId) as AttendanceLogDoc[];
    const logsByEmployee = new Map<string, typeof allLogs>();
    for (const log of scopedLogs) {
      const bucket = logsByEmployee.get(log.employeeId) ?? [];
      bucket.push(log);
      logsByEmployee.set(log.employeeId, bucket);
    }

    const employees = scopedProfiles
      .map((profile) => {
        const assessment = assessBurnoutRisk(
          logsByEmployee.get(profile.userId) ?? [],
          startDate,
          endDate,
          standardDailyHours,
          halfDayHours,
        );
        return {
          userId: profile.userId,
          employeeName: profile.fullName ?? profile.email ?? profile.userId,
          departmentId: profile.departmentId ?? null,
          ...assessment,
        };
      })
      .sort((left, right) => {
        const severity = { high: 0, moderate: 1, low: 2 } as const;
        return severity[left.riskLevel] - severity[right.riskLevel] || left.employeeName.localeCompare(right.employeeName);
      });

    return {
      startDate,
      endDate,
      employees,
      atRiskCount: employees.filter((employee) => employee.riskLevel !== "low").length,
    };
  },
});

export const checkCoverageConflict = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
    siteId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { identity, roles } = await requireAnyRole(ctx, ["manager", "hr_admin"]);
    if (args.endDate < args.startDate) {
      throw new Error("End date must be on or after start date");
    }
    const profiles = await getVisibleProfiles(ctx, identity.subject, roles);
    const accessibleSiteIds = args.siteId ? await getAccessibleSiteIds(ctx, identity.subject, roles) : null;
    assertRequestedSiteInScope(args.siteId, accessibleSiteIds);
    const scopedProfiles = filterProfilesBySiteScope(profiles, [], accessibleSiteIds, args.siteId);
    const [departments, approvedLeave] = await Promise.all([
      ctx.db.query("departments").collect(),
      getVisibleApprovedLeave(ctx, profiles, roles, args.startDate, args.endDate),
    ]);

    const visibleProfileByUserId = new Map(scopedProfiles.map((profile) => [profile.userId, profile] as const));
    const scopedProfileIds = new Set(scopedProfiles.map((profile) => profile.userId));
    const departmentNames = new Map(departments.map((department) => [String(department._id), department.name] as const));
    const dailyCoverage = new Map<string, { departmentId: string; departmentName: string; employees: Map<string, string> }>();

    for (const leaveRequest of approvedLeave) {
      if (!scopedProfileIds.has(leaveRequest.employeeId)) {
        continue;
      }
      const profile = visibleProfileByUserId.get(leaveRequest.employeeId);
      if (!profile?.departmentId) {
        continue;
      }
      const overlap = getOverlapRange(leaveRequest.startDate, leaveRequest.endDate, args.startDate, args.endDate);
      if (!overlap) {
        continue;
      }
      for (const date of getDateRange(overlap.startDate, overlap.endDate)) {
        if (isWeekend(date)) {
          continue;
        }
        const key = `${String(profile.departmentId)}:${date}`;
        const entry = dailyCoverage.get(key) ?? {
          departmentId: String(profile.departmentId),
          departmentName: departmentNames.get(String(profile.departmentId)) ?? "Unassigned",
          employees: new Map<string, string>(),
        };
        entry.employees.set(profile.userId, profile.fullName ?? profile.email ?? profile.userId);
        dailyCoverage.set(key, entry);
      }
    }

    const conflicts = Array.from(dailyCoverage.entries())
      .map(([key, entry]) => {
        const [, date] = key.split(":");
        const employees = Array.from(entry.employees.entries()).map(([employeeId, employeeName]) => ({ employeeId, employeeName }));
        return {
          date,
          departmentId: entry.departmentId,
          departmentName: entry.departmentName,
          employees: employees.sort((left, right) => left.employeeName.localeCompare(right.employeeName)),
          count: employees.length,
        };
      })
      .filter((entry) => entry.count >= 2)
      .sort((left, right) => left.date.localeCompare(right.date) || left.departmentName.localeCompare(right.departmentName));

    return {
      startDate: args.startDate,
      endDate: args.endDate,
      conflicts,
    };
  },
});
