# Project Finalization Status

Last updated: 2026-03-27 (UTC)

## Objective

Finalize the project by executing hard release gates and identifying remaining blockers to production.

## Executed now

1. **Full unit/integration test pass**
   - Command: `npm test`
   - Result: pass (41 files, 113 tests).
2. **Production preflight gate**
   - Command: `npm run release:preflight`
   - Result: failed as expected in this environment due to missing production env keys.
3. **Staging smoke gate automation in place**
   - Command available: `npm run release:staging-smoke -- --base-url https://<branch>.<project>.pages.dev`
   - Result: script ready and wired into npm scripts.

## Completed implementation items toward finalization

- Automated staging smoke script added (`scripts/release_staging_smoke.mjs`) with fail-fast checks for:
  - required security headers on `/`
  - PWA assets (`/manifest.webmanifest`, `/sw.js`, `/registerSW.js`) status/content type
- TWI runbook now includes executable command for TWI-47 validation.
- Vitest config updated so test environment has default `import.meta.env` values required by UI imports.

## Remaining blockers to production finalization

The following env keys are currently missing in this execution environment and block strict preflight:

- `VITE_CONVEX_URL`
- `VITE_CONVEX_SITE_URL`
- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_SENTRY_DSN`
- `VITE_SENTRY_ENVIRONMENT`
- `VITE_PUTER_ENABLED`
- `CLERK_JWT_ISSUER_DOMAIN`
- `CLERK_APPLICATION_ID`
- `CLERK_WEBHOOK_SIGNING_SECRET`
- `CONVEX_SITE_URL`
- `ADMIN_SETUP_TOKEN`

## Finalization checklist to close project

1. Populate production/staging env values for all required keys.
2. Re-run `npm run release:preflight` and ensure pass.
3. Run `npm run release:staging-smoke -- --base-url <staging-url>` and ensure pass.
4. Execute role-based manual smoke checklist from `docs/staging-smoke-tests.md`.
5. Record release evidence and owner sign-offs.

