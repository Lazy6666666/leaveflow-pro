import { buildSmartSuggestions, formatAmount, formatShortDate } from "./assistantUtils";

import type {
  BalanceSummary,
  BiometricsAudit,
  BurnoutDetail,
  BurnoutSummary,
  CoverageSummary,
  HolidayItem,
  LeaveHistoryItem,
  PayrollSummary,
  PendingApprovalItem,
  PolicySearchResult,
  ResolvedIntent,
  TeamCalendarItem,
} from "./assistantTypes";

function formatBalanceReply(balances: BalanceSummary[]) {
  if (balances.length === 0) {
    return "No leave balances are allocated yet. Ask HR to initialize your leave balances.";
  }
  return `Here is your current leave balance:\n\n${balances.map((balance) => `- ${balance.leave_types?.name ?? "Leave"}: ${balance.balance} remaining out of ${balance.leave_types?.annual_allocation ?? 0}`).join("\n")}`;
}

function formatHolidayReply(holidays: HolidayItem[]) {
  if (holidays.length === 0) return "There are no upcoming holidays configured for this year.";
  return `Upcoming holidays:\n\n${holidays.slice(0, 5).map((holiday) => `- ${holiday.name}: ${formatShortDate(holiday.date)}`).join("\n")}`;
}

function formatHistoryReply(history: LeaveHistoryItem[]) {
  if (history.length === 0) return "You do not have any leave requests yet.";
  return `Your most recent leave requests:\n\n${history.slice(0, 5).map((request) => `- ${request.leave_types?.name ?? "Leave"}: ${formatShortDate(request.start_date)} to ${formatShortDate(request.end_date)} (${request.status})`).join("\n")}`;
}

function formatPendingReply(payload: PendingApprovalItem[] | { denied: true }) {
  if ("denied" in payload) return "Pending approvals are only available to managers and HR admins.";
  if (payload.length === 0) return "There are no pending approvals right now.";
  return `Pending approvals:\n\n${payload.slice(0, 5).map((request) => `- ${request.profiles?.full_name || request.profiles?.email || "Employee"}: ${request.leave_types?.name ?? "Leave"} from ${formatShortDate(request.start_date)} to ${formatShortDate(request.end_date)}`).join("\n")}`;
}

function formatTeamReply(payload: TeamCalendarItem[] | { denied: true }) {
  if ("denied" in payload) return "Team leave visibility is only available to managers and HR admins.";
  if (payload.length === 0) return "No approved team leave is scheduled in the next 30 days.";
  return `Upcoming team leave:\n\n${payload.slice(0, 5).map((leave) => `- ${leave.profiles?.full_name ?? "Employee"}: ${leave.leave_types?.name ?? "Leave"} from ${formatShortDate(leave.start_date)} to ${formatShortDate(leave.end_date)}`).join("\n")}`;
}

function formatSuggestionReply(holidays: HolidayItem[]) {
  const suggestions = buildSmartSuggestions(holidays);
  if (suggestions.length === 0) return "I could not find any strong bridge-day suggestions in the current holiday window.";
  return `Smart leave suggestions:\n\n${suggestions.map((suggestion) => [`- ${suggestion.holiday} (${suggestion.holidayDate})`, `  - Take off: ${suggestion.leaveDaysToTake.join(", ")}`, `  - Total days off: ${suggestion.totalDaysOff}`, `  - Leave days used: ${suggestion.leaveDaysUsed}`, `  - Period: ${suggestion.period}`].join("\n")).join("\n\n")}`;
}

function formatPayrollReply(payload: PayrollSummary | { denied: true }) {
  if ("denied" in payload) return "Payroll summaries are only available to HR admins.";
  if (payload.employees.length === 0) return "No payroll activity was found in that date range.";

  const headers = ["Employee", "Department", "Worked Hrs", "Paid Leave", "Unpaid Leave", "Payable Hrs", "Gross Pay"];
  const rows = payload.employees.slice(0, 10).map((employee) => [
    employee.employeeName,
    employee.departmentName ?? "Unassigned",
    employee.workedHours.toFixed(2),
    employee.paidLeaveDays.toFixed(2),
    employee.unpaidLeaveDays.toFixed(2),
    employee.payableHours.toFixed(2),
    formatAmount(employee.grossPay),
  ]);
  const table = [
    `Payroll summary for ${formatShortDate(payload.startDate)} to ${formatShortDate(payload.endDate)}.`,
    "",
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
    "",
    `Totals: ${payload.totals.payableHours.toFixed(2)} payable hours, ${payload.totals.paidLeaveDays.toFixed(2)} paid leave days, ${payload.totals.unpaidLeaveDays.toFixed(2)} unpaid leave days, gross pay ${formatAmount(payload.totals.grossPay)}.`,
  ];
  if (payload.employees.length > 10) {
    table.push(`Showing 10 of ${payload.employees.length} employees in the current summary.`);
  }
  return table.join("\n");
}

function formatPolicyReply(payload: PolicySearchResult) {
  if (payload.matches.length === 0) {
    return "I could not find a matching policy passage yet. Ask HR to upload or index the relevant policy document first.";
  }
  return `Here are the most relevant policy matches (${payload.source} search):\n\n${payload.matches.slice(0, 3).map((match) => `- **${match.title}**${typeof match.score === "number" ? ` (${match.score.toFixed(2)})` : ""}: ${match.snippet}`).join("\n")}`;
}

function formatBurnoutReply(payload: BurnoutSummary | BurnoutDetail) {
  if ("employeeName" in payload) {
    const details = [
      `Burnout check for ${payload.employeeName}: ${payload.riskLevel} risk.`,
      `- Hours worked: ${payload.totalHours.toFixed(2)}`,
      `- Days off: ${payload.daysOff}`,
      `- Longest work streak: ${payload.longestWorkStreak} days`,
    ];
    if (payload.flags.length > 0) details.push(`- Flags: ${payload.flags.join("; ")}`);
    return details.join("\n");
  }

  const atRisk = payload.employees?.filter((employee) => employee.riskLevel !== "low") ?? [];
  if (atRisk.length === 0) {
    return `No one in the current scope is showing a moderate or high burnout signal between ${formatShortDate(payload.startDate)} and ${formatShortDate(payload.endDate)}.`;
  }
  return `Burnout risk summary for ${formatShortDate(payload.startDate)} to ${formatShortDate(payload.endDate)}:\n\n${atRisk.slice(0, 5).map((employee) => `- ${employee.employeeName}: ${employee.riskLevel} risk, ${employee.totalHours.toFixed(2)} hours, ${employee.daysOff} days off, longest streak ${employee.longestWorkStreak} days${employee.flags.length > 0 ? `, flags: ${employee.flags.join("; ")}` : ""}`).join("\n")}`;
}

function formatCoverageReply(payload: CoverageSummary | { denied: true }) {
  if ("denied" in payload) return "Coverage conflict checks are only available to managers and HR admins.";
  if (payload.conflicts.length === 0) return `No coverage conflicts were found between ${formatShortDate(payload.startDate)} and ${formatShortDate(payload.endDate)}.`;
  return `Coverage conflicts between ${formatShortDate(payload.startDate)} and ${formatShortDate(payload.endDate)}:\n\n${payload.conflicts.slice(0, 6).map((conflict) => `- ${formatShortDate(conflict.date)} | ${conflict.departmentName}: ${conflict.employees.map((employee) => employee.employeeName).join(", ")}`).join("\n")}`;
}

function formatBiometricsReply(payload: BiometricsAudit | { denied: true }) {
  if ("denied" in payload) return "Biometric audit summaries are only available to HR admins.";
  if (payload.length === 0) return "No biometric attendance configurations are set up yet.";
  return `Biometric audit summary:\n\n${payload.slice(0, 5).map((config) => `- ${config.name} (${config.vendor}): ${config.is_active ? "active" : "inactive"}, sync every ${config.sync_frequency_minutes} minutes, last sync ${config.last_sync_status ?? "unknown"}${config.last_sync_at ? ` on ${formatShortDate(config.last_sync_at.slice(0, 10))}` : ""}`).join("\n")}`;
}

export function buildDeterministicReply(resolved: ResolvedIntent) {
  switch (resolved.intent) {
    case "workflow":
      return "I can guide you, but I cannot submit or approve actions directly. Use the BALANCE request or approvals screens for that step.";
    case "balance":
      return formatBalanceReply(resolved.payload);
    case "holiday":
      return formatHolidayReply(resolved.payload);
    case "history":
      return formatHistoryReply(resolved.payload);
    case "pending":
      return formatPendingReply(resolved.payload);
    case "team":
      return formatTeamReply(resolved.payload);
    case "suggest":
      return formatSuggestionReply(resolved.payload);
    case "payroll":
      return formatPayrollReply(resolved.payload);
    case "policy":
      return formatPolicyReply(resolved.payload);
    case "burnout":
      return formatBurnoutReply(resolved.payload);
    case "coverage":
      return formatCoverageReply(resolved.payload);
    case "biometrics":
      return formatBiometricsReply(resolved.payload);
    default:
      return "The AI copilot is unavailable right now. Try again in a moment.";
  }
}

export function shouldUseStructuredFallback(intent: ResolvedIntent["intent"]) {
  return intent !== "unknown";
}
