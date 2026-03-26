# BALANCE

BALANCE is a leave, attendance, approvals, biometrics, and AI-assisted workforce operations app built with React, Vite, Clerk, and Convex.

## Stack

- React
- Vite
- TypeScript
- Clerk
- Convex
- Tailwind CSS
- Sentry

## Local Development

1. Install dependencies:

```sh
npm install
```

2. Set local environment variables in `.env.local` or `.env`.

3. Start the app:

```sh
npm run dev
```

## Build

```sh
npm run build
```

## Production Docs

- Deployment: [docs/cloudflare-pages-deploy.md](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/docs/cloudflare-pages-deploy.md)
- Deploy runbook: [docs/deploy-runbook.md](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/docs/deploy-runbook.md)
- Staging smoke tests: [docs/staging-smoke-tests.md](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/docs/staging-smoke-tests.md)
- Environment matrix: [docs/prod-env-matrix.md](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/docs/prod-env-matrix.md)
- Security headers: [docs/security-headers.md](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/docs/security-headers.md)
- Production audit: [docs/prod-launch-audit.md](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/docs/prod-launch-audit.md)

## Webhooks

### Clerk onboarding

- route: `/clerk/onboarding`
- required backend env:
  - `CLERK_WEBHOOK_SIGNING_SECRET`
  - `CLERK_JWT_ISSUER_DOMAIN`
  - `CLERK_APPLICATION_ID`

### Biometrics webhook

- route: `/biometrics/webhook`
- required backend env:
  - `CONVEX_SITE_URL`
- request requirements:
  - send secret in `x-webhook-secret`, `x-biometrics-secret`, or `Authorization: Bearer <secret>`
  - do not send secret in the request body
  - include a stable delivery id when available

## Notes

- Frontend Sentry is enabled through `VITE_SENTRY_DSN`.
- Backend incidents are recorded in Convex for operator review.
- Real email delivery requires both `RESEND_API_KEY` and `RESEND_FROM_EMAIL`.
