# PRD — Phase 0 Command Palette and Design Alignment

## Status
- Ralph planning gate artifact
- Repo: `/mnt/c/Users/NeilEdwardBaja/Desktop/New folder/leaveflow-pro`
- Scope owner: team planning run `ralph-planning-gate-is-active`

## Problem Statement
The audit action plan identifies two immediate, bounded gaps that can improve perceived product quality without weakening leaveflow-pro's stronger architecture:
1. the app lacks a global command palette for fast navigation and quick actions,
2. the UI language across the authenticated shell and landing surfaces is visually inconsistent (mixed icon sets, inconsistent accent usage, and uneven spacing/shadow treatment).

Phase 0 should close those gaps with a narrowly scoped first pass that improves speed, cohesion, and polish while preserving the current modular React/Vite/TypeScript architecture.

## Evidence Baseline
- The action plan prioritizes **command palette** and **design-system alignment pass** as P0 items.
- `src/components/ui/command.tsx` already wraps `cmdk`, so the repo has a viable primitive for a palette without adding dependencies.
- `src/components/AppLayout.tsx`, `src/components/AppSidebar.tsx`, and `src/App.tsx` define the authenticated shell and major route map where the palette can attach safely.
- Landing surfaces currently mix visual systems, including Lucide and Tabler icons plus bright fuchsia accents on premium/marketing variants.
- Existing tests already cover app-shell and landing behavior, so Phase 0 can extend those patterns instead of introducing a new test strategy.

## Goal
Ship a first implementation pass that:
- adds a role-aware global command palette for authenticated routes,
- aligns selected shell and landing surfaces to a more cohesive visual language,
- keeps scope tight enough to complete with regression coverage and without architectural shortcuts.

## Phase 0 Scope

### In scope
#### 1) Authenticated app command palette MVP
- Global open shortcut from authenticated app routes (`⌘K` on macOS, `Ctrl+K` on Windows/Linux).
- Searchable navigation actions for existing major modules:
  - Dashboard
  - AI Workspace
  - My Leave / Leave & Time Off
  - Attendance
  - Identity Hub / profile destination
  - Manager Hub when allowed
  - HR Operations when allowed
  - System Admin when allowed
  - Admin Setup when applicable
- Quick actions for already supported flows only:
  - open New Request sheet
  - jump to common hub tabs or legacy redirect targets where already supported
- Role-aware filtering so users only see actions they can access.
- Palette open/close/select analytics events if they can be added using the existing analytics hook without backend contract changes.

#### 2) App-shell design alignment pass
- Tighten visual consistency in the authenticated shell surfaces already central to navigation:
  - `src/components/AppLayout.tsx`
  - `src/components/AppSidebar.tsx`
  - any new command-palette integration files introduced for this feature
- Standardize icon usage on touched shell surfaces to one primary icon language.
- Bring button, divider, shadow, and spacing treatment closer to a single design direction instead of mixed emphasis levels.

#### 3) Targeted landing/design consistency pass
- Update only the currently active/high-visibility landing surfaces used in the existing app experience.
- Reduce overuse of neon/fuchsia accents on touched premium/landing surfaces where they conflict with the desired BALANCE brand tone.
- Normalize card, CTA, and navigation treatments on touched landing surfaces without rewriting entire pages.

#### 4) Regression coverage for the above
- Add/update automated tests covering command palette behavior and touched shell/landing regressions.
- Keep the implementation modular and compatible with current route-level lazy loading, auth guards, and role guards.

## Explicit Non-Goals
- Recruitment, reviews, expenses, training, onboarding, policy signatures, certifications, integrations, mobile attendance, or other Phase 1/2 roadmap domains.
- A full design-system rebuild, token migration, or broad restyle of every page in the repo.
- Rewriting existing route architecture, auth model, or analytics backend contracts.
- Building a fuzzy global data search across employees, leave records, attendance rows, or backend entities.
- New backend APIs solely for the command palette.
- Shipping the reusable domain-delivery blueprint in this implementation pass; that remains a separate follow-on planning artifact.
- Reworking experimental/alternate landing pages that are not part of the agreed high-visibility path unless required by the chosen implementation slice.

## Constraints
- Ralph planning gate is active: this PRD only defines the work; implementation follows after both required plan artifacts exist.
- No new dependencies unless a later explicit instruction overrides current repo rules.
- Preserve the repo's modular architecture and avoid monolithic shell components.
- Keep changes on the current branch directly in the repo; no worktrees.
- Reuse existing primitives (`cmdk`, existing dialog/ui components, analytics hook, route definitions, sidebar patterns) before creating new abstractions.
- Maintain keyboard accessibility, dark-mode support, and existing role/permission boundaries.
- Keep any new files reasonably small and reviewable.

## Users / Personas
- **Employee**: wants fast keyboard navigation and quick access to common leave/attendance flows.
- **Manager**: needs the same speed plus access to manager-specific destinations without seeing admin-only actions.
- **HR admin**: needs broader navigation and quick entry into admin hubs.

## Product Lanes

### Lane A — Command palette core
Deliver a reusable command palette surface that mounts in the authenticated shell and responds to global shortcut events.

### Lane B — Role-aware action model
Define and render a bounded action set derived from existing routes, tabs, and already-supported UI actions.

### Lane C — Design alignment pass
Polish shell and selected landing surfaces so visual treatment, iconography, accents, and spacing feel intentionally unified.

### Lane D — Verification and regression safety
Prove the feature works with unit/integration/build/lint coverage plus manual UX checks.

## Bounded Deliverables
1. **Global command palette integration** in the authenticated app shell.
2. **Role-aware command/action registry** covering currently existing routes and the New Request flow only.
3. **Targeted shell + landing design alignment pass** on explicitly selected high-visibility surfaces.
4. **Automated regression coverage** for shortcut behavior, role filtering, and touched visual surfaces.

## Likely Implementation Touchpoints
- `src/App.tsx`
- `src/components/AppLayout.tsx`
- `src/components/AppSidebar.tsx`
- `src/components/ui/command.tsx`
- selected landing files such as `src/components/landing/Hero.tsx`, `LandingNavbar.tsx`, `LandingCTA.tsx`, `Footer.tsx`, `FinalCTA.tsx`, or equivalent chosen surfaces
- related tests under `src/components/*.test.tsx`, `src/components/landing/*.test.tsx`, and/or `src/pages/*.test.tsx`

## Acceptance Criteria

### Command palette
- A user on an authenticated route can open the palette with `⌘K`/`Ctrl+K`.
- The palette can also be opened through an explicit visible affordance if one is added to the shell.
- The result list includes only destinations/actions the current user is allowed to access.
- Selecting a navigation item routes to the intended destination.
- Selecting the New Request action opens the existing request flow instead of a duplicate implementation.
- The palette closes on successful selection and on `Escape`.
- The palette does not appear on public/auth routes unless explicitly included by the implementation decision.

### Design alignment
- Touched shell surfaces use one primary icon family.
- Touched shell and landing surfaces share a more consistent hierarchy for spacing, border/shadow treatment, and CTA emphasis.
- Overly bright fuchsia accents are reduced or replaced on touched surfaces where they clash with the primary BALANCE brand direction.
- Dark mode and existing accessibility affordances remain intact on touched app surfaces.

### Architecture / quality
- No new dependency is introduced.
- No catch-all global store or mega-component is introduced just to support the palette.
- New code follows existing route/auth/role boundaries.
- Tests are added or updated for the core user paths touched by this slice.

## Out of Scope / Deferred Follow-ups
- Entity search across Convex data.
- Recent items, saved commands, or personalized command ranking.
- Cross-product workflow creation beyond the existing New Request action.
- Full landing-page redesign or motion-system overhaul.
- Domain blueprint/template documentation work.

## Implementation Exit Condition
Phase 0 is ready to exit when the command palette MVP and targeted design alignment pass both satisfy the acceptance criteria and the verification defined in `test-spec-phase0-command-palette-and-design-alignment.md` passes without introducing known shell or landing regressions.
