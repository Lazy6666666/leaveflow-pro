# Context Snapshot — leaveflow-pro phase 0 ralph+team

## Task statement
User explicitly invoked `$team $ralph` to proceed from the generated audit action plan into implementation.

## Desired outcome
Use team mode to implement a bounded Phase 0 slice for leaveflow-pro, but only after satisfying Ralph's planning gate with PRD and test-spec artifacts.

## Known facts / evidence
- Action plan exists at `/mnt/c/Users/NeilEdwardBaja/Desktop/New folder/.omx/reports/application_audit_action_plan.md`.
- Target repo is `/mnt/c/Users/NeilEdwardBaja/Desktop/New folder/leaveflow-pro`.
- Repo AGENTS requires direct-in-repo work and explicitly forbids git worktrees.
- `omx team` defaults to worktrees for git repos, so team leader cwd must remain outside the repo while workers edit the repo directly.
- Current high-value Phase 0 candidates from the action plan are:
  1. global command palette,
  2. design-system alignment pass,
  3. reusable domain-delivery blueprint.
- Ralph planning gate is active because the user explicitly invoked `$ralph`.

## Constraints
- Do not begin implementation until `.omx/plans/prd-*.md` and `.omx/plans/test-spec-*.md` exist.
- Use OMX team runtime, not spawn_agent fanout, for the `$team` workflow.
- No git worktrees.
- Keep repo changes bounded and directly on current branch.

## Unknowns / open questions
- Exact final naming of the PRD/test-spec artifacts.
- Whether Phase 0 should include only one or all three bounded deliverables in the first implementation pass.

## Likely codebase touchpoints
- `.omx/plans/`
- `docs/`
- `src/components/AppLayout.tsx`
- `src/components/AppSidebar.tsx`
- `src/components/ui/command.tsx`
- `src/components/landing/*`
- `src/pages/PremiumLanding.tsx`
