## Task Statement

Run a team-based code review on the current `leaveflow-pro` working tree and report blocking issues.

## Desired Outcome

Produce a severity-rated review of the current diff with concrete file:line findings and a clear recommendation.

## Known Facts / Evidence

- The working tree contains broad backend and frontend changes plus new untracked files.
- Project-level `tsc --noEmit` is clean.
- `lsp_diagnostics` has been run on the modified and new TypeScript/TSX files with no type errors.
- Confirmed blocking findings already observed locally:
  - tracked `.env` now contains live secrets including `CLERK_SECRET_KEY`, `ADMIN_SETUP_TOKEN`, `RESEND_API_KEY`, and `MISTRAL_API_KEY`
  - `ocrAndIndexPolicyDocument` can resolve arbitrary HR-accessible storage assets through `api.files.getFileUrl`
  - `storageFiles.fileClass` schema does not include `policy_document`
- Candidate medium regression observed locally:
  - assistant fallback no longer returns workflow guidance when Mistral is unavailable

## Constraints

- Review only; do not implement fixes.
- Prefer blocking/security issues over style comments.
- Use concrete file/path evidence.

## Unknowns / Open Questions

- Whether there are additional high-severity regressions in the newly split Convex modules.
- Whether the AI workspace and reporting additions hide non-typechecked behavioral regressions.

## Likely Touchpoints

- `convex/*.ts`
- `src/pages/admin/*.tsx`
- `src/components/AIChatPanel.tsx`
- `.env`
- `.gitignore`
