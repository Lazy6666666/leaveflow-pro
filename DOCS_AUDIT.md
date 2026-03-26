# Docs Audit — BALANCE / leaveflow-pro

Generated: 2026-03-18

---

## Done & Accurate

Work that is fully implemented and verified. These docs are reliable references.

| File | Status |
|------|--------|
| `docs/report.md` | Accurate status report as of 2026-03-17 |
| `docs/task.md.resolved` | Master checklist — Updated with Landing Page re-engineering (Done 2026-03-18) |
| `docs/dead-code-report.md` | Fresh (2026-03-18). 13 safe deletes + 8 items needing confirmation |
| `docs/design-system.md` | Design tokens documented and aligned with Tailwind config |
| `docs/attendance-trust-model.md` | Decision doc. Done |
| `docs/ai_scaling_implementation_plan.md` | Phase 1 implemented. Accurate |
| `docs/mistral_ai_integration_analysis.md` | Mistral is live and working. Accurate |
| `docs/cloudflare-pages-deploy.md` | Deploy path working. Done |
| `docs/security-headers.md` | Headers applied. Done |
| `docs/cli-auth-setup.md` | Clerk live key swapped. Done |
| `docs/prod-env-matrix.md` | Env matrix documented. Done |
| `docs/deploy-runbook.md` | Verified against the scripted Pages + Convex deploy flow on 2026-03-18 |
| `docs/email/resend-balance-template.html` | Template created and published (id: `60e5a04b-669b-45e6-8fa0-082294afbe55`) |
| `docs/email/resend-templates-setup.md` | Setup complete. Done |
| `docs/context/completed/*` (8 files) | Historical completed context snapshots — no action needed |

---

## Unfinished / Still Open

Work that was started but not completed.

| File | What's Open |
|------|-------------|
| `docs/task.md.resolved` | A6 (staging smoke tests — staging done, production not), A7 (Sentry production only), P1–P5 (full production hardening sign-off). *Landing Page Re-engineering is COMPLETE.* |
| `docs/staging-smoke-tests.md` | Doc is complete. Staging verified. Production run has not happened. |
| `docs/prod-launch-audit.md` | Audit doc is accurate but the production go/no-go it describes has not been executed |
| `docs/SUPABASE_MIGRATION_GAPS.md` | Migration is 95%+ done. Remaining: non-critical audit review on untouched low-risk mutations |
| `docs/instrumentation-checklist.md` | Core landing/auth/leave/attendance/AI/HR instrumentation is wired. Remaining: KPI dashboards, payroll export KPI rollups, and release-signoff audit. |
| `docs/product-measurement-audit.md` | Analytics layer is partially wired. Remaining: compute the launch KPIs from the emitted events and close the release-signoff audit. |
| `docs/balance-vs-truein-master-plan.md` | Living roadmap. Still open: offline real-device verification, face verification end-to-end, payroll export formats, production auth flow verification |

---

## Cleanup Completed

The obsolete docs identified in this audit were removed on 2026-03-18.

| File | Reason |
|------|--------|
| `docs/context/obsolete/convex-clerk-migration-20260310T183824Z.md` | Migration complete. Original task brief. |
| `docs/context/obsolete/remaining-issues-20260310T200933Z.md` | Migration-era issues were resolved. |
| `docs/context/partial/quality-review-fixes-20260310T234201Z.md` | Stale task brief for fixes that were already applied. |
| `docs/context/partial/supabase-convex-migration-20260311T213722Z.md` | Superseded by `docs/SUPABASE_MIGRATION_GAPS.md`. |
| `docs/context/context/completed/production-readiness-cleanups-20260311T205231Z copy.md` | Duplicate file in an invalid nested `context/context/` folder. |
| `docs/marketing_video_plan.md.resolved` | Closed plan for work that never proceeded. |
| `docs/components.md` | Scratch note from landing-page build exploration. |

---

## Legacy / Archive Candidates

Still accurate but reference things that are now legacy. No immediate action required.

| File | Note |
|------|------|
| `docs/SUPABASE_MIGRATION_GAPS.md` | Supabase is gone. Keep as migration record until production is stable, then archive. |
| `docs/context/completed/*` (all 8) | Historical task snapshots. Consider moving to `docs/archive/` to reduce noise. |

---

## Summary

| Category | Count |
|----------|-------|
| Done & accurate | 15 docs |
| Unfinished / open work | 7 docs with open items |
| Cleanup completed | 7 files removed |
| Legacy / archive candidates | ~9 files |

**Recommended next action:** Decide whether the legacy migration docs should move into an archive folder once production hardening is complete.
