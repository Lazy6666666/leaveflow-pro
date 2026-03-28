import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { mutation, query } from "../_generated/server";
import { now, requireAnyRole } from "../lib/auth";

export const listAgentConfigs = query({
  args: {},
  handler: async (ctx) => {
    await requireAnyRole(ctx, ["hr_admin"]);
    const configs = await ctx.db.query("agentConfigs").withIndex("by_agentName").collect();
    return configs.sort((left, right) => left.agentName.localeCompare(right.agentName));
  },
});

export const getAgentConfig = query({
  args: {
    agentName: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAnyRole(ctx, ["hr_admin"]);
    return await ctx.db
      .query("agentConfigs")
      .withIndex("by_agentName", (q) => q.eq("agentName", args.agentName))
      .unique();
  },
});

export const saveAgentConfig = mutation({
  args: {
    agentName: v.string(),
    enabled: v.boolean(),
    modelOverride: v.optional(v.string()),
    maxTokens: v.optional(v.number()),
    systemPrompt: v.optional(v.string()),
    allowedRoles: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireAnyRole(ctx, ["hr_admin"]);
    const existing = await ctx.db
      .query("agentConfigs")
      .withIndex("by_agentName", (q) => q.eq("agentName", args.agentName))
      .unique();

    const payload = {
      agentName: args.agentName,
      enabled: args.enabled,
      modelOverride: args.modelOverride,
      maxTokens: args.maxTokens,
      systemPrompt: args.systemPrompt,
      allowedRoles: args.allowedRoles,
      updatedBy: identity.subject,
      updatedAt: now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return { id: existing._id, created: false };
    }

    const id = await ctx.db.insert("agentConfigs", payload);
    return { id, created: true };
  },
});

export const deleteAgentConfig = mutation({
  args: {
    agentName: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAnyRole(ctx, ["hr_admin"]);
    const existing = await ctx.db
      .query("agentConfigs")
      .withIndex("by_agentName", (q) => q.eq("agentName", args.agentName))
      .unique();

    if (!existing) {
      return { deleted: false };
    }

    await ctx.db.delete(existing._id);
    return { deleted: true };
  },
});

export const listAgentLogs = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await requireAnyRole(ctx, ["hr_admin"]);
    return await ctx.db
      .query("toolCallLogs")
      .withIndex("by_calledAt")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
