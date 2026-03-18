# Cloudflare Pages Deployment

This repo supports two deployment paths:

1) Cloudflare Pages builds from Git (Cloudflare runs `npm run build`)
2) You build locally/CI and deploy `dist/` with Wrangler (`wrangler pages deploy`)

The Wrangler path is recommended when you want a fully reproducible “what you built is what you deployed” artifact.

## Build Settings (Git-Integrated Pages)

Use these values in the Cloudflare Pages project:

- Framework preset: `Vite`
- Root directory: `/`
- Build command: `npm ci && npm run build`
- Build output directory: `dist`

Monorepo variant (only if the app lives under `leaveflow-pro/`):

- Root directory: `/`
- Build command: `cd leaveflow-pro && npm ci && npm run build`
- Build output directory: `leaveflow-pro/dist`

## Reproducible CLI Deploy (Wrangler)

This repo ships a pinned Wrangler version and deploy scripts:

- Verify build output: `npm run pages:verify-dist`
- Build + verify + deploy: `npm run pages:deploy`

### One-Time Cloudflare Setup

1. Create a Cloudflare Pages project (name matters; you deploy to it by name).
2. Create an API token with at least:
   - Account permissions: `Cloudflare Pages:Edit`

### Required Environment Variables

- `CF_PAGES_PROJECT` (Pages project name)
- `CF_PAGES_BRANCH` (optional, defaults to `main`)
- `CLOUDFLARE_API_TOKEN` (recommended) or `CF_API_TOKEN`
- `CF_PAGES_DIR` (optional, defaults to `dist`; use `leaveflow-pro/dist` for monorepos)

### Deploy (macOS/Linux)

```bash
npm ci
npm run build

export CF_PAGES_PROJECT="leaveflow-pro"
export CF_PAGES_BRANCH="main"
export CLOUDFLARE_API_TOKEN="***"

npm run pages:deploy
```

### Deploy (Windows PowerShell)

```powershell
npm ci
npm run build

$env:CF_PAGES_PROJECT="leaveflow-pro"
$env:CF_PAGES_BRANCH="main"
$env:CLOUDFLARE_API_TOKEN="***"

npm run pages:deploy
```

### Deploy (Direct Wrangler Command)

If you prefer not to use the repo scripts:

```bash
npx --yes wrangler@4.74.0 pages deploy dist --project-name "<project>" --branch "<branch>"
```

## Preserving `_headers` and PWA Assets

Cloudflare Pages only applies custom headers if the deployed artifact contains a top-level `/_headers` file.
In this repo, that file is sourced from `public/_headers` and must exist in `dist/_headers` after `npm run build`.

The PWA installability also depends on these being present in the deployed artifact (paths are case-sensitive):

- `/manifest.webmanifest`
- `/sw.js`
- `/registerSW.js`

`npm run pages:verify-dist` enforces these before deploy.

## Frontend Environment Variables (Pages Builds)

If you use Git-integrated Pages builds, set these in Pages project settings:

- `VITE_CONVEX_URL`
- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_SENTRY_DSN`
- `VITE_SENTRY_ENVIRONMENT` (example: `production`)
- `VITE_SENTRY_TRACES_SAMPLE_RATE` (example: `0.1`)
- `VITE_PUTER_ENABLED` (example: `true`)
- `VITE_CONVEX_SITE_URL`

Source of truth for keys: `.env.production.example`.

## Backend Environment Variables

These do not go into Cloudflare Pages. Set them in Convex:

- `CLERK_JWT_ISSUER_DOMAIN`
- `CLERK_APPLICATION_ID`
- `CLERK_WEBHOOK_SIGNING_SECRET`
- `CONVEX_SITE_URL`
- `MISTRAL_API_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `ADMIN_SETUP_TOKEN`

See also `docs/prod-env-matrix.md`.

## Post-Deploy Verification

Run `docs/staging-smoke-tests.md` against the deployed URL, including the curl-based checks for:

- `/_headers` taking effect (security headers present on `/`)
- PWA assets returning non-HTML content types

Troubleshooting quick checks:

- If `/manifest.webmanifest`, `/registerSW.js`, or `/sw.js` return `text/html`, your deployed artifact is missing those files (wrong output dir or stale deploy).
- If the deployed JS shows an empty Sentry DSN, ensure `VITE_SENTRY_DSN` is set for that build environment and rebuild/redeploy.
