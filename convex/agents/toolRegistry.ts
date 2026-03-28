import type { ActionCtx } from "../_generated/server";
import type { AppRole } from "../constants";
import { now } from "../lib/auth";
import { internal } from "../_generated/api";
import { z } from "zod";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Tool = {
  name: string;
  description: string;
  allowedRoles: AppRole[];
  category?: "read" | "write" | "admin";
  source?: "local" | "mcp";
  timeoutMs?: number;
  inputSchema?: z.ZodType<unknown>;
  outputSchema?: z.ZodType<unknown>;
  handler: (ctx: ActionCtx, args: unknown) => Promise<unknown>;
};

// ─── Registry ─────────────────────────────────────────────────────────────────

const registry = new Map<string, Tool>();

function summarizeValue(value: unknown, depth = 0): unknown {
  if (value == null) return value;
  if (depth > 2) return { type: "truncated" };
  if (typeof value === "string") {
    return { type: "string", length: value.length, preview: value.slice(0, 80) };
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) {
    return {
      type: "array",
      length: value.length,
      preview: value.slice(0, 3).map((entry) => summarizeValue(entry, depth + 1)),
    };
  }
  if (typeof value === "object") {
    const objectValue = value as Record<string, unknown>;
    return {
      type: "object",
      keys: Object.keys(objectValue).slice(0, 20),
    };
  }
  return { type: typeof value };
}

function isDeveloperRole(role: AppRole) {
  return role === "convex_dev" || role === "dev";
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, name: string) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return promise;
  }

  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`Tool '${name}' timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

export function registerTool(tool: Tool): void {
  registry.set(tool.name, {
    category: tool.category ?? "read",
    source: tool.source ?? "local",
    timeoutMs: tool.timeoutMs ?? 10_000,
    inputSchema: tool.inputSchema ?? z.any(),
    outputSchema: tool.outputSchema ?? z.any(),
    ...tool,
  });
}

export function getTool(name: string): Tool {
  const tool = registry.get(name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
}

export function listToolsForRole(callerRole: AppRole) {
  return Array.from(registry.values())
    .filter((tool) => isDeveloperRole(callerRole) || tool.allowedRoles.includes(callerRole))
    .map((tool) => ({
      name: tool.name,
      description: tool.description,
      allowedRoles: tool.allowedRoles,
      category: tool.category ?? "read",
      source: tool.source ?? "local",
      timeoutMs: tool.timeoutMs ?? 10_000,
      validatesInput: tool.inputSchema !== undefined,
      validatesOutput: tool.outputSchema !== undefined,
    }));
}

export async function callTool(
  ctx: ActionCtx,
  name: string,
  callerRole: AppRole,
  userId: string,
  args: unknown,
): Promise<unknown> {
  const tool = getTool(name);
  const calledAt = now();
  let result: unknown;
  let error: string | undefined;
  const authorized = isDeveloperRole(callerRole) || tool.allowedRoles.includes(callerRole);

  if (!authorized) {
    error = `Role '${callerRole}' is not authorized to call tool '${name}'`;
    await ctx.runMutation(internal.agents.toolRegistry._logToolCall, {
      toolName: name,
      userId,
      args: summarizeValue(args) as Record<string, unknown>,
      error,
      calledAt,
    });
    throw new Error(error);
  }

  try {
    const parsedArgs = tool.inputSchema?.parse(args ?? {});
    result = await withTimeout(tool.handler(ctx, parsedArgs), tool.timeoutMs ?? 10_000, name);
    result = tool.outputSchema?.parse(result);
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    await ctx.runMutation(internal.agents.toolRegistry._logToolCall, {
      toolName: name,
      userId,
      args: summarizeValue(args) as Record<string, unknown>,
      error,
      calledAt,
    });
    throw err;
  }

  await ctx.runMutation(internal.agents.toolRegistry._logToolCall, {
    toolName: name,
    userId,
    args: summarizeValue(args) as Record<string, unknown>,
    result: summarizeValue(result) as Record<string, unknown>,
    calledAt,
  });

  return result;
}

// ─── Internal log mutation (called from callTool) ─────────────────────────────
// Exported so Convex can register it; not meant to be called directly.
import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const _logToolCall = internalMutation({
  args: {
    toolName: v.string(),
    userId: v.string(),
    args: v.optional(v.any()),
    result: v.optional(v.any()),
    error: v.optional(v.string()),
    calledAt: v.number(),
  },
  handler: async (ctx, input) => {
    await ctx.db.insert("toolCallLogs", {
      toolName: input.toolName,
      userId: input.userId,
      args: input.args,
      result: input.result,
      error: input.error,
      calledAt: input.calledAt,
    });
  },
});
