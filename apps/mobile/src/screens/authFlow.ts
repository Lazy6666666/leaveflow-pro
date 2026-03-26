export type AuthFactor = {
  strategy?: string;
};

export type AuthAttemptResult = {
  status?: string;
  createdSessionId?: string | null;
  supportedSecondFactors?: AuthFactor[];
};

export type AuthNextStep =
  | { kind: "complete"; sessionId?: string }
  | { kind: "verify_email_code" }
  | { kind: "unsupported_verification" }
  | { kind: "incomplete" };

type CompleteSignInAttemptOptions = {
  finalizeSignIn?: () => Promise<void>;
  setActiveSession?: (params: { session: string }) => Promise<void>;
};

const EMAIL_CODE_STRATEGY = "email_code";
const CLERK_TEST_EMAIL_MARKER = "+clerk_test";
const CLERK_TEST_VERIFICATION_CODE = "424242";

export function getNextSignInStep(result: AuthAttemptResult): AuthNextStep {
  if (result.status === "complete") {
    return {
      kind: "complete",
      sessionId: result.createdSessionId ?? undefined,
    };
  }

  if (result.status === "needs_client_trust" || result.status === "needs_second_factor") {
    const hasEmailCodeFactor = result.supportedSecondFactors?.some(
      (factor) => factor.strategy === EMAIL_CODE_STRATEGY,
    );

    if (hasEmailCodeFactor) {
      return { kind: "verify_email_code" };
    }

    return { kind: "unsupported_verification" };
  }

  return { kind: "incomplete" };
}

export function resolveAuthAttemptResult(
  resource: AuthAttemptResult | undefined,
  result?: AuthAttemptResult,
): AuthAttemptResult {
  return {
    status: resource?.status ?? result?.status,
    createdSessionId: resource?.createdSessionId ?? result?.createdSessionId,
    supportedSecondFactors: resource?.supportedSecondFactors ?? result?.supportedSecondFactors,
  };
}

export function getVerificationCodeSeed(identifier: string, isDevelopment: boolean) {
  if (isDevelopment && identifier.toLowerCase().includes(CLERK_TEST_EMAIL_MARKER)) {
    return CLERK_TEST_VERIFICATION_CODE;
  }

  return "";
}

export async function completeSignInAttempt(
  nextStep: Extract<AuthNextStep, { kind: "complete" }>,
  options: CompleteSignInAttemptOptions,
) {
  if (nextStep.sessionId && options.setActiveSession) {
    await options.setActiveSession({ session: nextStep.sessionId });
    return;
  }

  if (options.finalizeSignIn) {
    await options.finalizeSignIn();
    return;
  }

  throw new Error("Clerk session activation is unavailable on this device.");
}
