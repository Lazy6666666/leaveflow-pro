# PRD — Remaining Roadmap Execution Beyond Phase 0

## Status
- Mode: RALPLAN-DR consensus draft
- Scope: remaining roadmap after Phase 0 command palette + design alignment
- Repo: `/mnt/c/Users/NeilEdwardBaja/Desktop/New folder/leaveflow-pro`

## Context
This plan converts the existing audit action plan into an executable staged roadmap for the remaining major feature domains. It is tailored to current repo/runtime constraints:
- direct-in-repo only
- no git worktrees
- OMX team execution is preferred for parallel work
- Codex team workers currently face quota exhaustion risk
- third-party CLI workers can lose time on onboarding/trust prompts

## RALPLAN-DR

### Principles
1. Ship in staged vertical slices, not one giant feature dump.
2. Preserve the repo's modular advantage; do not centralize unrelated domains into mega-pages.
3. Prefer operationally complete workflows over demo breadth.
4. Each milestone must have explicit verification and rollback boundaries.
5. Use team for delivery, Ralph for final verification and persistence.

### Decision Drivers
1. **Execution realism:** broad scope must be split to avoid team/CLI orchestration drag.
2. **Architecture protection:** new domains must fit existing page/component/hook/backend boundaries.
3. **Verification cost:** each wave must be small enough to build, test, and review reliably.

### Viable Options

#### Option A — Sequential domain-by-domain delivery
- Deliver one domain at a time: Recruitment, then Reviews, then Expenses, etc.
- Pros: lowest risk, easiest to verify.
- Cons: slowest business impact; repeated shell/backend scaffolding overhead.

#### Option B — Staged capability waves by shared foundation **(recommended)**
- Group features into waves that share data patterns and permissions.
- Wave 1: workflow foundations + Recruitment + Onboarding
- Wave 2: Performance Reviews + Training + Certifications
- Wave 3: Expenses + Policy Signatures + Integrations + AI action feed
- Wave 4: dedicated mobile attendance experience
- Pros: balanced speed/risk, shared scaffolding per wave, better team parallelism.
- Cons: requires tighter planning discipline across each wave.

#### Option C — Parallel all-domains buildout
- Spin up multiple lanes across all major features immediately.
- Pros: fastest theoretical breadth.
- Cons: highest integration risk, high verification burden, most vulnerable to current team CLI friction.

### Recommended Decision
Choose **Option B**. It is the best balance between speed, verification cost, and current team-runtime constraints.

## ADR

### Decision
Implement the remaining roadmap as four staged capability waves, executed via team and verified via Ralph.

### Drivers
- direct-in-repo constraint
- no-worktree rule
- team worker reliability issues under Codex quota pressure
- need to preserve modular code structure

### Alternatives considered
- Option A: safer but too slow
- Option C: broader but too fragile under current runtime constraints

### Why chosen
Option B gives enough surface area per wave to justify team parallelism, while keeping acceptance criteria bounded enough for Ralph verification.

### Consequences
- requires wave-specific PRDs/test specs before each implementation sprint
- requires lane ownership and strict write-scope discipline
- reduces risk of partially-built orphan domains

### Follow-ups
- create per-wave PRD/test-spec artifacts before implementation
- maintain a wave ledger in `.omx/plans/`
- keep staffing flexible based on available CLI reliability

## Scope

### In scope
- Recruitment pipeline
- Onboarding checklists
- Performance reviews
- Training / learning center
- Certifications tracking
- Expense management
- Policy signature tracking
- Integrations settings
- AI suggestions + action feed
- Dedicated mobile attendance experience

### Out of scope for the next execution wave
- 3D-only landing embellishments
- broad design-system rewrites unrelated to functional delivery
- full mobile app platform migration unless required by the attendance wave

## Milestone Breakdown

### Wave 1 — Talent acquisition and activation
**Scope**
- Recruitment pipeline
- Onboarding checklists
- shared workflow scaffolding for task/status/assignment patterns

**Wave 1 architecture contract**
- **Routes / entry surfaces**
  - add a recruiter-facing entry inside existing admin/hub navigation instead of creating a new top-level product shell
  - onboarding should attach to the same admin/operations area or a clearly related route group, not a disconnected parallel shell
- **Frontend ownership boundaries**
  - pages:
    - `src/pages/admin/*` for Wave 1 route/tab containers
  - components:
    - create `src/components/recruitment/*`
    - create `src/components/onboarding/*`
  - hooks:
    - add domain-specific hooks only when shared across 2+ screens
  - do **not** add Wave 1 logic to unrelated AI, attendance, or payroll modules
- **Backend / data ownership**
  - add dedicated Convex modules for Wave 1 domains instead of growing generic admin files indefinitely:
    - `convex/recruitment.ts`
    - `convex/onboarding.ts`
    - optional shared helper module only for status/assignment primitives reused by both domains
  - schema additions must be isolated to Wave 1 entities only:
    - jobs
    - candidates
    - candidate stage history / recruiter notes
    - onboarding templates
    - onboarding task assignments / completion state
- **Permissions contract**
  - recruiter / hr-admin can create and update jobs and candidates
  - managers can view only the onboarding tasks or candidate data intentionally delegated to them
  - employees/new hires can only see onboarding tasks assigned to them
  - no Wave 1 UI should expose admin-only controls to employee routes

**Wave 1 rollout / rollback boundary**
- Wave 1 must be shippable as an isolated slice:
  - recruitment routes can be hidden from navigation without affecting existing leave/attendance flows
  - onboarding routes can be hidden from navigation without affecting existing identity/profile flows
  - shared workflow scaffolding must be limited to Wave 1 entities; if it destabilizes other modules, revert/remove only the new Wave 1 helpers and route entries
- Avoid destructive migration assumptions:
  - additive schema changes only for Wave 1
  - no rewrite of existing leave/attendance entities
  - no dependency on Wave 2+ entities to make Wave 1 usable

**Acceptance criteria**
- recruiters can create jobs and progress candidates through stages
- onboarding templates and assigned tasks exist with progress tracking
- role-aware access is enforced for recruiter/manager/admin views
- tests cover major recruiter + onboarding flows

### Wave 2 — People development and compliance readiness
**Scope**
- Performance reviews
- Training / learning center
- Certifications tracking

**Acceptance criteria**
- review cycles and structured review forms exist
- training catalog + assignment + completion tracking exists
- certifications can be tracked with expiry/reminder state
- shared employee/development data model is typed and verified

### Wave 3 — Operational controls and platform maturity
**Scope**
- Expense management
- Policy signature tracking
- Integrations settings
- AI suggestions + action feed

**Acceptance criteria**
- employees can submit expenses and approval flow works
- policy acknowledgements are assignable and traceable
- integrations settings surface exists with status/config placeholders where needed
- AI suggestions/action feed uses existing assistant infrastructure without bypassing permissions

### Wave 4 — Dedicated mobile attendance experience
**Scope**
- mobile-first attendance UX
- attendance entry workflow adaptations for constrained mobile interaction
- optional biometric / QR / location support only if already supportable by current platform stack

**Acceptance criteria**
- mobile attendance flow is materially better than desktop-responsive fallback
- core attendance actions remain role-safe and testable
- no regression to existing attendance history/identity flows

## Test Strategy
- each wave gets its own test-spec before execution
- minimum per wave:
  - typecheck
  - targeted eslint
  - targeted vitest on touched shell/domain files
  - build
  - manual UX walkthroughs for primary actor flows
- high-risk domains additionally require:
  - approval-path tests
  - permission visibility tests
  - backend mutation/query diagnostics on touched files

## Available Agent Types Roster
- `planner`
- `architect`
- `critic`
- `executor`
- `debugger`
- `test-engineer`
- `verifier`
- `writer`
- `code-reviewer`

## Staffing Guidance for `$team`

### Recommended default team shape per wave
- **1 executor lane** — primary delivery lane
- **1 executor/debugger lane** — supporting backend or secondary UI lane
- **1 test-engineer/verifier lane** — tests, regression checks, integration evidence
- **1 writer lane** *(optional on larger waves)* — docs, migration notes, admin usage notes

### Default team shape for Wave 1
- **Lane 1 — executor (medium)**  
  Own recruiter UI, route/tab entry, candidate/job flow components.
- **Lane 2 — executor/debugger (medium)**  
  Own Convex modules, schema additions, onboarding task model, and supporting data wiring.
- **Lane 3 — test-engineer/verifier (medium)**  
  Own Wave 1 tests, permission checks, targeted build/type/lint evidence.

### Direct-in-repo write-scope rule
Because this repo forbids worktrees, Wave 1 must not start until the lanes have explicit write ownership:
- Lane 1: `src/pages/admin/*`, `src/components/recruitment/*`, relevant nav wiring
- Lane 2: `convex/recruitment.ts`, `convex/onboarding.ts`, `convex/schema.ts`, `src/components/onboarding/*`
- Lane 3: touched tests and verification artifacts only
- If write scopes cannot stay disjoint, reduce implementation to **1 delivery lane + 1 verifier lane**

### Reasoning levels by lane
- implementation lanes: `medium`
- debugger lane: `medium`
- verifier lane: `medium`
- architect/critic sign-off lane: `high`

### Worker CLI guidance
- Prefer the most reliable authenticated CLI available at launch time.
- If Codex quota is exhausted, do not stall execution waiting on it; route team workers to the next viable CLI and keep the leader responsible for final verification.
- Budget extra startup time for third-party CLI trust/onboarding prompts.

## Execution Handoff

### Recommended next command family
- planning already complete for broad roadmap
- next create wave-specific PRD/test-spec for **Wave 1**
- then launch delivery via `$team`
- finally verify/fix via `$ralph`

### Team launch hint for Wave 1
```bash
omx team 3:executor "Implement Wave 1: recruitment pipeline + onboarding checklists in leaveflow-pro, direct-in-repo, no worktrees, additive schema only, lane 1 recruiter UI, lane 2 backend+onboarding wiring, lane 3 verification."
```

### Team -> Ralph verification path
1. team implements the approved wave
2. team reaches terminal completion gate
3. leader runs Ralph verification loop on the touched wave files
4. Ralph performs final tests/build/typecheck + review + cleanup

## Risks
- too-broad first wave will collapse into monolithic edits
- CLI onboarding friction can waste team cycles
- backend schema expansion may become the hidden critical path if not explicitly scoped per wave
- mobile attendance wave may require platform-specific decisions not yet planned

## Recommended Immediate Next Step
Create Wave 1 PRD + Wave 1 test spec, then execute Wave 1 only. Do **not** attempt all remaining waves in one implementation burst.
