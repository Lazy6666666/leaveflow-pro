Task statement:
Review backend_migration_gap_analysis.md.resolved and production_readiness_analysis.md.resolved, then implement the highest-value production backend fixes and cleanups in leaveflow-pro using OMX team mode.

Desired outcome:
- Add missing recurring biometrics sync automation.
- Add a server-side onboarding path so Clerk-created users can be provisioned without relying only on the browser.
- Remove the unsafe fallback for CONVEX_SITE_URL in biometrics connection messaging.
- Keep changes scoped, production-oriented, and verifiable.

Known facts/evidence:
- `convex/crons.ts` only schedules pending approval digest and daily attendance automation.
- `convex/http.ts` only exposes `/biometrics/webhook`; no Clerk onboarding route exists.
- `convex/users.ts` provisions profiles/roles/balances only through `ensureCurrentUser`, which requires an authenticated client request.
- `convex/admin.ts` already contains pull adapters including HikVision and already tracks sync status/record counts.
- `convex/admin.ts` uses `getEnv(\"CONVEX_SITE_URL\") ?? getEnv(\"VITE_CONVEX_SITE_URL\") ?? \"your-convex-site-url\"`, which is not production-safe.
- No `svix` package is currently installed for Clerk webhook signature verification.

Constraints:
- Respect existing dirty worktree; do not revert unrelated changes.
- Use tmux-based OMX team workflow, not in-process delegation.
- Prefer backend production fixes over broader feature work like payment backend or AI reimplementation.
- Keep worker scopes disjoint to reduce merge conflict risk.

Unknowns/open questions:
- Whether the preferred Clerk server-to-server path should use Svix verification or a simpler secret-gated route.
- Whether biometrics sync cadence should be daily or more frequent based on `syncFrequencyMinutes`.
- Whether current Convex deployment/env already has required Clerk webhook configuration.

Likely codebase touchpoints:
- `leaveflow-pro/convex/http.ts`
- `leaveflow-pro/convex/users.ts`
- `leaveflow-pro/convex/crons.ts`
- `leaveflow-pro/convex/admin.ts`
- `leaveflow-pro/convex/lib/env.ts`
- `leaveflow-pro/package.json`
