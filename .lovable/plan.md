

# Implementation Plan: Email Notifications, Department Management, Leave Balance Adjustments

## 1. Edge Function: `notify-leave` for Email Notifications

Create a backend function that sends email notifications using the Lovable AI-supported email approach. Since this is **transactional email** (not auth email), we need to check available tooling.

**Approach**: Create an edge function `notify-leave` that accepts a payload with the action type (submitted/approved/rejected), request details, and recipient info. The frontend calls it via `supabase.functions.invoke("notify-leave", ...)` after:
- Employee submits a request → notify their manager
- Manager approves/rejects → notify the employee

**Edge function** (`supabase/functions/notify-leave/index.ts`):
- CORS headers included
- `verify_jwt = false` in config.toml, validate auth in code
- Uses Supabase service role to look up manager email (from profiles) and employee email
- Sends email using Resend (requires `RESEND_API_KEY` secret) or falls back to a simple log if no key is set
- Payload: `{ type: "submitted" | "approved" | "rejected", request_id: string }`

**Frontend changes**:
- `RequestLeave.tsx`: After successful insert, invoke `notify-leave` with type `"submitted"`
- `Approvals.tsx`: After successful status update, invoke `notify-leave` with type matching the action

**Config**: Add `[functions.notify-leave]` with `verify_jwt = false` to `supabase/config.toml`

**Secret needed**: `RESEND_API_KEY` — will ask user to provide it before proceeding with email sending.

## 2. Department Management in HR Admin

Add a new page `src/pages/admin/Departments.tsx` and a route `/admin/departments`.

**Features**:
- List all departments in a table
- Add new department (dialog with name input)
- Edit department name
- Delete department (with confirmation)

**Changes**:
- Create `src/pages/admin/Departments.tsx` with CRUD using `supabase.from("departments")`
- Add route in `App.tsx`: `/admin/departments` guarded by `hr_admin` role
- Add sidebar item in `AppSidebar.tsx` under HR Admin section (Building icon)

No DB changes needed — `departments` table and RLS already exist.

## 3. Leave Balance Adjustment for HR Admins

Add a new page `src/pages/admin/Balances.tsx` at route `/admin/balances`.

**Features**:
- Select employee and year to view their balances
- Table showing each leave type and current balance
- "Adjust" button opens dialog to set a new balance value for a specific leave type
- "Initialize Year" button creates default balances for an employee based on leave type allocations
- Bulk initialize for all employees

**Changes**:
- Create `src/pages/admin/Balances.tsx`
- Add route in `App.tsx`: `/admin/balances` guarded by `hr_admin` role  
- Add sidebar item in `AppSidebar.tsx` under HR Admin section (Wallet icon)
- Uses existing `leave_balances` table — HR admin already has full RLS access (insert/update/delete/select)

No DB changes needed.

## Summary of Files to Create/Modify

| File | Action |
|---|---|
| `supabase/functions/notify-leave/index.ts` | Create |
| `supabase/config.toml` | Add function config |
| `src/pages/admin/Departments.tsx` | Create |
| `src/pages/admin/Balances.tsx` | Create |
| `src/App.tsx` | Add 2 routes |
| `src/components/AppSidebar.tsx` | Add 2 sidebar items |
| `src/pages/RequestLeave.tsx` | Add notify-leave invocation |
| `src/pages/manager/Approvals.tsx` | Add notify-leave invocation |

**Secret required**: Will need to ask user for a `RESEND_API_KEY` to enable email sending in the edge function.

