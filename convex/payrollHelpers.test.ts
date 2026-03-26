import { describe, expect, it } from "vitest";

import { buildPayrollExceptions, calculatePayrollOvertime } from "./payrollHelpers";

describe("payroll helpers", () => {
  it("calculates overtime premium for hourly employees", () => {
    const result = calculatePayrollOvertime(
      [
        {
          status: "present",
          clockIn: new Date("2026-03-18T09:00:00Z").getTime(),
          clockOut: new Date("2026-03-18T19:00:00Z").getTime(),
        },
      ] as never,
      8,
      4,
      8,
      20,
      1.5,
    );

    expect(result).toEqual({
      overtimeHours: 2,
      overtimePremiumPay: 20,
    });
  });

  it("flags overtime and unpaid-leave review scenarios", () => {
    const exceptions = buildPayrollExceptions([
      {
        employeeId: "salary-review",
        rateSource: "base_salary",
        grossPay: 3000,
        workedHours: 160,
        paidLeaveDays: 0,
        unpaidLeaveDays: 1,
        payableHours: 160,
        overtimeHours: 6,
      },
    ]);

    expect(exceptions).toEqual([
      expect.objectContaining({ exceptionType: "overtime_review_required" }),
      expect.objectContaining({ exceptionType: "unpaid_leave_deduction_review" }),
    ]);
  });
});
