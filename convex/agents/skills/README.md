## Agent Skills

Current skills:

- `skill.policy`
  Uses the existing RAG search action in `convex/rag.ts` to answer policy questions from indexed policy content.
- `skill.hrFaq`
  Answers common HR questions from a static FAQ map, then falls back to `skill.policy` when no direct FAQ answer exists.
- `skill.attendanceAnomaly`
  Reads the existing attendance admin dashboard and returns a compact list of suspicious attendance patterns for HR or manager review.

To add a new skill:

1. Create a module in this directory.
2. Export the skill handler.
3. Register it with `registerTool(...)` from `../toolRegistry`.
4. Import the module from `convex/agents/leaveAgent.ts` so the skill is registered when the agent entrypoint loads.
