# Staging Smoke Tests

Staging URL (Cloudflare Pages preview): set this to your preview deployment URL.

Example:

- `https://<branch>.<project>.pages.dev`

## Auth and App Boot

- Landing page loads.
- Sign-in completes with Clerk.
- First authenticated app load succeeds.
- Dashboard renders without console-fatal errors.

## Employee Flows

- Leave request can be submitted.
- Leave history loads.
- Attendance widget loads.
- Clock-in and clock-out still work if staging devices and policies allow it.

## Manager Flows

- Approvals page loads.
- Team calendar loads.
- Delegation page loads.

## HR Admin Flows

- Employees page loads.
- Policies page loads.
- Reports page loads.
- Biometrics settings page loads.

## AI Flows

- Puter-enabled path returns a response when available.
- Mistral fallback works when Puter is unavailable.
- Deterministic fallback still returns a response for handled intents.
- Assistant rate limits produce a controlled message instead of a crash.
- Failure responses conform to `docs/failure-response-contract.md` (error shape, mapping, intent fallback, and UI redaction).
- Failure injection validates missing-key, transport, HTTP, parse, and tool-loop exhaustion behavior before sign-off.

## Webhooks and Integrations

- Clerk `user.created` webhook provisions a user.
- Clerk duplicate webhook delivery is ignored.
- Biometrics webhook with a valid header secret is accepted.
- Biometrics duplicate webhook delivery is ignored.
- Biometrics webhook without a header secret is rejected.

## Monitoring

- Sentry receives at least one test event from the deployed frontend.
- No unexpected fatal frontend errors appear after smoke testing.

## Pages Deploy Verification (curl)

These checks confirm that the deployment artifact includes:

- `dist/_headers` (security headers are actually applied by Pages)
- PWA assets (served as real files, not rewritten to `index.html`)

Set `BASE_URL` to your deployed URL (no trailing slash).

### macOS/Linux

```bash
BASE_URL="https://<branch>.<project>.pages.dev"

# Security headers from /_headers should be present on HTML routes
curl -sI "$BASE_URL/" | tr -d '\r' | egrep -i '^(content-security-policy|x-content-type-options|referrer-policy|x-frame-options|permissions-policy):'

# PWA assets must exist and must not be rewritten to HTML
curl -sI "$BASE_URL/manifest.webmanifest" | tr -d '\r' | egrep -i '^(http/|content-type):'
curl -sI "$BASE_URL/sw.js" | tr -d '\r' | egrep -i '^(http/|content-type):'
curl -sI "$BASE_URL/registerSW.js" | tr -d '\r' | egrep -i '^(http/|content-type):'
```

Expected results (high level):

- `/` includes the security headers from `public/_headers`
- `/manifest.webmanifest`, `/sw.js`, `/registerSW.js` return `200` and a non-HTML `Content-Type`

### Windows PowerShell

PowerShell aliases `curl` to `Invoke-WebRequest` on some setups. Use `curl.exe` explicitly.

```powershell
$BASE_URL="https://<branch>.<project>.pages.dev"

# Security headers from /_headers should be present on HTML routes
curl.exe -sI "$BASE_URL/" | Select-String -Pattern "^(Content-Security-Policy|X-Content-Type-Options|Referrer-Policy|X-Frame-Options|Permissions-Policy):" -CaseSensitive:$false

# PWA assets must exist and must not be rewritten to HTML
curl.exe -sI "$BASE_URL/manifest.webmanifest" | Select-String -Pattern "^(HTTP/|Content-Type):" -CaseSensitive:$false
curl.exe -sI "$BASE_URL/sw.js" | Select-String -Pattern "^(HTTP/|Content-Type):" -CaseSensitive:$false
curl.exe -sI "$BASE_URL/registerSW.js" | Select-String -Pattern "^(HTTP/|Content-Type):" -CaseSensitive:$false
```

## Local Equivalents (Pre-Deploy Sanity)

These do not replace staging smoke tests, but they catch obvious breakage before deploying.

```bash
npm ci
npm run build
npm run pages:verify-dist
npm test
npm run lint
```

Notes:
- `npm test` must pass before deploying.
- `npm run lint` should be treated as a release gate once the remaining lint errors are resolved.

### Sentry Test Event (Deployed App)

Sentry is initialized in `src/main.tsx` via `initSentry()` and controlled by `VITE_SENTRY_DSN` / `VITE_SENTRY_ENVIRONMENT`.

To validate end-to-end ingestion on staging:
1. Ensure `VITE_SENTRY_DSN` is set for the staging deployment.
2. Open the deployed site and use the UI normally for a minute.
3. Trigger a controlled event:
   - Preferred (opt-in): set `VITE_ENABLE_SENTRY_TEST=1` for the staging build, then open DevTools and run `window.__sentryTestEvent?.()`.
   - Alternative: trigger a controlled error in a staging-only way (do not leave a permanent crash path enabled in production).
4. Confirm the event appears in Sentry with the expected environment tag.

#### Automated Sentry Ingest Check (Playwright)

This calls `window.__sentryTestEvent?.()` on the deployed URL and waits for a 2xx response from `*.ingest.*.sentry.io`.

One-time setup (in `leaveflow-pro/`):

```bash
npm i -D playwright
npx playwright install chromium
```

Run against the deployed URL:

```bash
node scripts/staging_sentry_ingest_check.mjs https://<branch>.<project>.pages.dev --timeout-ms 60000
```

If it fails with `window.__sentryTestEvent is not available`, ensure the staging build sets `VITE_ENABLE_SENTRY_TEST=1`.

