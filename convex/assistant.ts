"use node";

import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { getAiGatewayApiKey } from "./lib/env";

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

type AssistantData = {
  balances: BalanceSummary[];
  history: LeaveHistoryItem[];
  holidays: HolidayItem[];
  pendingApprovals: PendingApprovalItem[];
  teamCalendar: TeamCalendarItem[];
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const SYSTEM_PROMPT = `You are the BALANCE leave assistant.

You help employees and managers with:
- leave balances
- holidays
- leave history
- pending approvals
- team leave visibility
- smart leave suggestions

Rules:
- be concise
- answer using the provided context only
- if the user asks to submit or approve leave directly, explain that they should use the BALANCE workflow screens
- use markdown lists when useful
- if data is missing, say so plainly`;

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

function addDays(date: string, days: number) {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

function formatDay(date: string) {
  return longDateFormatter.format(new Date(`${date}T00:00:00`));
}

function formatShortDate(date: string) {
  return shortDateFormatter.format(new Date(`${date}T00:00:00`));
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
    .sort((a, b) => b.totalDaysOff - a.totalDaysOff || a.leaveDaysUsed - b.leaveDaysUsed)
    .slice(0, 5);
}

function buildDeterministicReply(input: string, data: AssistantData) {
  const normalized = input.toLowerCase();

  if (normalized.includes("submit") || normalized.includes("apply") || normalized.includes("approve")) {
    return "Use the BALANCE request or approvals screens for that action. I can help you review balances, holidays, requests, approvals, and team leave.";
  }

  if (normalized.includes("balance")) {
    if (data.balances.length === 0) {
      return "No leave balances are allocated yet. Ask HR to initialize your leave balances.";
    }

    const lines = data.balances.map((balance) => {
      const total = balance.leave_types?.annual_allocation ?? 0;
      return `- ${balance.leave_types?.name ?? "Leave"}: ${balance.balance} remaining out of ${total}`;
    });
    return `Here is your current leave balance:\n\n${lines.join("\n")}`;
  }

  if (normalized.includes("holiday")) {
    if (data.holidays.length === 0) {
      return "There are no upcoming holidays configured for this year.";
    }

    const lines = data.holidays
      .slice(0, 5)
      .map((holiday) => `- ${holiday.name}: ${formatShortDate(holiday.date)}`);
    return `Upcoming holidays:\n\n${lines.join("\n")}`;
  }

  if (normalized.includes("request") || normalized.includes("history")) {
    if (data.history.length === 0) {
      return "You do not have any leave requests yet.";
    }

    const lines = data.history.slice(0, 5).map((request) =>
      `- ${request.leave_types?.name ?? "Leave"}: ${formatShortDate(request.start_date)} to ${formatShortDate(request.end_date)} (${request.status})`,
    );
    return `Your most recent leave requests:\n\n${lines.join("\n")}`;
  }

  if (normalized.includes("pending") || normalized.includes("approval")) {
    if (data.pendingApprovals.length === 0) {
      return "There are no pending approvals right now.";
    }

    const lines = data.pendingApprovals.slice(0, 5).map((request) => {
      const employee = request.profiles?.full_name || request.profiles?.email || "Employee";
      return `- ${employee}: ${request.leave_types?.name ?? "Leave"} from ${formatShortDate(request.start_date)} to ${formatShortDate(request.end_date)}`;
    });
    return `Pending approvals:\n\n${lines.join("\n")}`;
  }

  if (normalized.includes("team calendar") || normalized.includes("team leave")) {
    if (data.teamCalendar.length === 0) {
      return "No approved team leave is scheduled in the next 30 days.";
    }

    const lines = data.teamCalendar.slice(0, 5).map((leave) =>
      `- ${leave.profiles?.full_name ?? "Employee"}: ${leave.leave_types?.name ?? "Leave"} from ${formatShortDate(leave.start_date)} to ${formatShortDate(leave.end_date)}`,
    );
    return `Upcoming team leave:\n\n${lines.join("\n")}`;
  }

  if (normalized.includes("suggest")) {
    const suggestions = buildSmartSuggestions(data.holidays);
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

  return "I can help with leave balances, upcoming holidays, recent requests, pending approvals, team leave, and smart leave suggestions.";
}

function buildContextSummary(data: AssistantData) {
  return JSON.stringify(
    {
      balances: data.balances.slice(0, 10),
      history: data.history.slice(0, 10),
      holidays: data.holidays.slice(0, 10),
      pendingApprovals: data.pendingApprovals.slice(0, 10),
      teamCalendar: data.teamCalendar.slice(0, 10),
    },
    null,
    2,
  );
}

async function maybeGenerateAiReply(messages: ChatMessage[], data: AssistantData) {
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
        {
          role: "system",
          content: `${SYSTEM_PROMPT}\n\nContext:\n${buildContextSummary(data)}`,
        },
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

    const currentYear = new Date().getFullYear();
    const today = new Date().toISOString().slice(0, 10);
    const nextThirtyDays = addDays(today, 30);
    const canSeeManagerData = currentUser.roles.includes("manager") || currentUser.roles.includes("hr_admin");

    const [balances, history, holidays, pendingApprovals, teamCalendar] = await Promise.all([
      ctx.runQuery(api.leave.getMyBalances, { year: currentYear }),
      ctx.runQuery(api.leave.getLeaveHistory, {}),
      ctx.runQuery(api.admin.getHolidays, { year: currentYear }),
      canSeeManagerData ? ctx.runQuery(api.leave.getPendingApprovals, {}) : Promise.resolve([]),
      canSeeManagerData
        ? ctx.runQuery(api.leave.getTeamCalendar, { startDate: today, endDate: nextThirtyDays })
        : Promise.resolve([]),
    ]);

    const data: AssistantData = {
      balances: balances ?? [],
      history: history ?? [],
      holidays: holidays ?? [],
      pendingApprovals: pendingApprovals ?? [],
      teamCalendar: teamCalendar ?? [],
    };

    const aiReply = await maybeGenerateAiReply(args.messages, data);
    const fallbackReply = buildDeterministicReply(args.messages.at(-1)?.content ?? "", data);

    return {
      message: aiReply ?? fallbackReply,
      source: aiReply ? "gateway" : "deterministic",
    };
  },
});
