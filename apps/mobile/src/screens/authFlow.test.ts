import { describe, expect, it } from "vitest";

import {
  completeSignInAttempt,
  getNextSignInStep,
  getVerificationCodeSeed,
  resolveAuthAttemptResult,
} from "./authFlow";

describe("getNextSignInStep", () => {
  it("returns complete when Clerk provides a session id", () => {
    expect(
      getNextSignInStep({
        status: "complete",
        createdSessionId: "sess_123",
      }),
    ).toEqual({
      kind: "complete",
      sessionId: "sess_123",
    });
  });

  it("returns complete when Clerk marks the attempt complete before exposing a session id", () => {
    expect(
      getNextSignInStep({
        status: "complete",
      }),
    ).toEqual({
      kind: "complete",
      sessionId: undefined,
    });
  });

  it("requests email code verification when client trust exposes email_code", () => {
    expect(
      getNextSignInStep({
        status: "needs_client_trust",
        supportedSecondFactors: [{ strategy: "email_code" }],
      }),
    ).toEqual({
      kind: "verify_email_code",
    });
  });

  it("marks unsupported verification when no email code factor is available", () => {
    expect(
      getNextSignInStep({
        status: "needs_second_factor",
        supportedSecondFactors: [{ strategy: "totp" }],
      }),
    ).toEqual({
      kind: "unsupported_verification",
    });
  });

  it("returns incomplete for any other unfinished state", () => {
    expect(
      getNextSignInStep({
        status: "needs_identifier",
      }),
    ).toEqual({
      kind: "incomplete",
    });
  });
});

describe("completeSignInAttempt", () => {
  it("falls back to Clerk finalize when the completed attempt does not expose a session id yet", async () => {
    let finalized = 0;

    await completeSignInAttempt(
      {
        kind: "complete",
        sessionId: undefined,
      },
      {
        finalizeSignIn: async () => {
          finalized += 1;
        },
      },
    );

    expect(finalized).toBe(1);
  });

  it("prefers activating the session when Clerk exposes a created session id", async () => {
    let activatedWith: string | null = null;
    let finalized = 0;

    await completeSignInAttempt(
      {
        kind: "complete",
        sessionId: "sess_123",
      },
      {
        finalizeSignIn: async () => {
          finalized += 1;
        },
        setActiveSession: async ({ session }) => {
          activatedWith = session;
        },
      },
    );

    expect(activatedWith).toBe("sess_123");
    expect(finalized).toBe(0);
  });

  it("falls back to activating the session when finalize is unavailable", async () => {
    let activatedWith: string | null = null;

    await completeSignInAttempt(
      {
        kind: "complete",
        sessionId: "sess_123",
      },
      {
        setActiveSession: async ({ session }) => {
          activatedWith = session;
        },
      },
    );

    expect(activatedWith).toBe("sess_123");
  });

  it("throws when a completed attempt cannot be finalized or activated", async () => {
    await expect(
      completeSignInAttempt(
        {
          kind: "complete",
          sessionId: undefined,
        },
        {},
      ),
    ).rejects.toThrow("Clerk session activation is unavailable on this device.");
  });
});

describe("resolveAuthAttemptResult", () => {
  it("prefers the live Clerk resource state after a mutation", () => {
    expect(
      resolveAuthAttemptResult(
        {
          status: "complete",
          createdSessionId: "sess_live",
        },
        {
          status: "needs_client_trust",
          createdSessionId: null,
        },
      ),
    ).toEqual({
      status: "complete",
      createdSessionId: "sess_live",
      supportedSecondFactors: undefined,
    });
  });

  it("falls back to the immediate result when the live Clerk resource has not hydrated yet", () => {
    expect(
      resolveAuthAttemptResult(undefined, {
        status: "needs_client_trust",
        createdSessionId: null,
        supportedSecondFactors: [{ strategy: "email_code" }],
      }),
    ).toEqual({
      status: "needs_client_trust",
      createdSessionId: null,
      supportedSecondFactors: [{ strategy: "email_code" }],
    });
  });
});

describe("getVerificationCodeSeed", () => {
  it("returns Clerk's test verification code for dev-mode clerk_test accounts", () => {
    expect(
      getVerificationCodeSeed("tester+clerk_test@example.com", true),
    ).toBe("424242");
  });

  it("returns an empty string for normal accounts", () => {
    expect(getVerificationCodeSeed("tester@example.com", true)).toBe("");
  });
});
