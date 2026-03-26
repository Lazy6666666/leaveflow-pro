# BALANCE vs Truein: Master Execution Plan

## Purpose

This is the single source of truth for:

- where BALANCE is behind Truein
- what needs to be implemented
- the recommended delivery order
- the production-hardening work
- the release checklist

This document is meant to be used as the operating plan until production.

## Target Outcome

BALANCE should become:

- trusted enough for attendance capture in the field
- operational enough for HR and managers to run day-to-day workforce workflows
- differentiated enough that it wins on intelligence, not just attendance capture

## Executive Summary

Truein is stronger today in:

- mobile-first attendance execution
- offline attendance reliability
- stronger attendance trust through face-recognition-style positioning
- shift scheduling and attendance rule maturity
- multi-site field operations
- payroll and HRMS export readiness

BALANCE is stronger today in:

- leave workflows
- approvals and delegation
- policy OCR and policy knowledge search
- AI-assisted payroll, burnout, coverage, and biometrics workflows
- role-based operational copilot behavior

That means the correct plan is:

1. Fix production baseline
2. Close attendance reliability and trust gaps
3. Close workforce operations gaps
4. Expand payroll operations
5. Use AI to move beyond parity

## Current Product State

### Already implemented in BALANCE

- employee attendance clock-in and clock-out in web UI
- geolocation capture
- geofencing support
- selfie capture and storage
- biometrics device and webhook ingestion
- leave balances, leave requests, holidays, approvals, and manager delegation
- payroll summary calculations
- payroll periods, locking, CSV export, and exceptions review UI (staging verification pending)
- HR admin reports for payroll, burnout, and coverage
- AI assistant for policy, payroll, biometrics, coverage, and burnout questions
- frontend Sentry
- assistant rate limiting
- webhook hardening and replay protection
- Cloudflare Pages deployment

### Not yet implemented or not yet verified in production

- offline attendance capture and replay (implemented baseline; needs real-device and production verification)
- hardened mobile attendance-first product surface (implemented baseline; continue hardening + reliability instrumentation)
- face verification or equivalent trust model (partial implementation; needs an end-to-end trust workflow and production validation)
- shift scheduling and weekly-off rule engine (implemented baseline; ruleset hardening + staging/production verification)
- multi-site workforce model (implemented baseline; consistent scoping across reads/writes still needs verification)
- payroll export and payroll handoff workflows (CSV + exceptions review exist; deeper export formats + retention/workflows still needed)
- clean repeatable deploy path without oversized asset workaround (implemented baseline; keep monitoring vendor bundle size and SW precache)
- live production Clerk frontend key in Pages (implemented; verify production auth flows end-to-end)
- final production CSP and host-level security header rollout (implemented baseline; production verification pending)

## Gap Matrix

### Gap 1: Mobile attendance execution

Why it matters:

- this is one of Truein's strongest product perceptions

Current BALANCE state:

- mobile-capable browser flow exists
- flow is not yet hardened as a mobile-first attendance product

Needs:

- installable attendance PWA behavior
- better permission recovery
- better upload retry behavior
- more reliable mobile UX

### Gap 2: Offline attendance reliability

Why it matters:

- this is the biggest operational gap versus Truein

Current BALANCE state:

- baseline offline queue, local persistence, and replay-safe server handling exist
- real-device and production verification are still pending

Needs:

- real-device validation on weak/no network
- replay monitoring and production verification
- admin/operator visibility for failed syncs

### Gap 3: Attendance trust

Why it matters:

- selfie capture alone is weaker than a true trust model

Current BALANCE state:

- selfie capture exists
- supervised/manual trust model is documented
- trust review queue and trust states exist
- automated face verification remains partial

Needs:

- automated verification completion if required
- auditability

### Gap 4: Scheduling and attendance rules

Why it matters:

- this is where attendance becomes a real workforce operations system

Current BALANCE state:

- shift templates, rosters, and weekly-off rules exist in baseline form
- attendance compliance still needs hardening and staging/production verification

Needs:

- grace periods
- attendance compliance logic

### Gap 5: Multi-site operations

Why it matters:

- Truein is stronger for distributed field teams and contractors

Current BALANCE state:

- site model, site-scoped biometrics configs, and site supervisors exist
- scoped read/write consistency still needs end-to-end verification

Needs:

- site dashboards

### Gap 6: Payroll operations

Why it matters:

- internal payroll insight is not the same as payroll execution

Current BALANCE state:

- payroll summary exists
- export and operational payroll workflows do not

Needs:

- payroll-ready exports
- payroll mapping logic
- exception review (implemented; staging/prod verification pending)
- payroll cutoffs and locking

### Gap 7: Production maturity

Why it matters:

- competitive product work is wasted if production setup remains fragile

Current BALANCE state:

- Pages project exists
- scripted Pages deployment and dist verification exist
- frontend env and Clerk rollout docs are in place
- CSP/security-header baseline is in repo
- remaining risk is production validation, not missing baseline setup

Needs:

- final launch gates and smoke tests

## Delivery Principles

- do not rebuild architecture without a proven need
- do not add large platforms just to look more enterprise
- fix attendance reliability before building advanced attendance intelligence
- use AI to amplify operational data quality, not to compensate for missing workflows
- tie every sprint to a business outcome, not only a technical milestone

## Recommended Delivery Order

1. Production baseline cleanup
2. Mobile attendance hardening
3. Offline queue and replay
4. Trust model decision
5. Shift and roster model
6. Schedule-aware attendance engine
7. Payroll export readiness
8. AI attendance copilot
9. Multi-site model
10. Identity verification implementation
11. Payroll exception review (implemented; staging/prod verification pending)
12. Policy-attendance AI reasoning
13. Final production hardening and launch gate

## Work Packages

## Work Package A: Production Baseline

### Goal

Remove current launch fragility.

### Implementation

- replace Pages test Clerk key with live Clerk key
- permanently remove or relocate oversized video deploy asset
- verify deploy path without filtered manual upload
- apply host CSP and security headers
- complete staging smoke tests
- confirm operator monitoring path

### Main code and deployment surfaces

- [cloudflare-pages-deploy.md](/C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/docs/cloudflare-pages-deploy.md)
- [security-headers.md](/C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/docs/security-headers.md)
- [prod-env-matrix.md](/C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/docs/prod-env-matrix.md)
- [main.tsx](/C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/src/main.tsx)
- [public](/C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/public)

### Exit criteria

- deploy is repeatable
- auth is live-configured
- staging pass succeeds

## Work Package B: Mobile Attendance Hardening

### Goal

Make mobile attendance reliable and intentionally designed.

### Implementation

- improve camera permission recovery
- improve location permission recovery
- improve selfie upload failure UX
- add attendance-first PWA behavior
- add network-state UX

### Main code surfaces

- [ClockInOutWidget.tsx](/C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/src/components/attendance/ClockInOutWidget.tsx)
- [SelfieCaptureDialog.tsx](/C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/src/components/attendance/SelfieCaptureDialog.tsx)
- [convexUpload.ts](/C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/src/lib/convexUpload.ts)

### Exit criteria

- tested on Android Chrome and iPhone Safari
- no dead-end permission states

## Work Package C: Offline Attendance Queue

### Goal

Support attendance when network is weak or absent.

### Implementation

- queue attendance events locally
- queue associated media metadata
- replay on reconnect
- make server replay-safe
- show pending sync state to users and admins

### Main code surfaces

- [ClockInOutWidget.tsx](/C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/src/components/attendance/ClockInOutWidget.tsx)
- [attendanceEmployee.ts](/C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/convex/attendanceEmployee.ts)
- [attendanceHelpers.ts](/C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/convex/attendanceHelpers.ts)
- [http.ts](/C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/convex/http.ts)

### Exit criteria

- offline events can be captured
- replay is duplicate-safe

## Work Package D: Attendance Trust Model

### Goal

Move beyond selfie-only capture.

### Decision options

- supervised device mode
- face verification
- hybrid model

### Recommendation

- decide first
- build supervised mode first if speed matters
- build automated face verification only after mobile/offline reliability is stable

### Exit criteria

- written trust model decision approved

## Work Package E: Identity Verification

### Goal

Add trust states and reviewability to attendance events.

### Implementation

- enrollment flow
- verification result states
- HR review queue
- audit trail

### Main code surfaces

- [SelfieCaptureDialog.tsx](/C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/src/components/attendance/SelfieCaptureDialog.tsx)
- [files.ts](/C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/convex/files.ts)
- [schema.ts](/C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/convex/schema.ts)
- [BiometricsSettings.tsx](/C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/src/pages/admin/BiometricsSettings.tsx)

### Exit criteria

- admins can see trusted vs flagged attendance events

## Work Package F: Shift and Roster Engine

### Goal

Add the workforce operations backbone.

### Implementation

- shift templates
- roster assignments
- weekly off rules
- grace periods
- late, half-day, overtime, and missed-punch logic

### Main code surfaces

- [schema.ts](/C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/convex/schema.ts)
- [attendanceAdmin.ts](/C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/convex/attendanceAdmin.ts)
- [AttendanceSettings.tsx](/C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/src/pages/admin/AttendanceSettings.tsx)
- [AttendanceDashboard.tsx](/C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/src/pages/admin/AttendanceDashboard.tsx)

### Exit criteria

- attendance is schedule-aware

## Work Package G: Multi-Site Operations

### Goal

Support distributed workforce operations.

### Implementation

- add sites
- attach biometrics and geofence configs to sites
- add site supervisors
- add site-level dashboards and scoped views

### Main code surfaces

- [adminBiometrics.ts](/C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/convex/adminBiometrics.ts)
- [adminBiometricsHelpers.ts](/C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/convex/adminBiometricsHelpers.ts)
- [BiometricsSettings.tsx](/C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/src/pages/admin/BiometricsSettings.tsx)
- [AttendanceDashboard.tsx](/C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/src/pages/admin/AttendanceDashboard.tsx)

### Exit criteria

- site-scoped operations work end to end

## Work Package H: Payroll Exports and Review

### Goal

Turn payroll insight into payroll execution.

### Implementation

- payroll CSV exports
- payroll mapping rules
- cutoff windows
- payroll lock state
- exception review layer (implemented; staging/prod verification pending)

### Main code surfaces

- [payroll.ts](/C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/convex/payroll.ts)
- [ReportsPage.tsx](/C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/src/pages/admin/reports/ReportsPage.tsx)
- [PayrollPeriodsTab.tsx](/C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/src/pages/admin/reports/PayrollPeriodsTab.tsx)
- [PayrollExceptionPanel.tsx](/C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/src/components/payroll/PayrollExceptionPanel.tsx)

### Exit criteria

- payroll can be exported cleanly

## Work Package I: AI Attendance Copilot

### Goal

Use BALANCE's strongest differentiator to move beyond Truein parity.

### Implementation

- explain attendance anomalies
- explain biometrics sync issues
- explain payroll deltas from attendance behavior
- recommend staffing and burnout actions
- connect policy knowledge to attendance and leave reasoning

### Main code surfaces

- [assistant.ts](/C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/convex/assistant.ts)
- [assistantConfig.ts](/C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/src/lib/assistantConfig.ts)
- [assistantReplies.ts](/C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/convex/assistantReplies.ts)
- [AIChatPanel.tsx](/C:/Users/NeilEdwardBaja/desktop/new%20folder/leaveflow-pro/src/components/AIChatPanel.tsx)

### Exit criteria

- assistant gives record-grounded attendance and payroll answers

## Suggested Sprint Sequence

### Sprint 1

- production baseline cleanup
- live Clerk key rollout
- oversized deploy asset fix

### Sprint 2

- mobile attendance hardening
- PWA installability
- permission and retry UX

### Sprint 3

- offline queue architecture
- replay-safe server contract
- sync state UX

### Sprint 4

- complete offline attendance
- trust model decision

### Sprint 5

- shift templates
- roster model
- weekly off logic

### Sprint 6

- schedule-aware attendance engine
- admin dashboard updates

### Sprint 7

- payroll export formats
- payroll review and exceptions (exceptions UI implemented; export formats still pending)

### Sprint 8

- multi-site model
- site supervisor scope

### Sprint 9

- AI attendance copilot
- biometrics and payroll explanations

### Sprint 10

- identity verification or supervised trust mode
- final production hardening

## Accomplished So Far (Repository-Backed)

These items are implemented in the repository baseline, even where staging or production verification is still pending.

### Workforce and attendance baseline

- employee web attendance flow exists with clock-in and clock-out, location capture, geofencing, and selfie capture
- offline attendance queue exists with local persistence, reconnect replay, duplicate-safe server handling, and sync-status UX
- trust states exist on attendance logs and HR can review and update flagged or unverified events through the trust review queue
- shift templates, roster assignment, and weekly-off rules exist in the admin surface
- multi-site primitives exist, including sites, site supervisors, site-scoped biometrics config, and site-aware attendance and report filtering

### Payroll, reporting, and AI baseline

- payroll summary, payroll periods, lock state, CSV export, export history, and exception review UI exist
- HR reporting surfaces exist for payroll, burnout, and coverage
- manager workflows exist for approvals, team calendar, and delegation
- AI workspace and assistant tooling exist for policy, leave, payroll, burnout, coverage, approvals, and staffing questions within role scope

### Deployment and production baseline

- Cloudflare Pages deploy scripts and artifact verification exist in-repo
- PWA installability baseline exists with manifest, service worker, and attendance-first start URL
- security-header and CSP baseline exists in the deploy artifact
- frontend Sentry initialization and a controlled test trigger exist for staged verification

## KPI Checklist

### Reliability KPIs

- [ ] mobile attendance success rate tracked
- [ ] offline replay success rate tracked
- [ ] duplicate attendance replay rate tracked
- [ ] selfie upload failure rate tracked

### Trust KPIs

- [ ] attendance trust state tracked
- [ ] flagged attendance review queue tracked
- [ ] suspicious attendance caught before payroll tracked

### Operations KPIs

- [ ] employee schedule assignment coverage tracked
- [ ] attendance exceptions by rule tracked
- [ ] payroll export volume tracked

### Differentiation KPIs

- [ ] HR assistant usage tracked
- [ ] manager assistant usage tracked
- [ ] policy answer success tracked
- [ ] AI-driven operational actions tracked

## Engineering Gate Checklist

### Code gate

- [ ] typecheck passes
- [ ] focused tests pass
- [ ] touched production flows are manually verified

### Product gate

- [ ] primary success path is tested
- [ ] primary failure path is tested
- [ ] analytics exist for success and failure states

### Release gate

- [ ] staging validation executed
- [ ] rollback path documented
- [ ] env changes documented

## Production Readiness Checklist

These checks are intentionally reserved for live staging or production validation. Repository implementation alone is not enough to mark them complete.

### Identity and access

- [ ] `VITE_CLERK_PUBLISHABLE_KEY` is a live production key
- [ ] `CLERK_JWT_ISSUER_DOMAIN` matches the live Clerk environment
- [ ] `CLERK_WEBHOOK_SIGNING_SECRET` is set in Convex
- [ ] production sign-in works
- [ ] production sign-out works
- [ ] role-based routes work for employee, manager, and HR admin
- [ ] onboarding webhook provisions users correctly

### Frontend hosting

- [ ] Cloudflare Pages project exists
- [ ] production deployment is current
- [ ] deploy path is repeatable without temporary filtering
- [ ] oversized deploy asset is permanently fixed
- [ ] `VITE_CONVEX_URL` points to production
- [ ] `VITE_CONVEX_SITE_URL` points to production
- [ ] `VITE_PUTER_ENABLED` is explicitly set
- [ ] `VITE_SENTRY_DSN` is set
- [ ] `VITE_SENTRY_ENVIRONMENT` is set to `production`
- [ ] `VITE_SENTRY_TRACES_SAMPLE_RATE` is intentionally set

### Backend and secrets

- [ ] `CONVEX_SITE_URL` is set
- [ ] `ADMIN_SETUP_TOKEN` is set
- [ ] `MISTRAL_API_KEY` is set if Mistral fallback or OCR is live
- [ ] `RESEND_API_KEY` is set if email is live
- [ ] `RESEND_FROM_EMAIL` is set if email is live
- [ ] backend envs match the documented matrix

### Security

- [ ] Cloudflare security headers are applied
- [ ] CSP is reviewed against Clerk, Convex, Sentry, and Puter
- [ ] `X-Content-Type-Options` is applied
- [ ] `Referrer-Policy` is applied
- [ ] `Permissions-Policy` is applied
- [ ] webhook replay protection is working
- [ ] assistant rate limiting is working

### Monitoring and operations

- [ ] frontend Sentry receives real production events
- [ ] backend incident logs are visible to operators
- [ ] operator knows how to inspect webhook failures
- [ ] operator knows how to inspect assistant failures
- [ ] operator knows how to inspect email failures
- [ ] rollback path is documented

### Attendance

- [ ] employee can clock in on production
- [ ] employee can clock out on production
- [ ] geolocation denial is handled gracefully
- [ ] selfie capture works on a real mobile device
- [ ] required selfie and required location rules work correctly
- [ ] attendance logs appear in admin dashboard
- [ ] HR attendance edit flow works

### Biometrics

- [ ] biometrics device can be configured
- [ ] webhook URL is correct
- [ ] webhook secret validation works
- [ ] duplicate webhook deliveries are ignored
- [ ] sync status updates correctly
- [ ] biometrics events appear in attendance records

### Leave and approvals

- [ ] leave balances load correctly
- [ ] leave request submission works
- [ ] manager approval works
- [ ] delegation works
- [ ] holidays load correctly
- [ ] team calendar works for managers

### AI and policy

- [ ] Puter path works if enabled
- [ ] Mistral fallback works if enabled
- [ ] assistant can answer policy questions
- [ ] assistant can answer balance questions
- [ ] assistant can answer coverage, burnout, and payroll questions according to role
- [ ] policy OCR and indexing work if enabled

### Reporting and payroll

- [ ] reports page loads in production
- [ ] payroll summary works
- [ ] burnout summary works
- [ ] coverage summary works
- [ ] exports work where implemented

### Domain and branding

- [ ] custom domain is attached if part of launch
- [ ] DNS is correct
- [ ] favicon and metadata render correctly
- [ ] no mojibake or broken copy remains in production

### Final go/no-go

- [ ] live auth works
- [ ] production deploy is repeatable
- [ ] monitoring is active
- [ ] attendance flows work on real devices
- [ ] leave and approval flows work
- [ ] biometrics ingestion works if enabled
- [ ] AI assistant works in intended production mode
- [ ] rollback path is known by operator

## Immediate Priority Checklist

- [x] replace Pages Clerk test key with live key
- [x] permanently fix oversized video deploy issue
- [x] complete CSP and security headers rollout
- [x] run full staging smoke tests
- [ ] verify real Sentry production event capture
- [x] begin mobile attendance hardening
- [x] design offline attendance queue
- [x] design trust model decision

## Success Definition

BALANCE is ready to seriously challenge Truein when:

- attendance works reliably on mobile
- attendance survives weak connectivity
- attendance events are trusted or clearly reviewable
- schedules and weekly offs are modeled explicitly
- payroll exports exist
- multi-site operations exist
- AI can explain attendance and payroll issues from real BALANCE data
- production deploy is clean and repeatable

## Sources

- Truein homepage: https://truein.com/
- Truein mobile attendance: https://truein.com/mobile-based-attendance-system/
- Truein geofencing attendance: https://truein.com/geofencing-attendance-system
- Truein pricing: https://truein.com/pricing/
