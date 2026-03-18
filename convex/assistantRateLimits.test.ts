import { describe, expect, it } from "vitest";

import { ASSISTANT_RATE_LIMITS, applyRateLimitWindow } from "./assistantRateLimits";

describe("assistant rate limit window", () => {
  it("starts a fresh window when no record exists", () => {
    const decision = applyRateLimitWindow(null, ASSISTANT_RATE_LIMITS.assistant_chat, 1_000);

    expect(decision.allowed).toBe(true);
    expect(decision.nextCount).toBe(1);
    expect(decision.nextWindowStartedAt).toBe(1_000);
    expect(decision.remaining).toBe(11);
  });

  it("blocks requests once the configured limit is reached", () => {
    const decision = applyRateLimitWindow(
      {
        count: ASSISTANT_RATE_LIMITS.assistant_chat.limit,
        windowStartedAt: 10_000,
      },
      ASSISTANT_RATE_LIMITS.assistant_chat,
      10_500,
    );

    expect(decision.allowed).toBe(false);
    expect(decision.retryAfterMs).toBeGreaterThan(0);
    expect(decision.remaining).toBe(0);
  });

  it("resets after the window elapses", () => {
    const decision = applyRateLimitWindow(
      {
        count: ASSISTANT_RATE_LIMITS.assistant_chat.limit,
        windowStartedAt: 10_000,
      },
      ASSISTANT_RATE_LIMITS.assistant_chat,
      10_000 + ASSISTANT_RATE_LIMITS.assistant_chat.windowMs + 1,
    );

    expect(decision.allowed).toBe(true);
    expect(decision.nextCount).toBe(1);
    expect(decision.remaining).toBe(11);
  });
});
