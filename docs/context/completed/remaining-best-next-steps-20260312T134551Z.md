Task statement

Execute the remaining best next steps in `leaveflow-pro` using OMX team mode. This run should focus on backend/type cleanup and validation of the newly added Phase 2 admin policy/reporting surfaces, while preserving the current context-folder organization and unrelated dirty worktree state.

Desired outcome

- Advance the active backend/type cleanup work without broad new feature scope.
- Verify and stabilize the current `Policies.tsx` and `Reports.tsx` changes.
- Preserve the current `.omx/context` organization (`active`, `completed`, `partial`, `obsolete`) and unrelated repo changes.
- Produce practical verification evidence for the current state.

Known facts and evidence

- Current branch is `feature/selfie-checkin-local-final`.
- Current working tree is dirty in `.env`, `.omx/state/*`, `convex/_generated/api.d.ts`, `convex/assistant.ts`, `convex/lib/env.ts`, `src/lib/convexTypes.ts`, `src/pages/admin/Policies.tsx`, `src/pages/admin/Reports.tsx`, plus unrelated landing/remotion files.
- The assistant is now using direct Mistral chat completions and the user confirmed the in-app assistant is working properly.
- Active context files currently left in the top-level repo context folder are:
  - `backend-cleanup-20260310T212138Z.md`
  - `type-errors-20260310T215918Z.md`
  - `web-guidelines-remediation-20260311T143638Z.md`
- Completed/partial/obsolete context buckets were already created and populated.
- `npx tsc --noEmit` previously passed after the Mistral/Phase 2 changes.
- Focused tests `npx vitest run convex/lib/aiScaling.test.ts` previously passed.
- Repo-local eslint on touched files has previously timed out without diagnostics.

Constraints

- Use OMX team mode via `omx team ...`, not in-process fanout.
- Do not revert unrelated dirty files.
- Prefer bounded cleanup and verification over large new features.
- Preserve the current context-folder organization unless a worker finds a concrete issue with it.

Unknowns and open questions

- Whether `convex/_generated/api.d.ts` needs regeneration in this pass or can be left untouched if typecheck remains green.
- Whether any runtime issues remain in `Policies.tsx` / `Reports.tsx` that are not visible from typecheck alone.
- Whether the current lint timeout is baseline repo behavior or indicates a touched-file regression.

Likely codebase touchpoints

- `convex/lib/env.ts`
- `convex/admin.ts`
- `convex/rag.ts`
- `src/lib/convexTypes.ts`
- `src/pages/admin/Policies.tsx`
- `src/pages/admin/Reports.tsx`
- `.omx/context/*`
