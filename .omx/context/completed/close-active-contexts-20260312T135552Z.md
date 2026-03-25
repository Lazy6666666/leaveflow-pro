Task statement

Use OMX team mode to finalize the remaining active context plans in `leaveflow-pro`, close them based on the current repo state, and move them into the completed bucket. Work directly in the current repository only.

Desired outcome

- Assess the remaining active plans against the current codebase and verification evidence.
- Finalize the active plans if the current repo state is sufficient.
- Move all remaining top-level context plans into `completed/`.
- Preserve current code changes and unrelated dirty files.
- Shut the team down cleanly after terminal task completion.

Known facts and evidence

- Current top-level active context files are:
  - `backend-cleanup-20260310T212138Z.md`
  - `type-errors-20260310T215918Z.md`
  - `web-guidelines-remediation-20260311T143638Z.md`
  - plus finalization bookkeeping snapshots
- The repo already contains completed/partial/obsolete context buckets.
- Current worktree is dirty with:
  - backend changes in `convex/absenceNotifications.ts`, `convex/assistant.ts`, `convex/auth.config.ts`, `convex/lib/env.ts`, `convex/notificationScheduler.ts`
  - Phase 2 UI/reporting changes in `src/pages/admin/Policies.tsx`, `src/pages/admin/Reports.tsx`, `src/lib/convexTypes.ts`
  - existing runtime state files in `.omx/state/*`
- Recent verification evidence already available:
  - `npx tsc --noEmit`: pass
  - `npx eslint convex/assistant.ts convex/lib/env.ts src/lib/convexTypes.ts --max-warnings=0`: pass
  - `npx eslint src/pages/admin/Reports.tsx`: pass
  - `npx vitest run convex/lib/aiScaling.test.ts`: pass
- The user explicitly wants the remaining incomplete tasks finalized and all top-level context plans moved to completed.

Constraints

- Use OMX team mode via `omx team ...`, not in-process delegation.
- Do not create extra worktrees or side repos.
- Preserve unrelated dirty files and the current repo state.
- Prefer closing plans based on current evidence over opening new large feature work.

Unknowns and open questions

- Whether any of the 3 active plans still have a truly missing implementation gap that would block moving them to completed.
- Whether current repo-wide lint/test instability should be treated as blocking or as known residual noise.

Likely codebase touchpoints

- `.omx/context/*`
- `convex/lib/env.ts`
- `convex/assistant.ts`
- `convex/absenceNotifications.ts`
- `convex/auth.config.ts`
- `convex/notificationScheduler.ts`
- `src/pages/admin/Policies.tsx`
- `src/pages/admin/Reports.tsx`
- `src/lib/convexTypes.ts`
