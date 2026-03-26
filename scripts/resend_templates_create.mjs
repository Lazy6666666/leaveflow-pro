import fs from "node:fs";
import path from "node:path";

import { loadEnvFiles } from "./load_env.mjs";

function parseArgs(argv) {
  const out = { publish: false };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--publish") {
      out.publish = true;
      continue;
    }
    if (token === "--name") {
      out.name = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === "--alias") {
      out.alias = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === "--file") {
      out.file = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === "--help" || token === "-h") {
      out.help = true;
      continue;
    }
  }
  return out;
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value.trim();
}

async function resendRequest({ apiKey, method, path: pathname, body }) {
  const res = await fetch(`https://api.resend.com${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // Ignore.
  }

  if (!res.ok) {
    const message = json?.message || json?.error || text || `HTTP ${res.status}`;
    throw new Error(`Resend API error (${method} ${pathname}): ${message}`);
  }

  return json;
}

async function main() {
  loadEnvFiles({ cwd: process.cwd(), files: [".env.local", ".env"] });

  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log("Usage: node scripts/resend_templates_create.mjs --name \"BALANCE Base\" --alias balance-base --file docs/email/resend-balance-template.html [--publish]");
    process.exit(0);
  }

  const apiKey = requireEnv("RESEND_API_KEY");
  const name = args.name || "BALANCE Base Template";
  const alias = args.alias || "balance-base";
  const file = args.file || "docs/email/resend-balance-template.html";

  const absFile = path.resolve(process.cwd(), file);
  if (!fs.existsSync(absFile)) {
    throw new Error(`Template HTML file not found: ${absFile}`);
  }

  const html = fs.readFileSync(absFile, "utf8");

  const createPayload = {
    name,
    alias,
    html,
    variables: [
      { key: "TITLE", type: "string", fallbackValue: "Update from BALANCE" },
      { key: "PREHEADER", type: "string", fallbackValue: "" },
      { key: "GREETING_HTML", type: "string", fallbackValue: "" },
      { key: "BODY_HTML", type: "string", fallbackValue: "<p>Hello from BALANCE.</p>" },
      { key: "CTA_HTML", type: "string", fallbackValue: "" },
      { key: "FOOTER_NOTE", type: "string", fallbackValue: "This is an automated message from BALANCE." },
    ],
  };

  const created = await resendRequest({
    apiKey,
    method: "POST",
    path: "/templates",
    body: createPayload,
  });

  const templateId = created?.id;
  if (!templateId) {
    throw new Error("Resend response did not include a template id.");
  }

  console.log(`Created Resend template: ${templateId}`);

  if (args.publish) {
    await resendRequest({
      apiKey,
      method: "POST",
      path: `/templates/${templateId}/publish`,
    });
    console.log(`Published Resend template: ${templateId}`);
  } else {
    console.log("Not published. Re-run with --publish to publish.");
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
