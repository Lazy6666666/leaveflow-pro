import { query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import type { AppRole } from "./constants";
import { getManagedEmployeeIds, getProfileByUserId, requireAnyRole, requireIdentity, getUserRoles } from "./lib/auth";
import { addDays, assessBurnoutRisk, getDateRange, getOverlapRange, getStandardDailyHours, isWeekend } from "./lib/aiScaling";

async function getVisibleProfiles(ctx: QueryCtx, userId: string, roles: AppRole[]) {
  if (roles.includes("hr_admin")) {
    return await ctx.db.query("profiles").collect();
  }

  if (roles.includes("manager")) {
    const managedEmployeeIds = await getManagedEmployeeIds(ctx, userId);
    const profiles = await ctx.db.query("profiles").collect();
    return profiles.filter((profile) => managedEmployeeIds.includes(profile.userId));
  }

  const profile = await getProfileByUserId(ctx, userId);
  return profile ? [profile] : [];
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

    const [profile, logs, settings] = await Promise.all([
      getProfileByUserId(ctx, targetUserId),
      ctx.db.query("attendanceLogs").withIndex("by_employeeId", (q) => q.eq("employeeId", targetUserId)).collect(),
      ctx.db.query("attendanceSettings").withIndex("by_singleton", (q) => q.eq("singleton", "default")).unique(),
    ]);

    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = addDays(endDate, -29);
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
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const roles = await getUserRoles(ctx, identity.subject);
    const profiles = await getVisibleProfiles(ctx, identity.subject, roles);
    const settings = await ctx.db.query("attendanceSettings").withIndex("by_singleton", (q) => q.eq("singleton", "default")).unique();
    const standardDailyHours = getStandardDailyHours(settings?.workStartTime ?? "09:00", settings?.workEndTime ?? "17:00");
    const halfDayHours = settings?.halfDayHours ?? standardDailyHours / 2;
    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = addDays(endDate, -29);
    const allLogs = await ctx.db.query("attendanceLogs").collect();
    const logsByEmployee = new Map<string, typeof allLogs>();
    for (const log of allLogs) {
      const bucket = logsByEmployee.get(log.employeeId) ?? [];
      bucket.push(log);
      logsByEmployee.set(log.employeeId, bucket);
    }

    const employees = profiles
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
  },
  handler: async (ctx, args) => {
    const { identity, roles } = await requireAnyRole(ctx, ["manager", "hr_admin"]);
    if (args.endDate < args.startDate) {
      throw new Error("End date must be on or after start date");
    }

    const [profiles, departments, approvedLeave] = await Promise.all([
      getVisibleProfiles(ctx, identity.subject, roles),
      ctx.db.query("departments").collect(),
      ctx.db.query("leaveRequests").withIndex("by_status", (q) => q.eq("status", "approved")).collect(),
    ]);

    const visibleProfileByUserId = new Map(profiles.map((profile) => [profile.userId, profile] as const));
    const departmentNames = new Map(departments.map((department) => [String(department._id), department.name] as const));
    const dailyCoverage = new Map<string, { departmentId: string; departmentName: string; employees: Map<string, string> }>();

    for (const leaveRequest of approvedLeave) {
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
