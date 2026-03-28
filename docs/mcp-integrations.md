## MCP Integrations

Current agent MCP-style tools are registered from `convex/agents/mcpServer.ts`.

Available tools:

- `biometric.getEmployeeStatus`
  Reads the current-day attendance dashboard and returns the latest matching attendance record for a specific employee ID.
- `biometric.recordAttendance`
  Writes a managed attendance log entry through the existing attendance admin mutation.
- `whatsapp.sendMessage`
  Sends a WhatsApp message through Twilio when the required credentials are present, otherwise degrades gracefully with `missing_credentials`.
- `calendar.createEvent`
  Creates a Google Calendar event through the Calendar REST API when `GOOGLE_CALENDAR_SERVICE_ACCOUNT_JSON` is configured. If credentials are missing or the API call fails, it degrades gracefully with a structured failure response.

Notes:

- MCP tool definitions are registered through `registerTool(...)` in `convex/agents/toolRegistry.ts`.
- `convex/agents/leaveAgent.ts` imports `./mcpServer` so the tools are registered when the agent entrypoint loads.
- Calendar sync uses the service-account JSON plus the optional `GOOGLE_CALENDAR_ID` env var (`primary` by default).
