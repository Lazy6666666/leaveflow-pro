"use node";

import { action as typedAction } from "./_generated/server";
import { api as typedApi, internal as typedInternal } from "./_generated/api";
import { v } from "convex/values";
import { getMistralApiKey } from "./lib/env";
import { buildAssistantSystemPrompt, buildAssistantTools, MAX_ASSISTANT_TOOL_ROUNDS } from "../src/lib/assistantConfig";

import { buildDeterministicReply, shouldUseStructuredFallback } from "./assistantReplies";
import type {
  BalanceSummary,
  BiometricsAudit,
  BurnoutDetail,
  BurnoutSummary,
  ChatMessage,
  CoverageSummary,
  CurrentUser,
  HolidayItem,
  LeaveHistoryItem,
  MistralMessage,
  MistralResponse,
  MistralToolCall,
  MistralToolDefinition,
  PendingApprovalItem,
  PayrollSummary,
  PolicySearchResult,
  ResolvedIntent,
  TeamCalendarItem,
} from "./assistantTypes";
import { addDays, buildSmartSuggestions, detectIntent, extractDateRange, extractModelText, fetchWithTimeout, getResolvedRange, getToolLimit, MISTRAL_API_URL, MISTRAL_CHAT_MODEL, parseToolArguments, shouldUseTeamBurnoutSummary } from "./assistantUtils";

type ConvexBuilder = (config: unknown) => unknown;
type ConvexRunner = <T = unknown>(fn: unknown, args: unknown) => Promise<T>;
type AssistantCtx = {
  runQuery: ConvexRunner;
  runMutation: ConvexRunner;
  runAction: ConvexRunner;
};

type UsersCurrentResult = {
  userId: string;
  fullName: string | null;
  roles: Array<"employee" | "manager" | "hr_admin">;
};

type AdminAttendanceDashboardLog = {
  employee_id: string;
  date: string;
  status: string;
  clock_in: string | null;
  clock_out: string | null;
  profiles: { full_name: string | null } | null;
};

type AdminAttendanceDashboardResult = {
  logs: AdminAttendanceDashboardLog[];
};

type Api = {
  admin: { getHolidays: unknown; getBiometricsConfigs: unknown };
  attendance: { getAdminAttendanceDashboard: unknown };
  insights: { detectBurnout: unknown; getBurnoutSummary: unknown; checkCoverageConflict: unknown };
  leave: { getMyBalances: unknown; getLeaveHistory: unknown; getPendingApprovals: unknown; getTeamCalendar: unknown };
  payroll: { getPayrollSummary: unknown };
  rag: { searchPolicy: unknown };
  users: { current: unknown };
};

type InternalApi = {
  assistantRateLimits: { consume: unknown };
  backendIncidents: { recordIssue: unknown };
};

const action = typedAction as unknown as ConvexBuilder;
const api = typedApi as unknown as Api;
const internal = typedInternal as unknown as InternalApi;

type AiReplyResult =
  | { ok: true; message: string }
  | { ok: false; reason: "missing_api_key" | "transport_error" | "http_error" | "parse_error" | "tool_round_exhausted" | "rate_limited"; retryAfterMs?: number };

type AssistantRateLimitScope = "assistant_chat" | "assistant_tool";

async function consumeAssistantRateLimit(ctx: AssistantCtx, userId: string, scope: AssistantRateLimitScope) {
  const result = await ctx.runMutation<{ ok: boolean; retryAfterMs: number }>(
    internal.assistantRateLimits.consume,
    { userId, scope },
  );
  if (result.ok) {
    return null;
  }

  return result;
}

async function reportAssistantIssue(
  ctx: AssistantCtx,
  source: string,
  message: string,
  details?: Record<string, unknown>,
) {
  try {
    await ctx.runMutation(internal.backendIncidents.recordIssue, {
      source,
      message,
      severity: "error",
      details,
      fingerprint: ["assistant", source],
    });
  } catch {
    // Monitoring must never block assistant fallbacks.
  }
}

function buildRateLimitMessage(retryAfterMs: number | undefined, scope: AssistantRateLimitScope) {
  const seconds = Math.max(1, Math.ceil((retryAfterMs ?? 1000) / 1000));
  const subject = scope === "assistant_tool" ? "assistant tools" : "assistant requests";
  return `Too many ${subject} in a short period. Please wait about ${seconds} seconds and try again.`;
}

async function executeAssistantTool(ctx: AssistantCtx, currentUser: CurrentUser, toolCall: MistralToolCall, latestUserMessage: string) {
  const toolName = toolCall.function?.name;
  const toolArgs = parseToolArguments(toolCall.function?.arguments);
  const currentYear = new Date().getFullYear();
  const canSeeManagerData = currentUser.roles.includes("manager") || currentUser.roles.includes("hr_admin");
  const isHrAdmin = currentUser.roles.includes("hr_admin");

  switch (toolName) {
    case "get_leave_balances":
      return JSON.stringify(await ctx.runQuery(api.leave.getMyBalances, { year: currentYear }) as BalanceSummary[], null, 2);
    case "get_leave_history":
      return JSON.stringify((await ctx.runQuery(api.leave.getLeaveHistory, {}) as LeaveHistoryItem[]).slice(0, getToolLimit(toolCall.function?.arguments)), null, 2);
    case "get_upcoming_holidays":
      return JSON.stringify((await ctx.runQuery(api.admin.getHolidays, { year: currentYear }) as HolidayItem[]).slice(0, getToolLimit(toolCall.function?.arguments)), null, 2);
    case "get_smart_leave_suggestions": {
      const holidays = await ctx.runQuery(api.admin.getHolidays, { year: currentYear }) as HolidayItem[];
      return JSON.stringify(buildSmartSuggestions(holidays), null, 2);
    }
    case "search_policy": {
      const query = typeof toolArgs.query === "string" && toolArgs.query.trim().length > 0 ? toolArgs.query : latestUserMessage;
      return JSON.stringify(await ctx.runAction(api.rag.searchPolicy, { query }) as PolicySearchResult, null, 2);
    }
    case "get_my_burnout_check":
      return JSON.stringify(await ctx.runQuery(api.insights.detectBurnout, {}) as BurnoutDetail, null, 2);
    case "get_pending_approvals":
      return JSON.stringify(canSeeManagerData ? (await ctx.runQuery(api.leave.getPendingApprovals, {}) as PendingApprovalItem[]).slice(0, getToolLimit(toolCall.function?.arguments)) : { error: "Pending approvals are only available to managers and HR admins." }, null, 2);
    case "get_team_calendar":
      return JSON.stringify(
        canSeeManagerData
          ? (await ctx.runQuery(api.leave.getTeamCalendar, { ...getResolvedRange(toolCall.function?.arguments, latestUserMessage) }) as TeamCalendarItem[]).slice(0, getToolLimit(toolCall.function?.arguments))
          : { error: "Team calendar is only available to managers and HR admins." },
        null,
        2,
      );
    case "get_burnout_overview":
      return JSON.stringify(canSeeManagerData ? await ctx.runQuery(api.insights.getBurnoutSummary, {}) as BurnoutSummary : { error: "Burnout overview is only available to managers and HR admins." }, null, 2);
    case "check_coverage_conflicts":
      return JSON.stringify(
        canSeeManagerData
          ? await ctx.runQuery(api.insights.checkCoverageConflict, { ...getResolvedRange(toolCall.function?.arguments, latestUserMessage, 14) }) as CoverageSummary
          : { error: "Coverage conflicts are only available to managers and HR admins." },
        null,
        2,
      );
    case "get_payroll_summary":
      return JSON.stringify(
        isHrAdmin
          ? await ctx.runQuery(api.payroll.getPayrollSummary, { ...getResolvedRange(toolCall.function?.arguments, latestUserMessage) }) as PayrollSummary
          : { error: "Payroll summaries are only available to HR admins." },
        null,
        2,
      );
    case "get_biometrics_audit":
      return JSON.stringify(isHrAdmin ? await ctx.runQuery(api.admin.getBiometricsConfigs, {}) as BiometricsAudit : { error: "Biometric audit summaries are only available to HR admins." }, null, 2);
    case "get_attendance_anomalies": {
      if (!isHrAdmin) return JSON.stringify({ error: "Only available to HR admins." }, null, 2);
      const logs = await ctx.runQuery(api.attendance.getAdminAttendanceDashboard, { view: "month" }) as AdminAttendanceDashboardResult;
      const anomalies = logs.logs
        .filter((l) => {
          if (l.status === "late") return true;
          if (l.clock_in && !l.clock_out) return true;
          if (l.clock_in && l.clock_out) {
            const dur = new Date(l.clock_out).getTime() - new Date(l.clock_in).getTime();
            if (dur < 60 * 60 * 1000) return true;
          }
          return false;
        })
        .slice(0, 20)
        .map((l) => ({ name: l.profiles?.full_name ?? l.employee_id, date: l.date, status: l.status, hasClockOut: !!l.clock_out }));
      return JSON.stringify({ anomalies }, null, 2);
    }
    case "get_biometrics_sync_failures": {
      if (!isHrAdmin) return JSON.stringify({ error: "Only available to HR admins." }, null, 2);
      const configs = await ctx.runQuery(api.admin.getBiometricsConfigs, {}) as BiometricsAudit;
      const failures = configs.filter((c) => c.last_sync_status && c.last_sync_status !== "ok");
      return JSON.stringify({ failures }, null, 2);
    }
    case "get_payroll_delta_explanation": {
      if (!isHrAdmin) return JSON.stringify({ error: "Only available to HR admins." }, null, 2);
      const range = getResolvedRange(toolCall.function?.arguments, latestUserMessage);
      const current = await ctx.runQuery(api.payroll.getPayrollSummary, range) as PayrollSummary;
      const prevStart = new Date(range.startDate);
      prevStart.setMonth(prevStart.getMonth() - 1);
      const prevEnd = new Date(range.endDate);
      prevEnd.setMonth(prevEnd.getMonth() - 1);
      const prev = await ctx.runQuery(api.payroll.getPayrollSummary, {
        startDate: prevStart.toISOString().slice(0, 10),
        endDate: prevEnd.toISOString().slice(0, 10),
      }) as PayrollSummary;
      return JSON.stringify({
        current: { period: `${range.startDate} to ${range.endDate}`, grossPay: current.totals.grossPay, employees: current.employees.length },
        previous: { period: `${prevStart.toISOString().slice(0, 10)} to ${prevEnd.toISOString().slice(0, 10)}`, grossPay: prev.totals.grossPay, employees: prev.employees.length },
        delta: { grossPay: Number((current.totals.grossPay - prev.totals.grossPay).toFixed(2)), employees: current.employees.length - prev.employees.length },
      }, null, 2);
    }
    case "get_staffing_recommendation": {
      if (!canSeeManagerData) return JSON.stringify({ error: "Only available to managers and HR admins." }, null, 2);
      const [burnout, coverage] = await Promise.all([
        ctx.runQuery(api.insights.getBurnoutSummary, {}) as Promise<BurnoutSummary>,
        ctx.runQuery(api.insights.checkCoverageConflict, { ...getResolvedRange(toolCall.function?.arguments, latestUserMessage, 14) }) as Promise<CoverageSummary>,
      ]);
      return JSON.stringify({ burnout, coverage }, null, 2);
    }
    default:
      return JSON.stringify({ error: `Unsupported tool: ${toolName ?? "unknown"}` }, null, 2);
  }
}

async function maybeGenerateAiReply(ctx: AssistantCtx, messages: ChatMessage[], currentUser: CurrentUser) {
  const mistralApiKey = getMistralApiKey();
  if (!mistralApiKey) return { ok: false, reason: "missing_api_key" } as const;

  const latestUserMessage = messages.filter((message) => message.role === "user").at(-1)?.content ?? "";
  const systemMessage: MistralMessage = { role: "system", content: buildAssistantSystemPrompt(currentUser.roles) };

  const mistralMessages: MistralMessage[] = [systemMessage, ...messages.map((message) => ({ role: message.role, content: message.content }))];
  const tools = buildAssistantTools(currentUser.roles) as MistralToolDefinition[];

  for (let round = 0; round < MAX_ASSISTANT_TOOL_ROUNDS; round += 1) {
    let response: Response;
    try {
      response = await fetchWithTimeout(MISTRAL_API_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${mistralApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: MISTRAL_CHAT_MODEL, temperature: 0.2, messages: mistralMessages, tools }),
      });
    } catch (error) {
      console.error("Assistant Mistral transport failed", error);
      await reportAssistantIssue(ctx, "assistant.mistral.transport", "Assistant Mistral transport failed.", {
        error: error instanceof Error ? error.message : String(error),
      });
      return { ok: false, reason: "transport_error" } as const;
    }

    if (!response.ok) {
      console.error("Assistant Mistral request failed", await response.text());
      await reportAssistantIssue(ctx, "assistant.mistral.http", "Assistant Mistral request failed.", {
        status: response.status,
      });
      return { ok: false, reason: "http_error" } as const;
    }

    let payload: MistralResponse;
    try {
      payload = await response.json() as MistralResponse;
    } catch (error) {
      console.error("Assistant Mistral response parsing failed", error);
      await reportAssistantIssue(ctx, "assistant.mistral.parse", "Assistant Mistral response parsing failed.", {
        error: error instanceof Error ? error.message : String(error),
      });
      return { ok: false, reason: "parse_error" } as const;
    }

    const assistantMessage = payload.choices?.[0]?.message;
    if (!assistantMessage) return { ok: false, reason: "parse_error" } as const;

    const toolCalls = assistantMessage.tool_calls ?? [];
    const textReply = extractModelText(assistantMessage.content);
    mistralMessages.push({ role: "assistant", content: textReply ?? "", tool_calls: toolCalls });

    if (toolCalls.length === 0) {
      return textReply
        ? ({ ok: true, message: textReply } as const)
        : ({ ok: false, reason: "parse_error" } as const);
    }

    for (const toolCall of toolCalls) {
      if (!toolCall.id) continue;
      mistralMessages.push({
        role: "tool",
        name: toolCall.function?.name,
        tool_call_id: toolCall.id,
        content: await executeAssistantTool(ctx, currentUser, toolCall, latestUserMessage),
      });
    }
  }

  return { ok: false, reason: "tool_round_exhausted" } as const;
}

async function resolveIntent(ctx: AssistantCtx, latestMessage: string, currentUser: CurrentUser, intent = detectIntent(latestMessage)): Promise<ResolvedIntent> {
  const currentYear = new Date().getFullYear();
  const today = new Date().toISOString().slice(0, 10);
  const nextThirtyDays = addDays(today, 30);
  const canSeeManagerData = currentUser.roles.includes("manager") || currentUser.roles.includes("hr_admin");
  const isHrAdmin = currentUser.roles.includes("hr_admin");

  switch (intent) {
    case "workflow":
      return { intent, payload: null };
    case "balance":
      return { intent, payload: await ctx.runQuery(api.leave.getMyBalances, { year: currentYear }) as BalanceSummary[] };
    case "holiday":
      return { intent, payload: await ctx.runQuery(api.admin.getHolidays, { year: currentYear }) as HolidayItem[] };
    case "history":
      return { intent, payload: await ctx.runQuery(api.leave.getLeaveHistory, {}) as LeaveHistoryItem[] };
    case "pending":
      return canSeeManagerData ? { intent, payload: await ctx.runQuery(api.leave.getPendingApprovals, {}) as PendingApprovalItem[] } : { intent, payload: { denied: true } };
    case "team":
      return canSeeManagerData ? { intent, payload: await ctx.runQuery(api.leave.getTeamCalendar, { startDate: today, endDate: nextThirtyDays }) as TeamCalendarItem[] } : { intent, payload: { denied: true } };
    case "suggest":
      return { intent, payload: await ctx.runQuery(api.admin.getHolidays, { year: currentYear }) as HolidayItem[] };
    case "payroll": {
      if (!isHrAdmin) return { intent, payload: { denied: true } };
      const { startDate, endDate } = extractDateRange(latestMessage);
      return { intent, payload: await ctx.runQuery(api.payroll.getPayrollSummary, { startDate, endDate }) as PayrollSummary };
    }
    case "policy":
      return { intent, payload: await ctx.runAction(api.rag.searchPolicy, { query: latestMessage }) as PolicySearchResult };
    case "burnout":
      return {
        intent,
        payload: shouldUseTeamBurnoutSummary(latestMessage, currentUser)
          ? await ctx.runQuery(api.insights.getBurnoutSummary, {}) as BurnoutSummary
          : await ctx.runQuery(api.insights.detectBurnout, {}) as BurnoutDetail,
      };
    case "coverage": {
      if (!canSeeManagerData) return { intent, payload: { denied: true } };
      const { startDate, endDate } = extractDateRange(latestMessage);
      return { intent, payload: await ctx.runQuery(api.insights.checkCoverageConflict, { startDate, endDate }) as CoverageSummary };
    }
    case "biometrics":
      return isHrAdmin ? { intent, payload: await ctx.runQuery(api.admin.getBiometricsConfigs, {}) as BiometricsAudit } : { intent, payload: { denied: true } };
    default:
      return { intent: "unknown", payload: null };
  }
}

export const runTool = action({
  args: {
    name: v.string(),
    argumentsText: v.optional(v.string()),
    latestUserMessage: v.optional(v.string()),
  },
  handler: async (
    ctx: AssistantCtx,
    args: { name: string; argumentsText?: string; latestUserMessage?: string },
  ) => {
    const currentUser = await ctx.runQuery(api.users.current, {}) as UsersCurrentResult | null;
    if (!currentUser) throw new Error("Unauthorized");
    const rateLimit = await consumeAssistantRateLimit(ctx, currentUser.userId, "assistant_tool");
    if (rateLimit) {
      return {
        ok: false,
        reason: "rate_limited" as const,
        message: buildRateLimitMessage(rateLimit.retryAfterMs, "assistant_tool"),
        retryAfterMs: rateLimit.retryAfterMs,
      };
    }

    const viewer: CurrentUser = { fullName: currentUser.fullName, roles: currentUser.roles };
    const content = await executeAssistantTool(
      ctx,
      viewer,
      {
        id: "client-tool-call",
        function: {
          name: args.name,
          arguments: args.argumentsText,
        },
      },
      args.latestUserMessage ?? "",
    );

    return {
      ok: true,
      content,
    };
  },
});

export const chat = action({
  args: {
    messages: v.array(v.object({ role: v.union(v.literal("user"), v.literal("assistant")), content: v.string() })),
  },
  handler: async (
    ctx: AssistantCtx,
    args: { messages: Array<{ role: "user" | "assistant"; content: string }> },
  ) => {
    const currentUser = await ctx.runQuery(api.users.current, {}) as UsersCurrentResult | null;
    if (!currentUser) throw new Error("Unauthorized");
    const rateLimit = await consumeAssistantRateLimit(ctx, currentUser.userId, "assistant_chat");
    if (rateLimit) {
      return {
        intent: detectIntent(args.messages.at(-1)?.content ?? ""),
        message: buildRateLimitMessage(rateLimit.retryAfterMs, "assistant_chat"),
        source: "system",
        sourceReason: "rate_limited",
        retryAfterMs: rateLimit.retryAfterMs,
      };
    }

    const viewer: CurrentUser = { fullName: currentUser.fullName, roles: currentUser.roles };
    const latestMessage = args.messages.at(-1)?.content ?? "";
    const intent = detectIntent(latestMessage);
    const aiReply = await maybeGenerateAiReply(ctx, args.messages, viewer);

    if (aiReply.ok) {
      return {
        intent,
        message: aiReply.message,
        source: "mistral",
        sourceReason: "mistral",
      };
    }

    const resolved = shouldUseStructuredFallback(intent)
      ? await resolveIntent(ctx, latestMessage, viewer, intent)
      : ({ intent, payload: null } as ResolvedIntent);
    const fallbackReply = shouldUseStructuredFallback(intent)
      ? buildDeterministicReply(resolved)
      : "The AI copilot is unavailable right now. Try again in a moment.";

    return {
      intent,
      message: fallbackReply,
      source: "deterministic",
      sourceReason: aiReply.reason,
    };
  },
});
