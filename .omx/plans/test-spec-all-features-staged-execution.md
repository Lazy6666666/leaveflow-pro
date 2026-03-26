# Test Spec — Remaining Roadmap Execution Beyond Phase 0

## Status
- Complements: `.omx/plans/prd-all-features-staged-execution.md`
- Scope: verification contract for multi-wave delivery beyond Phase 0

## Objective
Define what must be proven at the roadmap level and at each wave boundary before further rollout continues.

## Global Verification Rules
1. each wave must be verifiable independently
2. no next wave begins until the current wave has passing evidence
3. all shared shell/backend regressions touched by a wave must be rerun before sign-off
4. final Ralph verification remains mandatory after each team delivery wave

## Required Evidence Per Wave

### Static verification
- `npx tsc --noEmit` passes
- targeted eslint on touched files returns no errors
- diagnostics on touched TS files show zero errors

### Automated tests
- targeted vitest passes for all touched domains/components
- approval/permission flows are tested where applicable
- shell regressions are rerun when AppLayout/AppSidebar/navigation are touched

### Build verification
- `npm run build` succeeds after each wave

### Manual verification
- primary actor happy path for each new domain
- permission visibility and restricted action checks
- no duplicate flow introduced where an existing flow should be reused

## Wave-specific proof requirements

### Wave 1 — Recruitment + Onboarding
- **Required backend surfaces**
  - recruiter queries/mutations exist for jobs and candidates
  - onboarding queries/mutations exist for templates, assignments, and completion state
  - schema additions are additive and isolated to Wave 1 entities
- **Required route / UI proof**
  - recruiter/admin can reach the Wave 1 route entry from the intended admin/hub surface
  - jobs list/detail/create flow renders without breaking existing admin hubs
  - candidate stage transitions are visible in the UI and persisted
  - onboarding template creation and assignment flow renders and saves
  - assigned onboarding tasks can be viewed and marked complete by the intended actor
- **Required permission proof**
  - employee/new-hire does not see recruiter-only controls
  - manager sees only the onboarding scope intentionally granted to them
  - hr-admin/recruiter visibility is distinct from employee routes
- **Required regression proof**
  - AppLayout/AppSidebar/navigation regressions rerun if any Wave 1 navigation entry is added
  - no regression to current leave, attendance, or identity routes
- **Manual rollback check**
  - recruiter/onboarding route entries can be hidden or disabled without breaking existing production routes

### Wave 2 — Reviews + Training + Certifications
- review cycle creation and completion path validated
- training assignment and completion path validated
- certification creation/expiry/reminder logic validated
- employee vs manager/admin visibility validated

### Wave 3 — Expenses + Policy Signatures + Integrations + AI Feed
- expense submit/approve/reject path validated
- policy acknowledgement assignment/status validated
- integrations settings surface renders without breaking admin areas
- AI feed suggestions obey role-aware visibility and do not bypass safeguards

### Wave 4 — Mobile Attendance
- mobile attendance core action validated on representative viewport/device config
- no regression to current attendance history path
- any biometric/location/QR additions have explicit fallback behavior

## Team Execution Verification Contract
Before `omx team shutdown <team>`:
- `pending=0`
- `in_progress=0`
- `failed=0`
- completion evidence captured in mailbox/state

## Ralph Verification Contract
After team completes a wave, Ralph must verify:
- fresh test run output
- fresh build output
- fresh diagnostics
- architect-grade review evidence or equivalent explicit verification lane result
- deslop pass on changed files, followed by regression rerun

## Stop Conditions
Halt rollout if any of the following occur:
- schema/data model instability blocks multiple domains in the same wave
- permission model ambiguity affects user-visible access control
- build/test time becomes too large for bounded verification
- team runtime cannot sustain reliable worker progress for the chosen wave size

## Recommended Immediate Test Spec Follow-up
Generate a dedicated Wave 1 test spec before implementing Wave 1.

## Wave 1 implementation checklist for execution handoff
- [ ] dedicated Wave 1 backend modules named and created
- [ ] schema additions limited to jobs, candidates, stage history, onboarding templates, onboarding assignments
- [ ] recruiter route/tab entry added
- [ ] onboarding route/tab entry added
- [ ] recruiter happy path test added
- [ ] onboarding assignment/completion test added
- [ ] permission visibility tests added
- [ ] targeted AppLayout/AppSidebar regression tests rerun if nav changed
- [ ] `npx tsc --noEmit` passes
- [ ] targeted eslint returns no errors
- [ ] `npm run build` passes
