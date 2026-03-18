import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { loadEnvFiles } from "./load_env.mjs";

loadEnvFiles();

function getArgValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function resolveDistDir() {
  const explicit =
    getArgValue("--dir") ??
    process.env.CF_PAGES_DIR?.trim();

  if (explicit) return explicit;
  if (fs.existsSync("dist")) return "dist";
  if (fs.existsSync(path.join("leaveflow-pro", "dist"))) return path.join("leaveflow-pro", "dist");
  return "dist";
}

function getGitMeta() {
  try {
    const commitHash = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    const commitMessage = execFileSync("git", ["log", "-1", "--pretty=%s"], { encoding: "utf8" }).trim();
    const dirty = execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim().length > 0;
    return { commitHash, commitMessage, dirty };
  } catch {
    return {};
  }
}

const projectName =
  getArgValue("--project-name") ??
  process.env.CF_PAGES_PROJECT?.trim();

const branch =
  getArgValue("--branch") ??
  process.env.CF_PAGES_BRANCH?.trim() ??
  "main";

const distDir = resolveDistDir();
const dist = path.resolve(distDir);

if (!projectName) {
  console.error("[pages:deploy] Missing Pages project name.");
  console.error("Set CF_PAGES_PROJECT or pass --project-name <name>.");
  process.exit(1);
}

const token =
  process.env.CLOUDFLARE_API_TOKEN ??
  process.env.CF_API_TOKEN ??
  process.env.CLOUDFLARE_API_KEY;

if (!token) {
  console.error("[pages:deploy] Missing Cloudflare API token.");
  console.error("Set CLOUDFLARE_API_TOKEN (recommended) or CF_API_TOKEN.");
  process.exit(1);
}

if (!fs.existsSync(dist) || !fs.statSync(dist).isDirectory()) {
  console.error(`[pages:deploy] Build output directory not found: ${distDir}`);
  console.error("Run `npm run build` first (or set CF_PAGES_DIR).");
  process.exit(1);
}

const wranglerBin = path.resolve(
  "node_modules",
  ".bin",
  process.platform === "win32" ? "wrangler.cmd" : "wrangler",
);

const git = getGitMeta();
const args = [
  "pages",
  "deploy",
  distDir,
  "--project-name",
  projectName,
  "--branch",
  branch,
];

if (git.commitHash) args.push("--commit-hash", git.commitHash);
if (typeof git.dirty === "boolean") args.push("--commit-dirty", String(git.dirty));

let deployCmd = wranglerBin;
let deployArgs = args;
let deployPrintable = `${wranglerBin} ${args.join(" ")}`;

if (!fs.existsSync(wranglerBin)) {
  // Allow deploying even if wrangler isn't installed in node_modules (common when relying on npx).
  // This keeps the script usable across environments without forcing a full reinstall.
  deployCmd = process.platform === "win32" ? "npx.cmd" : "npx";
  deployArgs = ["wrangler", ...args];
  deployPrintable = `${deployCmd} ${deployArgs.join(" ")}`;
  console.warn("[pages:deploy] Wrangler binary not found in node_modules/.bin; falling back to `npx wrangler`");
}

if (hasFlag("--dry-run")) {
  console.log(`[pages:deploy] Dry run: ${deployPrintable}`);
  process.exit(0);
}

console.log(`[pages:deploy] Deploying ${distDir} -> ${projectName} (${branch})`);

const child = spawn(deployCmd, deployArgs, {
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

child.on("exit", (code) => process.exit(code ?? 1));
