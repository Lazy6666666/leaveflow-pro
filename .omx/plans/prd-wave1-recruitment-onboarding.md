# PRD — Wave 1 Recruitment + Onboarding

## Status
- Derived from `.omx/plans/prd-all-features-staged-execution.md`
- Execution mode: `$team` then `$ralph`
- Scope: first staged execution wave only

## Objective
Ship the first operational expansion beyond Phase 0 by adding:
1. a recruitment pipeline
2. onboarding checklist workflows
3. only the minimum shared workflow scaffolding needed by both domains

## In scope
- job requisitions
- candidate records
- candidate stage progression
- recruiter notes / status history
- onboarding templates
- onboarding task assignment and completion tracking
- admin/recruiter/manager/new-hire role-aware visibility

## Out of scope
- performance reviews
- training catalog
- certifications
- expenses
- policy signatures
- integrations settings
- AI action feed
- mobile attendance
- broad design-system rewrites

## Wave 1 architecture contract

### Frontend boundaries
- route/tab entry must attach to existing admin/operations surfaces
- create new domain components under:
  - `src/components/recruitment/`
  - `src/components/onboarding/`
- keep route containers under existing admin page structure rather than building a new standalone shell
- do not expand unrelated modules like attendance, payroll, or AI workspace just to host Wave 1

### Backend boundaries
- add dedicated Convex modules:
  - `convex/recruitment.ts`
  - `convex/onboarding.ts`
- keep schema additions additive and limited to:
  - jobs
  - candidates
  - candidate stage history / notes
  - onboarding templates
  - onboarding assignments / completion state
- only introduce shared helper primitives if both domains truly reuse them

### Permissions
- recruiter / hr-admin:
  - create/update jobs
  - create/update candidates
  - progress candidate stages
  - create onboarding templates
  - assign onboarding tasks
- manager:
  - view onboarding tasks intentionally assigned to their scope
  - no recruiter-only controls by default
- employee / new hire:
  - only see onboarding tasks assigned to them
  - no recruiter/admin controls

## Rollout / rollback boundary
- Wave 1 must remain removable without breaking existing leave, attendance, profile, or AI flows
- route entries for recruitment/onboarding must be hideable independently
- schema changes must be additive only
- if the shared workflow scaffolding destabilizes unrelated features, remove only the new Wave 1 helpers and route entries

## Delivery lanes
- Lane 1 — recruiter UI / route entry / candidate flows
- Lane 2 — backend data model / Convex modules / onboarding flows
- Lane 3 — tests / regression verification / build evidence

## Acceptance criteria
- recruiters can create jobs and move candidates through stages
- candidate stage history/notes are visible in the UI
- onboarding templates can be created and assigned
- assigned onboarding tasks can be viewed and marked complete
- visibility rules differ correctly across recruiter, manager, and employee contexts
- no regression to existing admin hub navigation

## Initial execution hint
Use a conservative direct-in-repo team shape first because worktrees are forbidden and external worker CLIs are noisy. Keep write scopes explicit before parallel edits.
