import fs from "node:fs";
import path from "node:path";
import { loadEnvFiles } from "./load_env.mjs";

loadEnvFiles();

function resolveDistDir() {
  const explicit = process.env.CF_PAGES_DIR?.trim();
  if (explicit) return explicit;

  if (fs.existsSync("dist")) return "dist";
  if (fs.existsSync(path.join("leaveflow-pro", "dist"))) return path.join("leaveflow-pro", "dist");
  return "dist";
}

function requirePath(p, kind = "file") {
  if (!fs.existsSync(p)) throw new Error(`Missing required ${kind}: ${p}`);

  if (kind === "directory") {
    const stat = fs.statSync(p);
    if (!stat.isDirectory()) throw new Error(`Expected directory at: ${p}`);
  }
}

function requireFileContains(filePath, needle) {
  const content = fs.readFileSync(filePath, "utf8");
  if (!content.includes(needle)) {
    throw new Error(`Expected ${filePath} to include: ${needle}`);
  }
}

const distDir = resolveDistDir();
const dist = path.resolve(distDir);

try {
  requirePath(dist, "directory");

  requirePath(path.join(dist, "index.html"));

  // Cloudflare Pages static config (headers)
  requirePath(path.join(dist, "_headers"));
  requireFileContains(path.join(dist, "_headers"), "Content-Security-Policy:");

  // PWA assets (vite-plugin-pwa + public/)
  requirePath(path.join(dist, "manifest.webmanifest"));
  requirePath(path.join(dist, "sw.js"));
  requirePath(path.join(dist, "registerSW.js"));

  console.log(`[pages:verify-dist] OK: ${distDir}`);
} catch (err) {
  console.error(`[pages:verify-dist] FAIL: ${distDir}`);
  console.error(err?.message ?? err);
  process.exitCode = 1;
}
