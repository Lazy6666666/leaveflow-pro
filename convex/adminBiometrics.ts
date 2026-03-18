import { action, internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

import { biometricsVendorValidator } from "./constants";
import type { BiometricsVendor } from "./constants";
import { applySiteScope, assertRequestedSiteInScope, getAccessibleSiteIds, now, recordAudit, requireAnyRole } from "./lib/auth";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import {
  currentConvexSiteUrl,
  getBiometricsErrorMessage,
  getMissingSiteUrlMessage,
  getWebhookReadyMessage,
  ingestBiometricsRecords,
  isBiometricsSyncDue,
  normalizeWebhookRecords,
  requireAdminAction,
  syncBiometricsConfig,
} from "./adminBiometricsHelpers";

async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  return await requireAnyRole(ctx, ["hr_admin"]);
}

export const getBiometricsConfigInternal = internalQuery({
  args: { configId: v.id("biometricsConfigs") },
  handler: async (ctx, args) => await ctx.db.get(args.configId),
});

export const listActiveBiometricsConfigsInternal = internalQuery({
  args: {},
  handler: async (ctx) => await ctx.db.query("biometricsConfigs").withIndex("by_isActive", (q) => q.eq("isActive", true)).collect(),
});

export const getWebhookBiometricsConfigInternal = internalQuery({
  args: { vendor: v.optional(v.string()), webhookSecret: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const configs = await ctx.db.query("biometricsConfigs").withIndex("by_isActive", (q) => q.eq("isActive", true)).collect();
    const requestedVendor = args.vendor === "generic" ? "generic_webhook" : args.vendor;
    return configs.find((config) => (!requestedVendor || config.vendor === requestedVendor) && (!args.webhookSecret || config.webhookSecret === args.webhookSecret)) ?? null;
  },
});

export const setBiometricsSyncStatusInternal = internalMutation({
  args: { configId: v.id("biometricsConfigs"), status: v.string(), records: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.configId, { lastSyncAt: now(), lastSyncStatus: args.status, lastSyncRecords: args.records, updatedAt: now() });
  },
});

export const ingestBiometricsRecordsInternal = internalMutation({
  args: {
    configId: v.id("biometricsConfigs"),
    source: v.string(),
    records: v.array(v.object({
      employee_identifier: v.string(),
      timestamp: v.string(),
      type: v.union(v.literal("in"), v.literal("out")),
      device_serial: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => await ingestBiometricsRecords(ctx, args),
});

export const getBiometricsConfigs = query({
  args: { siteId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { identity, roles } = await requireAdmin(ctx);
    const accessibleSiteIds = await getAccessibleSiteIds(ctx, identity.subject, roles);
    assertRequestedSiteInScope(args.siteId, accessibleSiteIds);
    const [configs, sites] = await Promise.all([
      ctx.db.query("biometricsConfigs").collect(),
      ctx.db.query("sites").collect(),
    ]);
    const filtered = applySiteScope(configs, accessibleSiteIds, args.siteId);
    const siteNamesById = new Map(sites.map((site) => [String(site._id), site.name] as const));
    return filtered.sort((a, b) => b.createdAt - a.createdAt).map((config) => ({
      id: config._id,
      vendor: config.vendor,
      name: config.name,
      site_id: config.siteId ?? null,
      site_name: config.siteId ? siteNamesById.get(config.siteId) ?? null : null,
      api_url: config.apiUrl ?? null,
      device_serial: config.deviceSerial ?? null,
      location_name: config.locationName ?? null,
      sync_frequency_minutes: config.syncFrequencyMinutes,
      is_active: config.isActive,
      last_sync_at: config.lastSyncAt ? new Date(config.lastSyncAt).toISOString() : null,
      last_sync_status: config.lastSyncStatus ?? null,
      last_sync_records: config.lastSyncRecords ?? null,
      has_api_key: !!config.apiKey,
      has_api_secret: !!config.apiSecret,
      has_webhook_secret: !!config.webhookSecret,
      extra_config: config.extraConfig ?? {},
      created_at: new Date(config.createdAt).toISOString(),
      updated_at: new Date(config.updatedAt).toISOString(),
    }));
  },
});

export const saveBiometricsConfig = mutation({
  args: {
    vendor: biometricsVendorValidator,
    name: v.string(),
    siteId: v.optional(v.string()),
    apiUrl: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    apiSecret: v.optional(v.string()),
    webhookSecret: v.optional(v.string()),
    deviceSerial: v.optional(v.string()),
    locationName: v.optional(v.string()),
    syncFrequencyMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    if (args.vendor === "generic_webhook" && !args.webhookSecret?.trim()) {
      throw new Error("Webhook secret is required for generic webhook devices");
    }
    const configId = await ctx.db.insert("biometricsConfigs", {
      vendor: args.vendor,
      name: args.name,
      siteId: args.siteId,
      apiUrl: args.apiUrl,
      apiKey: args.apiKey,
      apiSecret: args.apiSecret,
      webhookSecret: args.webhookSecret,
      deviceSerial: args.deviceSerial,
      locationName: args.locationName,
      syncFrequencyMinutes: args.syncFrequencyMinutes,
      isActive: false,
      createdAt: now(),
      updatedAt: now(),
    });
    await recordAudit(ctx, {
      tableName: "biometrics_configs",
      recordId: String(configId),
      action: "INSERT",
      changedBy: identity.subject,
      newData: await ctx.db.get(configId),
    });
    return { id: configId };
  },
});

export const toggleBiometricsConfig = mutation({
  args: { configId: v.id("biometricsConfigs") },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const config = await ctx.db.get(args.configId);
    if (!config) throw new Error("Biometrics config not found");
    if (!config.isActive && config.vendor === "generic_webhook" && !config.webhookSecret) {
      throw new Error("Generic webhook devices require a configured webhook secret before activation");
    }
    const nextState = { ...config, isActive: !config.isActive, updatedAt: now() };
    await ctx.db.patch(args.configId, { isActive: nextState.isActive, updatedAt: nextState.updatedAt });
    await recordAudit(ctx, {
      tableName: "biometrics_configs",
      recordId: String(args.configId),
      action: "UPDATE",
      changedBy: identity.subject,
      oldData: config,
      newData: nextState,
    });
    return { ok: true };
  },
});

export const deleteBiometricsConfig = mutation({
  args: { configId: v.id("biometricsConfigs") },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    const current = await ctx.db.get(args.configId);
    if (!current) throw new Error("Biometrics config not found");
    await ctx.db.delete(args.configId);
    await recordAudit(ctx, {
      tableName: "biometrics_configs",
      recordId: String(args.configId),
      action: "DELETE",
      changedBy: identity.subject,
      oldData: current,
    });
    return { ok: true };
  },
});

export const testBiometricsConnection = action({
  args: { configId: v.id("biometricsConfigs") },
  handler: async (ctx, args) => {
    await requireAdminAction(ctx);
    const config = await ctx.runQuery(internal.admin.getBiometricsConfigInternal, { configId: args.configId });
    if (!config) throw new Error("Biometrics config not found");

    if (config.vendor === "generic_webhook") {
      const convexSiteUrl = currentConvexSiteUrl();
      if (!convexSiteUrl) {
        await ctx.runMutation(internal.admin.setBiometricsSyncStatusInternal, { configId: args.configId, status: "configuration_required", records: config.lastSyncRecords ?? 0 });
        return { success: false, message: getMissingSiteUrlMessage() };
      }

      await ctx.runMutation(internal.admin.setBiometricsSyncStatusInternal, { configId: args.configId, status: "connected", records: config.lastSyncRecords ?? 0 });
      return { success: true, message: getWebhookReadyMessage(convexSiteUrl, config.webhookSecret) };
    }

    return await syncBiometricsConfig(ctx, config);
  },
});

export const syncBiometrics = action({
  args: { configId: v.id("biometricsConfigs") },
  handler: async (ctx, args) => {
    await requireAdminAction(ctx);
    const config = await ctx.runQuery(internal.admin.getBiometricsConfigInternal, { configId: args.configId });
    if (!config) throw new Error("Biometrics config not found");
    return await syncBiometricsConfig(ctx, config);
  },
});

export const runScheduledBiometricsSync = internalAction({
  args: {},
  handler: async (ctx) => {
    const configs = await ctx.runQuery(internal.admin.listActiveBiometricsConfigsInternal, {});
    const currentTimestamp = now();
    const dueConfigs = configs.filter((config) => isBiometricsSyncDue(config, currentTimestamp));
    const results: Array<{ configId: string; vendor: BiometricsVendor; success: boolean; total_synced?: number; unmatched?: number; message: string }> = [];

    for (const config of dueConfigs) {
      try {
        const result = await syncBiometricsConfig(ctx, config);
        results.push({ configId: String(config._id), vendor: config.vendor, success: result.success, total_synced: result.total_synced, unmatched: result.unmatched, message: result.message });
      } catch (error: unknown) {
        results.push({ configId: String(config._id), vendor: config.vendor, success: false, message: getBiometricsErrorMessage(error) });
      }
    }

    return { checked: configs.length, due: dueConfigs.length, synced: results.filter((result) => result.success).length, results };
  },
});

export const ingestBiometricsWebhook = internalAction({
  args: { payload: v.any(), vendor: v.optional(v.string()), webhookSecret: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const config = await ctx.runQuery(internal.admin.getWebhookBiometricsConfigInternal, { vendor: args.vendor, webhookSecret: args.webhookSecret });
    if (!config) return { success: false, status: 404, message: "No active biometrics config matched the incoming webhook." };
    if (!config.webhookSecret) return { success: false, status: 401, message: "Webhook secret is required for biometrics webhook ingestion." };
    if (config.webhookSecret !== args.webhookSecret) return { success: false, status: 401, message: "Webhook secret did not match the configured device." };

    const records = normalizeWebhookRecords(args.payload);
    if (records.length === 0) {
      await ctx.runMutation(internal.admin.setBiometricsSyncStatusInternal, { configId: config._id, status: "webhook_ignored", records: 0 });
      return { success: false, status: 400, message: "Webhook payload did not contain any recognizable attendance records." };
    }

    const result = await ctx.runMutation(internal.admin.ingestBiometricsRecordsInternal, { configId: config._id, source: config.vendor, records });
    return { success: true, status: 202, configId: String(config._id), vendor: config.vendor, processed: result.processed, unmatched: result.unmatched, received: records.length };
  },
});
