import fs from "node:fs";
import path from "node:path";

function parseEnvFile(contents) {
  const out = new Map();
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    // Support optional `export KEY=...`.
    const normalized = line.startsWith("export ") ? line.slice("export ".length).trim() : line;
    const eq = normalized.indexOf("=");
    if (eq === -1) continue;

    const key = normalized.slice(0, eq).trim();
    let value = normalized.slice(eq + 1).trim();

    // Strip surrounding quotes when present.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key) out.set(key, value);
  }
  return out;
}

export function loadEnvFiles({
  cwd = process.cwd(),
  files = [".env.local", ".env"],
} = {}) {
  for (const rel of files) {
    const filePath = path.resolve(cwd, rel);
    if (!fs.existsSync(filePath)) continue;

    const parsed = parseEnvFile(fs.readFileSync(filePath, "utf8"));
    for (const [key, value] of parsed.entries()) {
      // Never override real environment variables.
      if (process.env[key] !== undefined) continue;
      process.env[key] = value;
    }
  }
}

