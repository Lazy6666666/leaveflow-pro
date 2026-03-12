"use node";

import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { getMistralApiKey } from "./lib/env";
import type { ActionCtx } from "./_generated/server";

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

type MistralToolCall = {
  id?: string;
  function?: {
    name?: string;
    arguments?: string;
  } | null;
};

type MistralMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | Array<{ type?: string; text?: string }> | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: MistralToolCall[];
};

type MistralToolDefinition = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required?: string[];
      additionalProperties: boolean;
    };
  };
};

type MistralResponse = {
  choices?: Array<{
    message?: MistralMessage | null;
  }>;
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
const MAX_TOOL_ROUNDS = 4;
const MISTRAL_TIMEOUT_MS = 15_000;

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

async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs = MISTRAL_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function parseToolArguments(argumentsText: string | undefined) {
  if (!argumentsText) {
    return {};
  }

  try {
    const parsed = JSON.parse(argumentsText);
    return typeof parsed === "object" && parsed !== null ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function getToolLimit(argumentsText: string | undefined, fallback = 5, max = 10) {
  const limit = parseToolArguments(argumentsText).limit;
  if (typeof limit !== "number" || !Number.isFinite(limit)) {
    return fallback;
  }
  return Math.max(1, Math.min(max, Math.floor(limit)));
}

function getResolvedRange(argumentsText: string | undefined, fallbackInput: string, defaultEndOffsetDays = 30) {
  const parsed = parseToolArguments(argumentsText);
  const fallback = extractDateRange(fallbackInput);
  const today = new Date().toISOString().slice(0, 10);
  const startDate = typeof parsed.startDate === "string" ? parsed.startDate : fallback.startDate ?? today;
  const endDate = typeof parsed.endDate === "string" ? parsed.endDate : fallback.endDate ?? addDays(today, defaultEndOffsetDays);
  return {
    startDate,
    endDate,
  };
}

function buildAssistantTools(canSeeManagerData: boolean, isHrAdmin: boolean): MistralToolDefinition[] {
  const tools: MistralToolDefinition[] = [
    {
      type: "function",
      function: {
        name: "get_leave_balances",
        description: "Fetch the current employee leave balances and allocations.",
        parameters: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_leave_history",
        description: "Fetch recent leave requests and statuses for the current user.",
        parameters: {
          type: "object",
          properties: {
            limit: { type: "integer", minimum: 1, maximum: 10 },
          },
          additionalProperties: false,
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_upcoming_holidays",
        description: "Fetch configured upcoming public holidays.",
        parameters: {
          type: "object",
          properties: {
            limit: { type: "integer", minimum: 1, maximum: 10 },
          },
          additionalProperties: false,
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_smart_leave_suggestions",
        description: "Fetch smart leave suggestions based on holiday bridging opportunities.",
        parameters: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
      },
    },
    {
      type: "function",
      function: {
        name: "search_policy",
        description: "Search indexed HR policy documents for relevant snippets.",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string" },
          },
          required: ["query"],
          additionalProperties: false,
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_my_burnout_check",
        description: "Check burnout signals for the current user.",
        parameters: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
      },
    },
  ];

  if (canSeeManagerData) {
    tools.push(
      {
        type: "function",
        function: {
          name: "get_pending_approvals",
          description: "Fetch pending approvals requiring manager or HR action.",
          parameters: {
            type: "object",
            properties: {
              limit: { type: "integer", minimum: 1, maximum: 10 },
            },
            additionalProperties: false,
          },
        },
      },
      {
        type: "function",
        function: {
          name: "get_team_calendar",
          description: "Fetch approved team leave for a date range.",
          parameters: {
            type: "object",
            properties: {
              startDate: { type: "string" },
              endDate: { type: "string" },
              limit: { type: "integer", minimum: 1, maximum: 10 },
            },
            additionalProperties: false,
          },
        },
      },
      {
        type: "function",
        function: {
          name: "get_burnout_overview",
          description: "Fetch burnout risk overview across the manager or HR-visible scope.",
          parameters: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
        },
      },
      {
        type: "function",
        function: {
          name: "check_coverage_conflicts",
          description: "Check for leave coverage conflicts in a date range.",
          parameters: {
            type: "object",
            properties: {
              startDate: { type: "string" },
              endDate: { type: "string" },
            },
            additionalProperties: false,
          },
        },
      },
    );
  }

  if (isHrAdmin) {
    tools.push(
      {
        type: "function",
        function: {
          name: "get_payroll_summary",
          description: "Fetch payroll summary data for a date range.",
          parameters: {
            type: "object",
            properties: {
              startDate: { type: "string" },
              endDate: { type: "string" },
            },
            additionalProperties: false,
          },
        },
      },
      {
        type: "function",
        function: {
          name: "get_biometrics_audit",
          description: "Fetch biometric configuration and sync audit status.",
          parameters: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
        },
      },
    );
  }

  return tools;
}

async function executeAssistantTool(
  ctx: ActionCtx,
  currentUser: CurrentUser,
  toolCall: MistralToolCall,
  latestUserMessage: string,
) {
  const toolName = toolCall.function?.name;
  const toolArgs = parseToolArguments(toolCall.function?.arguments);
  const currentYear = new Date().getFullYear();
  const today = new Date().toISOString().slice(0, 10);
  const nextThirtyDays = addDays(today, 30);
  const canSeeManagerData = currentUser.roles.includes("manager") || currentUser.roles.includes("hr_admin");
  const isHrAdmin = currentUser.roles.includes("hr_admin");

  switch (toolName) {
    case "get_leave_balances":
      return JSON.stringify(await ctx.runQuery(api.leave.getMyBalances, { year: currentYear }), null, 2);
    case "get_leave_history":
      return JSON.stringify((await ctx.runQuery(api.leave.getLeaveHistory, {})).slice(0, getToolLimit(toolCall.function?.arguments)), null, 2);
    case "get_upcoming_holidays":
      return JSON.stringify((await ctx.runQuery(api.admin.getHolidays, { year: currentYear })).slice(0, getToolLimit(toolCall.function?.arguments)), null, 2);
    case "get_smart_leave_suggestions": {
      const holidays = await ctx.runQuery(api.admin.getHolidays, { year: currentYear });
      return JSON.stringify(buildSmartSuggestions(holidays), null, 2);
    }
    case "search_policy": {
      const query = typeof toolArgs.query === "string" && toolArgs.query.trim().length > 0 ? toolArgs.query : latestUserMessage;
      return JSON.stringify(await ctx.runAction(api.rag.searchPolicy, { query }), null, 2);
    }
    case "get_my_burnout_check":
      return JSON.stringify(await ctx.runQuery(api.insights.detectBurnout, {}), null, 2);
    case "get_pending_approvals":
      if (!canSeeManagerData) {
        return JSON.stringify({ error: "Pending approvals are only available to managers and HR admins." }, null, 2);
      }
      return JSON.stringify((await ctx.runQuery(api.leave.getPendingApprovals, {})).slice(0, getToolLimit(toolCall.function?.arguments)), null, 2);
    case "get_team_calendar":
      if (!canSeeManagerData) {
        return JSON.stringify({ error: "Team calendar is only available to managers and HR admins." }, null, 2);
      }
      return JSON.stringify(
        (
          await ctx.runQuery(api.leave.getTeamCalendar, {
            ...getResolvedRange(toolCall.function?.arguments, latestUserMessage),
          })
        ).slice(0, getToolLimit(toolCall.function?.arguments)),
        null,
        2,
      );
    case "get_burnout_overview":
      if (!canSeeManagerData) {
        return JSON.stringify({ error: "Burnout overview is only available to managers and HR admins." }, null, 2);
      }
      return JSON.stringify(await ctx.runQuery(api.insights.getBurnoutSummary, {}), null, 2);
    case "check_coverage_conflicts":
      if (!canSeeManagerData) {
        return JSON.stringify({ error: "Coverage conflicts are only available to managers and HR admins." }, null, 2);
      }
      return JSON.stringify(
        await ctx.runQuery(api.insights.checkCoverageConflict, {
          ...getResolvedRange(toolCall.function?.arguments, latestUserMessage, 14),
        }),
        null,
        2,
      );
    case "get_payroll_summary":
      if (!isHrAdmin) {
        return JSON.stringify({ error: "Payroll summaries are only available to HR admins." }, null, 2);
      }
      return JSON.stringify(
        await ctx.runQuery(api.payroll.getPayrollSummary, {
          ...getResolvedRange(toolCall.function?.arguments, latestUserMessage),
        }),
        null,
        2,
      );
    case "get_biometrics_audit":
      if (!isHrAdmin) {
        return JSON.stringify({ error: "Biometric audit summaries are only available to HR admins." }, null, 2);
      }
      return JSON.stringify(await ctx.runQuery(api.admin.getBiometricsConfigs, {}), null, 2);
    default:
      return JSON.stringify({ error: `Unsupported tool: ${toolName ?? "unknown"}` }, null, 2);
  }
}

async function maybeGenerateAiReply(
  ctx: ActionCtx,
  messages: ChatMessage[],
  currentUser: CurrentUser,
) {
  const mistralApiKey = getMistralApiKey();
  if (!mistralApiKey) {
    return null;
  }

  const canSeeManagerData = currentUser.roles.includes("manager") || currentUser.roles.includes("hr_admin");
  const isHrAdmin = currentUser.roles.includes("hr_admin");
  const latestUserMessage = messages.filter((message) => message.role === "user").at(-1)?.content ?? "";
  const systemMessage: MistralMessage = {
    role: "system",
    content: `${BASE_SYSTEM_PROMPT}

Role: ${getRoleLabel(currentUser)}
Use tools for live data instead of answering from memory.
Always use search_policy for questions about handbook, policy, remote work, or rules.
Use get_payroll_summary only for HR admins.
Use get_pending_approvals, get_team_calendar, get_burnout_overview, and check_coverage_conflicts only for manager or HR scopes.
If the user asks to submit, apply, approve, or reject directly, redirect them to the BALANCE workflow screens.`,
  };

  const mistralMessages: MistralMessage[] = [
    systemMessage,
    ...messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  ];

  const tools = buildAssistantTools(canSeeManagerData, isHrAdmin);

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    let response: Response;
    try {
      response = await fetchWithTimeout(MISTRAL_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mistralApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MISTRAL_CHAT_MODEL,
          temperature: 0.2,
          messages: mistralMessages,
          tools,
        }),
      });
    } catch (error) {
      console.error("Assistant Mistral transport failed", error);
      return null;
    }

    if (!response.ok) {
      console.error("Assistant Mistral request failed", await response.text());
      return null;
    }

    let payload: MistralResponse;
    try {
      payload = await response.json() as MistralResponse;
    } catch (error) {
      console.error("Assistant Mistral response parsing failed", error);
      return null;
    }

    const assistantMessage = payload.choices?.[0]?.message;
    if (!assistantMessage) {
      return null;
    }

    const toolCalls = assistantMessage.tool_calls ?? [];
    const textReply = extractModelText(assistantMessage.content);

    mistralMessages.push({
      role: "assistant",
      content: textReply ?? "",
      tool_calls: toolCalls,
    });

    if (toolCalls.length === 0) {
      return textReply;
    }

    for (const toolCall of toolCalls) {
      if (!toolCall.id) {
        continue;
      }
      mistralMessages.push({
        role: "tool",
        name: toolCall.function?.name,
        tool_call_id: toolCall.id,
        content: await executeAssistantTool(ctx, currentUser, toolCall, latestUserMessage),
      });
    }
  }

  return null;
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

async function resolveIntent(ctx: ActionCtx, latestMessage: string, currentUser: CurrentUser): Promise<ResolvedIntent> {
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
    const aiReply = await maybeGenerateAiReply(ctx, args.messages, {
      fullName: currentUser.fullName,
      roles: currentUser.roles,
    });
    const fallbackReply = buildDeterministicReply(resolved);

    return {
      intent: resolved.intent,
      message: aiReply ?? fallbackReply,
      source: aiReply ? "mistral" : "deterministic",
    };
  },
});
