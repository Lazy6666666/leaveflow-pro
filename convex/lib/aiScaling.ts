import type { HalfDayType } from "../constants";
import type { AttendanceLogDoc, LeaveRequestDoc } from "./types";

export const DEFAULT_MONTHLY_WORK_HOURS = 160;

const MS_PER_DAY = 86_400_000;

function parseDate(date: string) {
  return new Date(`${date}T00:00:00Z`);
}

export function addDays(date: string, days: number) {
  const next = parseDate(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

export function getDateRange(startDate: string, endDate: string) {
  const dates: string[] = [];
  for (let cursor = startDate; cursor <= endDate; cursor = addDays(cursor, 1)) {
    dates.push(cursor);
  }
  return dates;
}

export function isWeekend(date: string) {
  const day = parseDate(date).getUTCDay();
  return day === 0 || day === 6;
}

export function countWeekdaysInRange(startDate: string, endDate: string) {
  return getDateRange(startDate, endDate).filter((date) => !isWeekend(date)).length;
}

export function getStandardDailyHours(workStartTime: string, workEndTime: string) {
  const [startHour, startMinute] = workStartTime.split(":").map(Number);
  const [endHour, endMinute] = workEndTime.split(":").map(Number);
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return 8;
  }
  return Number(((end - start) / 60).toFixed(2));
}

export function calculateWorkedHours(
  log: Pick<AttendanceLogDoc, "clockIn" | "clockOut" | "status">,
  standardDailyHours: number,
  halfDayHours: number,
) {
  if (typeof log.clockIn === "number" && typeof log.clockOut === "number" && log.clockOut > log.clockIn) {
    const rawHours = (log.clockOut - log.clockIn) / 3_600_000;
    if (log.status === "half_day") {
      return Number(Math.min(rawHours, halfDayHours).toFixed(2));
    }
    return Number(rawHours.toFixed(2));
  }

  switch (log.status) {
    case "present":
    case "late":
      return standardDailyHours;
    case "half_day":
      return halfDayHours;
    default:
      return 0;
  }
}

export function getOverlapRange(
  startDate: string,
  endDate: string,
  targetStartDate: string,
  targetEndDate: string,
) {
  const overlapStart = startDate > targetStartDate ? startDate : targetStartDate;
  const overlapEnd = endDate < targetEndDate ? endDate : targetEndDate;
  return overlapStart <= overlapEnd ? { startDate: overlapStart, endDate: overlapEnd } : null;
}

function getDayCount(startDate: string, endDate: string) {
  return Math.floor((parseDate(endDate).getTime() - parseDate(startDate).getTime()) / MS_PER_DAY) + 1;
}

export function calculateLeaveUnits(
  leaveRequest: Pick<LeaveRequestDoc, "startDate" | "endDate" | "halfDayType">,
  rangeStartDate: string,
  rangeEndDate: string,
) {
  const overlap = getOverlapRange(leaveRequest.startDate, leaveRequest.endDate, rangeStartDate, rangeEndDate);
  if (!overlap) {
    return 0;
  }

  let units = getDayCount(overlap.startDate, overlap.endDate);
  units -= getHalfDayAdjustment(leaveRequest.halfDayType, leaveRequest.startDate, leaveRequest.endDate, overlap.startDate, overlap.endDate);
  return Number(Math.max(units, 0).toFixed(2));
}

function getHalfDayAdjustment(
  halfDayType: HalfDayType | undefined,
  originalStartDate: string,
  originalEndDate: string,
  overlapStartDate: string,
  overlapEndDate: string,
) {
  switch (halfDayType) {
    case "single":
      return overlapStartDate === originalStartDate && overlapEndDate === originalEndDate ? 0.5 : 0;
    case "start":
      return overlapStartDate === originalStartDate ? 0.5 : 0;
    case "end":
      return overlapEndDate === originalEndDate ? 0.5 : 0;
    default:
      return 0;
  }
}

export function isUnpaidLeaveType(name?: string | null) {
  const normalized = (name ?? "").toLowerCase();
  return /(unpaid|without pay|loss of pay|lwop|lop)/.test(normalized);
}

function getWeekStart(date: string) {
  const value = parseDate(date);
  const weekday = value.getUTCDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  value.setUTCDate(value.getUTCDate() + mondayOffset);
  return value.toISOString().slice(0, 10);
}

export type BurnoutAssessment = {
  riskLevel: "low" | "moderate" | "high";
  totalHours: number;
  daysOff: number;
  longestWorkStreak: number;
  weeklyHours: Array<{ weekStart: string; hours: number }>;
  flags: string[];
};

export function assessBurnoutRisk(
  logs: Array<Pick<AttendanceLogDoc, "date" | "clockIn" | "clockOut" | "status">>,
  startDate: string,
  endDate: string,
  standardDailyHours: number,
  halfDayHours: number,
): BurnoutAssessment {
  const weeklyTotals = new Map<string, number>();
  const workedDates = new Set<string>();
  let totalHours = 0;

  for (const log of logs) {
    if (log.date < startDate || log.date > endDate) {
      continue;
    }
    const workedHours = calculateWorkedHours(log, standardDailyHours, halfDayHours);
    if (workedHours <= 0) {
      continue;
    }
    totalHours += workedHours;
    workedDates.add(log.date);
    const weekStart = getWeekStart(log.date);
    weeklyTotals.set(weekStart, Number(((weeklyTotals.get(weekStart) ?? 0) + workedHours).toFixed(2)));
  }

  const windowDates = getDateRange(startDate, endDate);
  const daysOff = windowDates.filter((date) => !workedDates.has(date)).length;

  let currentStreak = 0;
  let longestWorkStreak = 0;
  for (const date of windowDates) {
    if (workedDates.has(date)) {
      currentStreak += 1;
      longestWorkStreak = Math.max(longestWorkStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  const weeklyHours = Array.from(weeklyTotals.entries())
    .map(([weekStart, hours]) => ({ weekStart, hours }))
    .sort((left, right) => left.weekStart.localeCompare(right.weekStart));

  const flags: string[] = [];
  if (weeklyHours.some((entry) => entry.hours > 45)) {
    flags.push("Exceeded 45 working hours in at least one week");
  }
  if (daysOff < 2) {
    flags.push("Fewer than 2 days off in the last 30 days");
  }
  if (longestWorkStreak >= 10) {
    flags.push("Worked 10 or more consecutive days");
  }

  const riskLevel = flags.length >= 2 || longestWorkStreak >= 12
    ? "high"
    : flags.length === 1 || weeklyHours.some((entry) => entry.hours >= 40) || daysOff < 4
      ? "moderate"
      : "low";

  return {
    riskLevel,
    totalHours: Number(totalHours.toFixed(2)),
    daysOff,
    longestWorkStreak,
    weeklyHours,
    flags,
  };
}
