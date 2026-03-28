# Convex v2 Migration Notes

This document captures the main Convex-side changes introduced during the v2
backend work so there is one stable reference for what changed, what was added,
and what was cleaned up.

## Added

- Careers schema and workflows
  - `jobListings`
  - `jobApplications`
  - careers sync helpers and external-source reconciliation
- Agent / AI backend surfaces
  - `agentConfigs`
  - `toolCallLogs`
  - local agent registry under `convex/agents/`
  - policy, HR FAQ, and attendance anomaly skill modules
- Admin / route support surfaces
  - agent workspace route and page shell
  - document expiry route and related support
- DEV role support
  - explicit `dev` role support alongside `convex_dev`
  - frontend and backend helper propagation for developer bypass paths

## Updated

- `convex/careers.ts`
  - normalized careers queries/mutations over `jobListings` and `jobApplications`
  - includes `listOpenJobs` and `listApplicationsByJob`
- `convex/agents/toolRegistry.ts`
  - role middleware
  - timeout wrapping
  - invocation logging to `toolCallLogs`
  - role-filtered tool listing
- `convex/agents/leaveAgent.ts`
  - Mistral parsing path
  - confidence gate
  - tool registry wiring
- `convex/adminCore.ts`
  - employee role updates now persist `dev`

## Cleaned Up

- Recruitment naming has been normalized toward Careers in the active Convex
  codepaths.
- No active Convex source references the legacy `recruitment` name directly.
- The main admin barrel remains in place at `convex/admin.ts`.

## Known Gaps

- MCP/server wrapper delivery is still partial; the current repo contains local
  agent registration plus integration notes, not a fully verified standalone MCP
  server deployment.
- Calendar sync remains graceful-degradation only until credentials and client
  flow are provisioned.
- End-to-end browser-based smoke verification still depends on the local
  Playwright/Chromium environment being healthy.
