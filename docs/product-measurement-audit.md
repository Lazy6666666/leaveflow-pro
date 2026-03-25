# Product Measurement Audit: BALANCE

## Context

This audit defines what BALANCE should measure across the full product surface:

- Public landing and auth
- Employee leave and attendance workflows
- Manager approvals and team operations
- HR admin operations
- AI workspace and copilot usage

The goal is to make launch, adoption, workflow quality, and operational outcomes measurable before any future product decisions depend on them.

## Product Surface

### Roles

- Employee: dashboard, leave balances, leave request, leave history, attendance history, holidays, profile, AI workspace
- Manager: approvals, team calendar, team attendance, delegation, AI workspace role-aware prompts
- HR admin: employees, departments, policies, balances, attendance dashboard, attendance settings, biometrics, badge mappings, reports, audit log, AI workspace role-aware prompts

### Core Flows

1. Landing page CTA -> auth -> first signed-in dashboard visit
2. First-user admin bootstrap
3. Employee leave request -> manager or HR decision
4. Employee clock-in -> clock-out
5. Manager approval queue -> approve/reject
6. Manager and HR team visibility -> coverage review -> delegation
7. HR configuration workflows -> policies, departments, balances, attendance settings, biometrics
8. AI prompt -> answer -> user follow-through into a BALANCE page

## Current Instrumentation Status

### What Exists Today

- Rich operational entities in Convex:
  - `profiles`, `userRoles`, `leaveBalances`, `leaveRequests`, `attendanceLogs`, `notifications`, `managerDelegations`, `biometricsConfigs`, `auditLogs`, `policyDocuments`
- Workflow mutations with durable state changes:
  - leave creation, cancellation, approval
  - clock in, clock out
  - admin setup
  - employee management
  - balances, biometrics, badge mappings, attendance management
- A generic analytics event pipeline exists in frontend and backend:
  - `leaveflow-pro/src/hooks/useAnalytics.ts`
  - `leaveflow-pro/src/lib/analytics.ts`
  - `leaveflow-pro/convex/analytics.ts`
  - `leaveflow-pro/convex/lib/analytics.ts`
- Frontend page-view and CTA instrumentation exists for the current landing, auth, dashboard, AI workspace, attendance widget, leave request flow, admin setup, reports, employees, and policies surfaces.
- Backend success-path instrumentation exists for leave submission/approval, attendance success events, admin setup, employee updates, and leave policy saves.
- Audit log writes for many admin and operational mutations
- Notifications for leave actions
- Derived insight queries:
  - burnout summary
  - coverage conflict check
  - payroll summary

### What Does Not Exist Today

- No complete manager + notification instrumentation pass yet
- No full P2 read-only adoption coverage yet
- No KPI dashboard or release-audit layer that consumes the emitted analytics events yet
- No experiment assignment or exposure events

### Practical Consequence

BALANCE can now measure core landing, auth, leave, attendance, AI, and several HR-admin adoption flows, but it still cannot claim full-funnel product measurement until the manager/notification/read-only gaps and KPI dashboards are completed.

## KPI Definitions

## KPI Definitions: Whole Product

### Primary Metric: `activated_workspace_rate`

| Component | Value |
|-----------|-------|
| Definition | Users who reach a signed-in dashboard session within 24 hours of account creation / users who complete sign-up |
| Numerator | Distinct users with `auth_completed` and `dashboard_viewed` within 24 hours |
| Denominator | Distinct users with `auth_completed` |
| Time window | User-level, first 24 hours after auth completion |
| Segment | By acquisition source, role at first session, device type |
| Exclusions | Internal/test users |
| Direction | Higher is better |
| Type | Leading |

### Supporting Metrics

#### `time_to_first_value`

| Component | Value |
|-----------|-------|
| Definition | Median minutes from `auth_completed` to first successful core action |
| Numerator | Elapsed minutes to first of: `leave_request_submitted`, `clock_in_succeeded`, `admin_setup_completed`, `approval_decision_submitted`, `ai_prompt_sent` |
| Denominator | Users who complete at least one core action |
| Time window | First 7 days after auth completion |
| Segment | By role and acquisition source |
| Exclusions | Internal/test users |
| Direction | Lower is better |
| Type | Leading |

#### `weekly_active_operators`

| Component | Value |
|-----------|-------|
| Definition | Distinct signed-in users with at least one core workflow action in a 7-day window |
| Numerator | Users with a qualifying action |
| Denominator | None, count metric |
| Time window | Rolling 7 days |
| Segment | By role |
| Exclusions | Internal/test users |
| Direction | Higher is better |
| Type | Lagging |

### Metric Relationships

- `activated_workspace_rate` predicts whether acquisition is turning into usable sessions.
- `time_to_first_value` predicts whether onboarding and information architecture are reducing friction.
- `weekly_active_operators` reflects sustained real usage after activation.

### Instrumentation Status

| Metric | Currently Tracked? | Gap |
|--------|-------------------|-----|
| activated_workspace_rate | No | Missing auth completion and dashboard view events |
| time_to_first_value | Partial | Core mutations exist, but no auth-to-session funnel events |
| weekly_active_operators | Partial | Can infer some activity from domain tables, but misses read-only usage |

## KPI Definitions: Employee Leave

### Primary Metric: `leave_request_submission_rate`

| Component | Value |
|-----------|-------|
| Definition | Signed-in employee sessions with at least one successful leave request / employee sessions that viewed leave request form |
| Numerator | Sessions with `leave_request_submitted` |
| Denominator | Sessions with `leave_request_form_viewed` |
| Time window | Per session |
| Segment | By leave type, attachment required vs not, conflict warning shown vs not |
| Exclusions | Sessions with auth expiry mid-flow |
| Direction | Higher is better |
| Type | Leading |

#### `leave_request_approval_rate`

| Component | Value |
|-----------|-------|
| Definition | Leave requests approved / leave requests submitted |
| Numerator | `leaveRequests.status = approved` |
| Denominator | All created leave requests |
| Time window | Request lifecycle |
| Segment | By leave type, manager, department, half-day type |
| Exclusions | Deleted test data |
| Direction | Depends on policy context |
| Type | Lagging |

#### `leave_request_decision_time_hours`

| Component | Value |
|-----------|-------|
| Definition | Median hours from request creation to approval or rejection |
| Numerator | Elapsed hours for decided requests |
| Denominator | Requests with final decision |
| Time window | Request lifecycle |
| Segment | By manager, department, leave type |
| Exclusions | Cancelled requests |
| Direction | Lower is better |
| Type | Lagging |

#### `conflict_warning_to_submit_rate`

| Component | Value |
|-----------|-------|
| Definition | Sessions that submit after seeing a conflict warning / sessions that see a conflict warning |
| Numerator | Sessions with `leave_request_submitted` after `leave_conflict_warning_shown` |
| Denominator | Sessions with `leave_conflict_warning_shown` |
| Time window | Per session |
| Segment | By warning severity and overlap count bucket |
| Exclusions | Invalid date sessions |
| Direction | Context dependent |
| Type | Leading |

### Instrumentation Status

| Metric | Currently Tracked? | Gap |
|--------|-------------------|-----|
| leave_request_submission_rate | No | Missing form view and session-level submit events |
| leave_request_approval_rate | Yes | Can infer from `leaveRequests` |
| leave_request_decision_time_hours | Yes | Can infer from `leaveRequests.createdAt` and `updatedAt` for decided requests |
| conflict_warning_to_submit_rate | No | Missing conflict warning impression event |

## KPI Definitions: Attendance

### Primary Metric: `clock_in_completion_rate`

| Component | Value |
|-----------|-------|
| Definition | Employee attendance sessions with successful clock-in / employee sessions where attendance widget is loaded |
| Numerator | `clock_in_succeeded` |
| Denominator | `attendance_widget_viewed` |
| Time window | Per session, one day context |
| Segment | By requireSelfie, requireLocation, geofenceEnabled, device type |
| Exclusions | Non-work days if business chooses |
| Direction | Higher is better |
| Type | Leading |

#### `same_day_clock_out_completion_rate`

| Component | Value |
|-----------|-------|
| Definition | Attendance logs with both clock in and clock out on same work date / attendance logs with clock in |
| Numerator | `attendanceLogs.clockOut != null` |
| Denominator | Logs with `clockIn != null` |
| Time window | Per work date |
| Segment | By source, status, department |
| Exclusions | Current day before work end cutoff |
| Direction | Higher is better |
| Type | Lagging |

#### `attendance_exception_rate`

| Component | Value |
|-----------|-------|
| Definition | Attendance logs marked late, half_day, or absent / all attendance logs |
| Numerator | Logs with non-standard status |
| Denominator | All attendance logs |
| Time window | Rolling 30 days |
| Segment | By department and source |
| Exclusions | Manually deleted test logs |
| Direction | Lower is better |
| Type | Lagging |

### Instrumentation Status

| Metric | Currently Tracked? | Gap |
|--------|-------------------|-----|
| clock_in_completion_rate | No | Missing widget view event |
| same_day_clock_out_completion_rate | Yes | Can infer from `attendanceLogs` |
| attendance_exception_rate | Yes | Can infer from `attendanceLogs.status` |

## KPI Definitions: Manager Operations

### Primary Metric: `approval_sla_24h`

| Component | Value |
|-----------|-------|
| Definition | Pending leave requests decided within 24 hours / all leave requests submitted to a visible manager scope |
| Numerator | Requests approved or rejected within 24 hours of creation |
| Denominator | All leave requests requiring manager or HR decision |
| Time window | Request lifecycle |
| Segment | By manager, department, leave type, delegated manager access |
| Exclusions | Requests created outside active manager assignment if business decides |
| Direction | Higher is better |
| Type | Lagging |

#### `approval_queue_visit_to_action_rate`

| Component | Value |
|-----------|-------|
| Definition | Sessions with an approval decision / sessions that view approvals page |
| Numerator | `leave_approval_submitted` |
| Denominator | `approvals_page_viewed` |
| Time window | Per session |
| Segment | By queue size bucket |
| Exclusions | Empty queue sessions |
| Direction | Higher is better |
| Type | Leading |

#### `coverage_conflict_resolution_rate`

| Component | Value |
|-----------|-------|
| Definition | Conflict review sessions followed by mitigating action / sessions with coverage conflict results |
| Numerator | Sessions with `coverage_conflicts_viewed` and later `approval_decision_submitted`, `delegation_created`, or schedule adjustment event |
| Denominator | Sessions with `coverage_conflicts_viewed` |
| Time window | Same session or 7 days |
| Segment | By department and conflict count |
| Exclusions | Zero-conflict sessions |
| Direction | Higher is better |
| Type | Leading |

### Instrumentation Status

| Metric | Currently Tracked? | Gap |
|--------|-------------------|-----|
| approval_sla_24h | Yes | Inferred from leave request timestamps |
| approval_queue_visit_to_action_rate | No | Missing approvals page view event |
| coverage_conflict_resolution_rate | No | Missing conflict result view and follow-through linking events |

## KPI Definitions: HR Admin Operations

### Primary Metric: `admin_configuration_completion_rate`

| Component | Value |
|-----------|-------|
| Definition | HR admin users completing at least one core setup action in first 7 days / HR admin users created |
| Numerator | HR admins with one of: employee update, policy saved, balances initialized, attendance settings saved, biometrics config saved |
| Denominator | HR admin users |
| Time window | First 7 days after HR admin role acquisition |
| Segment | First admin vs subsequent admin |
| Exclusions | Internal/test users |
| Direction | Higher is better |
| Type | Leading |

#### `first_admin_bootstrap_success_rate`

| Component | Value |
|-----------|-------|
| Definition | Successful admin bootstrap completions / admin setup submissions |
| Numerator | `admin_setup_completed` |
| Denominator | `admin_setup_submitted` |
| Time window | Per attempt |
| Segment | By environment |
| Exclusions | Internal testing if separated |
| Direction | Higher is better |
| Type | Leading |

#### `biometrics_sync_success_rate`

| Component | Value |
|-----------|-------|
| Definition | Successful biometrics sync actions / total biometrics sync actions |
| Numerator | Syncs with success outcome |
| Denominator | Manual and scheduled sync attempts |
| Time window | Rolling 30 days |
| Segment | By vendor and config |
| Exclusions | Disabled configs |
| Direction | Higher is better |
| Type | Lagging |

### Instrumentation Status

| Metric | Currently Tracked? | Gap |
|--------|-------------------|-----|
| admin_configuration_completion_rate | Partial | Can infer from audit logs, but no first-7-day role acquisition event |
| first_admin_bootstrap_success_rate | No | Missing attempt event |
| biometrics_sync_success_rate | Partial | Config status exists, but sync attempt/result event stream is incomplete |

## KPI Definitions: AI Workspace

### Primary Metric: `ai_workspace_engagement_rate`

| Component | Value |
|-----------|-------|
| Definition | Signed-in sessions with at least one AI prompt / signed-in sessions with AI workspace view or floating copilot open |
| Numerator | Sessions with `ai_prompt_sent` |
| Denominator | Sessions with `ai_workspace_viewed` or `ai_panel_opened` |
| Time window | Per session |
| Segment | By role lens, prompt source, embedded vs floating |
| Exclusions | Empty auto-open states without user interaction |
| Direction | Higher is better |
| Type | Leading |

#### `ai_prompt_to_followthrough_rate`

| Component | Value |
|-----------|-------|
| Definition | AI prompt sessions followed by click-through to a recommended BALANCE page / sessions with an AI answer |
| Numerator | Sessions with `ai_followthrough_clicked` within 30 minutes |
| Denominator | Sessions with `ai_response_rendered` |
| Time window | 30 minutes from response |
| Segment | By role, workflow card, quick action, answer source |
| Exclusions | System error responses |
| Direction | Higher is better |
| Type | Leading |

#### `ai_fallback_rate`

| Component | Value |
|-----------|-------|
| Definition | AI responses served from deterministic fallback or system error / all AI responses |
| Numerator | Responses with source `deterministic` or `system` |
| Denominator | All AI responses |
| Time window | Rolling 7 days |
| Segment | By role and prompt type |
| Exclusions | None |
| Direction | Lower is better |
| Type | Lagging |

### Instrumentation Status

| Metric | Currently Tracked? | Gap |
|--------|-------------------|-----|
| ai_workspace_engagement_rate | No | Missing panel/workspace and prompt events |
| ai_prompt_to_followthrough_rate | No | Missing answer render and deep-link click events |
| ai_fallback_rate | Partial | Response source exists in action return, but is not persisted as analytics |

## Funnel Analysis

## Funnel Analysis: Visitor to Activated User

### Funnel Stages

| Stage | Definition | Event | Drop-off Hypothesis |
|-------|-----------|-------|---------------------|
| 1. Landing view | Public visitor loads `/` | `landing_page_viewed` | Weak acquisition or no tracking |
| 2. CTA click | Visitor clicks sign-up CTA | `landing_cta_clicked` | Value prop not compelling |
| 3. Auth completion | User completes sign-up or sign-in | `auth_completed` | Clerk friction or trust gap |
| 4. Provisioned user | App provisions profile and employee role | `user_provisioned` | Backend onboarding error |
| 5. Dashboard view | User reaches `/dashboard` | `dashboard_viewed` | Redirect/auth issue |
| 6. First value | User completes first meaningful action | `first_core_action_completed` | Navigation confusion or poor onboarding |

### Cohort Breakdowns

- By auth mode: sign-in vs sign-up
- By CTA origin: navbar, hero, pricing, final CTA
- By first role: employee vs HR admin
- By device class

### Data Requirements

| Data | Available? | Source |
|------|-----------|--------|
| Landing page views | No | New frontend event |
| CTA clicks | No | New frontend event |
| Auth completion | No | New auth callback event |
| Provisioning | Partial | `users.ensureCurrentUser` mutation |
| Dashboard view | No | New page view event |
| First core action | Partial | Domain mutations exist |

## Funnel Analysis: Employee Leave Request

### Funnel Stages

| Stage | Definition | Event | Drop-off Hypothesis |
|-------|-----------|-------|---------------------|
| 1. Form view | User lands on `/request-leave` | `leave_request_form_viewed` | Navigation mismatch |
| 2. Dates entered | Both dates selected | `leave_dates_selected` | Form friction |
| 3. Conflict result shown | Conflict check returns result | `leave_conflict_result_viewed` | Team overlap concern |
| 4. Attachment added | Optional file attached | `leave_attachment_added` | Evidence burden too high |
| 5. Submit success | Mutation succeeds | `leave_request_submitted` | Validation or confidence issue |
| 6. Decision | Approved or rejected | existing domain data | Manager SLA or policy mismatch |

### Cohort Breakdowns

- By leave type
- By attachment presence
- By half-day vs full-day
- By conflict count bucket

## Funnel Analysis: Attendance Day Completion

### Funnel Stages

| Stage | Definition | Event | Drop-off Hypothesis |
|-------|-----------|-------|---------------------|
| 1. Widget viewed | Clock widget rendered with user present | `attendance_widget_viewed` | Dashboard not used |
| 2. Clock-in attempt | User initiates clock-in | `clock_in_attempted` | Requirement friction |
| 3. Clock-in success | Mutation succeeds | `clock_in_succeeded` | Selfie, location, or geofence failure |
| 4. Clock-out attempt | User initiates clock-out | `clock_out_attempted` | Forgetfulness or UX invisibility |
| 5. Clock-out success | Mutation succeeds | `clock_out_succeeded` | End-of-day friction |

### Cohort Breakdowns

- By attendance settings configuration
- By source manual vs biometrics
- By department

## Instrumentation Checklist

## Instrumentation Checklist: Whole Product

### Events to Add

| Event | Trigger | Properties | Priority |
|-------|---------|------------|----------|
| `landing_page_viewed` | Public landing page render | `session_id`, `referrer`, `utm_*`, `device_type` | P0 |
| `landing_cta_clicked` | Sign-up/sign-in CTA click on landing | `cta_location`, `target_path`, `session_id` | P0 |
| `auth_completed` | Clerk auth success and app redirect | `auth_mode`, `session_id`, `user_id` | P0 |
| `dashboard_viewed` | Dashboard page render after auth | `user_id`, `role_scope`, `session_id` | P0 |
| `sidebar_nav_clicked` | Sidebar item click | `item`, `from_path`, `to_path`, `role_scope` | P1 |
| `notification_center_opened` | Notification popover opens | `unread_count`, `session_id` | P1 |
| `notification_marked_read` | Single notification marked read | `notification_type`, `notification_age_bucket` | P2 |
| `leave_request_form_viewed` | Request leave page render | `user_id`, `session_id` | P0 |
| `leave_dates_selected` | Both start and end dates valid | `duration_days`, `half_day_type` | P1 |
| `leave_conflict_result_viewed` | Conflict summary returns | `conflict_count`, `severity`, `session_id` | P0 |
| `leave_attachment_added` | Attachment accepted client-side | `file_type`, `file_size_bucket_mb` | P2 |
| `leave_request_submitted` | Leave mutation succeeds | `leave_type_id`, `duration_days`, `half_day_type`, `has_attachment` | P0 |
| `leave_request_cancelled` | Cancel mutation succeeds | `request_id`, `lead_time_days` | P1 |
| `approvals_page_viewed` | Approvals page render | `pending_count`, `session_id` | P0 |
| `leave_approval_submitted` | Approve/reject mutation succeeds | `decision`, `request_age_hours`, `manager_scope` | P0 |
| `team_calendar_viewed` | Team calendar page render | `role_scope`, `month` | P1 |
| `coverage_conflicts_viewed` | Coverage conflict results shown | `date_range_days`, `conflict_count`, `department_count` | P1 |
| `delegation_created` | Delegation mutation succeeds | `duration_days`, `created_by_role` | P1 |
| `attendance_widget_viewed` | Clock widget receives data | `has_today_log`, `require_selfie`, `require_location`, `geofence_enabled` | P0 |
| `clock_in_attempted` | User submits clock-in | `has_selfie`, `has_location` | P0 |
| `clock_in_succeeded` | Clock-in mutation succeeds | `status`, `source`, `has_selfie`, `has_location` | P0 |
| `clock_in_failed` | Clock-in mutation throws | `error_type`, `require_selfie`, `require_location`, `geofence_enabled` | P0 |
| `clock_out_attempted` | User submits clock-out | `has_selfie`, `has_location` | P0 |
| `clock_out_succeeded` | Clock-out mutation succeeds | `source`, `work_duration_bucket_hours` | P0 |
| `admin_setup_submitted` | Admin setup form submit | `session_id` | P0 |
| `admin_setup_completed` | Admin bootstrap success | `user_id`, `session_id` | P0 |
| `employees_page_viewed` | Employees admin page render | `employee_count` | P2 |
| `policy_document_index_started` | Policy indexing or OCR starts | `source`, `has_file` | P2 |
| `policy_document_index_completed` | Policy indexing completes | `document_id`, `source` | P2 |
| `biometrics_sync_triggered` | Manual or scheduled sync starts | `config_id`, `vendor`, `trigger_source` | P1 |
| `biometrics_sync_completed` | Sync completes | `config_id`, `vendor`, `status`, `record_count` | P1 |
| `reports_page_viewed` | Reports page render | `session_id` | P2 |
| `reports_csv_exported` | Export button clicked | `has_payroll`, `has_burnout`, `has_coverage` | P2 |
| `ai_workspace_viewed` | AI workspace page render | `role_lenses`, `visible_prompt_count` | P0 |
| `ai_panel_opened` | Floating or embedded panel becomes visible by user action | `mode`, `role_scope` | P0 |
| `ai_quick_action_clicked` | Quick action chip click | `label`, `mode`, `role_scope` | P0 |
| `ai_prompt_sent` | User message submitted | `mode`, `prompt_source`, `message_length_bucket`, `role_scope` | P0 |
| `ai_response_rendered` | Assistant response displayed | `source`, `intent`, `mode`, `role_scope` | P0 |
| `ai_followthrough_clicked` | User clicks workflow deep link after AI usage | `destination`, `origin_surface`, `role_scope` | P0 |

### Event Schemas (Detail)

#### `leave_request_submitted`

- **Trigger**: `createRequest` mutation succeeds
- **Properties**:
  | Property | Type | Required | Description |
  |----------|------|----------|-------------|
  | `user_id` | string | yes | Actor user id |
  | `request_id` | string | yes | Created leave request id |
  | `leave_type_id` | string | yes | Leave type selected |
  | `duration_days` | number | yes | Computed day count after half-day rules |
  | `half_day_type` | string or null | yes | `null`, `start`, `end`, or `single` |
  | `has_attachment` | boolean | yes | Whether supporting file was uploaded |
  | `conflict_count` | number | no | Last known overlap count if available client-side |
  | `session_id` | string | yes | Session identifier |
- **Example payload**:
```json
{
  "user_id": "user_123",
  "request_id": "jr7leave1",
  "leave_type_id": "lt_sick",
  "duration_days": 2,
  "half_day_type": null,
  "has_attachment": true,
  "conflict_count": 1,
  "session_id": "sess_abc"
}
```
- **Volume**: Roughly proportional to leave submission volume

#### `clock_in_failed`

- **Trigger**: Clock-in submit path throws in UI or mutation
- **Properties**:
  | Property | Type | Required | Description |
  |----------|------|----------|-------------|
  | `user_id` | string | yes | Actor user id |
  | `error_type` | string | yes | Normalized reason such as `already_clocked_in`, `missing_selfie`, `missing_location`, `geofence_rejected`, `network_error` |
  | `require_selfie` | boolean | yes | Setting at attempt time |
  | `require_location` | boolean | yes | Setting at attempt time |
  | `geofence_enabled` | boolean | yes | Setting at attempt time |
  | `session_id` | string | yes | Session identifier |
- **Example payload**:
```json
{
  "user_id": "user_123",
  "error_type": "missing_selfie",
  "require_selfie": true,
  "require_location": false,
  "geofence_enabled": false,
  "session_id": "sess_abc"
}
```

#### `ai_response_rendered`

- **Trigger**: Assistant response is appended to the visible message list
- **Properties**:
  | Property | Type | Required | Description |
  |----------|------|----------|-------------|
  | `user_id` | string | yes | Viewer id |
  | `mode` | string | yes | `floating` or `embedded` |
  | `source` | string | yes | `mistral`, `deterministic`, or `system` |
  | `intent` | string | no | Resolved backend intent if available |
  | `message_count_in_session` | number | yes | Running chat turn count |
  | `role_scope` | string | yes | `employee`, `manager`, `hr_admin`, or combined |
  | `session_id` | string | yes | Session identifier |
- **Example payload**:
```json
{
  "user_id": "user_123",
  "mode": "embedded",
  "source": "mistral",
  "intent": "coverage",
  "message_count_in_session": 6,
  "role_scope": "hr_admin",
  "session_id": "sess_abc"
}
```

## Implementation Notes

### Highest-Leverage Instrumentation Points

- Landing CTAs:
  - `src/components/landing/Hero.tsx`
  - `src/components/landing/Navbar.tsx`
  - `src/components/landing/PricingTier.tsx`
  - `src/components/landing/FinalCTA.tsx`
- Auth and provisioning:
  - `src/pages/Auth.tsx`
  - `src/contexts/AuthContext.tsx`
  - `convex/users.ts`
- Dashboard and navigation:
  - `src/pages/Dashboard.tsx`
  - `src/components/AppSidebar.tsx`
  - `src/components/NotificationBell.tsx`
- Leave flow:
  - `src/pages/RequestLeave.tsx`
  - `src/pages/LeaveHistory.tsx`
  - `convex/leave.ts`
- Attendance flow:
  - `src/components/attendance/ClockInOutWidget.tsx`
  - `convex/attendanceEmployee.ts`
- Manager workflows:
  - `src/pages/manager/Approvals.tsx`
  - `src/pages/manager/TeamCalendar.tsx`
  - `src/pages/manager/ManagerDelegation.tsx`
  - `convex/manager.ts`
- HR workflows:
  - `src/pages/AdminSetup.tsx`
  - `src/pages/admin/Reports.tsx`
  - `src/pages/admin/BiometricsSettings.tsx`
  - `convex/adminBiometrics.ts`
- AI usage:
  - `src/pages/AIWorkspace.tsx`
  - `src/components/AIChatPanel.tsx`
  - `convex/assistant.ts`

### Existing Data That Can Be Used Immediately

- Leave request outcome and decision latency from `leaveRequests`
- Attendance completion and exception rates from `attendanceLogs`
- Manager delegation usage from `managerDelegations`
- Notification volume and unread state from `notifications`
- Operational change history from `auditLogs`
- Burnout, coverage, payroll summaries from current derived Convex queries

### Missing Before Meaningful Experimentation

- Stable analytics session id
- User-level event stream with timestamps
- Experiment assignment and exposure events
- UTM/referrer capture on public pages
- Standardized event taxonomy shared by frontend and backend

## Recommended Rollout

1. Add a minimal analytics layer and emit all P0 events first.
2. Backfill baseline dashboards for activation, leave, attendance, approvals, and AI usage.
3. Add P1 events for manager and biometrics workflows.
4. Add experiment exposure events only after the event taxonomy is stable.

## Key Risks

- The current admin reports page shows aggregates, but several are operational summaries rather than product KPIs.
- Audit logs are useful for forensic review, but they are not substitutes for intent-aware analytics events.
- AI adoption and AI usefulness are currently unmeasurable beyond anecdotal usage because prompts, responses, and follow-through are not persisted as product telemetry.
