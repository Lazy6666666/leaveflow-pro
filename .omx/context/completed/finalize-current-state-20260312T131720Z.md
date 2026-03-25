Task statement

Finalize the current accumulated work in `leaveflow-pro` using OMX team mode. Scope is limited to stabilizing the current working tree, verifying the Phase 2 admin operationalization changes, reconciling context-folder organization, and closing any obvious remaining gaps in the touched files without broad new feature work.

Desired outcome

- Validate and finalize the current Phase 2 admin reporting and policy knowledge management changes.
- Confirm the current Mistral/assistant/RAG changes still integrate cleanly with the repo state.
- Preserve the recent context-folder cleanup (`completed/`, `partial/`, `obsolete/`) and ensure only the intended files remain active.
- Run practical verification and document what still cannot be fully verified.
- Do not revert unrelated dirty user changes.

Known facts and evidence

- Current branch is `feature/selfie-checkin-local-final`.
- The repo is in a dirty state with modified files including `.env`, `.omx/state/*`, `convex/_generated/api.d.ts`, `src/lib/convexTypes.ts`, `src/pages/admin/Policies.tsx`, and `src/pages/admin/Reports.tsx`.
- Current context folder organization is:
  - active: `backend-cleanup`, `type-errors`, `web-guidelines-remediation`
  - completed: `ai-scaling-implementation`, `mistral-ai-integration`, `phase2-admin-operationalization`
  - partial: `quality-review-fixes`, `supabase-convex-migration`
  - obsolete: `convex-clerk-migration`, `remaining-issues`
- `npx tsc --noEmit` passed against the current workspace after Phase 2 changes.
- Focused tests `npx vitest run convex/lib/aiScaling.test.ts` passed (3 tests).
- Bounded eslint attempts against touched files have timed out previously without printing diagnostics.
- A previous OMX team run already implemented `Policies.tsx` and `Reports.tsx` enhancements and shut down cleanly.
- The current tmux leader pane is `%1` and HUD pane is `%17`.

Constraints

- Use OMX team mode via `omx team ...`, not in-process delegation.
- Prefer finishing and verifying the current work over expanding scope.
- Avoid destructive cleanup outside the explicit context organization already performed.
- Do not revert unrelated dirty state such as `.env` and repo-local OMX runtime files.

Unknowns and open questions

- Whether the modified `convex/_generated/api.d.ts` should be regenerated in this pass or left as-is if typecheck is already green.
- Whether there are any latent runtime issues in `Policies.tsx` or `Reports.tsx` that only show up in a full app run rather than `tsc`.
- Whether current lint/test timeouts reflect baseline repo slowness or a new regression in the touched areas.

Likely codebase touchpoints

- `src/pages/admin/Policies.tsx`
- `src/pages/admin/Reports.tsx`
- `src/lib/convexTypes.ts`
- `convex/rag.ts`
- `convex/_generated/api.d.ts`
- `.omx/context/*`
- `.omx/state/*`
