# Test Spec — Wave 1 Recruitment + Onboarding

## Objective
Define the concrete verification contract for Wave 1 execution.

## Required backend proof
- `convex/recruitment.ts` exposes the queries/mutations needed for jobs, candidates, and stage progression
- `convex/onboarding.ts` exposes the queries/mutations needed for templates, assignments, and completion state
- schema additions are additive and isolated to Wave 1 entities

## Required route / UI proof
- admin/recruiter can reach Wave 1 entry points from the intended existing admin surface
- jobs list/detail/create flow renders
- candidate stage transitions update visibly
- onboarding template creation and assignment flow renders
- assigned onboarding tasks are viewable and completable by the intended actor

## Required permission proof
- employee/new-hire cannot see recruiter/admin-only controls
- manager access is limited to explicitly intended onboarding scope
- hr-admin/recruiter views expose Wave 1 management controls

## Required regression proof
- rerun AppLayout/AppSidebar/navigation regression tests if nav is touched
- no regression to leave, attendance, identity, and existing admin hub routes

## Static verification
- `npx tsc --noEmit`
- targeted eslint on touched files with zero errors
- diagnostics on touched TS/TSX files show zero errors

## Automated tests
- targeted vitest for recruitment/onboarding components and routes
- permission visibility tests
- navigation regression tests if Wave 1 entry points are added

## Build proof
- `npm run build` succeeds

## Manual checks
- recruiter happy path: create job -> create candidate -> move candidate stage
- onboarding happy path: create template -> assign tasks -> mark task complete
- rollback sanity: Wave 1 route entries can be removed without breaking current shell routes
