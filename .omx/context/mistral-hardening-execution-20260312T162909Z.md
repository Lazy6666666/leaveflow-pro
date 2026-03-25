Task statement

Execute the remaining Mistral/AI hardening work in `leaveflow-pro` using OMX team mode. The target is to close the remaining practical items from `docs/mistral_ai_integration_analysis.md` and the current AI scaling status, without opening unrelated feature scope.

Desired outcome

- Strengthen automated verification around assistant + RAG behavior.
- Improve observability of AI vs fallback behavior where practical.
- Add moderation/safety handling only if it can be done safely and without breaking the current assistant behavior.
- Preserve the current AI Workspace, policy OCR, and AI admin/reporting features already implemented.

Known facts and evidence

- Current Mistral integration is implemented and working in the app.
- The current docs explicitly leave open:
  - stronger end-to-end assistant/RAG verification
  - better observability for `mistral` vs fallback
  - moderation/safety integration if truly needed
- Existing AI-related surfaces already present:
  - `convex/assistant.ts`
  - `convex/rag.ts`
  - `src/components/AIChatPanel.tsx`
  - `src/pages/AIWorkspace.tsx`
  - `src/pages/admin/Policies.tsx`
- Existing tests already present:
  - `convex/lib/aiScaling.test.ts`
  - `src/pages/AIWorkspace.test.tsx`
  - `src/test/example.test.ts`
- `npx tsc --noEmit` has already been passing on the current workspace.

Constraints

- Use OMX team mode via `omx team ...`, not in-process delegation.
- Work directly in this repository only.
- Do not revert unrelated dirty worktree changes.
- Avoid broad new product work; this is a hardening pass.
- Keep any new files reasonably scoped and avoid growing large files further when practical.

Unknowns and open questions

- Whether moderation should be implemented now or left as documented future work due to product requirements.
- Whether the current `AIWorkspace.test.tsx` is sufficient or needs extension to cover route/page integration better.
- Whether a clean assistant/RAG verification path can be added without requiring live networked test fixtures.

Likely codebase touchpoints

- `convex/assistant.ts`
- `convex/rag.ts`
- `src/components/AIChatPanel.tsx`
- `src/pages/AIWorkspace.tsx`
- `src/pages/AIWorkspace.test.tsx`
- `docs/mistral_ai_integration_analysis.md`
