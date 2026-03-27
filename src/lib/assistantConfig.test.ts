import { describe, expect, it } from "vitest";

import { buildAssistantSystemPrompt, buildAssistantTools } from "./assistantConfig";

function getToolNames(roles: string[]) {
  return buildAssistantTools(roles).map((tool) => tool.function.name);
}

describe("assistant config", () => {
  it("keeps employee tools limited to self-service and policy flows", () => {
    const names = getToolNames([]);

    expect(names).toContain("search_policy");
    expect(names).toContain("get_leave_balances");
    expect(names).not.toContain("get_pending_approvals");
    expect(names).not.toContain("get_attendance_anomalies");
    expect(names).not.toContain("get_payroll_summary");
  });

  it("exposes manager staffing tools without HR-only payroll tools", () => {
    const names = getToolNames(["manager"]);

    expect(names).toContain("get_pending_approvals");
    expect(names).toContain("get_staffing_recommendation");
    expect(names).not.toContain("get_payroll_summary");
    expect(names).not.toContain("get_attendance_anomalies");
  });

  it("exposes the full HR attendance copilot backend toolset", () => {
    const names = getToolNames(["hr_admin"]);

    expect(names).toEqual(expect.arrayContaining([
      "search_policy",
      "get_payroll_summary",
      "get_attendance_anomalies",
      "get_biometrics_sync_failures",
      "get_payroll_delta_explanation",
      "get_staffing_recommendation",
    ]));
  });

  it("states the current role in the system prompt", () => {
    expect(buildAssistantSystemPrompt(["convex_dev"])).toContain("Role: Developer");
    expect(buildAssistantSystemPrompt(["hr_admin"])).toContain("Role: HR Admin");
    expect(buildAssistantSystemPrompt(["manager"])).toContain("Role: Manager");
    expect(buildAssistantSystemPrompt([])).toContain("Role: Employee");
  });
});
