import type {
  AnalyticsSummary,
  BurnoutRisk,
  BurnoutSummary,
  CountDatum,
  CoverageSummary,
  MonthlyDatum,
  PayrollSummary,
} from "./reportsTypes";

export const REPORT_COLORS = [
  "hsl(var(--foreground))",
  "hsl(var(--muted-foreground))",
  "hsl(var(--border))",
  "hsl(var(--muted))",
  "hsl(var(--secondary-foreground))",
];

export const RISK_COLORS: Record<BurnoutRisk, string> = {
  high: "hsl(var(--destructive))",
  moderate: "hsl(var(--chart-4))",
  low: "hsl(var(--chart-2))",
};

export const isoDate = (value: Date) => value.toISOString().slice(0, 10);

export const formatAmount = (value: number | null) =>
  value === null ? "N/A" : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatShortDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(`${value}T00:00:00`));

export const formatRangeLabel = (startDate: string, endDate: string) => `${formatShortDate(startDate)} - ${formatShortDate(endDate)}`;

export const getRiskBadgeVariant = (riskLevel: BurnoutRisk) =>
  riskLevel === "high" ? "destructive" : riskLevel === "moderate" ? "default" : "secondary";

const buildCsvCell = (value: string | number | null | undefined) => `"${String(value ?? "").replace(/"/g, '""')}"`;

export function exportReportsCsv(input: {
  attendanceData: CountDatum[];
  analyticsSummary: AnalyticsSummary | null;
  burnoutSummary: BurnoutSummary | null;
  coverageSummary: CoverageSummary | null;
  monthlyData: MonthlyDatum[];
  payrollSummary: PayrollSummary | null;
  statusData: CountDatum[];
  typeData: CountDatum[];
}) {
  const rows: string[] = [["Section", "Category", "Metric", "Value"].map(buildCsvCell).join(",")];

  input.statusData.forEach((item) => rows.push(["Leave Status", item.name, "Count", item.count].map(buildCsvCell).join(",")));
  input.typeData.forEach((item) => rows.push(["Leave Type", item.name, "Count", item.count].map(buildCsvCell).join(",")));
  input.attendanceData.forEach((item) => rows.push(["Attendance", item.name, "Count", item.count].map(buildCsvCell).join(",")));
  input.monthlyData.forEach((item) => rows.push(["Monthly Leave Trends", item.month, "Requests", item.requests].map(buildCsvCell).join(",")));

  if (input.analyticsSummary) {
    rows.push(["Product Analytics", "Summary", "Date Range", `${input.analyticsSummary.recentWindowStart} to ${input.analyticsSummary.recentWindowEnd}`].map(buildCsvCell).join(","));
    rows.push(["Product Analytics", "Summary", "Total Events", input.analyticsSummary.totalEvents].map(buildCsvCell).join(","));
    rows.push(["Product Analytics", "Summary", "Unique Users", input.analyticsSummary.uniqueUsers].map(buildCsvCell).join(","));
    rows.push(["Product Analytics", "Summary", "Unique Sessions", input.analyticsSummary.uniqueSessions].map(buildCsvCell).join(","));
    input.analyticsSummary.topEvents.forEach((item) => {
      rows.push(["Product Analytics Events", item.name, "Count", item.count].map(buildCsvCell).join(","));
    });
    input.analyticsSummary.surfaceData.forEach((item) => {
      rows.push(["Product Analytics Surfaces", item.name, "Count", item.count].map(buildCsvCell).join(","));
    });
    input.analyticsSummary.dailyData.forEach((item) => {
      rows.push(["Product Analytics Daily", item.label, "Events", item.events].map(buildCsvCell).join(","));
      rows.push(["Product Analytics Daily", item.label, "Unique Users", item.uniqueUsers].map(buildCsvCell).join(","));
    });
    input.analyticsSummary.funnelData.forEach((item) => {
      rows.push(["Product Analytics Funnel", item.name, "Count", item.count].map(buildCsvCell).join(","));
    });
  }

  if (input.payrollSummary) {
    rows.push(["Payroll", "Summary", "Date Range", formatRangeLabel(input.payrollSummary.startDate, input.payrollSummary.endDate)].map(buildCsvCell).join(","));
    rows.push(["Payroll", "Summary", "Gross Pay", formatAmount(input.payrollSummary.totals.grossPay)].map(buildCsvCell).join(","));
    rows.push(["Payroll", "Summary", "Payable Hours", input.payrollSummary.totals.payableHours].map(buildCsvCell).join(","));
    input.payrollSummary.employees.forEach((employee) => {
      rows.push(
        [
          "Payroll Employees",
          employee.employeeName,
          employee.departmentName ?? "Unassigned",
          `gross ${formatAmount(employee.grossPay)} | payable hours ${employee.payableHours.toFixed(2)} | paid leave ${employee.paidLeaveDays.toFixed(2)} | unpaid leave ${employee.unpaidLeaveDays.toFixed(2)}`,
        ].map(buildCsvCell).join(","),
      );
    });
  }

  if (input.burnoutSummary) {
    rows.push(["Burnout", "Summary", "Date Range", formatRangeLabel(input.burnoutSummary.startDate, input.burnoutSummary.endDate)].map(buildCsvCell).join(","));
    rows.push(["Burnout", "Summary", "At Risk Employees", input.burnoutSummary.atRiskCount].map(buildCsvCell).join(","));
    input.burnoutSummary.employees.forEach((employee) => {
      rows.push(
        [
          "Burnout Employees",
          employee.employeeName,
          employee.riskLevel,
          `days off ${employee.daysOff} | peak weekly hours ${employee.peakWeeklyHours.toFixed(2)} | threshold weeks ${employee.overThresholdWeeks}`,
        ].map(buildCsvCell).join(","),
      );
    });
  }

  if (input.coverageSummary) {
    rows.push(["Coverage", "Summary", "Date Range", formatRangeLabel(input.coverageSummary.startDate, input.coverageSummary.endDate)].map(buildCsvCell).join(","));
    rows.push(["Coverage", "Summary", "Conflict Days", input.coverageSummary.conflicts.length].map(buildCsvCell).join(","));
    input.coverageSummary.conflicts.forEach((conflict) => {
      rows.push(
        [
          "Coverage Conflicts",
          conflict.departmentName,
          conflict.date,
          `${conflict.count} employees out: ${conflict.employees.map((employee) => employee.employeeName).join(", ")}`,
        ].map(buildCsvCell).join(","),
      );
    });
  }

  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "reports.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}
