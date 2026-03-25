#!/usr/bin/env node
/**
 * Staging Sentry ingest smoke test (frontend -> Sentry).
 *
 * Usage:
 *   node scripts/staging_sentry_ingest_check.mjs <deployed-url> [--timeout-ms 45000]
 *
 * Prereqs (one-time):
 *   npm i -D playwright
 *   npx playwright install chromium
 *
 * Notes:
 * - Expects the deployed site to expose a staging-only helper:
 *     window.__sentryTestEvent?.()
 * - Confirms a 2xx response to a request matching:
 *     *.ingest.*.sentry.io
 */

import { chromium } from 'playwright';

function usage(exitCode = 1) {
  console.error(
    [
      'Usage:',
      '  node scripts/staging_sentry_ingest_check.mjs <deployed-url> [--timeout-ms 45000]',
      '',
      'Example:',
      '  node scripts/staging_sentry_ingest_check.mjs https://<branch>.<project>.pages.dev --timeout-ms 60000',
    ].join('\n'),
  );
  process.exit(exitCode);
}

function redactUrl(raw) {
  try {
    const u = new URL(raw);
    // Avoid printing query strings (DSN public keys, etc).
    return u.origin + u.pathname;
  } catch {
    return raw;
  }
}

function parseArgs(argv) {
  const out = { url: '', timeoutMs: 45000 };

  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--timeout-ms') {
      const v = argv[i + 1];
      if (!v) usage(1);
      out.timeoutMs = Number(v);
      if (!Number.isFinite(out.timeoutMs) || out.timeoutMs <= 0) {
        console.error('Invalid --timeout-ms: ' + v);
        process.exit(1);
      }
      i++;
      continue;
    }
    if (a === '-h' || a === '--help') usage(0);
    if (a.startsWith('--')) {
      console.error('Unknown option: ' + a);
      usage(1);
    }
    positional.push(a);
  }

  out.url = positional[0] || '';
  return out;
}

const parsed = parseArgs(process.argv.slice(2));
if (!parsed.url) usage(1);

// Matches (as requested):
//   https://o123.ingest.us.sentry.io/...
//   https://o123.ingest.de.sentry.io/...
const sentryIngestRe = /^https:\/\/[^/]*\.ingest\.[^/]*\.sentry\.io\//i;

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext();
  const page = await context.newPage();

  let armed = false;

  let resolveOk;
  const ok2xx = new Promise((resolve) => {
    resolveOk = resolve;
  });

  page.on('response', (resp) => {
    if (!armed) return;
    const respUrl = resp.url();
    if (!sentryIngestRe.test(respUrl)) return;

    const status = resp.status();
    const method = resp.request().method();
    const entry = { method: method, status: status, url: redactUrl(respUrl) };

    if (status >= 200 && status < 300) resolveOk(entry);
  });

  await page.goto(parsed.url, { waitUntil: 'domcontentloaded', timeout: parsed.timeoutMs });

  armed = true;
  const invoked = await page.evaluate(() => {
    const fn = window.__sentryTestEvent;
    if (typeof fn === 'function') {
      fn();
      return true;
    }
    return false;
  });

  if (!invoked) {
    console.error('FAIL: window.__sentryTestEvent is not available on this page.');
    console.error('Expected a staging-only helper: window.__sentryTestEvent?.()');
    process.exit(2);
  }

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), parsed.timeoutMs),
  );

  const ok = await Promise.race([ok2xx, timeoutPromise]);
  console.log('PASS: Sentry ingest 2xx observed (' + ok.method + ' ' + ok.status + ') ' + ok.url);
} catch (err) {
  if (err && typeof err === 'object' && err.message === 'timeout') {
    console.error(
      'FAIL: Timed out after ' +
        String(parsed.timeoutMs) +
        'ms waiting for a 2xx response from *.ingest.*.sentry.io',
    );
  } else {
    console.error('FAIL:', (err && err.stack) || err);
  }
  process.exit(1);
} finally {
  await browser.close();
}