Task statement

Build a dedicated first-class AI product surface in `leaveflow-pro` using OMX team mode. The goal is to add an `AI Workspace` page that centralizes the distributed AI scaling capabilities already present in chat, policies, and reports.

Desired outcome

- Add a dedicated `AI Workspace` route/page to the app.
- Add a sidebar entry so the AI surface is discoverable.
- Preserve the existing floating AI chat and admin pages while making the new page the central AI launcher/overview.
- Present role-based AI sections for employee, manager, and HR admin users.
- Reuse existing backend/APIs and current UI surfaces instead of rebuilding the features from scratch.

Known facts and evidence

- The user explicitly said AI is meant to be a first-class product feature.
- Current AI entry points are distributed:
  - `src/components/AIChatPanel.tsx`
  - `src/pages/admin/Policies.tsx`
  - `src/pages/admin/Reports.tsx`
- There is currently no dedicated AI route in `src/App.tsx`.
- Sidebar navigation is defined in `src/components/AppSidebar.tsx`.
- Existing dashboard/layout/auth structure is already in place via:
  - `src/components/AppLayout.tsx`
  - `src/contexts/AuthContext.tsx`
  - `src/pages/Dashboard.tsx`
- The current repo already contains role-aware AI features and admin operational surfaces; this task is mainly product/UI centralization.

Constraints

- Use OMX team mode via `omx team ...`, not in-process delegation.
- Work directly in the current repository and branch.
- Do not revert unrelated dirty files.
- Preserve current routes and feature behavior; the AI Workspace should orchestrate existing capabilities rather than replace them.
- Keep file growth under control; split new UI into components when practical.

Unknowns and open questions

- Whether the AI Workspace should embed the existing `AIChatPanel` directly or provide a richer page-native chat composition.
- Whether the new page should live under a shared route for all roles or be role-gated differently by section content.
- How much of the current admin operational cards should deep-link into `Policies`/`Reports` versus duplicate summarized views on the page.

Likely codebase touchpoints

- `src/App.tsx`
- `src/components/AppSidebar.tsx`
- `src/components/AppLayout.tsx`
- `src/components/AIChatPanel.tsx`
- `src/contexts/AuthContext.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/admin/Policies.tsx`
- `src/pages/admin/Reports.tsx`
- `src/components/ui/*`
- new `src/pages/AIWorkspace.tsx`
- optional new `src/components/ai/*`
