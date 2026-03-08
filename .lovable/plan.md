

## BALANCE App Analysis - Gaps and Improvements

After reviewing the entire codebase, here is what's already built and what's missing:

### What's Already Working Well
- Authentication (email, Google, password reset)
- Leave management (request, approve/reject, history, balances)
- Attendance (clock in/out, history, team view, admin dashboard)
- Biometrics (multi-vendor config, badge mappings, CSV import)
- Admin tools (employees, departments, policies, reports, balances)
- AI chat assistant, email notifications, dark mode

### Gaps and Recommended Additions

**1. Branding Inconsistency - ResetPassword page**
The Reset Password page still shows "Leave Manager" branding instead of "BALANCE" with the new logo. The copyright in `Auth.tsx` line 111 also says "Leave Manager".

**2. Leave Balance Auto-Deduction**
When a leave request is approved, the employee's leave balance is NOT automatically deducted. Currently balances must be manually adjusted by HR. This is a critical workflow gap.

**3. Notifications - In-App**
There are email notifications but no in-app notification system (bell icon, notification center). Users have no way to see approval/rejection without checking email or manually refreshing.

**4. Employee Onboarding Flow**
When a new employee signs up, they have no leave balances allocated. There's no automatic provisioning. HR must manually go to Balances and initialize each person.

**5. Reports Missing Attendance Data**
The Reports page only covers leave requests. There are no attendance reports (tardiness rate, absence rate, department attendance comparison).

**6. Data Export**
No CSV/Excel export capability for any data (leave history, attendance logs, reports). HR admins would need this for payroll and compliance.

**7. Audit Trail / Activity Log**
No record of who changed what (balance adjustments, role changes, attendance corrections). Important for compliance.

**8. Half-Day / Partial Leave**
The leave request form only supports full-day ranges. No option for half-day or hourly leave.

**9. Manager Delegation**
No way for a manager to delegate approval authority when they're on leave themselves.

**10. Pagination**
Tables (employees, leave history, attendance) have no pagination. Will break with large datasets (Supabase 1000-row limit).

### Recommended Priority Plan

**Phase 1 - Critical Fixes** (should do now)
1. Fix "Leave Manager" branding on ResetPassword page and Auth copyright
2. Auto-deduct leave balance when request is approved (database trigger)
3. Add pagination to all data tables

**Phase 2 - High Value Features**
4. In-app notification system (notifications table + bell icon + badge count)
5. Auto-provision leave balances on employee signup (trigger on profiles table)
6. Add attendance data to Reports page
7. CSV export for leave history, attendance logs, and reports

**Phase 3 - Nice to Have**
8. Half-day leave support
9. Audit trail / activity log
10. Manager delegation

### Technical Details

**Auto-deduct balance trigger:**
```sql
CREATE FUNCTION deduct_leave_balance() RETURNS trigger
-- On leave_requests UPDATE where status changes to 'approved',
-- calculate days and subtract from leave_balances
```

**Notifications table:**
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY, user_id UUID, title TEXT, message TEXT,
  type TEXT, is_read BOOLEAN DEFAULT false, created_at TIMESTAMPTZ
);
```

**Auto-provision trigger:**
Extend `handle_new_user()` to also insert rows into `leave_balances` for all active leave types.

