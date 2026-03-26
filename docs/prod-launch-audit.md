# Production Launch Audit

## Purpose

This document captures what is still needed before BALANCE should be treated as production-ready, and it evaluates the proposed stack additions against the current codebase.

Date reviewed: 2026-03-14

## Current Stack Detected In Repo

### Frontend

- React + Vite are the active frontend stack. See [package.json](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/package.json#L1) and [vite.config.ts](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/vite.config.ts#L1).
- TanStack Query is installed and mounted. See [package.json](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/package.json#L53) and [src/App.tsx](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/src/App.tsx#L5).
- Next.js is not present.
- Zustand is not present.

### Auth

- Clerk is present and is the active auth provider. See [package.json](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/package.json#L17), [src/main.tsx](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/src/main.tsx#L1), and [src/contexts/AuthContext.tsx](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/src/contexts/AuthContext.tsx#L1).

### Backend

- Convex is the active backend, database, scheduler, and file storage layer. See [package.json](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/package.json#L57), [src/lib/convex.ts](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/src/lib/convex.ts#L1), [convex/files.ts](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/convex/files.ts#L7), and [convex/crons.ts](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/convex/crons.ts#L1).

### AI

- Mistral is present, but via direct HTTP calls, not the Mistral SDK. See [convex/assistant.ts](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/convex/assistant.ts#L104) and [convex/rag.ts](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/convex/rag.ts#L77).
- Puter is present as the browser-first assistant provider. See [src/lib/puter.ts](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/src/lib/puter.ts#L1).
- LangChain is not present.

### Vector Search

- Qdrant is not present.
- Policy search currently uses Mistral embeddings plus app-side scoring and fallback search inside Convex logic. See [convex/rag.ts](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/convex/rag.ts#L10) and [convex/rag.ts](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/convex/rag.ts#L47).

### Storage

- Cloudflare R2 is not present.
- File uploads currently use Convex storage. See [convex/files.ts](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/convex/files.ts#L7) and [src/lib/convexUpload.ts](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/src/lib/convexUpload.ts#L5).

### Workers

- BullMQ is not present.
- Background work currently uses Convex crons and scheduler jobs. See [convex/crons.ts](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/convex/crons.ts#L1) and [convex/leave.ts](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/convex/leave.ts#L388).

### Monitoring

- Sentry is now present on the frontend and is configured by environment variables. See [package.json](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/package.json#L47), [src/lib/sentry.ts](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/src/lib/sentry.ts#L1), and [src/main.tsx](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/src/main.tsx#L1).
- The backend now records durable incident logs for high-value failures, but external alerting still needs follow-through. See [convex/backendIncidents.ts](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/convex/backendIncidents.ts#L1), [src/hooks/useAnalytics.ts](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/src/hooks/useAnalytics.ts#L9), and [convex/analytics.ts](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/convex/analytics.ts#L6).

## Mandatory Vs Optional Stack Items

| Item | Status In Repo | Mandatory For This App | Decision |
|---|---|---:|---|
| Next.js | Missing | No | Do not add for launch. The app is already a Vite SPA. Migrating frameworks now would create avoidable risk. |
| Zustand | Missing | No | Do not add for launch unless you identify a specific state-management problem that Context plus Convex plus React Query cannot handle cleanly. |
| TanStack Query | Present | No | Keep it if it is already useful, but it is not a launch blocker because Convex already handles most server-state patterns. |
| Clerk | Present | Yes | Mandatory unless you plan a full auth replacement. The app is already built around Clerk. |
| Convex | Present | Yes | Mandatory. The app backend, scheduler, storage, and auth integration all depend on it. |
| Mistral SDK | Missing | No | Not mandatory. You already have working Mistral integration via direct fetch. Use the SDK only if you want stronger typing or cleaner API ergonomics later. |
| LangChain | Missing | No | Not mandatory for launch. Current assistant and policy search logic are custom and already integrated with Convex. |
| Qdrant | Missing | No | Not mandatory right now. Your current policy search works without a dedicated vector DB. Add it only if retrieval scale or relevance becomes a real bottleneck. |
| Cloudflare R2 | Missing | No | Not mandatory right now. Convex storage already backs uploads and file URLs. Add R2 only if you need lower storage cost, CDN strategy, or large-object separation. |
| BullMQ | Missing | No | Not mandatory right now. Convex crons and scheduler already cover the current job workload. |
| Sentry | Present | Yes | Keep it enabled in production and finish alert rules. |

## What Is Actually Mandatory Before Production

### 1. Fix environment and secret drift

- The production env matrix is now documented in [docs/prod-env-matrix.md](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/docs/prod-env-matrix.md#L1), with matching examples in [.env.example](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/.env.example#L1) and [.env.production.example](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/.env.production.example#L1).
- The app currently hard-fails if critical frontend vars are missing. See [src/main.tsx](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/src/main.tsx#L8), [src/lib/convex.ts](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/src/lib/convex.ts#L3), and [src/components/StripeProvider.tsx](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/src/components/StripeProvider.tsx#L4).
- The backend env helper expects values that are not documented in `.env.example`, including `CLERK_WEBHOOK_SIGNING_SECRET`, `MISTRAL_API_KEY`, and `CONVEX_SITE_URL`. See [convex/lib/env.ts](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/convex/lib/env.ts#L1).

Mandatory action:

- set the documented frontend env values in the production host
- set the documented backend env values in Convex
- verify staging and production values match the documented contract

### 2. Fix the Clerk webhook docs and onboarding contract

- The webhook docs and env naming now align on `CLERK_WEBHOOK_SIGNING_SECRET`. See [README.md](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/README.md#L67), [.env.example](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/.env.example#L10), and [convex/lib/env.ts](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/convex/lib/env.ts#L5).
- The actual webhook route uses Clerk `verifyWebhook()` and now ignores duplicate deliveries. See [convex/http.ts](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/convex/http.ts#L176).

Mandatory action:

- re-test Clerk user provisioning in staging

### 3. Harden webhook entry points

- The biometrics webhook now accepts secrets only from headers or bearer auth, not the request body. See [convex/http.ts](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/convex/http.ts#L132).
- Both webhook routes now have HTTP rate limiting and replay protection. See [convex/http.ts](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/convex/http.ts#L102) and [convex/httpRateLimits.ts](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/convex/httpRateLimits.ts#L1).
- Assistant chat and tool calls still have their own rate limiting separately. See [convex/assistantRateLimits.ts](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/convex/assistantRateLimits.ts#L5).

Mandatory action:

- monitor webhook traffic after release and tune the configured limits if needed

### 4. Add production monitoring

- The repo now has frontend exception monitoring plus product analytics. See [src/lib/sentry.ts](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/src/lib/sentry.ts#L1), [src/hooks/useAnalytics.ts](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/src/hooks/useAnalytics.ts#L9), and [convex/analytics.ts](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/convex/analytics.ts#L6).
- Existing audit documents also call out measurement gaps. See [docs/product-measurement-audit.md](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/docs/product-measurement-audit.md#L53) and [docs/instrumentation-checklist.md](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/docs/instrumentation-checklist.md#L3).

Mandatory action:

- keep Sentry enabled in production
- monitor the new backend incident log for Convex-side exceptions
- alert on webhook failures, onboarding failures, assistant failures, email failures, and storage failures

### 5. Add production security headers

- The HTML shell does not define CSP or related hardening. See [index.html](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/index.html#L1).
- This matters more now because the app loads a third-party Puter script at runtime. See [src/lib/puter.ts](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/src/lib/puter.ts#L1).

Mandatory action:

- define CSP for the production host using [security-headers.md](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/docs/security-headers.md#L1)
- include explicit allowances for Clerk, Convex, Stripe, and Puter only where needed
- set `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`

### 6. Define a real deployment and rollback process

- The README now points to operator-grade deployment docs, including [docs/cloudflare-pages-deploy.md](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/docs/cloudflare-pages-deploy.md#L1), [docs/deploy-runbook.md](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/docs/deploy-runbook.md#L1), and [docs/staging-smoke-tests.md](C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/docs/staging-smoke-tests.md#L1).
- There is no obvious repo-level deployment config or CI workflow checked in.

Mandatory action:

- run the documented staging-to-prod checklist before launch
- define who owns secret rotation, webhook validation, and smoke testing
- add CI if you want automated release gates rather than manual operator checks

## Recommended But Not Mandatory Before Launch

- improve assistant observability for provider fallback and rate-limit events
- keep Stripe disabled unless you implement a real payment-intent backend. The current repo has Stripe primitives, but not a complete billing flow.
- revisit Qdrant, R2, BullMQ, or LangChain only after current architecture hits clear scale or product limits

## Final Recommendation

Do not add Next.js, Zustand, LangChain, Qdrant, R2, or BullMQ just to look more production-grade. None of those are mandatory for this repo's current architecture, and adding them now would mostly increase migration risk.

The mandatory production stack for the app as it exists is:

- React + Vite
- Clerk
- Convex
- Mistral integration for AI features
- Sentry

If Puter remains part of the AI strategy, keep:

- Puter with a feature flag
- Mistral fallback
- server-side tool execution through Convex
