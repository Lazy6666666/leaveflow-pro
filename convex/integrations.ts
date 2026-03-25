import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

import { now, recordAudit, requireAnyRole, toIso } from "./lib/auth";

const integrationProviderKeyValidator = v.union(
  v.literal("slack"),
  v.literal("teams"),
  v.literal("google_calendar"),
  v.literal("payroll_export"),
);

const integrationStatusValidator = v.union(
  v.literal("not_configured"),
  v.literal("attention"),
  v.literal("connected"),
);

const INTEGRATION_CATALOG = [
  {
    description: "Route leave, attendance, and policy nudges into team channels.",
    key: "slack",
    name: "Slack",
  },
  {
    description: "Mirror approvals and workforce reminders into Microsoft Teams.",
    key: "teams",
    name: "Microsoft Teams",
  },
  {
    description: "Keep rota dates and reminder checkpoints aligned with shared calendars.",
    key: "google_calendar",
    name: "Google Calendar",
  },
  {
    description: "Prepare payroll-ready operational exports without triggering real payouts.",
    key: "payroll_export",
    name: "Payroll Export",
  },
] as const;

export const getIntegrationSettings = query({
  args: {},
  handler: async (ctx) => {
    await requireAnyRole(ctx, ["hr_admin"]);
    const settings = await ctx.db.query("integrationSettings").collect();
    const settingsMap = new Map(settings.map((setting) => [setting.providerKey, setting]));

    return INTEGRATION_CATALOG.map((integration) => {
      const saved = settingsMap.get(integration.key);
      return {
        configSummary: saved?.configSummary ?? "Placeholder configuration only — live credentials stay out of scope in Wave 3.",
        description: integration.description,
        enabled: saved?.enabled ?? false,
        id: saved?._id ?? null,
        key: integration.key,
        lastCheckedAt: saved?.lastCheckedAt ? toIso(saved.lastCheckedAt) : null,
        name: integration.name,
        status: saved?.status ?? "not_configured",
        updatedAt: saved ? toIso(saved.updatedAt) : null,
      };
    });
  },
});

export const saveIntegrationSetting = mutation({
  args: {
    configSummary: v.optional(v.string()),
    enabled: v.boolean(),
    providerKey: integrationProviderKeyValidator,
    status: integrationStatusValidator,
  },
  handler: async (ctx, args) => {
    const { identity } = await requireAnyRole(ctx, ["hr_admin"]);
    const timestamp = now();
    const configSummary = args.configSummary?.trim();
    const existing = await ctx.db
      .query("integrationSettings")
      .withIndex("by_providerKey", (q) => q.eq("providerKey", args.providerKey))
      .unique();

    if (existing) {
      const oldData = existing;
      await ctx.db.patch(existing._id, {
        configSummary: configSummary || undefined,
        enabled: args.enabled,
        lastCheckedAt: timestamp,
        status: args.status,
        updatedAt: timestamp,
        updatedByUserId: identity.subject,
      });
      const newData = await ctx.db.get(existing._id);
      await recordAudit(ctx, {
        action: "UPDATE",
        changedBy: identity.subject,
        newData,
        oldData,
        recordId: String(existing._id),
        tableName: "integrationSettings",
      });
      return { id: existing._id };
    }

    const settingId = await ctx.db.insert("integrationSettings", {
      configSummary: configSummary || undefined,
      createdAt: timestamp,
      enabled: args.enabled,
      lastCheckedAt: timestamp,
      providerKey: args.providerKey,
      status: args.status,
      updatedAt: timestamp,
      updatedByUserId: identity.subject,
    });

    await recordAudit(ctx, {
      action: "INSERT",
      changedBy: identity.subject,
      newData: await ctx.db.get(settingId),
      recordId: String(settingId),
      tableName: "integrationSettings",
    });

    return { id: settingId };
  },
});

export const integrationCatalog = INTEGRATION_CATALOG;
