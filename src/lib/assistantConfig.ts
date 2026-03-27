export type AssistantToolDefinition = {
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

export const BASE_SYSTEM_PROMPT = `You are the BALANCE AI Copilot.

Rules:
- Be helpful, direct, and natural in conversation.
- Use tools whenever current BALANCE data, policy knowledge, payroll, attendance, or staffing context is needed.
- Do not invent company-specific facts. If tools return no data or access is denied, say so plainly.
- If the user asks to submit, apply, approve, or reject directly, explain the next step and redirect them to the BALANCE workflow screens.
- When payroll data is shown, preserve markdown table formatting.
- When policy search returns snippets, quote only short snippets and avoid inventing policy text.`;

export const MAX_ASSISTANT_TOOL_ROUNDS = 4;

function getRoleLabel(roles: string[]) {
  if (roles.includes("convex_dev")) return "Developer";
  if (roles.includes("hr_admin")) return "HR Admin";
  if (roles.includes("manager")) return "Manager";
  return "Employee";
}

export function buildAssistantSystemPrompt(roles: string[]) {
  return `${BASE_SYSTEM_PROMPT}

Role: ${getRoleLabel(roles)}
Use tools for live data instead of answering from memory.
Always use search_policy for questions about handbook, policy, remote work, or rules.
Use get_payroll_summary only for HR admins.
Use get_attendance_anomalies for questions about suspicious clock patterns, missing punches, or repeated late arrivals.
Use get_biometrics_sync_failures for questions about device sync issues or biometric errors.
Use get_payroll_delta_explanation for questions about payroll changes between periods.
Use get_staffing_recommendation for questions about staffing risk, burnout, or coverage gaps.
Use get_pending_approvals, get_team_calendar, get_burnout_overview, and check_coverage_conflicts only for manager or HR scopes.
If the user asks to submit, apply, approve, or reject directly, redirect them to the BALANCE workflow screens.`;
}

export function buildAssistantTools(roles: string[]): AssistantToolDefinition[] {
  const isDeveloper = roles.includes("convex_dev");
  const canSeeManagerData = roles.includes("manager") || roles.includes("hr_admin") || isDeveloper;
  const isHrAdmin = roles.includes("hr_admin") || isDeveloper;
  const tools: AssistantToolDefinition[] = [
    { type: "function", function: { name: "get_leave_balances", description: "Fetch the current employee leave balances and allocations.", parameters: { type: "object", properties: {}, additionalProperties: false } } },
    { type: "function", function: { name: "get_leave_history", description: "Fetch recent leave requests and statuses for the current user.", parameters: { type: "object", properties: { limit: { type: "integer", minimum: 1, maximum: 10 } }, additionalProperties: false } } },
    { type: "function", function: { name: "get_upcoming_holidays", description: "Fetch configured upcoming public holidays.", parameters: { type: "object", properties: { limit: { type: "integer", minimum: 1, maximum: 10 } }, additionalProperties: false } } },
    { type: "function", function: { name: "get_smart_leave_suggestions", description: "Fetch smart leave suggestions based on holiday bridging opportunities.", parameters: { type: "object", properties: {}, additionalProperties: false } } },
    { type: "function", function: { name: "search_policy", description: "Search indexed HR policy documents for relevant snippets.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"], additionalProperties: false } } },
    { type: "function", function: { name: "get_my_burnout_check", description: "Check burnout signals for the current user.", parameters: { type: "object", properties: {}, additionalProperties: false } } },
  ];

  if (canSeeManagerData) {
    tools.push(
      { type: "function", function: { name: "get_pending_approvals", description: "Fetch pending approvals requiring manager or HR action.", parameters: { type: "object", properties: { limit: { type: "integer", minimum: 1, maximum: 10 } }, additionalProperties: false } } },
      { type: "function", function: { name: "get_team_calendar", description: "Fetch approved team leave for a date range.", parameters: { type: "object", properties: { startDate: { type: "string" }, endDate: { type: "string" }, limit: { type: "integer", minimum: 1, maximum: 10 } }, additionalProperties: false } } },
      { type: "function", function: { name: "get_burnout_overview", description: "Fetch burnout risk overview across the manager or HR-visible scope.", parameters: { type: "object", properties: {}, additionalProperties: false } } },
      { type: "function", function: { name: "check_coverage_conflicts", description: "Check for leave coverage conflicts in a date range.", parameters: { type: "object", properties: { startDate: { type: "string" }, endDate: { type: "string" } }, additionalProperties: false } } },
      { type: "function", function: { name: "get_staffing_recommendation", description: "Cross-reference burnout signals, leave coverage, and attendance to recommend staffing actions.", parameters: { type: "object", properties: { startDate: { type: "string" }, endDate: { type: "string" } }, additionalProperties: false } } },
    );
  }

  if (isHrAdmin) {
    tools.push(
      { type: "function", function: { name: "get_payroll_summary", description: "Fetch payroll summary data for a date range.", parameters: { type: "object", properties: { startDate: { type: "string" }, endDate: { type: "string" } }, additionalProperties: false } } },
      { type: "function", function: { name: "get_biometrics_audit", description: "Fetch biometric configuration and sync audit status.", parameters: { type: "object", properties: {}, additionalProperties: false } } },
      { type: "function", function: { name: "get_attendance_anomalies", description: "Detect suspicious attendance patterns: missing clock-outs, very short shifts, repeated late arrivals.", parameters: { type: "object", properties: {}, additionalProperties: false } } },
      { type: "function", function: { name: "get_biometrics_sync_failures", description: "List biometric device configs with recent sync failures.", parameters: { type: "object", properties: {}, additionalProperties: false } } },
      { type: "function", function: { name: "get_payroll_delta_explanation", description: "Compare current and previous payroll period totals and explain changes.", parameters: { type: "object", properties: { startDate: { type: "string" }, endDate: { type: "string" } }, additionalProperties: false } } },
    );
  }

  return tools;
}
