# Context Snapshot — Wave 3 policy + integrations slice

## Task statement
Continue Wave 3 after the expenses slice by implementing the next bounded slice: policy acknowledgements and integrations settings/status.

## Desired outcome
Start a stable single-lane team run that delivers the policy acknowledgement workflow plus integrations settings/status surface without touching unrelated Wave 3 domains.

## Known facts / evidence
- Wave 3 PRD: `.omx/plans/prd-wave3-operational-controls-and-ai-feed.md`
- Wave 3 test spec: `.omx/plans/test-spec-wave3-operational-controls-and-ai-feed.md`
- The expenses slice is already implemented in the repo and the prior team was shut down cleanly.
- Existing policy knowledge/document management already exists in `src/pages/admin/Policies.tsx` and `convex/rag.ts`.
- Integrations settings do not yet exist as a bounded admin/system surface.

## Constraints
- Repo AGENTS forbids git worktrees.
- Direct-in-repo edits only.
- Keep the slice bounded to policy acknowledgements + integrations settings/status.
- Preserve Waves 1-2 and the Wave 3 expenses work already present.
- Keep schema changes additive only.

## Likely touchpoints
- `convex/policyAcknowledgements.ts`
- `convex/integrations.ts`
- `convex/schema.ts`
- `src/components/policies/*`
- `src/components/integrations/*`
- `src/pages/admin/SystemHub.tsx`
- `src/pages/admin/Policies.tsx`
- `src/lib/wave3Api.ts`
