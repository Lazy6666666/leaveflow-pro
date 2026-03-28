# Tool Permissions

Current agent tool registry surfaces are defined in `convex/agents/toolRegistry.ts`
and registered from the modules under `convex/agents/`.

## Registered Tools

| Tool | Category | Source | Allowed Roles | Notes |
| --- | --- | --- | --- | --- |
| `skill.policy` | `read` | `local` | `employee`, `manager`, `hr_admin` | Uses the existing RAG policy search action. |
| `skill.hrFaq` | `read` | `local` | `employee`, `manager`, `hr_admin` | Static FAQ with policy fallback. |
| `skill.attendanceAnomaly` | `read` | `local` | `manager`, `hr_admin` | Summarizes suspicious attendance patterns from the admin dashboard. |
| `biometric.getEmployeeStatus` | `read` | `mcp` | `manager`, `hr_admin` | Uses the current-day attendance dashboard as the biometric status source. |
| `biometric.recordAttendance` | `write` | `mcp` | `manager`, `hr_admin` | Writes a managed attendance log entry through the existing admin mutation. |
| `whatsapp.sendMessage` | `write` | `mcp` | `manager`, `hr_admin` | Gracefully returns `missing_credentials` when Twilio is not configured. |
| `calendar.createEvent` | `write` | `mcp` | `manager`, `hr_admin` | Currently graceful-degradation only until Google Calendar credentials/client flow are implemented. |

## Enforcement Notes

- Authorization is enforced inside `callTool(...)` in `convex/agents/toolRegistry.ts`.
- Developer roles (`convex_dev`, `dev`) can inspect or invoke any registered tool.
- All tool outcomes are written to `toolCallLogs`.
- Registered metadata currently includes `category`, `source`, and `timeoutMs`.
