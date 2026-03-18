Task statement

Execute `docs/mistral_ai_integration_analysis.md` in `leaveflow-pro` by replacing the current Lovable AI gateway integration with a direct Mistral integration, while preserving the assistant UX and deterministic fallback.

Desired outcome

- Replace the backend call to `https://ai.gateway.lovable.dev/v1/chat/completions` with direct Mistral API calls.
- Add `MISTRAL_API_KEY` environment support in Convex env helpers.
- Keep `src/components/AIChatPanel.tsx` compatible with markdown responses.
- Preserve a deterministic fallback when the external AI service is unavailable or misconfigured.
- Verify the implementation locally.

Known facts and evidence

- Plan source: `docs/mistral_ai_integration_analysis.md`.
- Current assistant entrypoint is `convex/assistant.ts`.
- Current frontend consumer is `src/components/AIChatPanel.tsx`, which already renders assistant markdown with `react-markdown`.
- `convex/assistant.ts` currently fetches from Lovable's AI gateway with model `openai/gpt-4.1-mini`.
- `convex/lib/env.ts` currently exposes `AI_GATEWAY_API_KEY` and `LOVABLE_API_KEY`, but not `MISTRAL_API_KEY`.
- Real available assistant data sources are current-user data, balances, leave history, holidays, pending approvals, and team calendar.
- The repo is small enough that exact search/read was sufficient; semantic-code-retrieval's decision gate does not justify building a Mistral code index yet.
- `tmux` and `omx` are installed, and the leader session is inside tmux.
- Worktree is dirty in unrelated files: `.env`, `convex/_generated/api.d.ts`, untracked `docs/mistral_ai_integration_analysis.md`, and `node`.

Constraints

- Use the semantic-code-retrieval skill's cheaper-first path before embeddings.
- Use OMX team mode via `omx team ...`, not in-process fanout.
- Do not revert unrelated existing user changes.
- Keep the assistant functional even when no Mistral key is configured or the upstream service fails.

Unknowns and open questions

- Whether `MISTRAL_API_KEY` is configured only in Convex production/dashboard or also locally for test execution.
- Whether this phase should implement Mistral tool-calling against the currently available leave-domain queries only, or also stub future payroll/policy tools mentioned in the analysis doc.
- Whether installing the official `@mistralai/mistralai` SDK is worth the extra dependency versus using direct REST calls from Convex.

Likely codebase touchpoints

- `convex/assistant.ts`
- `convex/lib/env.ts`
- `package.json`
- `package-lock.json`
- `src/components/AIChatPanel.tsx`
