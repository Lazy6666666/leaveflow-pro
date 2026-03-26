import * as Sentry from "@sentry/react";

type SentryViewer = {
  id?: string | null;
  roles?: string[];
};

function normalizeSampleRate(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    return undefined;
  }

  return parsed;
}

export function getSentryDsn() {
  return import.meta.env.VITE_SENTRY_DSN?.trim() || "";
}

export function isSentryEnabled() {
  return getSentryDsn().length > 0 && import.meta.env.MODE !== "test";
}

export function initSentry() {
  if (!isSentryEnabled()) {
    return false;
  }

  const tracesSampleRate = normalizeSampleRate(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE);

  Sentry.init({
    dsn: getSentryDsn(),
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    integrations: tracesSampleRate ? [Sentry.browserTracingIntegration()] : [],
    tracesSampleRate,
    sendDefaultPii: false,
  });

  return true;
}

declare global {
  interface Window {
    __sentryTestEvent?: () => void;
  }
}

/**
 * Optional, opt-in test trigger for staging validation.
 * Enable by setting `VITE_ENABLE_SENTRY_TEST=1` at build time.
 *
 * Usage (in browser devtools console):
 * `window.__sentryTestEvent?.()`
 */
export function registerSentryTestTrigger() {
  if (!isSentryEnabled()) {
    return false;
  }

  if (import.meta.env.VITE_ENABLE_SENTRY_TEST !== "1") {
    return false;
  }

  window.__sentryTestEvent = () => {
    Sentry.captureMessage("Sentry test event (manual trigger)", { level: "info" });
    void Sentry.flush(2000);
  };

  return true;
}

export function syncSentryViewer(viewer: SentryViewer | null) {
  if (!isSentryEnabled()) {
    return;
  }

  if (!viewer?.id) {
    Sentry.setUser(null);
    Sentry.setTag("role_scope", "signed_out");
    return;
  }

  Sentry.setUser({ id: viewer.id });
  Sentry.setTag("role_scope", viewer.roles?.length ? viewer.roles.join(",") : "unknown");
}

export { Sentry };
