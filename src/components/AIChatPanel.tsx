import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Send, X, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/lib/convexApi";
import { useAuth } from "@/contexts/AuthContext";

type Msg = { role: "user" | "assistant"; content: string };

type BalanceSummary = NonNullable<FunctionReturnType<typeof api.leave.getMyBalances>>[number];
type LeaveHistoryItem = NonNullable<FunctionReturnType<typeof api.leave.getLeaveHistory>>[number];
type HolidayItem = NonNullable<FunctionReturnType<typeof api.admin.getHolidays>>[number];
type PendingApprovalItem = NonNullable<FunctionReturnType<typeof api.leave.getPendingApprovals>>[number];
type TeamCalendarItem = NonNullable<FunctionReturnType<typeof api.leave.getTeamCalendar>>[number];

type AssistantData = {
  balances: BalanceSummary[];
  history: LeaveHistoryItem[];
  holidays: HolidayItem[];
  pendingApprovals: PendingApprovalItem[];
  teamCalendar: TeamCalendarItem[];
};

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
          if (isOff(previous)) start = previous;
          break;
        }
      }

      for (let i = 1; i <= 4; i += 1) {
        const current = addDays(holiday.date, i);
        if (isOff(current)) {
          end = current;
        } else {
          const next = addDays(current, 1);
          if (isOff(next)) end = next;
          break;
        }
      }

      const leaveDays: string[] = [];
      let cursor = start;
      let totalDays = 0;
      while (cursor <= end) {
        totalDays += 1;
        if (!isOff(cursor)) leaveDays.push(cursor);
        cursor = addDays(cursor, 1);
      }

      return {
        holiday: holiday.name,
        holidayDate: formatDay(holiday.date),
        leaveDaysToTake: leaveDays.map(formatDay),
        totalDaysOff: totalDays,
        leaveDaysUsed: leaveDays.length,
        period: `${formatDay(start)} – ${formatDay(end)}`,
      };
    })
    .filter((item) => item.leaveDaysUsed > 0 && item.leaveDaysUsed <= 4 && item.totalDaysOff > item.leaveDaysUsed + 1)
    .sort((a, b) => b.totalDaysOff - a.totalDaysOff || a.leaveDaysUsed - b.leaveDaysUsed)
    .slice(0, 5);
}

function buildAssistantReply(input: string, data: AssistantData) {
  const normalized = input.toLowerCase();

  if (normalized.includes("balance")) {
    if (data.balances.length === 0) {
      return "No leave balances are allocated yet. Ask HR to initialize your leave balances.";
    }
    const lines = data.balances.map((balance) => {
      const total = balance.leave_types?.annual_allocation ?? 0;
      return `- ${balance.leave_types?.name ?? "Leave"}: ${balance.balance} remaining out of ${total}`;
    });
    return `Here’s your current leave balance:\n\n${lines.join("\n")}`;
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
      return "You don’t have any leave requests yet.";
    }
    const lines = data.history.slice(0, 5).map((request) => {
      return `- ${request.leave_types?.name ?? "Leave"}: ${formatShortDate(request.start_date)} to ${formatShortDate(request.end_date)} (${request.status})`;
    });
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
    const lines = data.teamCalendar.slice(0, 5).map((leave) => {
      return `- ${leave.profiles?.full_name ?? "Employee"}: ${leave.leave_types?.name ?? "Leave"} from ${formatShortDate(leave.start_date)} to ${formatShortDate(leave.end_date)}`;
    });
    return `Upcoming team leave:\n\n${lines.join("\n")}`;
  }

  if (normalized.includes("suggest")) {
    const suggestions = buildSmartSuggestions(data.holidays);
    if (suggestions.length === 0) {
      return "I couldn’t find any strong bridge-day suggestions in the current holiday window.";
    }
    const lines = suggestions.map((suggestion) => {
      return [
        `- ${suggestion.holiday} (${suggestion.holidayDate})`,
        `  - Take off: ${suggestion.leaveDaysToTake.join(", ")}`,
        `  - Total days off: ${suggestion.totalDaysOff}`,
        `  - Leave days used: ${suggestion.leaveDaysUsed}`,
        `  - Period: ${suggestion.period}`,
      ].join("\n");
    });
    return `Smart leave suggestions:\n\n${lines.join("\n\n")}`;
  }

  return "I can help with leave balances, upcoming holidays, recent requests, pending approvals, team leave, and smart leave suggestions.";
}

const AIChatPanel = () => {
  const { hasRole } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelTitleId = "leave-assistant-title";
  const inputId = "leave-assistant-input";
  const currentYear = new Date().getFullYear();
  const today = new Date().toISOString().slice(0, 10);
  const nextThirtyDays = addDays(today, 30);
  const balancesQuery = useQuery(api.leave.getMyBalances, { year: currentYear });
  const historyQuery = useQuery(api.leave.getLeaveHistory, {});
  const holidaysQuery = useQuery(api.admin.getHolidays, { year: currentYear });
  const pendingApprovalsQuery = useQuery(
    api.leave.getPendingApprovals,
    hasRole("manager") || hasRole("hr_admin") ? {} : "skip",
  );
  const teamCalendarQuery = useQuery(
    api.leave.getTeamCalendar,
    hasRole("manager") || hasRole("hr_admin")
      ? { startDate: today, endDate: nextThirtyDays }
      : "skip",
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const QUICK_ACTIONS = [
    { label: "Check balance", message: "What's my leave balance?" },
    { label: "Upcoming holidays", message: "When are the upcoming holidays?" },
    { label: "Recent requests", message: "Show my leave history" },
    { label: "Smart suggestions", message: "Suggest smart leave days" },
    ...(hasRole("manager") || hasRole("hr_admin")
      ? [
          { label: "Pending approvals", message: "Show pending approvals" },
          { label: "Team calendar", message: "Show team leave" },
        ]
      : []),
  ];

  const assistantData = useMemo<AssistantData>(() => {
    return {
      balances: balancesQuery ?? [],
      history: historyQuery ?? [],
      holidays: holidaysQuery ?? [],
      pendingApprovals: pendingApprovalsQuery ?? [],
      teamCalendar: teamCalendarQuery ?? [],
    };
  }, [balancesQuery, historyQuery, holidaysQuery, pendingApprovalsQuery, teamCalendarQuery]);

  const send = async (directText?: string) => {
    const text = (directText ?? input).trim();
    if (!text || isLoading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setIsLoading(true);

    const reply = buildAssistantReply(text, assistantData);
    window.setTimeout(() => {
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setIsLoading(false);
    }, 250);
  };

  return (
    <>
      {!open && (
        <Button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
          size="icon"
          aria-label="Open leave assistant"
          title="Open leave assistant"
        >
          <Bot className="h-6 w-6" />
        </Button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-4rem)] flex flex-col rounded-xl border bg-card shadow-2xl overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span id={panelTitleId} className="font-semibold text-sm">
                Leave Assistant
              </span>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-primary-foreground hover:bg-primary/80"
                  onClick={() => setMessages([])}
                  aria-label="Clear chat"
                  title="Clear chat"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary-foreground hover:bg-primary/80"
                onClick={() => setOpen(false)}
                aria-label="Close leave assistant"
                title="Close leave assistant"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea
            className="flex-1 p-4"
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
            aria-labelledby={panelTitleId}
          >
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-8">
                <Bot className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Hi! I can answer leave questions from Convex.</p>
                <p className="mt-1">Try one of these:</p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {QUICK_ACTIONS.map((action) => (
                    <Button
                      key={action.label}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs rounded-full"
                      onClick={() => send(action.message)}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <div ref={scrollRef} className="space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-3 border-t bg-card">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
              className="flex gap-2"
            >
              <label htmlFor={inputId} className="sr-only">
                Ask the leave assistant a question
              </label>
              <Input
                id={inputId}
                name="leaveAssistantQuery"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                autoComplete="off"
                placeholder="Ask about balances, holidays, or leave history…"
              />
              <Button type="submit" size="icon" disabled={isLoading} aria-label="Send message" title="Send message">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatPanel;
