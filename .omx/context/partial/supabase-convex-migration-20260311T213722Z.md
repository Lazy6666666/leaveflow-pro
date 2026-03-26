Task statement

Finish the remaining Supabase-to-Convex migration work without breaking current Clerk auth, current Convex-backed flows, or existing UI behavior. Focus on backend parity, missing functionality, safe cleanup, and verification.

Desired outcome

- Convex replaces the remaining real Supabase backend behavior still identified in `SUPABASE_MIGRATION_GAPS.md`.
- `src/components/AIChatPanel.tsx` continues to work with minimal UX change while using a server-side Convex assistant.
- Biometrics auto-sync runs on a real Convex scheduler path using existing vendor adapters and ingestion logic.
- Attendance admin CRUD, storage security, audit coverage, and HR delegation parity are closed or explicitly documented if blocked.
- Legacy Supabase files are only removed when the Convex replacement is implemented and verified.

Known facts / evidence

- Repo root is `leaveflow-pro/`.
- Current migration gap report is `SUPABASE_MIGRATION_GAPS.md`.
- Existing Convex assistant already lives in `convex/assistant.ts`, but it is a simple request/response action and not yet confirmed against old function parity.
- Existing chat UI remains in `src/components/AIChatPanel.tsx`.
- Remaining high-risk backend areas identified in the gap report:
  - AI leave assistant backend parity
  - scheduled biometrics sync by `syncFrequencyMinutes`
  - attendance admin CRUD parity
  - storage ACL parity
  - audit coverage parity
  - HR delegation management parity
- Relevant Convex modules include:
  - `convex/assistant.ts`
  - `convex/admin.ts`
  - `convex/attendance.ts`
  - `convex/manager.ts`
  - `convex/files.ts`
  - `convex/http.ts`
  - `convex/schema.ts`
  - `convex/lib/auth.ts`
  - `convex/crons.ts`
- Relevant legacy Supabase code includes:
  - `supabase/functions/chat-leave/index.ts`
  - `supabase/functions/sync-attendance/index.ts`
  - storage/audit SQL under `supabase/migrations/`

Constraints

- Do not redesign unrelated UI or break current routes.
- Preserve Clerk auth and current Convex-backed behavior.
- Prefer targeted changes over broad refactors.
- Use `apply_patch` for manual file edits.
- Do not delete legacy Supabase files until replacement is implemented and verified.
- Final verification must include at least `npm run build`; run Convex codegen if needed and possible.

Unknowns / open questions

- Exact current auth/role helper coverage for manager vs HR delegation flows.
- Whether current schema/index coverage is sufficient for new attendance/storage/audit queries.
- Whether local Convex codegen or deployment-linked checks require credentials not present in the environment.

Likely codebase touchpoints

- `SUPABASE_MIGRATION_GAPS.md`
- `convex/assistant.ts`
- `convex/admin.ts`
- `convex/attendance.ts`
- `convex/manager.ts`
- `convex/files.ts`
- `convex/http.ts`
- `convex/crons.ts`
- `convex/schema.ts`
- `convex/lib/auth.ts`
- `src/components/AIChatPanel.tsx`
- `src/lib/convexUpload.ts`
- `supabase/functions/chat-leave/index.ts`
- `supabase/functions/sync-attendance/index.ts`
- `supabase/migrations/*.sql`

Suggested worker split

- Worker 1: inspect AI assistant parity and biometrics scheduling paths; report exact file-level gaps and safe implementation hooks.
- Worker 2: inspect storage, audit, attendance admin CRUD, and delegation parity; report authorization and schema implications.
