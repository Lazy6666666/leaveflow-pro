# PRD — Wave 3 Operational Controls + Integrations + AI Feed

## Status
- Derived from `.omx/plans/prd-all-features-staged-execution.md`
- Execution mode: `$team` then `$ralph`
- Scope: third roadmap wave only

## Objective
Add the next bounded operations slice by introducing:
1. employee expense submission and approval flow
2. policy acknowledgement assignment and tracking
3. integrations settings/status surface
4. AI suggestions and action feed that stays inside existing permission boundaries

## In scope
- expense categories and expense records
- expense approval/rejection state
- policy documents/assignments/acknowledgement state
- integrations settings cards with configuration/status placeholders
- AI action feed UI backed by existing assistant infrastructure or clearly scoped placeholders
- admin-facing management UI in existing admin/system surfaces

## Out of scope
- real third-party integrations execution
- payment or reimbursement disbursement
- policy document file storage redesign
- broad assistant architecture rewrites
- Wave 4 mobile attendance work

## Wave 3 architecture contract

### Frontend boundaries
- keep expense and policy flows inside existing admin/system hub surfaces
- create new domain components under:
  - `src/components/expenses/*`
  - `src/components/policies/*`
  - `src/components/integrations/*`
  - `src/components/ai-feed/*`
- prefer tab/panel additions to existing admin hubs over new top-level shells
- do not spread Wave 3 logic into unrelated attendance/payroll/recruitment modules

### Backend boundaries
- add dedicated Convex modules as needed:
  - `convex/expenses.ts`
  - `convex/policyAcknowledgements.ts`
  - `convex/integrations.ts`
  - optional `convex/aiActionFeed.ts` only if a dedicated module is clearly justified
- keep schema additions additive and limited to:
  - expenses
  - expense approvals
  - policy acknowledgement records
  - integrations settings/status records
  - AI action feed records if persisted

### Permissions
- employees can submit expenses and view their own expense status
- managers/hr-admin approve or reject expenses according to existing role boundaries
- policy acknowledgements are assignable and viewable only by intended admin/employee scopes
- integrations settings remain admin-only
- AI action feed must not bypass existing assistant visibility/role controls

## Rollout / rollback boundary
- Wave 3 tabs and routes must be removable without breaking Waves 1-2 or existing admin flows
- schema changes are additive only
- integrations settings may remain placeholder-backed if the UI and state contract are explicit
- if AI feed wiring destabilizes assistant flows, revert only the Wave 3 feed surface

## Delivery lanes
- Lane 1 — expenses + approvals workflow
- Lane 2 — policy acknowledgements + integrations settings
- Lane 3 — AI feed + tests/regression verification

## Acceptance criteria
- employees can submit expenses and see status
- admin/manager approval flow works
- policy acknowledgements are assignable and traceable
- integrations settings surface renders with clear status/config states
- AI feed suggestions/actions respect role-aware visibility
- no regression to Waves 1-2 or current admin shell navigation
