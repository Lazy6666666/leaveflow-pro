# Mistral AI Integration Status

This document records the current Mistral integration state in `leaveflow-pro`, what was implemented, and what remains as future hardening work.

## Status

The Lovable AI gateway replacement is implemented in the current repository.

Implemented areas:
- direct Mistral chat completions from Convex
- Mistral tool-calling for live HR data access
- Mistral embeddings for policy RAG
- Mistral OCR support for policy document ingestion
- fallback source-reason reporting for assistant responses
- local and deployed `MISTRAL_API_KEY` support
- markdown/table-friendly assistant rendering in the UI
- dedicated `AI Workspace` page that centralizes AI entry points

## Current Architecture

### Frontend

[`AIChatPanel.tsx`](../src/components/AIChatPanel.tsx):
- sends messages to `api.assistant.chat`
- renders markdown responses
- renders markdown tables for structured responses such as payroll summaries

### Backend

[`assistant.ts`](../convex/assistant.ts):
- calls `https://api.mistral.ai/v1/chat/completions`
- uses `mistral-small-latest`
- defines tool schemas and executes Convex-backed tools
- keeps a fallback path for unavailable AI responses

[`rag.ts`](../convex/rag.ts):
- calls `https://api.mistral.ai/v1/embeddings`
- uses `mistral-embed`
- supports policy indexing, OCR-based ingestion, search, and deletion

[`env.ts`](../convex/lib/env.ts):
- exposes `getMistralApiKey()`
- resolves `MISTRAL_API_KEY` from normal env, local env files, and local fallback sources

## Implemented Tooling

The assistant now supports tool-backed access for:
- leave balances
- leave history
- holidays
- smart leave suggestions
- pending approvals
- team leave
- policy search
- payroll summaries
- burnout checks
- coverage conflict checks
- biometrics audit summaries

Role boundaries are enforced in the assistant/tool layer:
- employees do not get HR-only payroll or biometrics access
- managers and HR admins can access team-scope tools
- HR admins can access payroll and biometrics summaries

## What Changed From The Original Plan

The original plan assumed a more direct "replace gateway with client call" shape. The final implementation differs in a few important ways:

1. Direct Mistral integration was implemented, but through a tool-using assistant flow rather than a simple single-shot chat replacement.
2. Policy RAG was implemented with Mistral embeddings and Convex vector search.
3. The assistant was pushed further toward a copilot model with backend tools, role-aware behavior, and structured responses.
4. The admin UI was later extended to operationalize policy knowledge and reporting outside the chat surface.

## Verification Status

Verified:
- `npx tsc --noEmit`: pass
- `npx vitest run convex/assistantReplies.test.ts`: pass
- `npx vitest run src/pages/AIWorkspace.test.tsx`: pass
- live Mistral API/tool-calling behavior was validated during implementation
- current app assistant is confirmed by user to be working properly after the latest fixes

Also implemented:
- `MISTRAL_API_KEY` was set in project `.env`
- `MISTRAL_API_KEY` was also set in Convex cloud env

Not fully closed in one clean pass:
- repo-wide lint remains noisy/slow
- there is not yet a single polished automated test suite covering the whole assistant + RAG path end to end

## Known Design Notes

- The assistant now uses Mistral as the primary path, not the old Lovable gateway.
- A deterministic fallback still exists, but it should be treated as an outage/safety path, not the primary assistant behavior.
- The recent assistant changes were specifically aimed at avoiding the "generic hardcoded chatbot" behavior that appeared when fallback logic was too aggressive.

## Future Hardening

The next Mistral-related improvements should be:
1. Expand beyond the current focused fallback/UI tests into broader assistant + tool invocation + RAG verification.
2. Extend fallback observability from response-level source reasons into operator-facing metrics/logging if needed.
3. Add moderation/safety layers only if required by your actual HR compliance needs, not just because the API supports them.
