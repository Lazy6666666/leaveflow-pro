

# Leave Management System — Implementation Plan

This is a large system. I'll implement it in ordered phases across multiple steps. Here's the full plan:

## Phase 1: Database Schema & Auth Setup

### Database Migrations (single migration)

Create all tables, enums, functions, RLS policies, and triggers:

- **Enum**: `app_role` ('employee', 'manager', 'hr_admin')
- **Tables**: `departments`, `profiles` (linked to auth.users), `user_roles`, `leave_types`, `leave_balances`, `leave_requests`
- **Security definer function**: `has_role(uuid, app_role)` to avoid RLS recursion
- **RLS policies**: Per-table access control using `has_role()`
- **Trigger**: Auto-create profile + default 'employee' role on signup
- **Seed data**: Default leave types (Annual, Sick, Emergency, Unpaid) with allocations

### Auth Configuration
- Enable Google OAuth (user will need to provide Google Client ID/Secret in Supabase Auth settings)
- Supabase client setup with auth context and role management

### Storage
- Create `leave-attachments` bucket with RLS

## Phase 2: Core Frontend Infrastructure

### Files to create/modify:

- `src/integrations/supabase/client.ts` — Supabase client
- `src/contexts/AuthContext.tsx` — Auth state, session, user role
- `src/types/database.ts` — TypeScript types for all tables
- `src/components/AppSidebar.tsx` — Role-aware sidebar navigation
- `src/components/AppLayout.tsx` — Layout with sidebar + header + SidebarTrigger
- `src/components/AuthGuard.tsx` — Redirect unauthenticated users
- `src/components/RoleGuard.tsx` — Restrict routes by role
- `src/pages/Auth.tsx` — Login/signup with Google sign-in
- `src/pages/ResetPassword.tsx` — Password reset page
- Update `src/App.tsx` — All routes with guards

## Phase 3: Employee Pages

- `src/pages/Dashboard.tsx` — Role-based dashboard (leave balances, recent requests, quick actions)
- `src/pages/MyLeave.tsx` — Leave balance cards with progress bars
- `src/pages/RequestLeave.tsx` — Form with date pickers, leave type select, file upload, reason
- `src/pages/LeaveHistory.tsx` — Table of past requests with status badges, cancel action for pending

## Phase 4: Manager Pages

- `src/pages/manager/Approvals.tsx` — Pending requests table with approve/reject + comment
- `src/pages/manager/TeamCalendar.tsx` — Monthly calendar showing team leaves

## Phase 5: HR Admin Pages

- `src/pages/admin/Employees.tsx` — Employee CRUD, assign roles/departments/managers
- `src/pages/admin/Policies.tsx` — Configure leave types, allocation, carry-forward
- `src/pages/admin/Reports.tsx` — Analytics with recharts (leave trends, department usage)

## Phase 6: Edge Functions & Email Notifications

- `supabase/functions/notify-leave/index.ts` — Edge function to send emails on request submit, approve, reject
- Frontend calls this function after relevant actions

## Implementation Order

I'll build this incrementally across multiple messages:
1. **First**: Database migrations + Supabase client + auth context + auth page + app layout with sidebar
2. **Second**: Employee pages (dashboard, my-leave, request-leave, leave-history)
3. **Third**: Manager pages (approvals, team-calendar)
4. **Fourth**: Admin pages (employees, policies, reports)
5. **Fifth**: Edge function for email notifications + storage bucket

Each step will produce a working, testable state.

