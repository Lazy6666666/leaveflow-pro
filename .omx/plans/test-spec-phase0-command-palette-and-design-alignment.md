# Test Spec — Phase 0 Command Palette and Design Alignment

## Status
- Ralph planning gate artifact
- Complements: `/mnt/c/Users/NeilEdwardBaja/Desktop/New folder/leaveflow-pro/.omx/plans/prd-phase0-command-palette-and-design-alignment.md`

## Objective
Define the evidence required to mark the Phase 0 command palette and design alignment implementation complete.

## Scope Under Test
- Global command palette behavior for authenticated routes.
- Role-aware action visibility and navigation.
- New Request quick action integration.
- Targeted design alignment changes on the app shell and selected landing surfaces.
- No regression to auth-guarded routing, dark mode, or existing landing accessibility checks on touched surfaces.

## Completion Proof Summary
Implementation is complete only when all of the following are true:
1. automated tests for the new command palette and touched surfaces pass,
2. lint/build/type checks pass,
3. manual UX checks confirm the shortcut, navigation, quick action, and visual polish work as intended,
4. no known regression remains open for touched shell or landing surfaces.

## Automated Verification Matrix

| Area | Proof | Notes |
|---|---|---|
| Command palette open/close | Unit/integration test | Verify keyboard shortcut, dialog visibility, and Escape close behavior |
| Role-aware command visibility | Unit/integration test | Employee, manager/delegated manager, and HR admin scenarios |
| Navigation actions | Integration test | Verify route transitions for bounded destination set |
| New Request quick action | Integration test | Verify it opens the existing request sheet/path rather than a duplicate flow |
| Shell regressions | Existing + updated component tests | `AppLayout`, sidebar behavior, any palette trigger added to shell |
| Landing/design regressions | Existing + updated landing tests | Maintain accessibility/analytics expectations on touched landing surfaces |
| Type safety | Type check | `tsc --noEmit` or repo-equivalent |
| Lint | Lint run | On repo or modified files depending on project conventions |
| Production build viability | Build run | `npm run build` or equivalent |

## Required Automated Tests

### 1) Command palette component tests
Add or update tests to prove:
- `⌘K`/`Ctrl+K` opens the palette from authenticated shell context.
- `Escape` closes it.
- Search filters the visible commands.
- Empty state appears for no results.
- Selecting a command invokes the expected navigation or callback.

### 2) Role-aware action coverage
Add tests for at least these scenarios:
- **Employee** sees only employee-safe destinations.
- **Manager / delegated manager** sees manager destinations and not HR-admin-only items.
- **HR admin** sees admin destinations.
- **Needs-admin-setup** user sees the admin-setup action when applicable.

### 3) App shell regression tests
Add or extend tests around:
- `AppLayout` rendering with the palette mounted.
- shell trigger visibility if a button/badge entry point is added.
- no regression to floating AI panel hide/show behavior already covered by `src/components/AppLayout.test.tsx`.

### 4) Landing/design regression tests
Update or extend tests to prove touched landing surfaces still meet current expectations:
- existing landing CTA analytics tests keep passing if CTA markup/classes are changed,
- existing landing accessibility tests keep passing,
- any new visual affordance still has accessible labels and keyboard reachability where applicable.

## Required Commands
Run these commands from `/mnt/c/Users/NeilEdwardBaja/Desktop/New folder/leaveflow-pro` unless the implementation introduces a better-scoped equivalent.

### Lint
- `npm run lint`
- Result required: PASS

### Type check
- `npx tsc --noEmit`
- Result required: PASS
- If the repo later adds a dedicated typecheck script, that script may replace this command.

### Unit/integration tests
- `npm run test -- --runInBand` **or** the repo's normal `vitest run` invocation if `--runInBand` is unsupported
- Result required: PASS
- Minimum coverage expectation: all new palette tests plus touched existing regression suites pass.

### Build
- `npm run build`
- Result required: PASS

## Manual UX Checks
Perform and record all of the following in the implementation report.

### Authenticated shell checks
- Log in as an employee-equivalent user, open the palette with keyboard shortcut, and navigate to Dashboard, My Leave, and Attendance.
- Trigger the New Request action from the palette and confirm the existing request sheet/flow opens.
- Confirm the palette closes after a successful selection.
- Confirm the palette does not expose manager/admin-only destinations to an employee.

### Manager / delegated access checks
- Open the palette as a manager or delegated manager.
- Confirm manager destinations appear.
- Confirm HR-admin-only destinations remain hidden unless the user truly has HR-admin access.

### HR admin checks
- Open the palette as an HR admin.
- Confirm HR Operations and System Admin destinations are present and route correctly.

### Visual/design checks
- Review touched shell surfaces at desktop and mobile widths.
- Confirm icon usage is consistent across touched shell surfaces.
- Confirm spacing, card/border/shadow treatment, and CTA emphasis feel unified on the touched surfaces.
- Review touched landing surfaces in both light/dark contexts where applicable and confirm no unreadable contrast or awkward accent carryover.

### Accessibility/manual keyboard checks
- Confirm focus enters the palette input immediately on open.
- Confirm arrow keys can move through results.
- Confirm Enter activates the highlighted result.
- Confirm focus is not trapped incorrectly after close.
- Confirm touched landing CTAs/navigation remain keyboard reachable.

## Failure Policy
If any required automated or manual check fails:
1. fix the failure before calling the slice complete,
2. re-run the failing command/check,
3. include the rerun evidence in the final completion report,
4. do not waive failures without explicit approval.

## Report Format Required at Implementation Completion
The implementing agent should report:
- exact files changed,
- exact commands run,
- PASS/FAIL result for lint, typecheck, tests, and build,
- manual UX checks performed,
- any remaining known risk or deferred follow-up.

## Known Deferred Risks To Watch
- Shortcut conflicts with browser/system bindings or text inputs.
- Role filtering drift if route permissions and palette permissions diverge.
- Visual polish regressions on premium/landing variants if too many surfaces are included in one pass.
- Analytics gaps if palette events are added without matching existing event naming conventions.
