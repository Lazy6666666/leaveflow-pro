import { loadEnvFiles } from "./load_env.mjs";

function yesNo(value) {
  return value && value.trim() ? "yes" : "no";
}

function check(keys) {
  const rows = keys.map((k) => ({ key: k, present: yesNo(process.env[k]) }));
  const maxKey = Math.max(...rows.map((r) => r.key.length));
  for (const row of rows) {
    console.log(`${row.key.padEnd(maxKey)} : ${row.present}`);
  }
  return rows;
}

function main() {
  loadEnvFiles({ cwd: process.cwd(), files: [".env.local", ".env"] });

  console.log("Frontend env (Cloudflare Pages / Vite):");
  check([
    "VITE_CONVEX_URL",
    "VITE_CONVEX_SITE_URL",
    "VITE_CLERK_PUBLISHABLE_KEY",
    "VITE_SENTRY_DSN",
    "VITE_SENTRY_ENVIRONMENT",
    "VITE_SENTRY_TRACES_SAMPLE_RATE",
    "VITE_PUTER_ENABLED",
    "VITE_STRIPE_PUBLISHABLE_KEY",
  ]);

  console.log("\nBackend env (Convex):");
  check([
    "CLERK_JWT_ISSUER_DOMAIN",
    "CLERK_APPLICATION_ID",
    "CLERK_WEBHOOK_SIGNING_SECRET",
    "CONVEX_SITE_URL",
    "ADMIN_SETUP_TOKEN",
    "MISTRAL_API_KEY",
    "RESEND_API_KEY",
    "RESEND_FROM_EMAIL",
    "RESEND_TEMPLATE_BALANCE_BASE_ID",
  ]);

  const missingEmailSender = !process.env.RESEND_FROM_EMAIL?.trim() && process.env.RESEND_API_KEY?.trim();
  if (missingEmailSender) {
    console.log("\nWarning: RESEND_API_KEY is set but RESEND_FROM_EMAIL is missing. Email sending will be blocked until a verified sender is configured.");
  }
}

main();

