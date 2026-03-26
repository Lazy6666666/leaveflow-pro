# Test Spec — Wave 3 Operational Controls + Integrations + AI Feed

## Objective
Define the verification contract for the Wave 3 operational controls slice.

## Required backend proof
- expense queries/mutations exist for submit/list/approve/reject
- policy acknowledgement queries/mutations exist for assign/status tracking
- integrations settings/status query surface exists
- any AI feed backend hooks stay inside existing assistant permission boundaries

## Required route / UI proof
- employees can reach expense submission/status UI from the intended surface
- admins/managers can reach approval UI
- policy acknowledgement assignment/status UI renders and saves
- integrations settings/status surface renders without breaking admin areas
- AI action feed renders with scoped suggestion/action states

## Required permission proof
- employee expense view is scoped to the current user
- approval controls do not appear on employee-only surfaces
- integrations settings remain admin-only
- AI action feed does not expose restricted suggestions outside role scope

## Regression proof
- no regression to Wave 1 Recruitment/Onboarding tabs
- no regression to Wave 2 Reviews/Training/Certifications tabs
- no regression to existing HR/System hub routes touched by Wave 3 nav changes

## Static verification
- `npx tsc --noEmit`
- targeted eslint on touched files with zero errors
- diagnostics on touched TS/TSX files show zero errors

## Automated tests
- expense submission/approval tests
- policy acknowledgement assignment/status tests
- integrations surface render test
- AI feed visibility test

## Build proof
- `npm run build` succeeds

## Manual checks
- employee happy path: submit expense -> see pending status
- admin/manager happy path: approve or reject expense
- policy happy path: assign acknowledgement -> employee sees status
- integrations surface shows expected placeholders/status blocks without broken navigation
