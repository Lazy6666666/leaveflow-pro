# RALPLAN-DR — Fix Remaining Issues

## Scope
Fix the remaining correctness/security issues without reopening completed Wave 3/4 feature scope:
- narrow the Convex document typing in `convex/expenses.ts` and `convex/policyAcknowledgements.ts`
- address the offline selfie persistence risk in the mobile attendance flow
- remediate the `react-router-dom` advisory with the smallest safe upgrade
- classify `apps/mobile/tsconfig.json` failures into fix-now vs known debt

## Principles
1. Fix correctness and security first, not new features.
2. Prefer the smallest viable diff that removes real risk.
3. Separate slice-local defects from broader repo debt.
4. Do not re-open architecture unless a blocker forces it.
5. Every fix must end with fresh, command-backed verification.

## Decision Drivers
1. Current remaining issues are concentrated, not broad-product scope.
2. Some failures are real defects in newly-added code; others are pre-existing repo debt and must be isolated.
3. The safest finish path is sequential: remove real blockers, then reclassify residual debt honestly.

## Viable Options
### Option A — Broad repo cleanup first
- Pros: may reduce overall noise.
- Cons: highest scope creep; delays the specific fixes the review already identified.

### Option B — Targeted issue remediation first, then debt classification
- Pros: smallest diff, fastest credible finish, easiest to verify.
- Cons: leaves some broader repo debt intact if it is not caused by the new slices.

### Option C — Defer all fixes and document only
- Pros: lowest immediate churn.
- Cons: leaves known security/correctness issues unresolved; not acceptable as a finish plan.

## Recommended Decision
Choose **Option B**.

## ADR
### Decision
Apply a narrow, sequential remediation plan: fix the two concrete code issues and the dependency advisory first, then classify the remaining mobile typecheck failures into fix-now vs accepted debt.

### Drivers
- slice-local correctness issue in newly-added Convex modules
- clear privacy/security issue around offline selfie persistence
- known dependency advisory on a routing package used across the app
- need to avoid turning finalization into open-ended repo cleanup

### Alternatives considered
- Broad repo cleanup first | rejected because it expands scope beyond the named issues
- Documentation-only closeout | rejected because it leaves known issues unfixed

### Why chosen
It resolves the actionable defects with the least risk and gives a truthful boundary around whatever debt remains.

### Consequences
- The finish is narrower and more defensible.
- Some repo-wide mobile typecheck debt may remain after the slice-local fixes are done.

### Follow-ups
- If mobile typecheck still fails after the targeted fixes, record the remaining items as repo debt, not wave failure.

## File-Level Workstreams
### Workstream 1 — Convex typing correction
- Files:
  - `convex/expenses.ts`
  - `convex/policyAcknowledgements.ts`
  - optional supporting types from `convex/_generated/dataModel.d.ts`
- Change:
  - replace widened `Awaited<ReturnType<QueryCtx["db"]["get"]>>`-style aliases with concrete generated table doc types (`Doc<"expenses">`, `Doc<"policyAcknowledgements">`) or explicit serialized shapes
- Acceptance criteria:
  - no property-access errors from widened unions in these modules
  - serializers and helpers compile with concrete field access

### Workstream 2 — Offline selfie persistence hardening
- Files:
  - `apps/mobile/src/hooks/useEmployeeDashboardData.ts`
  - `apps/mobile/src/lib/mobileSelfieStorage.ts`
  - `apps/mobile/src/hooks/useMobileOfflineQueue.ts`
  - `apps/mobile/src/components/attendance/AttendanceCaptureModal.tsx`
- Change:
  - preferred: block offline queueing when selfie verification is required
  - fallback option only if required by product constraint: keep offline selfie retention but add strict deletion/retention controls
- Acceptance criteria:
  - raw selfie files are not silently retained indefinitely for offline replay
  - blocked/offline path gives explicit user-facing guidance
  - tests cover blocked selfie-offline behavior

### Workstream 3 — Router advisory remediation
- Files:
  - `package.json`
  - `package-lock.json`
  - affected route smoke tests if needed
- Change:
  - upgrade `react-router-dom` (and lockfile) to the smallest patched version that clears the advisory
- Acceptance criteria:
  - dependency tree no longer reports the known router advisory
  - route tests/build still pass

### Workstream 4 — Mobile tsconfig classification
- Files:
  - `apps/mobile/tsconfig.json`
  - mobile files touched by the Wave 4 slice
  - any failing files identified by `npx tsc --noEmit -p apps/mobile/tsconfig.json`
- Change:
  - separate failures into:
    - directly caused by new Wave 4 changes -> fix now
    - clearly pre-existing / unrelated repo debt -> document and defer
- Acceptance criteria:
  - Wave 4-added files are clean under diagnostics/typecheck
  - residual failures, if any, are explicitly classified and linked to unrelated files

## Explicit Sequencing
1. Fix Workstream 1 first.
2. Fix Workstream 2 second.
3. Upgrade router dependency in Workstream 3.
4. Re-run targeted verification.
5. Run `apps/mobile/tsconfig` and classify remaining failures in Workstream 4.
6. Only then decide whether any additional repo cleanup is necessary.

## Verification Steps
- `npx tsc --noEmit`
- `npx tsc --noEmit -p apps/mobile/tsconfig.json`
- targeted tests:
  - Convex unit tests for expenses/policy acknowledgements
  - mobile attendance fallback tests
  - affected route/component tests
- `npm run build`
- dependency verification:
  - `npm audit --omit=dev --audit-level=high`

## Team / Ralph Guidance
### Available agent types
- `executor`
- `debugger`
- `test-engineer`
- `security-reviewer`
- `code-reviewer`

### Recommended execution mode
- Prefer **direct local execution or `$ralph`**, not `$team`, for this fix set.
- Reason: the remaining issues are tightly coupled and sequential; team workers already spent time blocked on the same verification surface.

### If a team is still required
- Lane 1 — `executor`: Convex typing + offline selfie handling
- Lane 2 — `test-engineer`: targeted tests + mobile tsconfig classification
- Lane 3 — `security-reviewer`: router advisory + privacy review

### Verification path
- complete Workstreams 1-3
- rerun targeted tests and builds
- classify `apps/mobile` residual failures
- final code review + security check before closeout
