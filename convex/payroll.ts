import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { assertRequestedSiteInScope, getAccessibleSiteIds, requireAnyRole } from "./lib/auth";
import {
  DEFAULT_MONTHLY_WORK_HOURS,
  calculateLeaveUnits,
  calculateWorkedHours,
  countWeekdaysInRange,
  getStandardDailyHours,
  isUnpaidLeaveType,
} from "./lib/aiScaling";
import type { Doc } from "./_generated/dataModel";
import type { AttendanceLogDoc, AttendanceSettingsDoc, DepartmentDoc, LeaveRequestDoc, LeaveTypeDoc, ProfileDoc, ReaderCtx } from "./lib/types";
import { collectEmployeeIdsForSiteScope, filterProfilesBySiteScope, filterRecordsBySiteScope } from "./siteScope";

type PayrollEmployeeSummary = {
  employeeId: string;
  employeeName: string;
  email: string | null;
  departmentName: string | null;
  hourlyRate: number | null;
  baseSalary: number | null;
  rateSource: "hourly_rate" | "base_salary" | "missing";
  workedHours: number;
  workedDaysEquivalent: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  payableHours: number;
  payableDaysEquivalent: number;
  grossPay: number | null;
};

type PayrollSummaryResult = {
  startDate: string;
  endDate: string;
  scheduledWorkdays: number;
  standardDailyHours: number;
  halfDayHours: number;
  employees: PayrollEmployeeSummary[];
  totals: {
    workedHours: number;
    paidLeaveDays: number;
    unpaidLeaveDays: number;
    payableHours: number;
    grossPay: number;
  };
};

type PayrollExceptionSeed = {
  employeeId: string;
  exceptionType: string;
  description: string;
};

type PayrollExceptionDoc = Doc<"payrollExceptions">;
type PayrollSiteScope = {
  accessibleSiteIds: string[] | null;
  siteId?: string;
};

function buildPayrollExceptions(employees: PayrollEmployeeSummary[]): PayrollExceptionSeed[] {
  const out: PayrollExceptionSeed[] = [];

  for (const employee of employees) {
    if (employee.rateSource === "missing") {
      out.push({
        employeeId: employee.employeeId,
        exceptionType: "missing_compensation_rate",
        description: "No hourly rate or base salary is set for this employee. Gross pay cannot be estimated reliably.",
      });
    }

    if (employee.grossPay === null) {
      out.push({
        employeeId: employee.employeeId,
        exceptionType: "missing_gross_pay",
        description: "Gross pay could not be calculated for this employee (missing or invalid compensation inputs).",
      });
    }

    if (employee.payableHours === 0 && (employee.workedHours > 0 || employee.paidLeaveDays > 0)) {
      out.push({
        employeeId: employee.employeeId,
        exceptionType: "zero_payable_hours",
        description: "Payable hours resolved to 0 even though worked hours or paid leave days exist. Verify attendance settings and leave allocation logic.",
      });
    }
  }

  return out;
}

async function computePayrollSummary(
  ctx: ReaderCtx,
  args: { startDate: string; endDate: string },
  siteScope: PayrollSiteScope = { accessibleSiteIds: null },
): Promise<PayrollSummaryResult> {
  const [profiles, departments, attendanceLogs, leaveRequests, leaveTypes, settings] = await Promise.all([
    ctx.db.query("profiles").collect() as Promise<ProfileDoc[]>,
    ctx.db.query("departments").collect() as Promise<DepartmentDoc[]>,
    ctx.db.query("attendanceLogs").collect() as Promise<AttendanceLogDoc[]>,
    ctx.db.query("leaveRequests").withIndex("by_status", (q) => q.eq("status", "approved")).collect() as Promise<LeaveRequestDoc[]>,
    ctx.db.query("leaveTypes").collect() as Promise<LeaveTypeDoc[]>,
    ctx.db
      .query("attendanceSettings")
      .withIndex("by_singleton", (q) => q.eq("singleton", "default"))
      .unique() as Promise<AttendanceSettingsDoc | null>,
  ]);
  const scopedProfiles = filterProfilesBySiteScope(
    profiles,
    attendanceLogs,
    siteScope.accessibleSiteIds,
    siteScope.siteId,
  );
  const scopedAttendanceLogs = filterRecordsBySiteScope(
    attendanceLogs,
    siteScope.accessibleSiteIds,
    siteScope.siteId,
  ) as AttendanceLogDoc[];
  const scopedAttendanceLogsInRange = scopedAttendanceLogs.filter(
    (log) => log.date >= args.startDate && log.date <= args.endDate,
  );
  const scopedEmployeeIds = collectEmployeeIdsForSiteScope(
    profiles,
    scopedAttendanceLogsInRange,
    siteScope.accessibleSiteIds,
    siteScope.siteId,
  );

  const departmentById = new Map<DepartmentDoc["_id"], string>(departments.map((department) => [department._id, department.name]));
  const leaveTypeById = new Map<LeaveTypeDoc["_id"], LeaveTypeDoc>(leaveTypes.map((leaveType) => [leaveType._id, leaveType]));
  const standardDailyHours = getStandardDailyHours(settings?.workStartTime ?? "09:00", settings?.workEndTime ?? "17:00");
  const halfDayHours = settings?.halfDayHours ?? standardDailyHours / 2;
  const scheduledWorkdays = countWeekdaysInRange(args.startDate, args.endDate);

  const attendanceByEmployee = new Map<string, AttendanceLogDoc[]>();
  for (const log of scopedAttendanceLogsInRange) {
    const bucket = attendanceByEmployee.get(log.employeeId) ?? [];
    bucket.push(log);
    attendanceByEmployee.set(log.employeeId, bucket);
  }

  const leaveByEmployee = new Map<string, LeaveRequestDoc[]>();
  for (const leaveRequest of leaveRequests) {
    if (!scopedEmployeeIds.has(leaveRequest.employeeId)) {
      continue;
    }
    if (leaveRequest.endDate < args.startDate || leaveRequest.startDate > args.endDate) {
      continue;
    }
    const bucket = leaveByEmployee.get(leaveRequest.employeeId) ?? [];
    bucket.push(leaveRequest);
    leaveByEmployee.set(leaveRequest.employeeId, bucket);
  }

  const employees: PayrollEmployeeSummary[] = scopedProfiles
    .map((profile) => {
      const employeeLogs = attendanceByEmployee.get(profile.userId) ?? [];
      const employeeLeave = leaveByEmployee.get(profile.userId) ?? [];

      const workedHours = Number(
        employeeLogs
          .reduce((total, log) => total + calculateWorkedHours(log, standardDailyHours, halfDayHours), 0)
          .toFixed(2),
      );

      let paidLeaveDays = 0;
      let unpaidLeaveDays = 0;
      for (const leaveRequest of employeeLeave) {
        const leaveType = leaveTypeById.get(leaveRequest.leaveTypeId);
        const units = calculateLeaveUnits(leaveRequest, args.startDate, args.endDate);
        if (units <= 0) {
          continue;
        }
        if (isUnpaidLeaveType(leaveType?.name)) {
          unpaidLeaveDays += units;
        } else {
          paidLeaveDays += units;
        }
      }

      paidLeaveDays = Number(paidLeaveDays.toFixed(2));
      unpaidLeaveDays = Number(unpaidLeaveDays.toFixed(2));

      const payableHours = Number((workedHours + paidLeaveDays * standardDailyHours).toFixed(2));
      const workedDaysEquivalent = Number((workedHours / standardDailyHours).toFixed(2));
      const payableDaysEquivalent = Number((workedDaysEquivalent + paidLeaveDays).toFixed(2));

      let grossPay: number | null = null;
      let rateSource: "hourly_rate" | "base_salary" | "missing" = "missing";
      if (typeof profile.hourlyRate === "number") {
        grossPay = Number((payableHours * profile.hourlyRate).toFixed(2));
        rateSource = "hourly_rate";
      } else if (typeof profile.baseSalary === "number") {
        const proratedShare = scheduledWorkdays > 0 ? payableDaysEquivalent / scheduledWorkdays : 0;
        grossPay = Number((profile.baseSalary * proratedShare).toFixed(2));
        rateSource = "base_salary";
      }

      return {
        employeeId: profile.userId,
        employeeName: profile.fullName ?? profile.email ?? profile.userId,
        email: profile.email ?? null,
        departmentName: profile.departmentId ? departmentById.get(profile.departmentId) ?? null : null,
        hourlyRate: profile.hourlyRate ?? null,
        baseSalary: profile.baseSalary ?? null,
        rateSource,
        workedHours,
        workedDaysEquivalent,
        paidLeaveDays,
        unpaidLeaveDays,
        payableHours,
        payableDaysEquivalent,
        grossPay,
      };
    })
    .filter((employee) =>
      employee.workedHours > 0 ||
      employee.paidLeaveDays > 0 ||
      employee.unpaidLeaveDays > 0 ||
      employee.hourlyRate !== null ||
      employee.baseSalary !== null,
    )
    .sort((left, right) => left.employeeName.localeCompare(right.employeeName));

  const totals = employees.reduce(
    (summary, employee) => {
      summary.workedHours += employee.workedHours;
      summary.paidLeaveDays += employee.paidLeaveDays;
      summary.unpaidLeaveDays += employee.unpaidLeaveDays;
      summary.payableHours += employee.payableHours;
      summary.grossPay += employee.grossPay ?? 0;
      return summary;
    },
    {
      workedHours: 0,
      paidLeaveDays: 0,
      unpaidLeaveDays: 0,
      payableHours: 0,
      grossPay: 0,
    },
  );

  return {
    startDate: args.startDate,
    endDate: args.endDate,
    scheduledWorkdays,
    standardDailyHours,
    halfDayHours,
    employees,
    totals: {
      workedHours: Number(totals.workedHours.toFixed(2)),
      paidLeaveDays: Number(totals.paidLeaveDays.toFixed(2)),
      unpaidLeaveDays: Number(totals.unpaidLeaveDays.toFixed(2)),
      payableHours: Number(totals.payableHours.toFixed(2)),
      grossPay: Number(totals.grossPay.toFixed(2)),
    },
  };
}

export const getPayrollSummary = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
    siteId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { identity, roles } = await requireAnyRole(ctx, ["hr_admin"]);
    const accessibleSiteIds = await getAccessibleSiteIds(ctx, identity.subject, roles);
    assertRequestedSiteInScope(args.siteId, accessibleSiteIds);

    if (args.endDate < args.startDate) {
      throw new Error("End date must be on or after start date");
    }

    const summary = await computePayrollSummary(ctx, args, {
      accessibleSiteIds,
      siteId: args.siteId,
    });
    return {
      ...summary,
      assumptions: {
        hourlyRateFallbackHoursPerMonth: DEFAULT_MONTHLY_WORK_HOURS,
        unpaidLeaveRule:
          "Leave types with names matching unpaid/without pay/lwop/lop are excluded from payable leave days.",
      },
    };
  },
});

export const getPayrollPeriods = query({
  args: {},
  handler: async (ctx) => {
    await requireAnyRole(ctx, ["hr_admin"]);
    return ctx.db.query("payrollPeriods").order("desc").take(50);
  },
});

export const createPayrollPeriod = mutation({
  args: { startDate: v.string(), endDate: v.string() },
  handler: async (ctx, args) => {
    await requireAnyRole(ctx, ["hr_admin"]);
    return ctx.db.insert("payrollPeriods", {
      startDate: args.startDate,
      endDate: args.endDate,
      status: "open",
      createdAt: Date.now(),
    });
  },
});

export const lockPayrollPeriod = mutation({
  args: { periodId: v.id("payrollPeriods") },
  handler: async (ctx, args) => {
    const { identity } = await requireAnyRole(ctx, ["hr_admin"]);
    const period = await ctx.db.get(args.periodId);
    if (!period) throw new Error("Period not found");
    if (period.status === "locked") throw new Error("Period already locked");
    await ctx.db.patch(args.periodId, {
      status: "locked",
      lockedAt: Date.now(),
      lockedBy: identity.subject,
    });

    // Snapshot exceptions at lock time so HR can review them consistently.
    const existing = await ctx.db
      .query("payrollExceptions")
      .withIndex("by_periodId", (q) => q.eq("periodId", args.periodId))
      .collect();
    for (const ex of existing) {
      await ctx.db.delete(ex._id);
    }

    const summary = await computePayrollSummary(ctx, { startDate: period.startDate, endDate: period.endDate });
    const seeds = buildPayrollExceptions(summary.employees);
    const createdAt = Date.now();
    for (const seed of seeds) {
      await ctx.db.insert("payrollExceptions", {
        periodId: args.periodId,
        employeeId: seed.employeeId,
        exceptionType: seed.exceptionType,
        description: seed.description,
        createdAt,
      });
    }
  },
});

export const getPayrollExceptionsForPeriod = query({
  args: {
    periodId: v.id("payrollPeriods"),
    siteId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { identity, roles } = await requireAnyRole(ctx, ["hr_admin"]);
    const accessibleSiteIds = await getAccessibleSiteIds(ctx, identity.subject, roles);
    assertRequestedSiteInScope(args.siteId, accessibleSiteIds);

    const exceptions = await ctx.db
      .query("payrollExceptions")
      .withIndex("by_periodId", (q) => q.eq("periodId", args.periodId))
      .order("desc")
      .collect();

    if (exceptions.length === 0) {
      return [];
    }

    const profiles = filterProfilesBySiteScope(
      (await ctx.db.query("profiles").collect()) as ProfileDoc[],
      [],
      accessibleSiteIds,
      args.siteId,
    );
    const profileByUserId = new Map<string, ProfileDoc>(profiles.map((profile) => [profile.userId, profile]));

    return (exceptions as PayrollExceptionDoc[])
      .filter((ex) => profileByUserId.has(ex.employeeId))
      .map((ex) => {
      const profile = profileByUserId.get(ex.employeeId);
      return {
        _id: ex._id,
        employeeId: ex.employeeId,
        employeeName: profile?.fullName ?? profile?.email ?? ex.employeeId,
        exceptionType: ex.exceptionType,
        description: ex.description,
        resolvedAt: ex.resolvedAt,
        createdAt: ex.createdAt,
      };
    });
  },
});

export const resolvePayrollException = mutation({
  args: {
    exceptionId: v.id("payrollExceptions"),
  },
  handler: async (ctx, args) => {
    await requireAnyRole(ctx, ["hr_admin"]);
    const existing = await ctx.db.get(args.exceptionId);
    if (!existing) {
      throw new Error("Exception not found");
    }
    await ctx.db.patch(args.exceptionId, { resolvedAt: Date.now() });
    return { ok: true };
  },
});

export const exportPayrollCsv = action({
  args: { startDate: v.string(), endDate: v.string(), siteId: v.optional(v.string()) },
  handler: async (ctx, args): Promise<string> => {
    const data = await ctx.runQuery(api.payroll.getPayrollSummary, {
      startDate: args.startDate,
      endDate: args.endDate,
      siteId: args.siteId,
    });
    const header = "Name,Department,Worked Hours,Paid Leave Days,Gross Pay";
    const rows = data.employees.map((e) =>
      [
        `"${e.employeeName}"`,
        `"${e.departmentName ?? ""}"`,
        e.workedHours,
        e.paidLeaveDays,
        e.grossPay ?? "",
      ].join(",")
    );
    return [header, ...rows].join("\n");
  },
});

const DEFAULT_PAYROLL_MAPPING = {
  overtimeThresholdHours: 8,
  overtimeMultiplier: 1.5,
  defaultCurrency: "USD",
  payPeriod: "monthly" as const,
  deductUnpaidLeaveFromGross: true,
};

export const getPayrollMappingConfig = query({
  args: {},
  handler: async (ctx) => {
    await requireAnyRole(ctx, ["hr_admin"]);
    const config = await ctx.db.query("payrollMappingConfig").withIndex("by_singleton", (q) => q.eq("singleton", "global")).first();
    return config ?? { ...DEFAULT_PAYROLL_MAPPING, singleton: "global" };
  },
});

export const upsertPayrollMappingConfig = mutation({
  args: {
    overtimeThresholdHours: v.number(),
    overtimeMultiplier: v.number(),
    defaultCurrency: v.string(),
    payPeriod: v.union(v.literal("monthly"), v.literal("biweekly"), v.literal("weekly")),
    deductUnpaidLeaveFromGross: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAnyRole(ctx, ["hr_admin"]);
    const existing = await ctx.db.query("payrollMappingConfig").withIndex("by_singleton", (q) => q.eq("singleton", "global")).first();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: now });
    } else {
      await ctx.db.insert("payrollMappingConfig", { singleton: "global", ...args, createdAt: now, updatedAt: now });
    }
  },
});
