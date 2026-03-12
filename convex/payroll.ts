import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireAnyRole } from "./lib/auth";
import {
  DEFAULT_MONTHLY_WORK_HOURS,
  calculateLeaveUnits,
  calculateWorkedHours,
  countWeekdaysInRange,
  getStandardDailyHours,
  isUnpaidLeaveType,
} from "./lib/aiScaling";

export const getPayrollSummary = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAnyRole(ctx, ["hr_admin"]);

    if (args.endDate < args.startDate) {
      throw new Error("End date must be on or after start date");
    }

    const [profiles, departments, attendanceLogs, leaveRequests, leaveTypes, settings] = await Promise.all([
      ctx.db.query("profiles").collect(),
      ctx.db.query("departments").collect(),
      ctx.db.query("attendanceLogs").collect(),
      ctx.db.query("leaveRequests").withIndex("by_status", (q) => q.eq("status", "approved")).collect(),
      ctx.db.query("leaveTypes").collect(),
      ctx.db.query("attendanceSettings").withIndex("by_singleton", (q) => q.eq("singleton", "default")).unique(),
    ]);

    const departmentById = new Map(departments.map((department) => [String(department._id), department.name] as const));
    const leaveTypeById = new Map(leaveTypes.map((leaveType) => [String(leaveType._id), leaveType] as const));
    const standardDailyHours = getStandardDailyHours(settings?.workStartTime ?? "09:00", settings?.workEndTime ?? "17:00");
    const halfDayHours = settings?.halfDayHours ?? standardDailyHours / 2;
    const scheduledWorkdays = countWeekdaysInRange(args.startDate, args.endDate);

    const attendanceByEmployee = new Map<string, typeof attendanceLogs>();
    for (const log of attendanceLogs) {
      if (log.date < args.startDate || log.date > args.endDate) {
        continue;
      }
      const bucket = attendanceByEmployee.get(log.employeeId) ?? [];
      bucket.push(log);
      attendanceByEmployee.set(log.employeeId, bucket);
    }

    const leaveByEmployee = new Map<string, typeof leaveRequests>();
    for (const leaveRequest of leaveRequests) {
      if (leaveRequest.endDate < args.startDate || leaveRequest.startDate > args.endDate) {
        continue;
      }
      const bucket = leaveByEmployee.get(leaveRequest.employeeId) ?? [];
      bucket.push(leaveRequest);
      leaveByEmployee.set(leaveRequest.employeeId, bucket);
    }

    const employees = profiles
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
          const leaveType = leaveTypeById.get(String(leaveRequest.leaveTypeId));
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
          departmentName: profile.departmentId ? departmentById.get(String(profile.departmentId)) ?? null : null,
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
      assumptions: {
        hourlyRateFallbackHoursPerMonth: DEFAULT_MONTHLY_WORK_HOURS,
        unpaidLeaveRule:
          "Leave types with names matching unpaid/without pay/lwop/lop are excluded from payable leave days.",
      },
      employees,
      totals: {
        workedHours: Number(totals.workedHours.toFixed(2)),
        paidLeaveDays: Number(totals.paidLeaveDays.toFixed(2)),
        unpaidLeaveDays: Number(totals.unpaidLeaveDays.toFixed(2)),
        payableHours: Number(totals.payableHours.toFixed(2)),
        grossPay: Number(totals.grossPay.toFixed(2)),
      },
    };
  },
});
