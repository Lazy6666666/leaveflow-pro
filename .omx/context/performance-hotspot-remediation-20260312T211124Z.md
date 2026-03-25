# Task Statement

Execute the remaining performance findings from the earlier review in `leaveflow-pro`.

# Desired Outcome

- Reduce obvious hot-path full-table scans and N+1 lookups on the employee dashboard, leave conflict summary, and admin reporting/insight queries.
- Preserve current behavior.
- Avoid touching unrelated in-flight user changes elsewhere in the dirty worktree.

# Known Facts / Evidence

- Prior review identified hot spots in:
  - `convex/leave.ts`
    - `getDashboardData`
    - `getConflictSummary`
    - `getPendingApprovals`
    - `getTeamCalendar`
  - `convex/adminReports.ts`
  - `convex/insights.ts`
  - `convex/attendanceAdmin.ts`
- The repo has many unrelated modified and untracked files. Workers must not revert or “clean up” unrelated changes.
- Current dominant issues are:
  - full-table scans on hot user/admin paths
  - repeated `ctx.db.get(...)` inside loops
  - manager-scoped queries loading org-wide data unnecessarily
- Existing indexed fields that may help:
  - `attendanceLogs.by_date`
  - `attendanceLogs.by_employeeId_date`
  - `leaveRequests.by_status`
  - `leaveRequests.by_employeeId`
  - `profiles.by_managerUserId`

# Constraints

- Stay within the existing data model unless a small safe helper refactor is enough.
- Do not implement speculative caching layers unless required.
- Preserve API response shapes.
- Do not touch unrelated frontend/design work.
- Follow repo AGENTS instructions and keep changes directly in this repo.

# Unknowns / Open Questions

- Which performance findings were already partially addressed by the user in local changes.
- Whether additional Convex indexes are acceptable right now or if fixes should stay within current schema.
- Whether admin reports should remain one-shot or be split/lazy later; for now prefer low-risk backend wins.

# Likely Codebase Touchpoints

- `convex/leave.ts`
- `convex/adminReports.ts`
- `convex/insights.ts`
- `convex/attendanceAdmin.ts`
- possibly shared helpers in `convex/lib/auth.ts`

# Suggested Work Split

- Worker 1: `convex/leave.ts` hot paths and any small helper needed for manager/team lookups
- Worker 2: admin/reporting paths in `convex/adminReports.ts`, `convex/insights.ts`, `convex/attendanceAdmin.ts`

