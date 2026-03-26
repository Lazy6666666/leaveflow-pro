import { describe, expect, it } from "vitest";

import { HTTP_RATE_LIMITS, applyHttpRateLimitWindow } from "./httpRateLimits";

describe("http rate limit window", () => {
  it("starts a fresh window when no record exists", () => {
    const decision = applyHttpRateLimitWindow(null, HTTP_RATE_LIMITS.biometrics_webhook_ip, 1_000);

    expect(decision.allowed).toBe(true);
    expect(decision.nextCount).toBe(1);
    expect(decision.nextWindowStartedAt).toBe(1_000);
    expect(decision.remaining).toBe(119);
  });

  it("blocks requests once the configured limit is reached", () => {
    const decision = applyHttpRateLimitWindow(
      {
        count: HTTP_RATE_LIMITS.clerk_onboarding_ip.limit,
        windowStartedAt: 10_000,
      },
      HTTP_RATE_LIMITS.clerk_onboarding_ip,
      10_500,
    );

    expect(decision.allowed).toBe(false);
    expect(decision.retryAfterMs).toBeGreaterThan(0);
    expect(decision.remaining).toBe(0);
  });

  it("treats replay protection as a one-hit window", () => {
    const decision = applyHttpRateLimitWindow(
      {
        count: 1,
        windowStartedAt: 10_000,
      },
      HTTP_RATE_LIMITS.biometrics_webhook_replay,
      10_500,
    );

    expect(decision.allowed).toBe(false);
    expect(decision.remaining).toBe(0);
  });
});
