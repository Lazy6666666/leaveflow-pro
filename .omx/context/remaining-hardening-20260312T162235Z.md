Task statement

Execute the remaining practical hardening work in `leaveflow-pro` using OMX team mode. Scope is limited to strengthening automated verification around the newly added AI surfaces and updating docs so they no longer describe already-completed items as future work.

Desired outcome

- Improve automated verification for the new AI Workspace / AI UI surfaces.
- Keep Mistral/AI scaling docs aligned with the current implemented state.
- Preserve current behavior and avoid broad new feature work.
- Keep all work directly in this repository.

Known facts and evidence

- `AIWorkspace.tsx` now exists and is routed via `/ai-workspace`.
- `AIChatPanel.tsx` supports embedded mode and source badges.
- `src/pages/AIWorkspace.test.tsx` already exists but has not been verified yet.
- Existing automated test coverage includes:
  - `src/pages/requestLeaveDuration.test.ts`
  - `src/test/example.test.ts`
  - `convex/lib/aiScaling.test.ts`
- Docs still contain future-hardening notes that were valid earlier but may now be outdated, especially around the AI Workspace recommendation.
- `npx tsc --noEmit` has already passed on the current workspace.

Constraints

- Use OMX team mode via `omx team ...`, not in-process delegation.
- Do not revert unrelated dirty files.
- Avoid broad new feature development; focus on hardening, tests, and doc alignment.
- Respect repo rule to work only in this repository and current branch.

Unknowns and open questions

- Whether the existing `AIWorkspace.test.tsx` is complete, passing, or still skeletal.
- Whether any additional helper extraction is needed to make AI workspace behavior testable without changing visible behavior.
- Which doc statements are now stale versus still legitimate future work.

Likely codebase touchpoints

- `src/pages/AIWorkspace.tsx`
- `src/pages/AIWorkspace.test.tsx`
- `src/components/AIChatPanel.tsx`
- `docs/ai_scaling_implementation_plan.md`
- `docs/mistral_ai_integration_analysis.md`
- `vitest.config.ts`
