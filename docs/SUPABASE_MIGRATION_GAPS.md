# Supabase Migration Gaps

## Summary

The active app runtime is on Clerk + Convex. The frontend does not call Supabase directly anymore, and the legacy Supabase backend artifacts have been removed from the repo.

## Current State

Fully or substantially migrated to Convex:

- Core leave data and workflows
- Profiles and roles
- Leave notifications
- Pending approval digest
- Notifications
- Public holidays
- Departments
- Leave balances
- Attendance settings
- Biometrics configs
- Badge mappings
- Manager delegations
- Audit log table

Primary leftover risk areas:

- broader non-critical audit review on untouched low-risk mutations

## Confirmed Supabase-Only Or Legacy Features

### 1. AI leave assistant backend

Status: migrated to Convex

Legacy implementation:

- legacy Supabase edge function `chat-leave` (removed after migration cleanup)

What it did:

- authenticated the user against Supabase auth claims
- exposed tool-calling functions for balances, holidays, leave history, team calendar, pending approvals, and leave submission
- called an external AI gateway for streamed assistant responses

Current Convex state:

- [src/components/AIChatPanel.tsx](C:/Users/NeilEdwardBaja/Desktop/New%20folder/leaveflow-pro/src/components/AIChatPanel.tsx)

Current Convex implementation:

- [convex/assistant.ts](C:/Users/NeilEdwardBaja/Desktop/New%20folder/leaveflow-pro/convex/assistant.ts)
- [src/components/AIChatPanel.tsx](C:/Users/NeilEdwardBaja/Desktop/New%20folder/leaveflow-pro/src/components/AIChatPanel.tsx)

What is now present:

- server-side Convex action for chat requests
- Convex-backed data retrieval for balances, holidays, leave history, pending approvals, and team leave
- deterministic backend responses when no Mistral fallback is configured or available
- Puter as the browser-first provider with Convex-backed tool execution and Mistral fallback
- explicit guardrail to guide users back to BALANCE UI for submit/approve flows instead of acting silently

Migration implication:

- old Supabase `chat-leave` behavior is replaced for current app use
- streaming/tool-call parity from the old edge function is no longer required for current UX, which remains request/response

### 2. Scheduled biometrics sync worker

Status: migrated

Legacy implementation:

- legacy Supabase edge function `sync-attendance` (removed after migration cleanup)

What it did:

- tested vendor connections
- pulled attendance logs from vendor APIs
- supported webhook ingestion
- updated sync status
- matched badge IDs to employees
- wrote attendance logs
- triggered absence notifications

Current Convex state:

- [convex/admin.ts](C:/Users/NeilEdwardBaja/Desktop/New%20folder/leaveflow-pro/convex/admin.ts)
- [convex/http.ts](C:/Users/NeilEdwardBaja/Desktop/New%20folder/leaveflow-pro/convex/http.ts)
- [convex/crons.ts](C:/Users/NeilEdwardBaja/Desktop/New%20folder/leaveflow-pro/convex/crons.ts)

What is present:

- vendor config management
- connection testing
- manual sync action
- webhook ingestion

What is now present:

- scheduled pull sync based on `syncFrequencyMinutes`
- Convex cron loop that iterates active biometrics configs automatically
- sync status transitions for scheduled/manual runs
- manual sync and webhook ingestion preserved
- biometrics ingestion audit coverage for attendance writes

Migration implication:

- old automated biometrics sync behavior is now present on Convex

### 3. Storage bucket and ACL parity

Status: migrated with stricter explicit metadata enforcement

Legacy implementation:

- historical Supabase storage policies and buckets (removed after final cleanup)

Supabase buckets:

- `leave-attachments`
- `avatars`
- `attendance-selfies`

Current Convex state:

- [convex/schema.ts](C:/Users/NeilEdwardBaja/Desktop/New%20folder/leaveflow-pro/convex/schema.ts)
- [convex/files.ts](C:/Users/NeilEdwardBaja/Desktop/New%20folder/leaveflow-pro/convex/files.ts)
- [src/lib/convexUpload.ts](C:/Users/NeilEdwardBaja/Desktop/New%20folder/leaveflow-pro/src/lib/convexUpload.ts)

What is present:

- file references stored on Convex docs
- generic upload URL generation
- guarded file read access through `getFileUrl`

What is now present:

- upload-time segregation by file class
- registered storage metadata in Convex for owner + class tracking
- stricter read-time enforcement for:
  - avatars
  - leave attachments
  - attendance selfies
- mutation-side ownership/class verification before linking files to leave, profile, or attendance records

Migration implication:

- storage access is now materially closer to old bucket semantics while staying aligned with current Convex auth rules

### 4. Audit trigger parity

Status: substantially migrated

Legacy implementation:

- historical Supabase audit trigger setup (removed after final cleanup)

Supabase behavior:

- automatic audit rows via triggers for:
  - `leave_balances`
  - `user_roles`
  - `attendance_logs`
  - `leave_requests`
  - `manager_delegations`

Current Convex state:

- [convex/schema.ts](C:/Users/NeilEdwardBaja/Desktop/New%20folder/leaveflow-pro/convex/schema.ts)
- [convex/lib/auth.ts](C:/Users/NeilEdwardBaja/Desktop/New%20folder/leaveflow-pro/convex/lib/auth.ts)

What is present:

- `auditLogs` table
- manual `recordAudit` helper

What is now present:

- no-op-aware audit helper behavior for updates
- explicit audit coverage for role changes
- explicit audit coverage for biometrics ingestion writes
- explicit audit coverage for same-day attendance patch paths
- additional audit coverage on badge mappings and biometrics config writes

Remaining review area:

- untouched lower-risk mutations still rely on manual discipline rather than automatic trigger semantics

Migration implication:

- audit infrastructure exists, but parity with old automatic auditing is incomplete

### 5. Attendance admin CRUD parity

Status: migrated on the backend

Legacy implementation:

- historical Supabase attendance RLS workflow (removed after final cleanup)

Supabase behavior:

- employees could create/update own attendance
- managers could view and update team attendance
- HR admins could view, insert, update, and delete attendance

Current Convex state:

- [convex/attendance.ts](C:/Users/NeilEdwardBaja/Desktop/New%20folder/leaveflow-pro/convex/attendance.ts)
- [convex/admin.ts](C:/Users/NeilEdwardBaja/Desktop/New%20folder/leaveflow-pro/convex/admin.ts)

What is present:

- employee clock-in and clock-out
- team/admin attendance reads
- attendance settings
- biometrics ingestion
- absence automation

What is now present:

- explicit manager/HR attendance edit mutation with team visibility checks
- explicit HR attendance create mutation
- explicit HR attendance delete mutation
- safe validation for attendance timestamps and selfie ownership/class usage

Migration implication:

- backend correction workflow parity now exists without changing current UI flows

### 6. HR admin delegation management parity

Status: migrated on the backend

Legacy implementation:

- historical Supabase delegation RLS workflow (removed after final cleanup)

Supabase behavior:

- HR admins could view all delegations
- HR admins could manage all delegations
- delegates could view and update delegated team leave requests

Current Convex state:

- [convex/manager.ts](C:/Users/NeilEdwardBaja/Desktop/New%20folder/leaveflow-pro/convex/manager.ts)
- [convex/lib/auth.ts](C:/Users/NeilEdwardBaja/Desktop/New%20folder/leaveflow-pro/convex/lib/auth.ts)
- [convex/leave.ts](C:/Users/NeilEdwardBaja/Desktop/New%20folder/leaveflow-pro/convex/leave.ts)

What is present:

- delegation table
- active delegation resolution in auth helpers
- delegated visibility for leave approvals

What is now present:

- HR visibility over all delegations
- HR ability to create delegations on behalf of a manager
- HR ability to deactivate any delegation
- existing delegated manager approval visibility preserved

Migration implication:

- delegation control now matches the old backend behavior more closely

## Already Replaced Successfully

These old Supabase functions appear to have Convex replacements:

- `notify-leave`
  - replaced by [convex/leaveNotificationEmails.ts](C:/Users/NeilEdwardBaja/Desktop/New%20folder/leaveflow-pro/convex/leaveNotificationEmails.ts)
  - payload builder in [convex/leaveNotifications.ts](C:/Users/NeilEdwardBaja/Desktop/New%20folder/leaveflow-pro/convex/leaveNotifications.ts)

- `digest-pending-approvals`
  - replaced by [convex/notificationScheduler.ts](C:/Users/NeilEdwardBaja/Desktop/New%20folder/leaveflow-pro/convex/notificationScheduler.ts)
  - data source in [convex/notifications.ts](C:/Users/NeilEdwardBaja/Desktop/New%20folder/leaveflow-pro/convex/notifications.ts)

- `notify-absence`
  - replaced by [convex/absenceNotifications.ts](C:/Users/NeilEdwardBaja/Desktop/New%20folder/leaveflow-pro/convex/absenceNotifications.ts)

- `bootstrap-admin`
  - replaced by [convex/admin.ts](C:/Users/NeilEdwardBaja/Desktop/New%20folder/leaveflow-pro/convex/admin.ts)

## Legacy Files Cleanup Status

Removed after runtime verification:

- `supabase/config.toml`
- `supabase/functions/bootstrap-admin/index.ts`
- `supabase/functions/chat-leave/index.ts`
- `supabase/functions/digest-pending-approvals/index.ts`
- `supabase/functions/notify-absence/index.ts`
- `supabase/functions/notify-leave/index.ts`
- `supabase/functions/sync-attendance/index.ts`
- `supabase/README.md`
- `supabase/migrations/*`

Current local reference check:

- active app/runtime code no longer references Supabase clients or Supabase functions directly
- remaining repo references are now limited to:
  - this migration report
  - `lint-output.txt`

Safe cleanup recommendation:

- optionally scrub generated lint artifacts that still mention removed Supabase files

## Recommended Migration Order

### Remaining cleanup order

1. Optionally scrub historical Supabase mentions from generated lint artifacts if you keep those files in-repo.

## Practical Conclusion

The app is not still "running on Supabase" in the normal user flow. Current remaining work is mostly optional repo cleanup:

- optionally scrub generated lint artifacts that still mention removed Supabase files
- optionally broaden audit normalization across untouched low-risk mutations

Core backend parity gaps called out in this report have been closed in Convex.
