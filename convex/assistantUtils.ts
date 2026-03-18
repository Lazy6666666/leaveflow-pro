import type { AssistantIntent, CurrentUser, HolidayItem } from "./assistantTypes";

export const BASE_SYSTEM_PROMPT = `You are the BALANCE AI Copilot.

Rules:
- Be helpful, direct, and natural in conversation.
- Use tools whenever current BALANCE data, policy knowledge, payroll, attendance, or staffing context is needed.
- Do not invent company-specific facts. If tools return no data or access is denied, say so plainly.
- If the user asks to submit, apply, approve, or reject directly, explain the next step and redirect them to the BALANCE workflow screens.
- When payroll data is shown, preserve markdown table formatting.
- When policy search returns snippets, quote only short snippets and avoid inventing policy text.`;

export const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";
export const MISTRAL_CHAT_MODEL = "mistral-small-latest";
export const MAX_TOOL_ROUNDS = 4;
export const MISTRAL_TIMEOUT_MS = 15_000;

const longDateFormatter = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" });
const shortDateFormatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });

export function addDays(date: string, days: number) {
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

export function formatShortDate(date: string) {
  return shortDateFormatter.format(new Date(`${date}T00:00:00`));
}

export function formatAmount(value: number | null) {
  return value === null ? "N/A" : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function getRoleLabel(currentUser: CurrentUser) {
  if (currentUser.roles.includes("hr_admin")) return "HR Admin";
  if (currentUser.roles.includes("manager")) return "Manager";
  return "Employee";
}

export function buildSmartSuggestions(holidays: HolidayItem[]) {
  return holidays.slice(0, 6).flatMap((holiday) => {
    const weekday = new Date(`${holiday.date}T00:00:00`).getDay();
    if (weekday === 2) {
      return [{
        holiday: holiday.name,
        holidayDate: formatDay(holiday.date),
        leaveDaysToTake: [formatShortDate(addDays(holiday.date, -1))],
        totalDaysOff: 4,
        leaveDaysUsed: 1,
        period: `${formatShortDate(addDays(holiday.date, -1))} to ${formatShortDate(addDays(holiday.date, 2))}`,
      }];
    }
    if (weekday === 4) {
      return [{
        holiday: holiday.name,
        holidayDate: formatDay(holiday.date),
        leaveDaysToTake: [formatShortDate(addDays(holiday.date, 1))],
        totalDaysOff: 4,
        leaveDaysUsed: 1,
        period: `${formatShortDate(holiday.date)} to ${formatShortDate(addDays(holiday.date, 3))}`,
      }];
    }
    return [];
  });
}

function hasWorkflowIntent(input: string) {
  return /\b(apply|submit|approve|reject|cancel|withdraw|book|request)\b/.test(input.toLowerCase());
}

export function detectIntent(input: string): AssistantIntent {
  const normalized = input.toLowerCase();
  if (hasWorkflowIntent(normalized)) return "workflow";
  if (/\b(payroll|salary|payslip|gross pay|hourly rate|base salary)\b/.test(normalized)) return "payroll";
  if (/\b(policy|handbook|remote work|rule|rules|notice period|leave policy)\b/.test(normalized)) return "policy";
  if (/\b(burnout|overwork|overworked|fatigue|workload|longest streak)\b/.test(normalized)) return "burnout";
  if (/\b(coverage|conflict|overlap|staffing gap|short staffed)\b/.test(normalized)) return "coverage";
  if (/\b(biometric|biometrics|attendance audit|clock audit|device sync)\b/.test(normalized)) return "biometrics";
  if (/\b(balance|balances|remaining leave|leave left)\b/.test(normalized)) return "balance";
  if (/\b(holiday|holidays|public holiday)\b/.test(normalized)) return "holiday";
  if (/\b(history|past leave|recent leave|requests)\b/.test(normalized)) return "history";
  if (/\b(pending approval|approvals|approve queue)\b/.test(normalized)) return "pending";
  if (/\b(team calendar|team leave|who is out|who's out|anyone off)\b/.test(normalized)) return "team";
  if (/\b(suggestion|bridge day|long weekend|smart leave)\b/.test(normalized)) return "suggest";
  return "unknown";
}

export function extractDateRange(input: string) {
  const normalized = input.toLowerCase();
  const today = new Date().toISOString().slice(0, 10);
  if (/\bthis month\b/.test(normalized)) {
    return { startDate: startOfMonth(today), endDate: endOfMonth(today) };
  }
  if (/\bnext 2 weeks\b|\bnext two weeks\b/.test(normalized)) {
    return { startDate: today, endDate: addDays(today, 14) };
  }
  if (/\bnext month\b/.test(normalized)) {
    const firstNextMonth = addDays(endOfMonth(today), 1);
    return { startDate: firstNextMonth, endDate: endOfMonth(firstNextMonth) };
  }
  return { startDate: today, endDate: addDays(today, 30) };
}

export function shouldUseTeamBurnoutSummary(input: string, currentUser: CurrentUser) {
  if (!currentUser.roles.includes("manager") && !currentUser.roles.includes("hr_admin")) return false;
  return /\b(anyone|who|team|staff)\b/.test(input.toLowerCase());
}

export function extractModelText(content: unknown) {
  if (typeof content === "string") {
    const trimmed = content.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (!Array.isArray(content)) return null;
  const text = content
    .map((part) => {
      if (typeof part === "string") return part;
      if (part && typeof part === "object" && "text" in part && typeof part.text === "string") return part.text;
      return "";
    })
    .join("\n")
    .trim();
  return text.length > 0 ? text : null;
}

export async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs = MISTRAL_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export function parseToolArguments(argumentsText: string | undefined) {
  if (!argumentsText) return {};
  try {
    const parsed = JSON.parse(argumentsText);
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function getToolLimit(argumentsText: string | undefined, fallback = 5, max = 10) {
  const limit = parseToolArguments(argumentsText).limit;
  if (typeof limit !== "number" || !Number.isFinite(limit)) return fallback;
  return Math.max(1, Math.min(max, Math.floor(limit)));
}

export function getResolvedRange(argumentsText: string | undefined, fallbackInput: string, defaultEndOffsetDays = 30) {
  const parsed = parseToolArguments(argumentsText);
  const fallback = extractDateRange(fallbackInput);
  const today = new Date().toISOString().slice(0, 10);
  const startDate = typeof parsed.startDate === "string" ? parsed.startDate : fallback.startDate ?? today;
  const endDate = typeof parsed.endDate === "string" ? parsed.endDate : fallback.endDate ?? addDays(today, defaultEndOffsetDays);
  return { startDate, endDate };
}
