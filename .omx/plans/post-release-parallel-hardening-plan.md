# Post-Release Parallel Hardening Plan

## Goal
Run the next post-release pass in parallel without destabilizing `main`: reduce security exposure, isolate local worktree noise, verify the pushed product paths, and produce a prioritized debt backlog for the next implementation cycle.

## Grounding Evidence
- `main` was pushed successfully and `origin/main` matches local `HEAD` at `89f56d31f26633ec7cfdd616ea8cc5f742b2eb6f`.
- Core gates were green before push:
  - `npx tsc --noEmit`
  - `npx tsc --noEmit -p apps/mobile/tsconfig.json`
  - `npm run build`
  - `npm audit --omit=dev --audit-level=high`
- GitHub reported default-branch vulnerabilities after push, so remote security debt remains.
- The local worktree is still heavily dirty across product files, OMX state, Playwright artifacts, and docs, which raises merge risk for any follow-up work.

## Scope
- Security remediation planning
- Local worktree cleanup planning
- Post-release QA planning
- Repo-debt triage planning
- CI / remote health verification planning

## Recommended Parallel Staffing
- `Team lane 1` (`dependency-expert` or `executor`, high): security alert remediation and dependency classification
- `Team lane 2` (`executor`, medium): local worktree cleanup and separation of product files vs generated/tooling noise
- `Team lane 3` (`test-engineer`, medium): focused post-release QA sweep across HR operations, Expo auth, attendance fallback, and AI workspace flows
- `Subagent lane 1` (`verifier`, medium): CI / remote health verification and deployment fallout checks
- `Subagent lane 2` (`architect` or `planner`, medium): repo-debt classification into fix-now vs defer

## Step 1: Freeze The Baseline
Create a clean execution baseline for the next pass before any new edits start.

Acceptance criteria:
- The team records the pushed baseline SHA `89f56d31f26633ec7cfdd616ea8cc5f742b2eb6f`.
- A snapshot of current local noise is captured and grouped into:
  - product code
  - generated files
  - local tooling artifacts
  - OMX / Playwright / scratch state
- No new edits begin until each lane has an explicit write scope.

## Step 2: Run The Security Lane
Classify GitHub and local dependency findings into immediate fixes, low-risk upgrades, and deferred items.

Acceptance criteria:
- Every current GitHub/default-branch alert is mapped to one of:
  - fix now
  - defer with rationale
  - false positive / transitive-only
- Runtime-path issues are prioritized above dev-only issues.
- Any proposed fix batch is limited to low-risk, testable upgrades with a clear verification command set.
- The lane produces a short remediation queue ordered by severity and blast radius.

## Step 3: Run The Cleanup Lane
Separate legitimate product changes from persistent local noise so future commits are reviewable.

Acceptance criteria:
- The dirty worktree is classified into:
  - keep for next product pass
  - move / archive / ignore
  - revertable local noise
- OMX state, Playwright captures, and other non-product artifacts are explicitly excluded from normal product commits.
- A clean commit strategy is defined for the next cycle without requiring destructive resets.
- Any risky cleanup area is flagged before execution rather than silently bundled.

## Step 4: Run The QA Lane
Perform a focused post-release QA pass on the highest-risk user-facing surfaces instead of broad undirected retesting.

Acceptance criteria:
- QA covers at least these surfaces:
  - HR Operations tabs
  - Expo auth/session bridge
  - attendance fallback flow
  - AI workspace / manager / identity / system hub navigation
- Each surface has a pass/fail result with the exact proving command or manual scenario.
- Any defect found is tagged as:
  - release-critical
  - fix-next
  - cosmetic / defer

## Step 5: Produce The Next Debt Backlog
Turn the findings from the security, cleanup, and QA lanes into a single prioritized execution queue.

Acceptance criteria:
- The backlog contains 3-6 concrete next tasks.
- Each task includes:
  - objective
  - owner lane
  - expected files / area
  - verification method
  - risk level
- The queue is ordered by:
  1. production risk
  2. merge/conflict risk
  3. verification cost

## Suggested Handoff Sequence
1. Start `Team lane 2` first to prevent cleanup noise from colliding with the other lanes.
2. Start `Team lane 1` and `Team lane 3` in parallel once write scopes are locked.
3. Run verifier and architect/planner subagents as read-only sidecars.
4. End with a single leader synthesis pass that turns lane outputs into the next executable task list.

## Risks
- The local worktree is broad enough that careless cleanup could disturb real product work.
- GitHub alert counts can shift independently of local `npm audit`, so remediation needs both local and remote evidence.
- Router-backed tests require using the repo’s intended Vitest `forks` pool; forcing other pools can create false negatives.

## Deliverables
1. Security remediation queue
2. Worktree cleanup map
3. Focused QA verdict matrix
4. Prioritized next debt backlog
