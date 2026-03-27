import { describe, expect, it } from "vitest";

import { formatApprovalDateRange, getDecisionVerb } from "./managerApprovals";

describe("managerApprovals helpers", () => {
  it("formats a single-day approval range compactly", () => {
    expect(formatApprovalDateRange("2026-03-27", "2026-03-27")).toBe("Fri, Mar 27");
  });

  it("formats a multi-day approval range compactly", () => {
    expect(formatApprovalDateRange("2026-03-27", "2026-03-29")).toBe(
      "Fri, Mar 27 - Sun, Mar 29",
    );
  });

  it("returns decision verbs for action states", () => {
    expect(getDecisionVerb("approved")).toBe("Approve");
    expect(getDecisionVerb("rejected")).toBe("Reject");
  });
});
