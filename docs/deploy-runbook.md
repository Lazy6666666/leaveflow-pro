# Deploy Runbook

## Purpose

This runbook defines the minimum production deployment process for BALANCE.

## Before Deployment

- Run `npm run prod:check` and confirm the required frontend/backend env keys are present.
- If deploying through the repo scripts, ensure `CF_PAGES_PROJECT` is set and `CLOUDFLARE_API_TOKEN` or `CF_API_TOKEN` is available.
- Confirm production env values are set for frontend and Convex.
- Confirm `VITE_SENTRY_DSN` is set and events are visible in Sentry.
- Confirm `CLERK_WEBHOOK_SIGNING_SECRET` is set in Convex.
- Confirm `MISTRAL_API_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CONVEX_SITE_URL`, `VITE_CONVEX_URL`, and `VITE_CLERK_PUBLISHABLE_KEY` are set correctly.
- Confirm the current Convex deployment target is the intended environment.

## Release Steps

1. Run `npm run build` to produce the frontend artifact.
2. Run `npm run pages:verify-dist` to confirm `dist/` contains `index.html`, `/_headers`, and the required PWA assets.
3. Deploy the frontend with `npm run pages:deploy:dist` or run `npm run pages:deploy` for the build + verify + deploy sequence.
4. Deploy Convex functions and schema updates for the intended production environment.
5. Verify Clerk onboarding webhook health.
6. Verify biometrics webhook health if enabled.
7. Run the checklist in `docs/staging-smoke-tests.md` against the deployed environment.
8. Confirm Sentry is receiving events and no new fatal errors appear.

## Rollback

### Frontend rollback

- Roll back to the previous known-good frontend deployment in the hosting provider.
- If the failed deploy used the repo scripts, redeploy the last known-good artifact with `wrangler pages deploy` or rerun the deploy script from that known-good commit.
- Re-run the smoke checklist after rollback.

### Convex rollback

- If the issue is function-only, redeploy the previous known-good Convex code.
- If the issue involves a schema change, stop and evaluate data compatibility before rollback.
- If webhooks are affected, disable the external sender temporarily until the backend is stable again.

## Incident Priorities

- P0: auth broken, app cannot boot, payroll/reporting corrupted, attendance ingestion corrupts records
- P1: AI degraded, email degraded, admin-only workflows partially broken
- P2: non-critical UI regressions or analytics gaps

## Deployment Owner Checklist

- deployment owner assigned
- rollback owner assigned
- webhook owner assigned
- post-deploy smoke tester assigned

## Evidence Contract

All production releases must include evidence artifacts that prove each acceptance criterion was validated and reviewed.

### 1) Required fields per evidence item

Each evidence artifact entry must include:

- **Ticket ID** (Linear issue ID, for example `BAL-123`)
- **Environment** (`staging`, `production`, or other explicit target)
- **Command and output** (exact command used, plus output/log/screenshot)
- **Reviewer** (name or handle of the person who reviewed the artifact)
- **Date** (UTC date in `YYYY-MM-DD`)
- **Result** (`pass` or `fail`)

Store this metadata in an `evidence-index.md` (or `evidence-index.json`) alongside artifacts for the release.

### 2) Canonical storage locations

Use this canonical path layout for every release:

- `docs/release-evidence/<release-id>/evidence-index.md`
- `docs/release-evidence/<release-id>/role-matrix/`
- `docs/release-evidence/<release-id>/migrations/`
- `docs/release-evidence/<release-id>/staging/`
- `docs/release-evidence/<release-id>/smoke/`

`<release-id>` should match the release tag or release date key (for example `2026-03-27` or `v1.14.0`).

### 3) Naming conventions for validation artifacts

Use stable, descriptive filenames:

- Role matrix: `role-matrix-<ticket-id>-<env>-<date>.md`
- Migration dry-run log: `migration-dry-run-<ticket-id>-<env>-<date>.log`
- Staging screenshots: `staging-<ticket-id>-<scenario>-<date>.png`
- Staging logs: `staging-log-<ticket-id>-<scenario>-<date>.log`
- Smoke output: `smoke-<ticket-id>-<env>-<date>.log`

Use lowercase kebab-case for `<scenario>` and keep timestamps/dates in UTC.

### 4) Link requirements in Linear

For each Linear ticket in the release:

- Every acceptance criterion must link to **at least one** evidence artifact.
- Links must point to files under `docs/release-evidence/<release-id>/...`.
- If one artifact validates multiple criteria, explicitly reference that same link in each criterion.

Tickets cannot be marked ready to close until all criterion-to-evidence links are present.

### 5) Evidence completeness checklist gate (before closure)

Before closing a release ticket, confirm all items below:

- [ ] Evidence index exists at `docs/release-evidence/<release-id>/evidence-index.md` (or `.json`).
- [ ] Every required evidence field is present for every artifact entry.
- [ ] Role matrix, migration dry-run, staging evidence, and smoke output artifacts exist and follow naming conventions.
- [ ] Every acceptance criterion in Linear links to at least one artifact.
- [ ] A reviewer has signed off on completeness and all required items are marked `pass` (or failures include a documented disposition).

This checklist is a hard gate: do not close the release until every item is complete.
