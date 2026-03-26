Task statement

Use semantic code retrieval to index the repository, query the unresolved migration/parity gaps, and then use tmux-backed OMX team mode to fix the remaining issues in the Supabase -> Convex and Supabase Auth -> Clerk migration.

Desired outcome

- Build a reusable semantic code index for this repository.
- Query the index for the unresolved migration issues and verify the returned code locations.
- Use `omx team ...` from the live tmux leader pane to split the remaining fixes.
- Land the highest-value remaining fixes without regressing the current passing build/test/typecheck state.

Known facts / evidence

- Live tmux leader pane is active (`$TMUX` set); current window has leader pane `%4` and one HUD pane `%7`.
- Previous team run completed cleanly and surfaced concrete remaining issues.
- Current verification state before this pass:
  - `npx convex codegen --typecheck disable`: pass
  - `npx tsc --noEmit`: pass
  - `npm run test`: pass
  - `npm run build`: pass
  - `npm run lint`: noisy at repo baseline due to broad existing ESLint surface, including legacy `supabase/functions/*` and many `no-explicit-any` hits in the new Convex layer
- Concrete remaining issues from previous review:
  - biometrics sync parity is still placeholder-level
  - AI assistant parity is reduced versus previous backend flow
  - scheduled notification/digest parity is still missing
  - worker review also flagged a possible delegation/runtime access issue around manager/delegate visibility
- Already fixed in the last pass:
  - `convex/http.ts` now exposes `/biometrics/webhook`
  - `convex/files.ts` now enforces auth-aware file URL access
  - `convex/attendance.ts` now enforces selfie/location requirements server-side
  - upload helper no longer resolves URLs before ownership is linked

Constraints

- Use semantic retrieval indexing first, then use team mode.
- Keep the team state alive until terminal task state is reached.
- Do not shut down the team early.
- Avoid reverting unrelated dirty-worktree changes.

Unknowns / open questions

- Which remaining issue gives the highest user-facing value for immediate implementation: biometrics sync, AI assistant parity, scheduled digest/notification parity, or delegate-access regression.
- Whether the semantic queries surface any additional cross-cutting files not already covered by prior exact-text review.
- Whether any of the remaining issues require new Convex scheduled functions / crons or HTTP actions beyond the current scaffolding.

Likely codebase touchpoints

- `convex/http.ts`
- `convex/admin.ts`
- `convex/attendance.ts`
- `convex/leave.ts`
- `convex/notifications.ts`
- `convex/users.ts`
- `src/components/AIChatPanel.tsx`
- `src/pages/admin/BiometricsSettings.tsx`
- `src/pages/manager/Approvals.tsx`
- `src/components/AppSidebar.tsx`
- `src/pages/Dashboard.tsx`
- `supabase/functions/*`
- `supabase/migrations/*`

Semantic retrieval plan

- Build index over repo root into `.omx/indexes/remaining-issues-mistral.json`
- Query for:
  - biometrics webhook/sync parity
  - scheduled pending-approval digest / absence notifications
  - AI assistant parity for leave chat
  - delegate approval / team-visibility regression
