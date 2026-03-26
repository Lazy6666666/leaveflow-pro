# PRD — Wave 2 Performance Reviews + Training + Certifications

## Status
- Derived from `.omx/plans/prd-all-features-staged-execution.md`
- Execution mode: staged delivery under autopilot / Ralph
- Scope: second roadmap wave only

## Objective
Add a bounded people-development slice that introduces:
1. performance review cycles and assignments
2. training courses and training assignments
3. certification tracking with expiry visibility

## In scope
- review cycle creation
- review assignment records
- training course catalog
- training assignment records
- certification records with issue/expiry dates
- admin-facing management UI in existing HR Operations surfaces

## Out of scope
- peer-review workflows
- learning content hosting / file uploads
- automated reminders / email delivery
- employee-facing portals beyond what existing routes already support
- Wave 3 and Wave 4 roadmap items

## Wave 2 architecture contract

### Frontend boundaries
- keep Wave 2 under existing admin shell / HR Operations hub
- create new domain components under:
  - `src/components/reviews/`
  - `src/components/training/`
- add tabs to `src/pages/admin/HROperationsHub.tsx`
- do not spread Wave 2 logic into unrelated payroll, attendance, or AI modules

### Backend boundaries
- add dedicated Convex modules:
  - `convex/performanceReviews.ts`
  - `convex/training.ts`
- keep schema additions additive and limited to:
  - performance review cycles
  - performance review assignments
  - training courses
  - training assignments
  - certification records

### Permissions
- hr-admin creates and manages all Wave 2 records
- manager access may be added later, but this initial slice remains admin-led unless a route is explicitly exposed
- employee-facing visibility is deferred unless routed intentionally in a later refinement

## Rollout / rollback boundary
- Wave 2 route entries must be hideable without impacting Wave 1 or existing leave/attendance/admin flows
- schema changes are additive only
- removing Wave 2 tabs/components must not break current hub navigation

## Delivery lanes
- Lane 1 — reviews UI + route entry
- Lane 2 — training/certifications UI + backend wiring
- Lane 3 — tests / regression verification / build evidence

## Acceptance criteria
- admins can create review cycles and review assignments
- admins can create training courses and training assignments
- admins can create certification records with expiry dates
- HR Operations hub exposes Reviews, Training, and Certifications tabs
- no regression to Wave 1 tabs or existing admin tabs
