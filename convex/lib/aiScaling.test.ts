import { describe, expect, it } from "vitest";
import { assessBurnoutRisk, calculateLeaveUnits, calculateWorkedHours, getStandardDailyHours } from "./aiScaling";

describe("aiScaling helpers", () => {
  it("calculates leave overlap with half-day adjustments", () => {
    expect(
      calculateLeaveUnits(
        {
          startDate: "2026-03-10",
          endDate: "2026-03-12",
          halfDayType: "start",
        },
        "2026-03-10",
        "2026-03-12",
      ),
    ).toBe(2.5);

    expect(
      calculateLeaveUnits(
        {
          startDate: "2026-03-10",
          endDate: "2026-03-10",
          halfDayType: "single",
        },
        "2026-03-01",
        "2026-03-31",
      ),
    ).toBe(0.5);
  });

  it("falls back to schedule-based attendance hours when timestamps are missing", () => {
    const standardDailyHours = getStandardDailyHours("09:00", "18:00");
    expect(standardDailyHours).toBe(9);

    expect(
      calculateWorkedHours(
        {
          clockIn: undefined,
          clockOut: undefined,
          status: "present",
        },
        standardDailyHours,
        4.5,
      ),
    ).toBe(9);

    expect(
      calculateWorkedHours(
        {
          clockIn: undefined,
          clockOut: undefined,
          status: "half_day",
        },
        standardDailyHours,
        4.5,
      ),
    ).toBe(4.5);
  });

  it("flags burnout when weekly hours exceed the threshold and days off are too low", () => {
    const logs = [
      { date: "2026-03-01", status: "present" as const, clockIn: undefined, clockOut: undefined },
      { date: "2026-03-02", status: "present" as const, clockIn: undefined, clockOut: undefined },
      { date: "2026-03-03", status: "present" as const, clockIn: undefined, clockOut: undefined },
      { date: "2026-03-04", status: "present" as const, clockIn: undefined, clockOut: undefined },
      { date: "2026-03-05", status: "present" as const, clockIn: undefined, clockOut: undefined },
      { date: "2026-03-06", status: "present" as const, clockIn: undefined, clockOut: undefined },
      { date: "2026-03-07", status: "present" as const, clockIn: undefined, clockOut: undefined },
      { date: "2026-03-08", status: "present" as const, clockIn: undefined, clockOut: undefined },
      { date: "2026-03-09", status: "present" as const, clockIn: undefined, clockOut: undefined },
      { date: "2026-03-10", status: "present" as const, clockIn: undefined, clockOut: undefined },
      { date: "2026-03-11", status: "present" as const, clockIn: undefined, clockOut: undefined },
      { date: "2026-03-12", status: "present" as const, clockIn: undefined, clockOut: undefined },
      { date: "2026-03-13", status: "present" as const, clockIn: undefined, clockOut: undefined },
      { date: "2026-03-14", status: "present" as const, clockIn: undefined, clockOut: undefined },
      { date: "2026-03-15", status: "present" as const, clockIn: undefined, clockOut: undefined },
      { date: "2026-03-16", status: "present" as const, clockIn: undefined, clockOut: undefined },
    ];

    const assessment = assessBurnoutRisk(logs, "2026-03-01", "2026-03-30", 8, 4);

    expect(assessment.riskLevel).toBe("high");
    expect(assessment.flags).toContain("Exceeded 45 working hours in at least one week");
    expect(assessment.daysOff).toBeLessThan(20);
    expect(assessment.longestWorkStreak).toBeGreaterThanOrEqual(16);
  });
});
