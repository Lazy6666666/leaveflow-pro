"use node";

import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { getAiGatewayApiKey, getMistralApiKey } from "./lib/env";

type BalanceSummary = {
  balance: number;
  leave_types?: {
    name?: string | null;
    annual_allocation?: number | null;
  } | null;
};

type LeaveHistoryItem = {
  start_date: string;
  end_date: string;
  status: string;
  leave_types?: {
    name?: string | null;
  } | null;
};

type HolidayItem = {
  name: string;
  date: string;
};

type PendingApprovalItem = {
  start_date: string;
  end_date: string;
  profiles?: {
    full_name?: string | null;
    email?: string | null;
  } | null;
  leave_types?: {
    name?: string | null;
  } | null;
};

type TeamCalendarItem = {
  start_date: string;
  end_date: string;
  profiles?: {
    full_name?: string | null;
  } | null;
  leave_types?: {
    name?: string | null;
  } | null;
};

type BurnoutSummary = {
  startDate: string;
  endDate: string;
  atRiskCount?: number;
  employees?: Array<{
    employeeName: string;
    riskLevel: "low" | "moderate" | "high";
    totalHours: number;
    daysOff: number;
    longestWorkStreak: number;
    flags: string[];
  }>;
};

type BurnoutDetail = {
  employeeName: string;
  riskLevel: "low" | "moderate" | "high";
  totalHours: number;
  daysOff: number;
  longestWorkStreak: number;
  flags: string[];
  startDate: string;
  endDate: string;
};

type PayrollSummary = {
  startDate: string;
  endDate: string;
  employees: Array<{
    employeeName: string;
    departmentName: string | null;
    workedHours: number;
    paidLeaveDays: number;
    unpaidLeaveDays: number;
    payableHours: number;
    grossPay: number | null;
    rateSource: "hourly_rate" | "base_salary" | "missing";
  }>;
  totals: {
    workedHours: number;
    paidLeaveDays: number;
    unpaidLeaveDays: number;
    payableHours: number;
    grossPay: number;
  };
};

type CoverageSummary = {
  startDate: string;
  endDate: string;
  conflicts: Array<{
    date: string;
    departmentName: string;
    count: number;
    employees: Array<{
      employeeName: string;
    }>;
  }>;
};

type PolicySearchResult = {
  source: "vector" | "lexical";
  matches: Array<{
    title: string;
    score?: number;
    snippet: string;
  }>;
};

type BiometricsAudit = Array<{
  name: string;
  vendor: string;
  is_active: boolean;
  last_sync_status?: string | null;
  last_sync_at?: string | null;
  sync_frequency_minutes: number;
}>;

type CurrentUser = {
  fullName: string | null;
  roles: string[];
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type AssistantIntent =
  | "workflow"
  | "payroll"
  | "policy"
  | "burnout"
  | "coverage"
  | "biometrics"
  | "balance"
  | "holiday"
  | "history"
  | "pending"
  | "team"
  | "suggest"
  | "unknown";

type ResolvedIntent =
  | { intent: "workflow"; payload: null }
  | { intent: "payroll"; payload: PayrollSummary | { denied: true } }
  | { intent: "policy"; payload: PolicySearchResult }
  | { intent: "burnout"; payload: BurnoutSummary | BurnoutDetail }
  | { intent: "coverage"; payload: CoverageSummary | { denied: true } }
  | { intent: "biometrics"; payload: BiometricsAudit | { denied: true } }
  | { intent: "balance"; payload: BalanceSummary[] }
  | { intent: "holiday"; payload: HolidayItem[] }
  | { intent: "history"; payload: LeaveHistoryItem[] }
  | { intent: "pending"; payload: PendingApprovalItem[] | { denied: true } }
  | { intent: "team"; payload: TeamCalendarItem[] | { denied: true } }
  | { intent: "suggest"; payload: HolidayItem[] }
  | { intent: "unknown"; payload: null };

const BASE_SYSTEM_PROMPT = `You are the BALANCE AI Copilot.

Rules:
- Answer using the provided tool result only.
- Be concise and specific.
- Respect role boundaries. If access is denied, say so plainly.
- If the user asks to submit, apply, approve, or reject directly, redirect them to the BALANCE workflow screens.
- When payroll data is shown, preserve markdown table formatting.
- When policy search returns snippets, quote only short snippets and avoid inventing policy text.`;

const longDateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";
const MISTRAL_CHAT_MODEL = "mistral-small-latest";

function addDays(date: string, days: number) {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

function startOfMonth(date: string) {
  return `${date.slice(0, 8)}01`;
}

function endOfMonth(date: string) {
  const base = new Date(`${startOfMonth(date)}T00:00:00`);
  base.setMonth(base.getMonth() + 1);
  base.setDate(0);
  return base.toISOString().slice(0, 10);
}

function formatDay(date: string) {
  return longDateFormatter.format(new Date(`${date}T00:00:00`));
}

function formatShortDate(date: string) {
  return shortDateFormatter.format(new Date(`${date}T00:00:00`));
}

function formatAmount(value: number | null) {
  if (value === null) {
    return "N/A";
  }
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getRoleLabel(currentUser: CurrentUser) {
  if (currentUser.roles.includes("hr_admin")) {
    return "HR admin";
  }
  if (currentUser.roles.includes("manager")) {
    return "Manager";
  }
  return "Employee";
}

function buildSmartSuggestions(holidays: HolidayItem[]) {
  const today = new Date().toISOString().slice(0, 10);
  const sixMonthsOut = addDays(today, 180);
  const holidayDates = new Set(
    holidays
      .filter((holiday) => holiday.date >= today && holiday.date <= sixMonthsOut)
      .map((holiday) => holiday.date),
  );

  const isWeekend = (date: string) => {
    const day = new Date(`${date}T00:00:00`).getDay();
    return day === 0 || day === 6;
  };
  const isOff = (date: string) => isWeekend(date) || holidayDates.has(date);

  return holidays
    .filter((holiday) => {
      const day = new Date(`${holiday.date}T00:00:00`).getDay();
      return day !== 0 && day !== 6;
    })
    .map((holiday) => {
      let start = holiday.date;
      let end = holiday.date;

      for (let i = 1; i <= 4; i += 1) {
        const current = addDays(holiday.date, -i);
        if (isOff(current)) {
          start = current;
        } else {
          const previous = addDays(current, -1);
          if (isOff(previous)) {
            start = previous;
          }
          break;
        }
      }

      for (let i = 1; i <= 4; i += 1) {
        const current = addDays(holiday.date, i);
        if (isOff(current)) {
          end = current;
        } else {
          const next = addDays(current, 1);
          if (isOff(next)) {
            end = next;
          }
          break;
        }
      }

      const leaveDays: string[] = [];
      let cursor = start;
      let totalDays = 0;

      while (cursor <= end) {
        totalDays += 1;
        if (!isOff(cursor)) {
          leaveDays.push(cursor);
        }
        cursor = addDays(cursor, 1);
      }

      return {
        holiday: holiday.name,
        holidayDate: formatDay(holiday.date),
        leaveDaysToTake: leaveDays.map(formatDay),
        totalDaysOff: totalDays,
        leaveDaysUsed: leaveDays.length,
        period: `${formatDay(start)} - ${formatDay(end)}`,
      };
    })
    .filter((item) => item.leaveDaysUsed > 0 && item.leaveDaysUsed <= 4 && item.totalDaysOff > item.leaveDaysUsed + 1)
    .sort((left, right) => right.totalDaysOff - left.totalDaysOff || left.leaveDaysUsed - right.leaveDaysUsed)
    .slice(0, 5);
}

function hasWorkflowIntent(input: string) {
  return /\b(submit|apply|approve|reject|cancel)\b/.test(input);
}

function detectIntent(input: string): AssistantIntent {
  const normalized = input.toLowerCase();

  if (hasWorkflowIntent(normalized)) {
    return "workflow";
  }
  if (/\b(payroll|salary|pay run|wages|compensation)\b/.test(normalized)) {
    return "payroll";
  }
  if (/\b(policy|policies|handbook|faq|remote work|work from home|wfh)\b/.test(normalized)) {
    return "policy";
  }
  if (/\b(burnout|overwork|overworked|wellbeing|well-being|days off)\b/.test(normalized)) {
    return "burnout";
  }
  if (/\b(coverage|conflict|staffing)\b/.test(normalized)) {
    return "coverage";
  }
  if (/\b(biometric|biometrics|attendance audit|clock audit|device sync)\b/.test(normalized)) {
    return "biometrics";
  }
  if (/\b(pending|approval)\b/.test(normalized)) {
    return "pending";
  }
  if (/\b(team calendar|team leave)\b/.test(normalized)) {
    return "team";
  }
  if (/\b(request|history)\b/.test(normalized)) {
    return "history";
  }
  if (/\b(holiday|holidays)\b/.test(normalized)) {
    return "holiday";
  }
  if (/\b(suggest|bridge day|smart leave)\b/.test(normalized)) {
    return "suggest";
  }
  if (/\b(balance|balances)\b/.test(normalized)) {
    return "balance";
  }
  return "unknown";
}

function extractDateRange(input: string) {
  const today = new Date().toISOString().slice(0, 10);
  const isoDates = input.match(/\b\d{4}-\d{2}-\d{2}\b/g) ?? [];
  if (isoDates.length >= 2) {
    return {
      startDate: isoDates[0],
      endDate: isoDates[1],
    };
  }

  const normalized = input.toLowerCase();
  if (normalized.includes("next two weeks") || normalized.includes("next 2 weeks")) {
    return {
      startDate: today,
      endDate: addDays(today, 13),
    };
  }
  if (normalized.includes("next week")) {
    return {
      startDate: today,
      endDate: addDays(today, 6),
    };
  }

  return {
    startDate: startOfMonth(today),
    endDate: endOfMonth(today),
  };
}

function shouldUseTeamBurnoutSummary(input: string, currentUser: CurrentUser) {
  if (!currentUser.roles.includes("manager") && !currentUser.roles.includes("hr_admin")) {
    return false;
  }
  return /\b(anyone|who|team|staff)\b/.test(input.toLowerCase());
}

function summarizeToolPayload(payload: ResolvedIntent["payload"]) {
  if (payload === null) {
    return null;
  }
  if ("employees" in payload && Array.isArray(payload.employees)) {
    return { ...payload, employees: payload.employees.slice(0, 8) };
  }
  if ("matches" in payload && Array.isArray(payload.matches)) {
    return { ...payload, matches: payload.matches.slice(0, 3) };
  }
  if (Array.isArray(payload)) {
    return payload.slice(0, 8);
  }
  return payload;
}

function extractModelText(content: unknown) {
  if (typeof content === "string") {
    const trimmed = content.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (!Array.isArray(content)) {
    return null;
  }

  const text = content
    .map((part) => {
      if (typeof part === "string") {
        return part;
      }
      if (part && typeof part === "object" && "text" in part && typeof part.text === "string") {
        return part.text;
      }
      return "";
    })
    .join("\n")
    .trim();

  return text.length > 0 ? text : null;
}

async function maybeGenerateAiReply(
  messages: ChatMessage[],
  currentUser: CurrentUser,
  resolved: ResolvedIntent,
) {
  const systemMessage = {
    role: "system" as const,
    content: `${BASE_SYSTEM_PROMPT}

Role: ${getRoleLabel(currentUser)}
Intent: ${resolved.intent}
Tool result:
${JSON.stringify(summarizeToolPayload(resolved.payload), null, 2)}`,
  };

  const mistralApiKey = getMistralApiKey();
  if (mistralApiKey) {
    const response = await fetch(MISTRAL_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mistralApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MISTRAL_CHAT_MODEL,
        temperature: 0.2,
        messages: [
          systemMessage,
          ...messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        ],
      }),
    });

    if (response.ok) {
      const payload = await response.json();
      const content = payload?.choices?.[0]?.message?.content;
      const reply = extractModelText(content);
      if (reply) {
        return reply;
      }
    } else {
      console.error("Assistant Mistral request failed", await response.text());
    }
  }

  const aiGatewayApiKey = getAiGatewayApiKey();
  if (!aiGatewayApiKey) {
    return null;
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${aiGatewayApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-4.1-mini",
      temperature: 0.2,
      messages: [
        systemMessage,
        ...messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ],
    }),
  });

  if (!response.ok) {
    console.error("Assistant gateway request failed", await response.text());
    return null;
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  return typeof content === "string" && content.trim() ? content.trim() : null;
}

function formatBalanceReply(balances: BalanceSummary[]) {
  if (balances.length === 0) {
    return "No leave balances are allocated yet. Ask HR to initialize your leave balances.";
  }

  const lines = balances.map((balance) => {
    const total = balance.leave_types?.annual_allocation ?? 0;
    return `- ${balance.leave_types?.name ?? "Leave"}: ${balance.balance} remaining out of ${total}`;
  });
  return `Here is your current leave balance:\n\n${lines.join("\n")}`;
}

function formatHolidayReply(holidays: HolidayItem[]) {
  if (holidays.length === 0) {
    return "There are no upcoming holidays configured for this year.";
  }

  const lines = holidays.slice(0, 5).map((holiday) => `- ${holiday.name}: ${formatShortDate(holiday.date)}`);
  return `Upcoming holidays:\n\n${lines.join("\n")}`;
}

function formatHistoryReply(history: LeaveHistoryItem[]) {
  if (history.length === 0) {
    return "You do not have any leave requests yet.";
  }

  const lines = history.slice(0, 5).map((request) =>
    `- ${request.leave_types?.name ?? "Leave"}: ${formatShortDate(request.start_date)} to ${formatShortDate(request.end_date)} (${request.status})`,
  );
  return `Your most recent leave requests:\n\n${lines.join("\n")}`;
}

function formatPendingReply(payload: PendingApprovalItem[] | { denied: true }) {
  if ("denied" in payload) {
    return "Pending approvals are only available to managers and HR admins.";
  }
  if (payload.length === 0) {
    return "There are no pending approvals right now.";
  }

  const lines = payload.slice(0, 5).map((request) => {
    const employee = request.profiles?.full_name || request.profiles?.email || "Employee";
    return `- ${employee}: ${request.leave_types?.name ?? "Leave"} from ${formatShortDate(request.start_date)} to ${formatShortDate(request.end_date)}`;
  });
  return `Pending approvals:\n\n${lines.join("\n")}`;
}

function formatTeamReply(payload: TeamCalendarItem[] | { denied: true }) {
  if ("denied" in payload) {
    return "Team leave visibility is only available to managers and HR admins.";
  }
  if (payload.length === 0) {
    return "No approved team leave is scheduled in the next 30 days.";
  }

  const lines = payload.slice(0, 5).map((leave) =>
    `- ${leave.profiles?.full_name ?? "Employee"}: ${leave.leave_types?.name ?? "Leave"} from ${formatShortDate(leave.start_date)} to ${formatShortDate(leave.end_date)}`,
  );
  return `Upcoming team leave:\n\n${lines.join("\n")}`;
}

function formatSuggestionReply(holidays: HolidayItem[]) {
  const suggestions = buildSmartSuggestions(holidays);
  if (suggestions.length === 0) {
    return "I could not find any strong bridge-day suggestions in the current holiday window.";
  }

  const lines = suggestions.map((suggestion) =>
    [
      `- ${suggestion.holiday} (${suggestion.holidayDate})`,
      `  - Take off: ${suggestion.leaveDaysToTake.join(", ")}`,
      `  - Total days off: ${suggestion.totalDaysOff}`,
      `  - Leave days used: ${suggestion.leaveDaysUsed}`,
      `  - Period: ${suggestion.period}`,
    ].join("\n"),
  );
  return `Smart leave suggestions:\n\n${lines.join("\n\n")}`;
}

function formatPayrollReply(payload: PayrollSummary | { denied: true }) {
  if ("denied" in payload) {
    return "Payroll summaries are only available to HR admins.";
  }
  if (payload.employees.length === 0) {
    return "No payroll activity was found in that date range.";
  }

  const headers = ["Employee", "Department", "Worked Hrs", "Paid Leave", "Unpaid Leave", "Payable Hrs", "Gross Pay"];
  const rows = payload.employees.slice(0, 10).map((employee) =>
    [
      employee.employeeName,
      employee.departmentName ?? "Unassigned",
      employee.workedHours.toFixed(2),
      employee.paidLeaveDays.toFixed(2),
      employee.unpaidLeaveDays.toFixed(2),
      employee.payableHours.toFixed(2),
      formatAmount(employee.grossPay),
    ],
  );
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

  const lines = payload.matches.slice(0, 3).map((match) =>
    `- **${match.title}**${typeof match.score === "number" ? ` (${match.score.toFixed(2)})` : ""}: ${match.snippet}`,
  );
  return `Here are the most relevant policy matches (${payload.source} search):\n\n${lines.join("\n")}`;
}

function formatBurnoutReply(payload: BurnoutSummary | BurnoutDetail) {
  if ("employees" in payload) {
    const atRisk = payload.employees?.filter((employee) => employee.riskLevel !== "low") ?? [];
    if (atRisk.length === 0) {
      return `No one in the current scope is showing a moderate or high burnout signal between ${formatShortDate(payload.startDate)} and ${formatShortDate(payload.endDate)}.`;
    }

    const lines = atRisk.slice(0, 5).map((employee) =>
      `- ${employee.employeeName}: ${employee.riskLevel} risk, ${employee.totalHours.toFixed(2)} hours, ${employee.daysOff} days off, longest streak ${employee.longestWorkStreak} days${employee.flags.length > 0 ? `, flags: ${employee.flags.join("; ")}` : ""}`,
    );
    return `Burnout risk summary for ${formatShortDate(payload.startDate)} to ${formatShortDate(payload.endDate)}:\n\n${lines.join("\n")}`;
  }

  const details = [
    `Burnout check for ${payload.employeeName}: ${payload.riskLevel} risk.`,
    `- Hours worked: ${payload.totalHours.toFixed(2)}`,
    `- Days off: ${payload.daysOff}`,
    `- Longest work streak: ${payload.longestWorkStreak} days`,
  ];
  if (payload.flags.length > 0) {
    details.push(`- Flags: ${payload.flags.join("; ")}`);
  }
  return details.join("\n");
}

function formatCoverageReply(payload: CoverageSummary | { denied: true }) {
  if ("denied" in payload) {
    return "Coverage conflict checks are only available to managers and HR admins.";
  }
  if (payload.conflicts.length === 0) {
    return `No coverage conflicts were found between ${formatShortDate(payload.startDate)} and ${formatShortDate(payload.endDate)}.`;
  }

  const lines = payload.conflicts.slice(0, 6).map((conflict) =>
    `- ${formatShortDate(conflict.date)} | ${conflict.departmentName}: ${conflict.employees.map((employee) => employee.employeeName).join(", ")}`,
  );
  return `Coverage conflicts between ${formatShortDate(payload.startDate)} and ${formatShortDate(payload.endDate)}:\n\n${lines.join("\n")}`;
}

function formatBiometricsReply(payload: BiometricsAudit | { denied: true }) {
  if ("denied" in payload) {
    return "Biometric audit summaries are only available to HR admins.";
  }
  if (payload.length === 0) {
    return "No biometric attendance configurations are set up yet.";
  }

  const lines = payload.slice(0, 5).map((config) =>
    `- ${config.name} (${config.vendor}): ${config.is_active ? "active" : "inactive"}, sync every ${config.sync_frequency_minutes} minutes, last sync ${config.last_sync_status ?? "unknown"}${config.last_sync_at ? ` on ${formatShortDate(config.last_sync_at.slice(0, 10))}` : ""}`,
  );
  return `Biometric audit summary:\n\n${lines.join("\n")}`;
}

function buildDeterministicReply(resolved: ResolvedIntent) {
  switch (resolved.intent) {
    case "workflow":
      return "Use the BALANCE request or approvals screens for that action. I can help you review balances, policies, payroll, coverage, burnout, holidays, requests, approvals, and team leave.";
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
      return "I can help with policies, balances, holidays, leave history, payroll summaries, burnout checks, coverage conflicts, approvals, and team leave visibility.";
  }
}

async function resolveIntent(ctx: any, latestMessage: string, currentUser: CurrentUser): Promise<ResolvedIntent> {
  const intent = detectIntent(latestMessage);
  const currentYear = new Date().getFullYear();
  const today = new Date().toISOString().slice(0, 10);
  const nextThirtyDays = addDays(today, 30);
  const canSeeManagerData = currentUser.roles.includes("manager") || currentUser.roles.includes("hr_admin");
  const isHrAdmin = currentUser.roles.includes("hr_admin");

  switch (intent) {
    case "workflow":
      return { intent, payload: null };
    case "balance":
      return { intent, payload: await ctx.runQuery(api.leave.getMyBalances, { year: currentYear }) };
    case "holiday":
      return { intent, payload: await ctx.runQuery(api.admin.getHolidays, { year: currentYear }) };
    case "history":
      return { intent, payload: await ctx.runQuery(api.leave.getLeaveHistory, {}) };
    case "pending":
      return canSeeManagerData
        ? { intent, payload: await ctx.runQuery(api.leave.getPendingApprovals, {}) }
        : { intent, payload: { denied: true } };
    case "team":
      return canSeeManagerData
        ? { intent, payload: await ctx.runQuery(api.leave.getTeamCalendar, { startDate: today, endDate: nextThirtyDays }) }
        : { intent, payload: { denied: true } };
    case "suggest":
      return { intent, payload: await ctx.runQuery(api.admin.getHolidays, { year: currentYear }) };
    case "payroll": {
      if (!isHrAdmin) {
        return { intent, payload: { denied: true } };
      }
      const { startDate, endDate } = extractDateRange(latestMessage);
      return { intent, payload: await ctx.runQuery(api.payroll.getPayrollSummary, { startDate, endDate }) };
    }
    case "policy":
      return { intent, payload: await ctx.runAction(api.rag.searchPolicy, { query: latestMessage }) };
    case "burnout":
      if (shouldUseTeamBurnoutSummary(latestMessage, currentUser)) {
        return { intent, payload: await ctx.runQuery(api.insights.getBurnoutSummary, {}) };
      }
      return { intent, payload: await ctx.runQuery(api.insights.detectBurnout, {}) };
    case "coverage": {
      if (!canSeeManagerData) {
        return { intent, payload: { denied: true } };
      }
      const { startDate, endDate } = extractDateRange(latestMessage);
      return { intent, payload: await ctx.runQuery(api.insights.checkCoverageConflict, { startDate, endDate }) };
    }
    case "biometrics":
      return isHrAdmin
        ? { intent, payload: await ctx.runQuery(api.admin.getBiometricsConfigs, {}) }
        : { intent, payload: { denied: true } };
    default:
      return { intent: "unknown", payload: null };
  }
}

export const chat = action({
  args: {
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.runQuery(api.users.current, {});
    if (!currentUser) {
      throw new Error("Unauthorized");
    }

    const latestMessage = args.messages.at(-1)?.content ?? "";
    const resolved = await resolveIntent(ctx, latestMessage, {
      fullName: currentUser.fullName,
      roles: currentUser.roles,
    });
    const aiReply = await maybeGenerateAiReply(args.messages, {
      fullName: currentUser.fullName,
      roles: currentUser.roles,
    }, resolved);
    const fallbackReply = buildDeterministicReply(resolved);

    return {
      intent: resolved.intent,
      message: aiReply ?? fallbackReply,
      source: aiReply ? "gateway" : "deterministic",
    };
  },
});
