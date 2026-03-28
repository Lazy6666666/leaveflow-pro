"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { api, internal } from "../_generated/api";
import type { AppRole } from "../constants";
import { callTool, listToolsForRole } from "./toolRegistry";

// Import skills (registers them in the tool registry)
import "./mcpServer";
import "./leaveTools";
import "./skills/attendanceAnomalySkill";
import "./skills/policySkill";
import "./skills/hrFaqSkill";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParsedLeaveRequest {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  confidence: number; // 0–1
}

interface LeaveAgentOutput {
  leaveRequestId?: string;
  message: string;
  requiresConfirmation: boolean;
  parsed?: ParsedLeaveRequest;
}

function resolvePrimaryRole(roles: AppRole[]): AppRole {
  if (roles.includes("dev")) return "dev";
  if (roles.includes("convex_dev")) return "convex_dev";
  if (roles.includes("hr_admin")) return "hr_admin";
  if (roles.includes("manager")) return "manager";
  return "employee";
}

async function requireActionRoles(
  ctx: Parameters<typeof processLeaveRequest.handler>[0],
  allowedRoles: AppRole[],
) {
  const currentUser = await ctx.runQuery(api.users.current as never, {});
  if (!currentUser) {
    throw new Error("Unauthorized");
  }

  const identity = { subject: (currentUser as { userId: string }).userId };
  const roles = (currentUser as { roles: AppRole[] }).roles;
  const hasAllowedRole =
    allowedRoles.some((role) => roles.includes(role)) ||
    roles.includes("convex_dev") ||
    roles.includes("dev");

  if (!hasAllowedRole) {
    throw new Error("Forbidden");
  }

  return { identity, roles };
}

// ─── Mistral parse helper ─────────────────────────────────────────────────────

async function parseLeaveRequest(
  naturalLanguage: string,
  mistralApiKey: string,
): Promise<ParsedLeaveRequest> {
  const today = new Date().toISOString().slice(0, 10);
  const prompt = `Today is ${today}. Parse this leave request into JSON with fields: leaveType (annual/sick/emergency/other), startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), reason (string), confidence (0-1 float). Request: "${naturalLanguage}". Respond with only valid JSON.`;

  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${mistralApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 200,
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) throw new Error(`Mistral API error: ${res.status}`);
  const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  const content = data.choices[0]?.message?.content ?? "{}";

  // Strip markdown code fences if present
  const json = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
  return JSON.parse(json) as ParsedLeaveRequest;
}

// ─── Leave Agent action ───────────────────────────────────────────────────────

export const processLeaveRequest = action({
  args: {
    naturalLanguageRequest: v.string(),
    confirmSubmit: v.optional(v.boolean()),
    parsedOverride: v.optional(v.object({
      leaveType: v.string(),
      startDate: v.string(),
      endDate: v.string(),
      reason: v.string(),
    })),
  },
  handler: async (ctx, args): Promise<LeaveAgentOutput> => {
    const { identity } = await requireActionRoles(ctx, ["employee", "manager", "hr_admin"]);
    const agentConfig = await ctx.runQuery(api["agents/configs"].getAgentConfig as never, {
      agentName: "leave-automation-agent",
    });

    if (agentConfig && agentConfig.enabled === false) {
      return {
        message: "Leave automation agent is currently disabled.",
        requiresConfirmation: false,
      };
    }

    // Rate limit check
    const rateLimitResult = await ctx.runMutation(
      internal.assistantRateLimits.consume as never,
      { userId: identity.subject, scope: "assistant_chat" },
    );
    if (!(rateLimitResult as { ok?: boolean }).ok) {
      return { message: "Rate limit reached. Please try again later.", requiresConfirmation: false };
    }

    const actualMistralKey = process.env.MISTRAL_API_KEY;
    if (!actualMistralKey) {
      return { message: "AI service unavailable (missing MISTRAL_API_KEY).", requiresConfirmation: false };
    }

    // Parse the request
    let parsed: ParsedLeaveRequest;
    try {
      parsed = args.parsedOverride
        ? { ...args.parsedOverride, confidence: 1 }
        : await parseLeaveRequest(args.naturalLanguageRequest, actualMistralKey);
    } catch (err) {
      return {
        message: `Failed to parse request: ${err instanceof Error ? err.message : String(err)}`,
        requiresConfirmation: false,
      };
    }

    // Low confidence — ask for confirmation
    if (parsed.confidence < 0.75 && !args.confirmSubmit) {
      return {
        message: `I understood: ${parsed.leaveType} leave from ${parsed.startDate} to ${parsed.endDate} (reason: ${parsed.reason}). Is this correct? Reply with confirmSubmit: true to proceed.`,
        requiresConfirmation: true,
        parsed,
      };
    }

    // Find matching leave type
    const leaveTypes = await ctx.runQuery(api.leave.getLeaveTypes as never, {});
    const leaveType = (leaveTypes as Array<{ id: string; name: string }>).find(
      (lt) => lt.name.toLowerCase().includes(parsed.leaveType.toLowerCase()),
    );

    if (!leaveType) {
      return {
        message: `Could not find leave type matching "${parsed.leaveType}". Available types: ${(leaveTypes as Array<{ name: string }>).map((lt) => lt.name).join(", ")}`,
        requiresConfirmation: true,
        parsed,
      };
    }

    // Submit the leave request
    const result = await ctx.runMutation(api.leave.createRequest as never, {
      leaveTypeId: leaveType.id,
      startDate: parsed.startDate,
      endDate: parsed.endDate,
      reason: parsed.reason,
    });

    const leaveRequestId = (result as { id: string }).id;
    return {
      leaveRequestId,
      message: `Leave request submitted successfully! ${parsed.leaveType} leave from ${parsed.startDate} to ${parsed.endDate}.`,
      requiresConfirmation: false,
      parsed,
    };
  },
});

export const listAvailableTools = action({
  args: {},
  handler: async (ctx) => {
    const { roles } = await requireActionRoles(ctx, ["employee", "manager", "hr_admin"]);
    return listToolsForRole(resolvePrimaryRole(roles));
  },
});

export const invokeTool = action({
  args: {
    name: v.string(),
    payload: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { identity, roles } = await requireActionRoles(ctx, ["employee", "manager", "hr_admin"]);
    return callTool(
      ctx,
      args.name,
      resolvePrimaryRole(roles),
      identity.subject,
      args.payload ?? {},
    );
  },
});
