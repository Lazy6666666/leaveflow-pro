

## Leveraging Agentic AI in Your Leave Management System

Your system currently handles leave requests, approvals, notifications, balances, and team calendars. Adding an AI agent can make the experience conversational and proactive. Here are the practical ways to integrate agentic AI, followed by a recommended implementation approach.

### Use Cases

1. **AI Leave Assistant (Chatbot)** — Employees ask natural language questions like:
   - "How many sick days do I have left?"
   - "Submit a leave request for next Friday"
   - "When is the next public holiday?"
   - "Who on my team is off next week?" (for managers)
   
   The AI agent uses **tool calling** to query the database and perform actions on behalf of the user.

2. **Smart Leave Suggestions** — AI analyzes team calendar, upcoming holidays, and remaining balances to suggest optimal leave dates (e.g., "Take Thursday-Friday off to get a 4-day weekend with the Monday holiday").

3. **Approval Summarizer for Managers** — When a manager opens the approvals page, AI summarizes pending requests with context: team coverage gaps, the employee's remaining balance, and historical patterns.

4. **Conflict Detection** — Before submitting a request, AI checks team calendar and flags if too many team members are already off during the same period.

### Recommended Implementation: AI Leave Assistant Chatbot

This is the highest-impact feature and naturally enables the other use cases over time.

#### Architecture

```text
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Chat UI     │────▶│  Edge Function   │────▶│  Lovable AI     │
│  (React)     │◀────│  (chat-leave)    │◀────│  Gateway        │
└─────────────┘     │                  │     └─────────────────┘
                     │  Tool Execution  │
                     │  ┌─────────────┐ │
                     │  │ get_balance  │ │
                     │  │ submit_leave │ │
                     │  │ team_calendar│ │
                     │  │ get_holidays │ │
                     │  └─────────────┘ │
                     └──────────────────┘
```

#### Steps

1. **Create `supabase/functions/chat-leave/index.ts`** — Edge function that:
   - Accepts conversation messages from the client
   - Sends them to Lovable AI Gateway with a system prompt describing the leave management context
   - Defines tools (via function calling) for: `get_leave_balance`, `submit_leave_request`, `get_team_calendar`, `get_holidays`, `get_pending_approvals`
   - When AI calls a tool, the edge function executes the database query using the authenticated user's context, then returns results to the AI for a natural language response
   - Streams the response back via SSE

2. **Create a Chat UI component** — A floating chat button (bottom-right) that opens a slide-out panel with:
   - Message history (stored in component state, no persistence needed)
   - Streaming token-by-token rendering
   - Markdown support for formatted responses

3. **Add a new route or overlay** — Accessible from all pages via the AppLayout

4. **Database migration** — No new tables needed initially. The AI reads existing tables (`leave_balances`, `leave_requests`, `holidays`, `profiles`) through the edge function using the user's auth context.

#### Security
- The edge function validates the JWT and only queries data the user has access to via RLS
- Write operations (submit leave) go through the same RLS policies as the existing UI
- The AI cannot bypass permissions — it acts as the authenticated user

#### Technical Details
- Uses Lovable AI Gateway with `google/gemini-3-flash-preview` (default model, fast and capable)
- Tool calling pattern for structured data extraction from the database
- `LOVABLE_API_KEY` is already auto-provisioned — no API key setup needed
- Streaming SSE for responsive chat experience

### What This Unlocks
Once the chatbot infrastructure is in place, adding new capabilities (smart suggestions, conflict detection, approval summaries) is just a matter of adding new tools to the edge function — no UI changes needed.

