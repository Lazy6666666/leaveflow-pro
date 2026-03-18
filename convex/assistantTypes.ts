export type BalanceSummary = {
  balance: number;
  leave_types?: {
    name?: string | null;
    annual_allocation?: number | null;
  } | null;
};

export type LeaveHistoryItem = {
  start_date: string;
  end_date: string;
  status: string;
  leave_types?: {
    name?: string | null;
  } | null;
};

export type HolidayItem = {
  name: string;
  date: string;
};

export type PendingApprovalItem = {
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

export type TeamCalendarItem = {
  start_date: string;
  end_date: string;
  profiles?: {
    full_name?: string | null;
  } | null;
  leave_types?: {
    name?: string | null;
  } | null;
};

export type BurnoutSummary = {
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

export type BurnoutDetail = {
  employeeName: string;
  riskLevel: "low" | "moderate" | "high";
  totalHours: number;
  daysOff: number;
  longestWorkStreak: number;
  flags: string[];
  startDate: string;
  endDate: string;
};

export type PayrollSummary = {
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

export type CoverageSummary = {
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

export type PolicySearchResult = {
  source: "vector" | "lexical";
  matches: Array<{
    title: string;
    score?: number;
    snippet: string;
  }>;
};

export type BiometricsAudit = Array<{
  name: string;
  vendor: string;
  is_active: boolean;
  last_sync_status?: string | null;
  last_sync_at?: string | null;
  sync_frequency_minutes: number;
}>;

export type CurrentUser = {
  fullName: string | null;
  roles: string[];
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type MistralToolCall = {
  id?: string;
  function?: {
    name?: string;
    arguments?: string;
  } | null;
};

export type MistralMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | Array<{ type?: string; text?: string }> | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: MistralToolCall[];
};

export type MistralToolDefinition = {
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

export type MistralResponse = {
  choices?: Array<{
    message?: MistralMessage | null;
  }>;
};

export type AssistantIntent =
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

export type ResolvedIntent =
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
