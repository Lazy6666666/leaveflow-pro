import type { LucideIcon } from "lucide-react";

export type CountDatum = { name: string; count: number };
export type MonthlyDatum = { month: string; requests: number };
export type AnalyticsDailyDatum = { date: string; label: string; events: number; uniqueUsers: number };
export type AnalyticsFunnelDatum = { name: string; count: number };

export type AnalyticsSummary = {
  recentWindowStart: string;
  recentWindowEnd: string;
  totalEvents: number;
  uniqueUsers: number;
  uniqueSessions: number;
  topEvents: CountDatum[];
  surfaceData: CountDatum[];
  dailyData: AnalyticsDailyDatum[];
  funnelData: AnalyticsFunnelDatum[];
};

export type PayrollEmployee = {
  employeeId: string;
  employeeName: string;
  departmentName: string | null;
  grossPay: number | null;
  workedHours: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  payableHours: number;
};

export type PayrollSummary = {
  startDate: string;
  endDate: string;
  employees: PayrollEmployee[];
  totals: {
    workedHours: number;
    paidLeaveDays: number;
    unpaidLeaveDays: number;
    payableHours: number;
    grossPay: number;
  };
};

export type BurnoutRisk = "high" | "moderate" | "low";

export type BurnoutEmployee = {
  userId: string;
  employeeName: string;
  riskLevel: BurnoutRisk;
  daysOff: number;
  peakWeeklyHours: number;
  overThresholdWeeks: number;
};

export type BurnoutSummary = {
  startDate: string;
  endDate: string;
  atRiskCount: number;
  employees: BurnoutEmployee[];
};

export type CoverageConflict = {
  date: string;
  departmentName: string;
  employees: { employeeId: string; employeeName: string }[];
  count: number;
};

export type CoverageSummary = {
  startDate: string;
  endDate: string;
  conflicts: CoverageConflict[];
};

export type SummaryCard = {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
};
