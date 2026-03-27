const ENV_KEYS = [
  "ADMIN_SETUP_TOKEN",
  "CAREERS_GREENHOUSE_BOARD_TOKEN",
  "CAREERS_SCRAPER_ENDPOINT",
  "CLERK_APPLICATION_ID",
  "CLERK_JWT_ISSUER_DOMAIN",
  "CLERK_WEBHOOK_SIGNING_SECRET",
  "CONVEX_SITE_URL",
  "MISTRAL_API_KEY",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "VITE_CONVEX_SITE_URL",
] as const;

export type EnvKey = (typeof ENV_KEYS)[number];

const DEFAULT_CLERK_APPLICATION_ID = "convex";

type ProcessWithEnv = {
  env: Record<string, string | undefined>;
};

function getProcessEnv(): Record<string, string | undefined> | undefined {
  if (typeof process !== "undefined") {
    return (process as ProcessWithEnv).env;
  }
  return undefined;
}

function normalizeEnvValue(value: string | undefined) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim() || undefined;
  }

  return trimmed;
}

export function getEnv(name: EnvKey): string | undefined {
  return normalizeEnvValue(getProcessEnv()?.[name]);
}

export function requireEnv(name: EnvKey): string {
  const value = getEnv(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getConvexSiteUrl(): string | undefined {
  const siteUrl = getEnv("CONVEX_SITE_URL") ?? getEnv("VITE_CONVEX_SITE_URL");
  return siteUrl?.replace(/\/+$/, "");
}

export function getClerkIssuerDomain(): string | undefined {
  return getEnv("CLERK_JWT_ISSUER_DOMAIN");
}

export function getClerkApplicationId(): string {
  return getEnv("CLERK_APPLICATION_ID") ?? DEFAULT_CLERK_APPLICATION_ID;
}

export function getMistralApiKey(): string | undefined {
  return getEnv("MISTRAL_API_KEY");
}

export function getResendApiKey(): string | undefined {
  return getEnv("RESEND_API_KEY");
}

export function getResendFromEmail(): string | undefined {
  return getEnv("RESEND_FROM_EMAIL");
}
