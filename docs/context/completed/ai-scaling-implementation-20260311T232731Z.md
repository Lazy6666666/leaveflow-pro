Task statement

Execute `docs/ai_scaling_implementation_plan.md` in `leaveflow-pro`, using a dedicated git worktree, semantic code retrieval for repo mapping, and OMX team mode for parallel execution. Final result must be merged back into the current branch `feature/selfie-checkin-local-final`.

Desired outcome

- Add Phase 1 AI scaling backend capabilities for payroll, insights, and policy RAG.
- Upgrade assistant orchestration to route by intent and respect role-specific data visibility.
- Update chat UI quick actions and output formatting to expose the new capabilities cleanly.
- Verify the implementation locally, then merge the worktree branch back into the current branch.

Known facts and evidence

- Plan source: `docs/ai_scaling_implementation_plan.md`.
- Current branch: `feature/selfie-checkin-local-final`.
- Current worktree is dirty in unrelated files: `.env`, `convex/_generated/api.d.ts`, plus untracked `docs/mistral_ai_integration_analysis.md` and `node`.
- Repo has existing Convex modules for `assistant`, `attendance`, `leave`, `admin`, `manager`, `users`, and `schema`.
- `convex/schema.ts` currently has no salary/rate fields on `profiles` and no `policyDocuments` table.
- `convex/assistant.ts` currently implements a deterministic leave-focused assistant with no payroll, insights, or RAG integration.
- `src/components/AIChatPanel.tsx` currently exposes generic leave quick actions and markdown rendering.
- `tmux` and `omx` are available, and this leader session is already inside tmux.
- `MISTRAL_API_KEY` is present in the environment, so semantic indexing is available if needed.

Constraints

- Use the provided `$semantic-code-retrieval` workflow rather than guessing cross-cutting code paths.
- Use OMX team mode via `omx team ...`; do not replace it with in-process fanout.
- Keep user changes intact and avoid reverting unrelated dirty worktree state.
- Implement in a separate git worktree, then merge back into the current branch after verification.

Unknowns and open questions

- Whether current generated Convex client files should be regenerated as part of the implementation or updated only as needed for passing type checks.
- Whether policy document ingestion already exists elsewhere in the admin UI, or if this phase should stop at search/query plumbing only.
- Which existing role names and authorization helpers should gate payroll and insights visibility inside the assistant.

Likely codebase touchpoints

- `convex/schema.ts`
- `convex/assistant.ts`
- `convex/attendance.ts`
- `convex/leave.ts`
- `convex/admin.ts`
- `convex/users.ts`
- `convex/lib/*`
- `src/components/AIChatPanel.tsx`
- `src/contexts/AuthContext.tsx`
- `src/lib/convexApi.ts`
