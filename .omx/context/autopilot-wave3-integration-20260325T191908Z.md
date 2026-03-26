# Context Snapshot — autopilot Wave 3 integration

## Task statement
Autonomously continue from the current staged roadmap state by integrating and verifying the already-landed Wave 3 slices in `leaveflow-pro`.

## Desired outcome
Finish the practical local workflow for:
- reviewing the Wave 3 expenses slice
- reviewing the Wave 3 policy acknowledgements + integrations slice
- running the highest-signal verification path that this workspace supports
- surfacing what remains blocked by environment or external auth

## Known facts / evidence
- Existing staged plan artifacts:
  - `.omx/plans/prd-all-features-staged-execution.md`
  - `.omx/plans/test-spec-all-features-staged-execution.md`
  - `.omx/plans/prd-wave3-operational-controls-and-ai-feed.md`
  - `.omx/plans/test-spec-wave3-operational-controls-and-ai-feed.md`
- Wave 3 expenses slice appears present in repo:
  - `convex/expenses.ts`
  - `src/components/expenses/*`
  - `src/pages/IdentityHub.tsx`
  - `src/pages/manager/ManagerHub.tsx`
  - `src/lib/wave3Api.ts`
- Wave 3 policy/integrations slice appears present in repo:
  - `convex/policyAcknowledgements.ts`
  - `convex/integrations.ts`
  - `src/components/policies/*`
  - `src/components/integrations/*`
  - `src/pages/admin/Policies.tsx`
  - `src/pages/admin/SystemHub.tsx`
- Wave 2 codegen/type debt is already addressed in code by updating `convex/_generated/api.d.ts` and removing `wave1Api` / `wave2Api` casts.
- Known workspace behavior:
  - targeted `vitest` can pass when invoked through `vitest.mjs` with `--environment=jsdom --pool=vmThreads --maxWorkers=1`
  - plain `vitest`, `eslint`, and `vite build` may hang or time out in this workspace
  - `npx convex codegen` fails with `401 MissingAccessToken`

## Constraints
- Repo AGENTS forbids git worktrees.
- Do not revert unrelated dirty changes.
- Favor local integration over more tmux-team retries unless a new multi-lane need clearly appears.
- Treat remaining build/codegen/auth issues as environment debt if they cannot be resolved from local code.

## Unknowns / open questions
- Whether the Wave 3 slices have behavioral bugs that the worker lanes did not surface.
- Whether the `vite build` hang is code-triggered or purely workspace/filesystem/plugin latency.
- Whether any of the large worker-written replacements (especially `src/pages/admin/Policies.tsx`) need simplification before acceptance.

## Likely codebase touchpoints
- `convex/expenses.ts`
- `convex/policyAcknowledgements.ts`
- `convex/integrations.ts`
- `convex/schema.ts`
- `convex/lib/types.ts`
- `src/lib/convexTypes.ts`
- `src/lib/wave3Api.ts`
- `src/components/expenses/*`
- `src/components/policies/*`
- `src/components/integrations/*`
- `src/pages/admin/Policies.tsx`
- `src/pages/admin/SystemHub.tsx`
- `src/pages/IdentityHub.tsx`
- `src/pages/manager/ManagerHub.tsx`
