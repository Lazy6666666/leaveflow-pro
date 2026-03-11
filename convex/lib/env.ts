const ENV_KEYS = [
  "ADMIN_SETUP_TOKEN",
  "CLERK_APPLICATION_ID",
  "CLERK_JWT_ISSUER_DOMAIN",
  "CLERK_WEBHOOK_SIGNING_SECRET",
  "AI_GATEWAY_API_KEY",
  "CONVEX_SITE_URL",
  "LOVABLE_API_KEY",
  "RESEND_API_KEY",
  "VITE_CONVEX_SITE_URL",
] as const;

export type EnvKey = (typeof ENV_KEYS)[number];

type ProcessWithEnv = {
  env: Record<string, string | undefined>;
};

function hasProcessEnv(value: unknown): value is ProcessWithEnv {
  if (typeof value !== "object" || value === null || !("env" in value)) {
    return false;
  }

  const { env } = value as { env?: unknown };
  return typeof env === "object" && env !== null;
}

function getProcessEnv(): Record<string, string | undefined> | undefined {
  const processValue = Reflect.get(globalThis, "process");
  return hasProcessEnv(processValue) ? processValue.env : undefined;
}

export function getEnv(name: EnvKey): string | undefined {
  const value = getProcessEnv()?.[name];
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
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

export function getAiGatewayApiKey(): string | undefined {
  return getEnv("AI_GATEWAY_API_KEY") ?? getEnv("LOVABLE_API_KEY");
}
