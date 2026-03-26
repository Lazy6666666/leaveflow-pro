# Context Snapshot — fix remaining issues

## Task statement
Create a consensus plan to fix the remaining issues after the staged Wave 3 and Wave 4 implementation work landed.

## Desired outcome
Produce a concrete, testable fix plan for the remaining correctness, security, and verification issues without reopening already-complete product scope.

## Known facts / evidence
- Wave 3 expenses, policy acknowledgements, integrations, and AI feed slices are implemented.
- Wave 4 mobile attendance fallback work is implemented.
- Broad app typecheck, targeted Wave 3 tests, and build have passed in the main thread.
- Targeted Wave 4 mobile tests and lint have passed.
- A review surfaced a concrete typing issue:
  - `convex/expenses.ts`
  - `convex/policyAcknowledgements.ts`
  use overly broad `Awaited<ReturnType<QueryCtx["db"]["get"]>>`-style document typing, which widens incorrectly under generated Convex types.
- A security review surfaced:
  - `react-router-dom` version has an advisory path and should be upgraded
  - offline selfie persistence in the mobile attendance flow may retain raw biometric files on-device longer than acceptable
- Repo-level verification debt remains:
  - `npx tsc --noEmit -p apps/mobile/tsconfig.json` still reports broader errors outside the new Wave 4 slice

## Constraints
- Keep scope bounded to fixes for the remaining issues; do not reopen unrelated feature work.
- Preserve the delivered Wave 3 and Wave 4 behavior unless the fix requires a narrow adjustment.
- Prefer minimal, reviewable diffs.
- No git worktrees.

## Unknowns / open questions
- Whether the router advisory fix is a straightforward dependency bump or requires route-level follow-up.
- Whether offline selfie persistence should be removed entirely for unsupported/offline cases or kept with stricter retention controls.
- Which mobile typecheck failures are truly pre-existing versus newly exposed by the latest generated types.

## Likely codebase touchpoints
- `package.json`
- `package-lock.json`
- `convex/expenses.ts`
- `convex/policyAcknowledgements.ts`
- `apps/mobile/src/hooks/useEmployeeDashboardData.ts`
- `apps/mobile/src/lib/mobileSelfieStorage.ts`
- `apps/mobile/src/hooks/useMobileOfflineQueue.ts`
- `apps/mobile/src/components/attendance/AttendanceCaptureModal.tsx`
- `apps/mobile/tsconfig.json`
