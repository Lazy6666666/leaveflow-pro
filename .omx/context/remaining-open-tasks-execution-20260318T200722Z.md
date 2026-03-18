# Remaining Open Tasks Execution Context

- Task: Execute the remaining code-deliverable work implied by DOCS_AUDIT.md and docs/report.md, not merely update the docs.
- Desired outcome: Close the real implementation gaps that are still unresolved in the current tree, then validate and report which open items remain only because they require external production verification.
- Known facts:
  - docs/report.md still lists broad open areas, but several items are already implemented in code.
  - docs/task.md.resolved shows Sprint I items done, while docs/report.md still says I is open.
  - convex/schema.ts already contains aceEnrollments, erificationResults, and payrollMappingConfig tables.
  - convex/faceVerification.ts exists and src/pages/admin/TrustReviewQueue.tsx already shows confidence plus a no-enrollment link.
  - convex/payroll.ts already exposes getPayrollMappingConfig and upsertPayrollMappingConfig, but no admin UI currently consumes them.
  - Production-only items (real production deploy, real-device checks, real Sentry prod verification) cannot be fully completed locally without external environment access.
- Constraints:
  - Work directly on the current branch in leaveflow-pro; no git worktrees.
  - Keep diffs small and focused on real implementation gaps.
  - Validate with targeted tests/builds after code changes.
- Unknowns:
  - Whether Trust Review still needs an enrollment-status action beyond the existing confidence/no-enrollment UI.
  - Whether additional assistant/analytics/product gaps are already implemented elsewhere in the dirty tree.
- Likely touchpoints:
  - convex/payroll.ts
  - src/pages/admin/AttendanceSettings.tsx
  - src/pages/admin/TrustReviewQueue.tsx
  - src/pages/admin/reports/**
  - targeted tests around any new admin settings UI