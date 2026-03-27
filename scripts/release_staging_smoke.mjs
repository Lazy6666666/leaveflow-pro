#!/usr/bin/env node

import process from "node:process";

function parseArgs(argv) {
  const args = { baseUrl: "", timeoutMs: 15000 };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if ((token === "--base-url" || token === "-b") && argv[i + 1]) {
      args.baseUrl = argv[i + 1];
      i += 1;
      continue;
    }
    if ((token === "--timeout-ms" || token === "-t") && argv[i + 1]) {
      const parsed = Number.parseInt(argv[i + 1], 10);
      if (Number.isFinite(parsed) && parsed > 0) args.timeoutMs = parsed;
      i += 1;
      continue;
    }
    if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    }
  }
  return args;
}

function printHelp() {
  console.log(`Usage: node scripts/release_staging_smoke.mjs --base-url <https://preview.pages.dev> [--timeout-ms 15000]

Automated checks:
- Security headers on /
- PWA asset status/content type on /manifest.webmanifest, /sw.js, /registerSW.js

Manual checklist reminders are printed after automated checks.`);
}

function sanitizeBaseUrl(value) {
  try {
    const parsed = new URL(value);
    if (!/^https?:$/.test(parsed.protocol)) return null;
    parsed.pathname = "";
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

async function fetchHead(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { method: "HEAD", signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

function checkSecurityHeaders(response) {
  const requiredHeaders = [
    "content-security-policy",
    "x-content-type-options",
    "referrer-policy",
    "x-frame-options",
    "permissions-policy",
  ];

  const missing = requiredHeaders.filter((header) => !response.headers.get(header));
  return { pass: missing.length === 0, missing };
}

function checkPwaAsset(response) {
  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  return {
    pass: response.status === 200 && !contentType.includes("text/html"),
    status: response.status,
    contentType,
  };
}

function printResult(label, pass, detail) {
  const icon = pass ? "✅" : "❌";
  console.log(`${icon} ${label}: ${detail}`);
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const baseUrl = sanitizeBaseUrl(args.baseUrl || process.env.BASE_URL || "");

  if (!baseUrl) {
    console.error("❌ Missing/invalid base URL. Provide --base-url or BASE_URL.");
    printHelp();
    process.exit(1);
  }

  const checks = [
    { path: "/", kind: "headers" },
    { path: "/manifest.webmanifest", kind: "pwa" },
    { path: "/sw.js", kind: "pwa" },
    { path: "/registerSW.js", kind: "pwa" },
  ];

  console.log(`Running staging smoke checks against ${baseUrl}`);

  let failed = 0;
  for (const check of checks) {
    const target = `${baseUrl}${check.path}`;
    try {
      const response = await fetchHead(target, args.timeoutMs);
      if (check.kind === "headers") {
        const result = checkSecurityHeaders(response);
        printResult(
          `Security headers ${check.path}`,
          result.pass,
          result.pass ? "all required headers present" : `missing: ${result.missing.join(", ")}`,
        );
        if (!result.pass) failed += 1;
      } else {
        const result = checkPwaAsset(response);
        printResult(
          `PWA asset ${check.path}`,
          result.pass,
          `status=${result.status}, content-type=${result.contentType || "<none>"}`,
        );
        if (!result.pass) failed += 1;
      }
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      printResult(`Request ${check.path}`, false, message);
    }
  }

  console.log("\nManual checklist reminders:");
  console.log("- Auth boot + role-based app flows (employee/manager/hr admin)");
  console.log("- AI fallback and rate-limit handling");
  console.log("- Clerk + biometrics webhook health");
  console.log("- Sentry event ingestion verification");

  if (failed > 0) {
    console.error(`\n❌ ${failed} automated staging smoke check(s) failed.`);
    process.exit(1);
  }

  console.log("\n✅ Automated staging smoke checks passed.");
}

run();
