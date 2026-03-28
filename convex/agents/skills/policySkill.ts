import type { ActionCtx } from "../../_generated/server";
import { registerTool } from "../toolRegistry";
import { api } from "../../_generated/api";
import { z } from "zod";

// Policy Skill: queries the RAG vector store for relevant policy chunks

async function policySkillHandler(ctx: ActionCtx, args: unknown): Promise<{ answer: string; sources: string[] }> {
  const { question } = args as { question: string };

  // Use existing RAG infrastructure
  const results = await ctx.runAction(api.rag.searchPolicy as never, { query: question });
  const matches = ((results as { matches?: Array<{ snippet?: string; title?: string }> })?.matches ?? []).slice(0, 3);

  if (!matches.length) {
    return { answer: "No relevant policy found. Please contact HR directly.", sources: [] };
  }

  const answer = matches
    .map((match) => match.snippet?.trim())
    .filter((snippet): snippet is string => Boolean(snippet))
    .join("\n\n");
  const sources = matches
    .map((match) => match.title?.trim())
    .filter((title): title is string => Boolean(title));

  if (!answer) {
    return { answer: "Relevant policy documents were found, but no policy snippet could be generated.", sources };
  }

  return { answer, sources };
}

registerTool({
  name: "skill.policy",
  description: "Answer questions about company policies using the RAG knowledge base.",
  allowedRoles: ["employee", "manager", "hr_admin"],
  inputSchema: z.object({ question: z.string() }),
  outputSchema: z.object({
    answer: z.string(),
    sources: z.array(z.string()),
  }),
  handler: policySkillHandler,
});

export { policySkillHandler };
