import { calculateWorkedHours } from "./lib/aiScaling";
import type { AttendanceLogDoc } from "./lib/types";

export type PayrollExceptionSeed = {
  employeeId: string;
  exceptionType: string;
  description: string;
};

type PayrollExceptionEmployee = {
  employeeId: string;
  rateSource: "hourly_rate" | "base_salary" | "missing";
  grossPay: number | null;
  workedHours: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  payableHours: number;
  overtimeHours: number;
};

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

export function calculatePayrollOvertime(
  logs: AttendanceLogDoc[],
  standardDailyHours: number,
  halfDayHours: number,
  overtimeThresholdHours: number,
  hourlyRate: number | null,
  overtimeMultiplier: number,
) {
  const overtimeHours = roundCurrency(
    logs.reduce((total, log) => {
      const workedHours = calculateWorkedHours(log, standardDailyHours, halfDayHours);
      return total + Math.max(0, workedHours - overtimeThresholdHours);
    }, 0),
  );

  const overtimePremiumPay = hourlyRate !== null && overtimeMultiplier > 1
    ? roundCurrency(overtimeHours * hourlyRate * (overtimeMultiplier - 1))
    : 0;

  return {
    overtimeHours,
    overtimePremiumPay,
  };
}

export function buildPayrollExceptions(employees: PayrollExceptionEmployee[]): PayrollExceptionSeed[] {
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

    if (employee.overtimeHours > 0 && employee.rateSource !== "hourly_rate") {
      out.push({
        employeeId: employee.employeeId,
        exceptionType: "overtime_review_required",
        description: "Overtime was detected for an employee without an hourly rate. Review the applicable overtime policy before payroll handoff.",
      });
    }

    if (employee.unpaidLeaveDays > 0 && employee.rateSource === "base_salary") {
      out.push({
        employeeId: employee.employeeId,
        exceptionType: "unpaid_leave_deduction_review",
        description: "Unpaid leave was recorded for a salaried employee. Confirm the gross-pay deduction policy before export handoff.",
      });
    }
  }

  return out;
}
