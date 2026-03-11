Task statement

Migrate the existing BALANCE app backend from Supabase to Convex and migrate authentication from Supabase Auth/Lovable cloud auth to Clerk, then remove Supabase usage from the frontend and backend code.

Desired outcome

- React app runs against Clerk + Convex providers instead of Supabase.
- Existing auth gates, roles, and protected routes still work.
- Existing Supabase table/function usage is replaced by Convex schema, queries, mutations, and actions.
- Remaining Supabase imports and API calls are removed or isolated behind an explicit follow-up if blocked by credentials/live services.

Known facts / evidence

- Repo root for the app is `leaveflow-pro/`.
- Current auth is a custom `AuthContext` over `supabase.auth` in `src/contexts/AuthContext.tsx`.
- Route protection uses `AuthGuard` + `RoleGuard` in `src/App.tsx`.
- Supabase client is centralized in `src/integrations/supabase/client.ts`.
- Frontend currently hits Supabase tables: `departments`, `profiles`, `user_roles`, `leave_types`, `leave_balances`, `leave_requests`, `public_holidays`, `attendance_logs`, `attendance_settings`, `badge_mappings`, `biometrics_config`, `notifications`, `manager_delegations`, `audit_logs`.
- Frontend currently hits Supabase storage buckets: `avatars`, `leave-attachments`, `attendance-selfies`.
- Frontend currently invokes Supabase functions: `bootstrap-admin`, `notify-leave`, `sync-attendance`.
- Supabase SQL schema lives under `supabase/migrations/`.
- Dirty worktree exists before migration work. Current modified/untracked files include `package.json`, `package-lock.json`, `src/App.tsx`, `src/pages/Auth.tsx`, `src/pages/Dashboard.tsx`, `src/pages/Index.tsx`, `src/pages/admin/Reports.tsx`, logo assets, Stripe components, and `src/components/landing/*`.
- No deeper repo `AGENTS.md` was found under `leaveflow-pro/`.
- `tmux` and `omx` are installed. The current shell was not already inside tmux at snapshot time.

Constraints

- Do not revert unrelated user changes in the dirty worktree.
- Follow migration phases in order and validate each before advancing.
- Use Convex + Clerk as target stack.
- Team launch must be tmux-backed and evidence-driven.

Unknowns / open questions

- No live Clerk keys or Convex deployment URL are present yet.
- A data backfill path from Supabase Postgres to Convex documents may require a one-off import script and access to exported Supabase data.
- Supabase Storage assets must move somewhere; likely Convex file storage or another external asset store, but the repo does not yet define that choice.
- Some current Supabase edge functions perform scheduled/integration work that may need Convex actions/crons plus environment secrets.

Likely codebase touchpoints

- `src/main.tsx`
- `src/App.tsx`
- `src/contexts/AuthContext.tsx`
- `src/components/AuthGuard.tsx`
- `src/components/RoleGuard.tsx`
- `src/components/AppSidebar.tsx`
- `src/components/NotificationBell.tsx`
- `src/components/attendance/*`
- `src/pages/**/*.tsx`
- `src/integrations/supabase/*`
- `src/integrations/lovable/index.ts`
- `supabase/migrations/*.sql`
- `supabase/functions/*`
- `package.json`

Suggested worker split

- Worker 1: derive final logical schema and access-control rules from Supabase SQL migrations.
- Worker 2: inventory frontend Supabase auth/data/storage/function usage and map to target Convex/Clerk modules.
