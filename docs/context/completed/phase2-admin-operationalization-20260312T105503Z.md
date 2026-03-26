Task statement

Execute the next phase after AI Scaling Phase 1 in `leaveflow-pro` using OMX team mode. The scope for this turn is operationalizing the existing Phase 1 backend through admin-facing workflows and reporting.

Desired outcome

- Extend the admin policy experience so HR can manage policy knowledge documents for RAG instead of relying on backend-only indexing.
- Extend admin reporting so payroll, burnout, and coverage insights are visible outside the assistant chat.
- Reuse the existing Phase 1 Convex modules where possible instead of inventing a new backend layer.
- Verify the implementation locally and keep unrelated user changes intact.

Known facts and evidence

- The current branch is `feature/selfie-checkin-local-final`.
- Phase 1 backend is already present in `convex/payroll.ts`, `convex/insights.ts`, `convex/rag.ts`, `convex/schema.ts`, and the AI assistant/reporting UI already references those capabilities.
- `src/pages/admin/Policies.tsx` currently manages leave types only and does not expose policy knowledge document management.
- `src/pages/admin/Reports.tsx` currently shows generic leave/attendance charts and does not expose payroll, burnout, or coverage outputs from the Phase 1 Convex modules.
- The app already has admin routes for `/admin/policies` and `/admin/reports`, and the sidebar already links to them.
- Storage upload infrastructure already exists via `convex/files.ts`, `src/lib/convexUpload.ts`, and the `storageFiles` table.
- The worktree is dirty in existing files including `.env`, `.omx/state/*`, `convex/_generated/api.d.ts`, `convex/assistant.ts`, and `convex/rag.ts`.
- The earlier extra worktree `leaveflow-pro-ai-scaling-phase1` has been deleted.

Constraints

- Use OMX team mode via `omx team ...`, not in-process fanout.
- Do not revert unrelated dirty state.
- Keep scope bounded to Phase 2 operationalization: admin policy management and admin reporting/visibility.
- Prefer additive UI changes and reuse of current backend APIs over large architecture rewrites.

Unknowns and open questions

- Whether policy document upload in this phase should support file upload plus extracted text, or a text-first indexing UI is the best bounded step.
- Whether payroll reporting should stay inside the existing `Reports` page or split into a dedicated admin route.
- Whether the current reports data query should be extended or separate Convex queries/actions should back the new admin insights cards.

Likely codebase touchpoints

- `src/pages/admin/Policies.tsx`
- `src/pages/admin/Reports.tsx`
- `src/components/AIChatPanel.tsx`
- `src/components/AppSidebar.tsx`
- `convex/rag.ts`
- `convex/payroll.ts`
- `convex/insights.ts`
- `convex/files.ts`
- `src/lib/convexUpload.ts`
- `convex/admin.ts`
