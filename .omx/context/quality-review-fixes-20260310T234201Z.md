Task statement

Use tmux-backed OMX team mode to execute the highest-priority fixes from the validated quality review of the Clerk + Convex migration.

Desired outcome

- Fix the broken full-day leave request submission path.
- Fix manager vs delegate capability leakage so delegated approvers do not inherit manager-only flows.
- Fix the most user-visible stale-state/error-handling regressions introduced during the migration.
- Preserve the current passing verification baseline (`tsc`, `build`, `test`).

Known facts / evidence

- Live tmux leader pane is active (`$TMUX` set); current target pane is `2:0.0`.
- `tmux`, `omx`, and the repo-local app environment are available.
- Current verification baseline after review:
  - `tsc --noEmit`: pass
  - `npm run build`: pass
  - `npm test`: pass
- Validated high-severity findings from review:
  - `src/pages/RequestLeave.tsx` sends an invalid `halfDayType` for the default full-day path and can preserve invalid `"single"` state.
  - `src/contexts/AuthContext.tsx` / `src/components/RoleGuard.tsx` / `src/components/AppSidebar.tsx` / `convex/manager.ts` / `convex/attendance.ts` conflate delegated approval access with actual manager role membership.
  - `src/pages/LeaveHistory.tsx` invalidates stale dashboard cache keys.
  - `src/pages/Holidays.tsx` closes/resets after failed save/delete operations.
  - `src/pages/admin/Balances.tsx` can leave `initializing` stuck on rejected mutations.
  - `src/pages/manager/TeamCalendar.tsx` can show stale prior-month data while the header advances.
- Medium follow-ups exist around swallowed provisioning errors and inconsistent async mutation handling in admin screens.

Constraints

- Launch via `omx team ...`, not in-process fanout.
- Keep team state alive until terminal worker/task state is reached.
- Do not revert unrelated dirty-worktree changes.
- Prefer the validated review findings over speculative cleanup.

Unknowns / open questions

- Whether to spend one worker on broader async-handler cleanup after the high-severity issues are fixed.
- Whether the team should stop after landing core fixes or also sweep medium issues in the same run.

Likely codebase touchpoints

- `src/pages/RequestLeave.tsx`
- `convex/leave.ts`
- `convex/lib/auth.ts`
- `src/contexts/AuthContext.tsx`
- `src/components/RoleGuard.tsx`
- `src/components/AppSidebar.tsx`
- `src/pages/Dashboard.tsx`
- `convex/manager.ts`
- `convex/attendance.ts`
- `src/pages/LeaveHistory.tsx`
- `src/pages/Holidays.tsx`
- `src/pages/admin/Balances.tsx`
- `src/pages/manager/TeamCalendar.tsx`
