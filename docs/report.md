# BALANCE Project Status Report

Last updated: 2026-03-19

This report summarizes delivered work and the remaining roadmap items for the BALANCE attendance + roster track in `leaveflow-pro/`.

## Completed (Implemented)

Note: Items listed as implemented may still require staging / production verification unless explicitly stated.

### Phase 0: Design System Foundation

- Documented BALANCE design tokens in `leaveflow-pro/docs/design-system.md`.
- Aligned Tailwind token configuration in `leaveflow-pro/tailwind.config.ts` (fonts now driven by CSS variables).

### Sprint 1 - Work Package A: Production Baseline

- A1: Swapped Clerk test key for live key.
- A2: Relocated oversized video asset from `leaveflow-pro/public/`.
- A3: Verified deploy path repeatability.
- A4: Applied security headers in `leaveflow-pro/public/_headers` (CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).
- A5: Audited `leaveflow-pro/public/_headers` against the security matrix.
- A5.1: Added `leaveflow-pro/public/_redirects` to make SPA fallback safe for PWA artifacts (`/manifest.webmanifest`, `/sw.js`, `/registerSW.js`) on Cloudflare Pages.
- A6: Ran staging smoke tests per `leaveflow-pro/docs/staging-smoke-tests.md` (see verification details below).
- A7 (Staging): Confirmed Sentry receives real events from the deployed staging frontend (via a staging-only manual test trigger).

### Staging URL (As Of 2026-03-17)

- Cloudflare Pages (staging/preview): `https://feature-selfie-checkin-local-mbih.balance-bqz.pages.dev`

### Sprint 2 - Work Package B: Mobile Attendance Hardening

- B1: Added `offlineSyncId` deduplication field to the `attendanceLogs` schema.
- B2: Designed mobile attendance surface (PWA shell, permission recovery UI, retry UX, sync status).
- B3: Updated `leaveflow-pro/public/manifest.json` with PWA configuration.
- B4: Integrated `vite-plugin-pwa` for service worker + precaching.
- B5-B7: Improved permission-denied handling and upload retry UX in `leaveflow-pro/src/components/attendance/ClockInOutWidget.tsx` and `leaveflow-pro/src/components/attendance/SelfieCaptureDialog.tsx`.
- B7.1: Refactored `leaveflow-pro/src/components/attendance/ClockInOutWidget.tsx` to use a controller hook (`leaveflow-pro/src/components/attendance/useClockInOutController.ts`) while preserving behavior.
- B8: Added `leaveflow-pro/src/components/NetworkStatusBanner.tsx`.
- B9: Added `leaveflow-pro/src/components/OfflineSyncStatusBadge.tsx` to display pending sync events.

### Sprint 3 - Work Package C: Offline Attendance Queue

- C1: Added `offlineAttendanceLogs` table to schema.
- C2: Added `replayOfflineLogs` mutation to replay offline events.
- C3: Hardened `clockIn` / `clockOut` mutations to reject duplicate `offlineSyncId` values.
- C4: Created `leaveflow-pro/src/lib/offlineQueue.ts` for IndexedDB-backed queue management.
- C5: Created `leaveflow-pro/src/hooks/useOfflineQueue.ts` for queue orchestration.
- C6-C7: Updated `leaveflow-pro/src/components/attendance/ClockInOutWidget.tsx` and `leaveflow-pro/src/components/NetworkStatusBanner.tsx` to use the offline queue and drain on reconnect.
- C8: Added sync state display on the employee dashboard.

### Developer Experience: Boilerplate Reduction (As Of 2026-03-17)
- Added reusable hooks for shared client concerns: `useNetworkStatus`, `useConvexQuery`, `useConvexParallelQuery`, `useConvexMutation`, `useRole`, `useConflictCheck`.
- Refactored representative pages/components to use the hooks (AttendanceHistory, RequestLeave, Reports, Holidays, ProfileSettings, NetworkStatusBanner, useOfflineQueue).
- Split `leaveflow-pro/src/pages/admin/Reports.tsx` into smaller modules under `leaveflow-pro/src/pages/admin/reports/**` (behavior preserved).

### Email (Resend) (As Of 2026-03-17)

- Standardized a BALANCE-branded, email-client-safe HTML wrapper for all transactional emails: `leaveflow-pro/convex/lib/emailTemplates.ts`.
- Added a standalone Resend template HTML for copy/paste usage: `leaveflow-pro/docs/email/resend-balance-template.html`.

### Sprint 4 - Work Package D: Attendance Trust Model

- D1: Documented the trust model decision in `leaveflow-pro/docs/attendance-trust-model.md` (recommended supervised kiosk mode first).
- D2-D3: Added `trustState` and `reviewNotes` fields to the `attendanceLogs` schema.
- D4: Updated `leaveflow-pro/convex/attendanceAdmin.ts` for trust review queries and mutations.
- D5: Designed the HR Trust Review Queue screen.
- D6: Created `leaveflow-pro/src/pages/admin/TrustReviewQueue.tsx` (verification pending).

### Sprint 5 - Work Package F (Part 1): Shift and Roster Engine (Schema + Backend)

- Added backend schema for `shifts`, `shiftRosters`, and `weeklyOffRules`.
- Implemented shift template queries/mutations in `leaveflow-pro/convex/shifts.ts`.
- Implemented roster + weekly off rule queries/mutations in `leaveflow-pro/convex/rosters.ts`.

### Sprint 6 - Work Package F (Part 2): Shift and Roster Engine (Admin UI)

- F8 (Design): Shift Management screen design initiated.
- F9 (Implement): Created `leaveflow-pro/src/pages/admin/ShiftManagement.tsx` for shift template CRUD.
- F10 (Implement): Created `leaveflow-pro/src/pages/admin/RosterAssignment.tsx` for roster assignment + weekly off rules.
- F11 (Update): Updated `leaveflow-pro/src/pages/admin/AttendanceSettings.tsx` to link to the new pages.
- F12 (Backend update): Updated `leaveflow-pro/convex/attendanceAdmin.ts` `getAdminAttendanceDashboard` to include shift information per attendance log.
- F12 (Frontend): Added schedule compliance display to `leaveflow-pro/src/pages/admin/AttendanceDashboard.tsx` using the shift data returned by `getAdminAttendanceDashboard`.
- F12.1 (Refactor): Split `leaveflow-pro/src/pages/admin/AttendanceDashboard.tsx` into modules under `leaveflow-pro/src/pages/admin/attendance-dashboard/**` and reduced editor/dialog boolean state sprawl using a discriminated union.

### Sprint 7 - Work Package H: Payroll Exports and Review

- Added payroll exceptions snapshotting at lock time, a period-level exceptions query, and a resolve mutation ("exceptions review") in `leaveflow-pro/convex/payroll.ts`.
- Wired an HR review drawer into Reports: locked payroll periods now expose an "Exceptions" panel with per-item resolve action in `leaveflow-pro/src/pages/admin/reports/**`.
- Added global payroll mapping config storage plus HR Admin controls for overtime threshold, overtime multiplier, pay period, currency, and unpaid-leave deduction defaults in `leaveflow-pro/convex/payroll.ts` and `leaveflow-pro/src/pages/admin/AttendanceSettings.tsx`.
- Fixed mojibake in the payroll export button copy ("Exporting...") in `leaveflow-pro/src/components/payroll/PayrollExportButton.tsx`.

### Integrations: Email (Resend)

- Added a BALANCE-branded Resend HTML template at `leaveflow-pro/docs/email/resend-balance-template.html`.
- Added a reusable BALANCE email wrapper at `leaveflow-pro/convex/lib/emailTemplates.ts` and refactored leave/absence/digest emails to use it.
- Created and published the Resend template via API (template id: `60e5a04b-669b-45e6-8fa0-082294afbe55`, alias: `balance-base`). Setup notes are in `leaveflow-pro/docs/email/resend-templates-setup.md`.

### Local Verification (As Of 2026-03-17)

- `npm run build`: PASS (local)
- `npm test`: PASS (local)
- `npx tsc -p tsconfig.app.json --noEmit`: PASS (local)
- `npx tsc -p tsconfig.node.json --noEmit`: PASS (local)
- `npm run lint`: PASS (local) (0 warnings)

Build note:
- Simplified Vite/Rollup chunking to avoid circular chunk dependencies that can break runtime module evaluation on staging CDNs (see `leaveflow-pro/vite.config.ts`). PWA precache limit was raised to keep builds deployable with a large shared vendor bundle.
- Added Workbox `skipWaiting`/`clientsClaim`/`cleanupOutdatedCaches` and Pages cache headers to reduce stale precached `index.html` serving old hashed chunks across deployments (`leaveflow-pro/vite.config.ts`, `leaveflow-pro/public/_headers`).

## Remaining (Next Work)

### Sprint 1 - Work Package A: Production Baseline

Notes:
- Continue validating auth-gated flows (employee/manager/admin) on staging with real accounts and real data.
- UI polish: improved sidebar label contrast on the dark sidepanel by fixing `SidebarLink` label color inheritance and raising secondary label contrast (`leaveflow-pro/src/components/ui/sidebar.tsx`, `leaveflow-pro/src/components/AppSidebar.tsx`).

Staging verification details (2026-03-17, current preview deployment URL):
- Cloudflare Pages deploy completed successfully to the alias URL above.
- HTML routes include the security headers from `public/_headers` (CSP + Permissions-Policy present).
- PWA assets are served as real files (not rewritten to HTML):
  - `GET /manifest.webmanifest`: `Content-Type: application/manifest+json`
  - `GET /sw.js`: `Content-Type: application/javascript`
  - `GET /registerSW.js`: `Content-Type: application/javascript`
  - `GET /icon-192x192.png` and `GET /icon-512x512.png`: `Content-Type: image/png`
- Sentry end-to-end ingestion confirmed via the staging-only manual trigger `window.__sentryTestEvent?.()` returning `200` responses from `*.ingest.de.sentry.io`.
- Re-validated after the latest deploy: `scripts/staging_sentry_ingest_check.mjs` observed a `POST 200` ingest response, and `npx convex dev --once` completed successfully.

### Production Readiness Checklist (From `balance-vs-truein-master-plan.md`)

Important note:
- The staging completion of A6/A7 above does not automatically check off the master plan's production-readiness checklist. That checklist is a separate "production go/no-go" track and should be updated as production verification happens.

Remaining work buckets (source: `leaveflow-pro/docs/balance-vs-truein-master-plan.md`):
- Production readiness: finish the production environment rollout (Clerk/Convex/Pages/Sentry/Puter), document rollback, and re-verify the full set of core flows on real devices.
- Roadmap work packages: complete Payroll exports + review (H), Multi-site operations (G), AI attendance copilot follow-through (I), and Identity verification + final hardening (E/P).
- KPI instrumentation: core landing/auth/leave/attendance/AI/HR events are now emitted; remaining work is manager/notification/read-only adoption coverage plus the KPI dashboards and audit sign-off.
- Engineering/product gates: ensure typecheck + tests + manual prod-flow verification are executed for each release, and that the remaining manager/notification/read-only paths are covered by analytics.

Concrete production items still pending (high level):
- Production auth + role routes: verify sign-in/out, role-based routes for employee/manager/hr_admin, and onboarding webhook provisioning.
- Production hosting + env alignment: Cloudflare Pages production deploy, `VITE_CONVEX_URL`/`VITE_CONVEX_SITE_URL` point to production, and production Sentry environment + DSN are set intentionally. `npm run prod:check:strict` now validates the production env matrix and currently flags a test Clerk key, `VITE_SENTRY_ENVIRONMENT=staging`, and missing `RESEND_FROM_EMAIL`.
- Secrets and integrations: set Resend sender (`RESEND_FROM_EMAIL`) if email is intended to be live; confirm Convex backend envs match the documented matrix.
- Monitoring/ops: confirm real production Sentry events, ensure operators can inspect webhook/assistant/email failures, and document rollback path.
- Real-device verification: run the core attendance flows on Android Chrome + iPhone Safari (camera permissions, selfie capture, offline queue drain on reconnect), plus admin review/edit flows.

Production-specific items not yet verified in this report:
- A7 (Production): confirm Sentry receives real production events (production DSN + `VITE_SENTRY_ENVIRONMENT=production`) from the production frontend deployment.

### Sprint 6 - Work Package F (Part 2): Shift and Roster Engine (Admin UI)

Note: F12 schedule compliance display is implemented locally; verify in staging with real shift + attendance data.

### Sprint 7 - Work Package H: Payroll Exports and Review

Status:
- Implemented: Payroll period CRUD + locking, payroll summary calculation, CSV export action, and payroll exceptions review (exceptions are snapshotted when a period is locked, queryable per period, and resolvable) in `leaveflow-pro/convex/payroll.ts`, with UI surfaced in HR Admin Reports (locked periods expose an "Exceptions" drawer).
- Implemented follow-through: overtime-aware payroll summaries now include overtime premium logic for hourly staff, lock-time exceptions flag overtime/unpaid-leave review cases, and payroll exports are now recorded for retention/audit history.
- Remaining: finalize export retention policy decisions and staging/production verification with real compensation + policy data.

### Sprint 8 - Work Package G: Multi-Site Operations

Status:
- Implemented: `sites` + `siteSupervisors` tables + CRUD (`leaveflow-pro/convex/sites.ts`), HR Admin Sites UI (`/admin/sites` + per-site dashboard), supervisor assignment from Sites Management, employee default site assignment, site-aware attendance capture/geofence resolution, site-filtered admin attendance dashboard, site-owned biometrics configs/sync, site-filtered reports/payroll views, and site-tagged absence automation.
- Remaining: complete production verification for supervisor scoping + per-site geofence rules on live data/devices.

### Sprint 9 - Work Package I: AI Attendance Copilot

- Backend: I1-I6 are implemented in `leaveflow-pro/convex/assistant.ts` (attendance anomalies, biometrics sync explanation, payroll delta, staffing/coverage recommendations, and policy-aware answers).
- Frontend: I7 implemented (refactored `leaveflow-pro/src/components/AIChatPanel.tsx` into `leaveflow-pro/src/components/ai-chat/**` with `useAIChatController` and presentational components; behavior preserved), and I8 now opens the admin AI panel with a record-specific attendance review prompt from flagged attendance rows.
- Remaining: validate the AI guidance flow against production data and decide which AI success/follow-through KPIs should be release-gating. Backend tool exposure and role boundaries now have dedicated regression coverage.

### Sprint 10 - Work Package E: Identity Verification + Final Production Hardening

- Backend (partial): face enrollment + verification result ingestion exists (`leaveflow-pro/convex/faceVerification.ts` + `faceEnrollments` / `verificationResults` schema tables), but end-to-end identity verification (including any webhook/device integration) still needs definition and production validation.
- Frontend (partial): Face Enrollment screen exists and is now routed at `/face-enrollment` (employee sidebar link added).
- Trust review operations now surface verification confidence and enrollment status/navigation in `leaveflow-pro/src/pages/admin/TrustReviewQueue.tsx`.
- Final hardening: Implement P1-P5 (production readiness checklist, KPI audit, device testing, rollback docs, go/no-go sign-off).
