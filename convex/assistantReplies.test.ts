import { describe, expect, it } from "vitest";

import { buildDeterministicReply, shouldUseStructuredFallback } from "./assistantReplies";
import type { ResolvedIntent } from "./assistantTypes";

describe("assistant fallback behavior", () => {
  it("keeps structured workflow guidance available during fallback", () => {
    expect(shouldUseStructuredFallback("workflow")).toBe(true);

    const resolved: ResolvedIntent = {
      intent: "workflow",
      payload: null,
    };

    expect(buildDeterministicReply(resolved)).toContain("cannot submit or approve actions directly");
    expect(buildDeterministicReply(resolved)).toContain("BALANCE");
  });

  it("does not use a structured fallback for unknown intent", () => {
    expect(shouldUseStructuredFallback("unknown")).toBe(false);
  });
});
