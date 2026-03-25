import { loadEnvFiles } from "./load_env.mjs";

function parseArgs(argv) {
  return {
    json: argv.includes("--json"),
    strictProduction: argv.includes("--strict-production"),
  };
}

function hasValue(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function safeUrl(value) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function validateUrl(key, value, { productionOnly = false } = {}) {
  if (!hasValue(value)) {
    return { key, status: "fail", detail: "missing" };
  }

  const parsed = safeUrl(value);
  if (!parsed) {
    return { key, status: "fail", detail: "invalid url" };
  }

  if (productionOnly && /(^localhost$|^127\.0\.0\.1$)/i.test(parsed.hostname)) {
    return { key, status: "fail", detail: "points to localhost" };
  }

  return { key, status: "pass", detail: parsed.origin };
}

function validatePresence(key, value) {
  return { key, status: hasValue(value) ? "pass" : "fail", detail: hasValue(value) ? "present" : "missing" };
}

function validateClerkPublishableKey(value) {
  if (!hasValue(value)) {
    return { key: "VITE_CLERK_PUBLISHABLE_KEY", status: "fail", detail: "missing" };
  }
  if (value.startsWith("pk_test_")) {
    return { key: "VITE_CLERK_PUBLISHABLE_KEY", status: "fail", detail: "test key" };
  }
  return { key: "VITE_CLERK_PUBLISHABLE_KEY", status: "pass", detail: "live-looking key" };
}

function validateSentryEnvironment(value) {
  if (!hasValue(value)) {
    return { key: "VITE_SENTRY_ENVIRONMENT", status: "fail", detail: "missing" };
  }
  if (value !== "production") {
    return { key: "VITE_SENTRY_ENVIRONMENT", status: "fail", detail: `expected production, got ${value}` };
  }
  return { key: "VITE_SENTRY_ENVIRONMENT", status: "pass", detail: value };
}

function validateSampleRate(value) {
  if (!hasValue(value)) {
    return { key: "VITE_SENTRY_TRACES_SAMPLE_RATE", status: "warn", detail: "unset" };
  }
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    return { key: "VITE_SENTRY_TRACES_SAMPLE_RATE", status: "fail", detail: "must be between 0 and 1" };
  }
  return { key: "VITE_SENTRY_TRACES_SAMPLE_RATE", status: "pass", detail: value };
}

function validateConvexSitePair(frontendValue, backendValue) {
  if (!hasValue(frontendValue) || !hasValue(backendValue)) {
    return { key: "VITE_CONVEX_SITE_URL ↔ CONVEX_SITE_URL", status: "warn", detail: "cannot compare; one or both values missing" };
  }
  if (frontendValue !== backendValue) {
    return { key: "VITE_CONVEX_SITE_URL ↔ CONVEX_SITE_URL", status: "fail", detail: "values differ" };
  }
  return { key: "VITE_CONVEX_SITE_URL ↔ CONVEX_SITE_URL", status: "pass", detail: "values match" };
}

function buildChecks(env) {
  return [
    validateUrl("VITE_CONVEX_URL", env.VITE_CONVEX_URL, { productionOnly: true }),
    validateUrl("VITE_CONVEX_SITE_URL", env.VITE_CONVEX_SITE_URL, { productionOnly: true }),
    validateClerkPublishableKey(env.VITE_CLERK_PUBLISHABLE_KEY),
    validateUrl("VITE_SENTRY_DSN", env.VITE_SENTRY_DSN, { productionOnly: true }),
    validateSentryEnvironment(env.VITE_SENTRY_ENVIRONMENT),
    validateSampleRate(env.VITE_SENTRY_TRACES_SAMPLE_RATE),
    validatePresence("VITE_PUTER_ENABLED", env.VITE_PUTER_ENABLED),
    validateUrl("CLERK_JWT_ISSUER_DOMAIN", env.CLERK_JWT_ISSUER_DOMAIN, { productionOnly: true }),
    validatePresence("CLERK_APPLICATION_ID", env.CLERK_APPLICATION_ID),
    validatePresence("CLERK_WEBHOOK_SIGNING_SECRET", env.CLERK_WEBHOOK_SIGNING_SECRET),
    validateUrl("CONVEX_SITE_URL", env.CONVEX_SITE_URL, { productionOnly: true }),
    validatePresence("ADMIN_SETUP_TOKEN", env.ADMIN_SETUP_TOKEN),
    validateConvexSitePair(env.VITE_CONVEX_SITE_URL, env.CONVEX_SITE_URL),
    hasValue(env.RESEND_API_KEY) && !hasValue(env.RESEND_FROM_EMAIL)
      ? { key: "RESEND_FROM_EMAIL", status: "fail", detail: "missing while RESEND_API_KEY is set" }
      : { key: "RESEND_FROM_EMAIL", status: hasValue(env.RESEND_FROM_EMAIL) ? "pass" : "warn", detail: hasValue(env.RESEND_FROM_EMAIL) ? "present" : "unset" },
    { key: "MISTRAL_API_KEY", status: hasValue(env.MISTRAL_API_KEY) ? "pass" : "warn", detail: hasValue(env.MISTRAL_API_KEY) ? "present" : "unset" },
    { key: "RESEND_API_KEY", status: hasValue(env.RESEND_API_KEY) ? "pass" : "warn", detail: hasValue(env.RESEND_API_KEY) ? "present" : "unset" },
  ];
}

function printChecks(checks) {
  const maxKey = Math.max(...checks.map((row) => row.key.length));
  for (const row of checks) {
    console.log(`${row.key.padEnd(maxKey)} : ${row.status.toUpperCase()} (${row.detail})`);
  }
}

function main() {
  loadEnvFiles({ cwd: process.cwd(), files: [".env.local", ".env"] });
  const options = parseArgs(process.argv.slice(2));
  const checks = buildChecks(process.env);

  if (options.json) {
    console.log(JSON.stringify({ checks }, null, 2));
  } else {
    console.log("Production readiness env check:");
    printChecks(checks);
  }

  const failingChecks = checks.filter((row) => row.status === "fail");
  if (options.strictProduction && failingChecks.length > 0) {
    process.exit(1);
  }
}

main();
