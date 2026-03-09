

## Pre-Production Analysis: Security, Performance, and UI/UX Gaps

### 1. SECURITY FIXES (Critical)

**1a. Audit logs RLS: unauthenticated write access**
The `audit_logs` INSERT policy uses `WITH CHECK (true)` on the `public` role, allowing anyone (even unauthenticated users) to inject fake audit records. Fix: change the policy to target `authenticated` role only, and set `WITH CHECK (changed_by = auth.uid())`.

**1b. RLS policies targeting `public` instead of `authenticated`**
Multiple tables have policies applied to `public` role instead of `authenticated`: `attendance_logs`, `attendance_settings`, `manager_delegations`, `leave_requests` (delegate policies), `departments`, `leave_types`, `public_holidays`. While `auth.uid()` checks prevent data leakage today, this is a misconfiguration that should be corrected.

**1c. Leaked password protection disabled**
The security scan shows leaked password protection (HIBP check) is disabled. Should be enabled via auth configuration.

**1d. Input validation missing**
- `RequestLeave.tsx`: No validation on reason length, no check that `end_date >= start_date`, no file type/size validation on attachments.
- `ProfileSettings.tsx`: No validation on full name length.
- `Balances.tsx`: No bounds checking on balance adjustments (could set negative values).
- `ManagerDelegation.tsx`: No validation that `end_date >= start_date`.

**1e. Bulk initialize is an N+1 query bomb**
`Balances.tsx` `bulkInitialize` fires individual SELECT + INSERT for every employee x leave_type combination. With 100 employees and 5 leave types, that's 500+ queries. Should be batched.

### 2. PERFORMANCE / CACHING

**2a. No React Query usage for data fetching**
Every page uses raw `useState` + `useEffect` + `supabase` calls with no caching, deduplication, or background refetch. React Query is installed but unused. Key pages to convert: Dashboard, MyLeave, LeaveHistory, Employees, Approvals. This would give automatic caching, stale-while-revalidate, and reduce redundant API calls on navigation.

**2b. Dashboard fires 5 sequential/parallel queries every mount**
No caching means navigating away and back re-fetches everything. React Query would cache this.

**2c. AttendanceHistory has no pagination**
Unlike other tables, attendance logs have no pagination and could grow large.

**2d. Approvals page has no pagination**
Could become problematic with many pending requests.

### 3. UI/UX GAPS

**3a. No loading/error states on actions**
- `handleDeactivate` in ManagerDelegation has no loading indicator or error handling.
- `handleCancel` in LeaveHistory has no confirmation dialog (destructive action).
- `handleSave` in Employees has no error handling for role insert failures.

**3b. No confirmation dialogs for destructive actions**
- Cancelling a leave request (LeaveHistory) happens immediately on click with no "Are you sure?" prompt.
- Deactivating a delegation happens immediately.

**3c. Empty state on Approvals for HR admins**
HR admins see ALL pending requests (no team filter), which could include requests they shouldn't need to action.

**3d. Profile page department change is silently ignored**
`handleSave` in ProfileSettings only saves `full_name` but the UI shows a department selector. The department change is never persisted (and would be blocked by RLS since only HR admins can change departments). The department field should either be removed or shown as read-only for non-admins.

**3e. No mobile responsiveness on several pages**
- Dashboard grid `grid-cols-2 lg:grid-cols-5` doesn't have a single-column mobile breakpoint for the stats row.
- Delegation form `sm:grid-cols-4` is cramped on small screens.

**3f. Notification bell doesn't filter by realtime channel**
The realtime subscription listens to ALL inserts on the notifications table, not just for the current user. While there's a client-side filter `if (newNotif.user_id === user?.id)`, this is wasteful and could leak notification metadata.

**3g. CSV export doesn't sanitize values**
Fields containing commas or quotes in CSV exports (LeaveHistory, Employees, AuditLog) could break the CSV format. Values need proper escaping.

---

### Recommended Implementation Plan

**Phase 1 — Security (must-fix before prod)**
1. Fix all RLS policies: change `public` role to `authenticated`, restrict audit_logs INSERT
2. Enable leaked password protection
3. Add client-side input validation (date ranges, field lengths, file size limits)
4. Fix ProfileSettings to not show department as editable for non-admins
5. Add confirmation dialogs for destructive actions (cancel leave, deactivate delegation)

**Phase 2 — Performance**
6. Convert key pages to React Query (`useQuery`/`useMutation`) for caching and deduplication
7. Add pagination to AttendanceHistory and Approvals
8. Fix bulk initialize to use batch inserts

**Phase 3 — UI Polish**
9. Add proper error handling and loading states to all mutations
10. Fix CSV export escaping
11. Add realtime filter to notification channel
12. Improve mobile responsiveness on Dashboard and Delegation pages

### Technical Detail

**RLS migration (Phase 1, items 1-2):**
```sql
-- Drop and recreate policies targeting 'authenticated' instead of 'public'
-- Fix audit_logs INSERT policy
DROP POLICY "System can insert audit logs" ON audit_logs;
CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);
-- Repeat pattern for all affected tables...
```

**React Query conversion pattern (Phase 2, item 6):**
```typescript
const { data: balances, isLoading } = useQuery({
  queryKey: ['leave-balances', user?.id, currentYear],
  queryFn: async () => {
    const { data } = await supabase.from('leave_balances')...
    return data;
  },
  enabled: !!user,
  staleTime: 5 * 60 * 1000, // 5 min cache
});
```

