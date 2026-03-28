import { registerTool } from "../toolRegistry";
import { policySkillHandler } from "./policySkill";
import type { ActionCtx } from "../../_generated/server";
import { z } from "zod";

// ─── Static FAQ map ───────────────────────────────────────────────────────────

const FAQ: Record<string, string> = {
  "annual leave": "Employees are entitled to 30 calendar days of annual leave per year as per UAE Labour Law.",
  "sick leave": "Employees are entitled to 90 days of sick leave per year: 15 days full pay, 30 days half pay, 45 days unpaid.",
  "maternity leave": "Female employees are entitled to 60 days of maternity leave: 45 days full pay, 15 days half pay.",
  "payroll date": "Salaries are processed on the 25th of each month via WPS.",
  "document submission": "Submit documents to HR via the Document Expiry portal at /admin/document-expiry.",
  "onboarding": "New employees complete onboarding tasks in the Onboarding section of the HR portal.",
  "public holiday": "Public holidays follow the UAE official calendar. Check the Holidays page for the current year.",
  "expense claim": "Submit expense claims via the Expenses section. Claims are reviewed within 5 business days.",
};

function matchFaq(question: string): { answer: string; confidence: "high" | "low" } | null {
  const lower = question.toLowerCase();
  for (const [key, answer] of Object.entries(FAQ)) {
    if (lower.includes(key)) return { answer, confidence: "high" };
  }
  return null;
}

// ─── HR FAQ Skill ─────────────────────────────────────────────────────────────

async function hrFaqSkillHandler(
  ctx: ActionCtx,
  args: unknown,
): Promise<{ answer: string; confidence: "high" | "low" }> {
  const { question } = args as { question: string };

  // Try static FAQ first
  const faqMatch = matchFaq(question);
  if (faqMatch) return faqMatch;

  // RAG fallback
  try {
    const ragResult = await policySkillHandler(ctx, { question });
    if (ragResult.answer && ragResult.sources.length > 0) {
      return { answer: ragResult.answer, confidence: "low" };
    }
  } catch {
    // RAG unavailable — fall through
  }

  return {
    answer: "I don't have a specific answer for that. Please contact HR at hr@company.com.",
    confidence: "low",
  };
}

registerTool({
  name: "skill.hrFaq",
  description: "Answer common HR questions using a static FAQ map with RAG fallback.",
  allowedRoles: ["employee", "manager", "hr_admin"],
  category: "read",
  source: "local",
  inputSchema: z.object({ question: z.string() }),
  outputSchema: z.object({
    answer: z.string(),
    confidence: z.enum(["high", "low"]),
  }),
  handler: hrFaqSkillHandler,
});

export { hrFaqSkillHandler };
