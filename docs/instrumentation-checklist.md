# Instrumentation Checklist: BALANCE

## Objective

Add a minimal product analytics layer that captures acquisition, activation, leave, attendance, manager, HR admin, and AI workspace behaviors without replacing existing transactional or audit data.

## Tracking Principles

- Track user behavior that informs a product decision
- Keep event names stable and verb-first
- Emit success and failure events separately for critical workflows
- Prefer one event per meaningful state transition
- Include `session_id`, `user_id` when available, `role_scope`, and `timestamp` on all events

## Common Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `session_id` | string | yes | Stable analytics session id |
| `user_id` | string | no | Present after auth |
| `role_scope` | string | no | `employee`, `manager`, `hr_admin`, `manager_delegated`, or combined |
| `path` | string | no | Current route |
| `surface` | string | yes | Product surface such as `landing`, `dashboard`, `leave`, `attendance`, `ai_workspace` |
| `timestamp` | string | yes | ISO timestamp |

## P0 Events

### Acquisition and Activation

| Event | Trigger | Properties | Code Location |
|-------|---------|------------|---------------|
| `landing_page_viewed` | Public landing page render | `referrer`, `utm_*`, `device_type` | `src/pages/Index.tsx` |
| `landing_cta_clicked` | Sign-in or sign-up CTA click | `cta_location`, `target_path` | `src/components/landing/Hero.tsx`, `src/components/landing/Navbar.tsx`, `src/components/landing/PricingTier.tsx`, `src/components/landing/FinalCTA.tsx` |
| `auth_viewed` | Auth page render | `mode`, `redirect_target` | `src/pages/Auth.tsx` |
| `auth_completed` | First authenticated app session | `auth_mode`, `is_new_user` | `src/contexts/AuthContext.tsx` |
| `user_provisioned` | `ensureCurrentUser` succeeds | `created_profile`, `created_employee_role` | `convex/users.ts` |
| `dashboard_viewed` | Dashboard render with resolved data | `pending_count`, `has_manager_access` | `src/pages/Dashboard.tsx` |

### Leave Workflow

| Event | Trigger | Properties | Code Location |
|-------|---------|------------|---------------|
| `leave_request_form_viewed` | Request leave page render | `available_leave_type_count` | `src/pages/RequestLeave.tsx` |
| `leave_dates_selected` | Valid start and end dates selected | `duration_days`, `half_day_type` | `src/pages/RequestLeave.tsx` |
| `leave_conflict_result_viewed` | Conflict query returns result | `conflict_count`, `severity`, `date_span_days` | `src/pages/RequestLeave.tsx` |
| `leave_request_submitted` | Leave mutation succeeds | `request_id`, `leave_type_id`, `duration_days`, `half_day_type`, `has_attachment` | `convex/leave.ts` |
| `leave_request_submit_failed` | Leave mutation fails | `error_type`, `has_attachment`, `date_span_days` | `src/pages/RequestLeave.tsx` |
| `leave_approval_submitted` | Approval or rejection succeeds | `request_id`, `decision`, `decision_latency_hours` | `convex/leave.ts` |

### Attendance Workflow

| Event | Trigger | Properties | Code Location |
|-------|---------|------------|---------------|
| `attendance_widget_viewed` | Widget receives query data | `has_today_log`, `require_selfie`, `require_location`, `geofence_enabled` | `src/components/attendance/ClockInOutWidget.tsx` |
| `clock_in_attempted` | User initiates clock-in | `has_selfie`, `has_location` | `src/components/attendance/ClockInOutWidget.tsx` |
| `clock_in_succeeded` | Clock-in succeeds | `log_id`, `status`, `source`, `has_selfie`, `has_location` | `convex/attendanceEmployee.ts` |
| `clock_in_failed` | Clock-in throws | `error_type`, `require_selfie`, `require_location`, `geofence_enabled` | `src/components/attendance/ClockInOutWidget.tsx` |
| `clock_out_attempted` | User initiates clock-out | `has_selfie`, `has_location` | `src/components/attendance/ClockInOutWidget.tsx` |
| `clock_out_succeeded` | Clock-out succeeds | `log_id`, `work_duration_bucket_hours` | `convex/attendanceEmployee.ts` |
| `clock_out_failed` | Clock-out throws | `error_type` | `src/components/attendance/ClockInOutWidget.tsx` |

### AI Workspace

| Event | Trigger | Properties | Code Location |
|-------|---------|------------|---------------|
| `ai_workspace_viewed` | AI workspace page render | `visible_prompt_count`, `role_lenses` | `src/pages/AIWorkspace.tsx` |
| `ai_panel_opened` | Floating or embedded panel becomes visible by user action | `mode`, `entry_point` | `src/components/AIChatPanel.tsx` |
| `ai_quick_action_clicked` | Quick action chip click | `label`, `mode` | `src/components/AIChatPanel.tsx` |
| `ai_prompt_sent` | User message submitted | `mode`, `prompt_source`, `message_length_bucket` | `src/components/AIChatPanel.tsx` |
| `ai_response_rendered` | Assistant reply added to message list | `source`, `intent`, `mode` | `src/components/AIChatPanel.tsx`, `convex/assistant.ts` |
| `ai_followthrough_clicked` | User clicks BALANCE deep link after AI guidance | `destination`, `origin_surface` | `src/pages/AIWorkspace.tsx` |

### Admin Bootstrap

| Event | Trigger | Properties | Code Location |
|-------|---------|------------|---------------|
| `admin_setup_viewed` | Admin setup page render | `needs_admin_setup` | `src/pages/AdminSetup.tsx` |
| `admin_setup_submitted` | Setup token form submit | `has_token` | `src/pages/AdminSetup.tsx` |
| `admin_setup_completed` | Bootstrap succeeds | `user_id` | `src/pages/AdminSetup.tsx`, `convex/adminCore.ts` |
| `admin_setup_failed` | Bootstrap fails | `error_type` | `src/pages/AdminSetup.tsx` |

## P1 Events

### Navigation and Notifications

| Event | Trigger | Properties | Code Location |
|-------|---------|------------|---------------|
| `sidebar_nav_clicked` | Sidebar nav click | `item`, `from_path`, `to_path` | `src/components/AppSidebar.tsx` |
| `notification_center_opened` | Notification popover opens | `unread_count` | `src/components/NotificationBell.tsx` |
| `notification_marked_read` | Single notification read | `notification_type`, `notification_age_bucket` | `src/components/NotificationBell.tsx` |
| `notifications_mark_all_read` | Mark all read succeeds | `unread_count` | `src/components/NotificationBell.tsx` |

### Manager Workflow

| Event | Trigger | Properties | Code Location |
|-------|---------|------------|---------------|
| `approvals_page_viewed` | Approvals page render | `pending_count` | `src/pages/manager/Approvals.tsx` |
| `team_calendar_viewed` | Team calendar render | `month`, `visible_event_count` | `src/pages/manager/TeamCalendar.tsx` |
| `team_attendance_viewed` | Team attendance render | `day_offset`, `visible_employee_count` | `src/pages/manager/TeamAttendance.tsx` |
| `coverage_conflicts_viewed` | Coverage query result shown | `start_date`, `end_date`, `conflict_count` | `convex/insights.ts`, `src/pages/admin/Reports.tsx` |
| `delegation_created` | Delegation succeeds | `duration_days`, `created_by_role` | `convex/manager.ts` |
| `delegation_deactivated` | Deactivation succeeds | `delegation_age_days` | `convex/manager.ts` |
| `payroll_exported` | Payroll CSV export succeeds | `period_id`, `site_id`, `row_count`, `employee_count`, `total_gross_pay`, `export_format` | `src/components/payroll/PayrollExportButton.tsx` |

### HR Admin Workflow

| Event | Trigger | Properties | Code Location |
|-------|---------|------------|---------------|
| `reports_page_viewed` | Reports render | `has_payroll`, `has_burnout`, `has_coverage` | `src/pages/admin/Reports.tsx` |
| `reports_csv_exported` | CSV export button click | `sections_included` | `src/pages/admin/Reports.tsx` |
| `employee_updated` | Employee update succeeds | `changed_fields`, `target_role` | `convex/adminCore.ts` |
| `leave_policy_saved` | Policy create or update succeeds | `is_active`, `allocation_days` | `convex/adminCore.ts` |
| `attendance_settings_saved` | Attendance settings saved | `require_selfie`, `require_location`, `geofence_enabled` | `convex/attendanceAdmin.ts` |
| `biometrics_sync_triggered` | Manual or scheduled sync starts | `config_id`, `vendor`, `trigger_source` | `convex/adminBiometrics.ts`, `convex/crons.ts` |
| `biometrics_sync_completed` | Sync finishes | `config_id`, `vendor`, `status`, `record_count` | `convex/adminBiometrics.ts` |

## P2 Events

| Event | Trigger | Properties | Code Location |
|-------|---------|------------|---------------|
| `my_leave_viewed` | My Leave page render | `balance_count`, `current_year` | `src/pages/MyLeave.tsx` |
| `leave_history_viewed` | Leave history page render | `request_count` | `src/pages/LeaveHistory.tsx` |
| `attendance_history_viewed` | Attendance history render | `month_offset`, `log_count` | `src/pages/AttendanceHistory.tsx` |
| `employees_page_viewed` | Employees page render | `employee_count` | `src/pages/admin/Employees.tsx` |
| `policies_page_viewed` | Policies page render | `policy_count`, `document_count` | `src/pages/admin/Policies.tsx` |
| `policy_document_index_started` | OCR or indexing starts | `source`, `has_file` | `src/components/admin/PolicyDocumentOcrDialog.tsx`, `convex/rag.ts` |
| `policy_document_index_completed` | OCR or indexing completes | `document_id`, `source` | `convex/rag.ts` |

## Event Implementation Notes

### Session Handling

- Generate a client session id on first app load
- Persist it in browser storage with rotation rules
- Pass it through frontend analytics events
- Include it in backend mutation analytics when the UI can forward it

### Role Scope Rules

- Emit `role_scope` based on effective access, not just explicit role
- Distinguish delegated manager access from explicit manager role where relevant

### Error Normalization

Normalize failure events into stable buckets:

- `validation_error`
- `network_error`
- `unauthorized`
- `already_completed`
- `missing_selfie`
- `missing_location`
- `geofence_rejected`
- `unknown`

### Join Strategy

Keep product analytics separate from domain tables, but use common ids to join later:

- `user_id`
- `request_id`
- `log_id`
- `config_id`
- `session_id`

## Recommended Delivery Order

1. Ship P0 activation, leave, attendance, AI, and admin bootstrap events
2. Validate event payload quality in lower environments
3. Build first KPI dashboards from P0 only
4. Add P1 manager and HR admin events
5. Add P2 read-only adoption events after core funnels are stable

## Done Criteria

- Every P0 event emits in success and failure paths where applicable
- Every event has a documented owner and code location
- Events use a shared schema and naming convention
- Session id is stable across a signed-in session
- KPI dashboards can be computed without ambiguous business logic
