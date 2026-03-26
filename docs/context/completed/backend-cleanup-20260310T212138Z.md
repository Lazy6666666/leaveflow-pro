Task statement

Run a separate multi-agent backend cleanup pass after the remaining-issues parity work. Focus on Convex backend wiring, removing `any` usage, and replacing loose env access with explicit typed helpers/vars.

Desired outcome

- Reduce or remove `@typescript-eslint/no-explicit-any` usage across the Convex backend.
- Normalize env access instead of scattered `process.env` / `globalThis` shims.
- Keep behavior unchanged while improving typing and backend structure.
- Preserve current passing verification on typecheck, tests, and build.

Known facts / evidence

- Remaining-issues team run is complete and cleaned up.
- Current verification before this pass:
  - `npx convex codegen --typecheck disable`: pass
  - `npx tsc --noEmit`: pass
  - `npm run test`: pass
  - `npm run build`: pass
- Convex backend file set includes:
  - `convex/auth.config.ts`
  - `convex/files.ts`
  - `convex/absenceNotifications.ts`
  - `convex/notifications.ts`
  - `convex/notificationScheduler.ts`
  - `convex/crons.ts`
  - `convex/admin.ts`
  - `convex/attendance.ts`
  - `convex/leave.ts`
  - `convex/manager.ts`
  - `convex/http.ts`
  - `convex/users.ts`
  - `convex/lib/auth.ts`
  - `convex/lib/types.ts`
- Env access is currently scattered across:
  - `convex/auth.config.ts`
  - `convex/admin.ts`
  - `convex/absenceNotifications.ts`
  - `convex/notificationScheduler.ts`

Constraints

- Disjoint file ownership across agents.
- Do not revert unrelated app changes.
- Keep backend behavior stable; this is a cleanup/refinement pass, not a feature rewrite.

Suggested split

- Agent 1: `convex/lib/auth.ts`, `convex/users.ts`, `convex/files.ts`, plus one shared env/types helper under `convex/lib/` if needed.
- Agent 2: `convex/absenceNotifications.ts`, `convex/notifications.ts`, `convex/notificationScheduler.ts`, `convex/crons.ts`.
- Agent 3: `convex/admin.ts`, `convex/attendance.ts`, `convex/leave.ts`, `convex/manager.ts`, `convex/http.ts`, `convex/auth.config.ts`.
