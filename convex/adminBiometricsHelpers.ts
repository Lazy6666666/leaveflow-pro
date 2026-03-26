import { api, internal } from "./_generated/api";
import { getConvexSiteUrl } from "./lib/env";
import { hasAuditDiff, now, recordAudit, vendorKey } from "./lib/auth";

import type { ActionCtx, MutationCtx } from "./_generated/server";
import type { BiometricsVendor } from "./constants";
import type { BiometricsConfigDoc } from "./lib/types";

export type BiometricsAttendanceRecord = {
  employee_identifier: string;
  timestamp: string;
  type: "in" | "out";
  device_serial?: string;
};

type VendorConnectionConfig = Pick<
  BiometricsConfigDoc,
  "_id" | "vendor" | "name" | "apiUrl" | "apiKey" | "apiSecret" | "webhookSecret" | "lastSyncRecords"
>;

type VendorAdapter = {
  testConnection: (config: VendorConnectionConfig) => Promise<{ success: boolean; message: string }>;
  fetchLogs: (config: VendorConnectionConfig, date: string) => Promise<BiometricsAttendanceRecord[]>;
};

type WebhookRecord = Record<string, unknown>;
type SupportedPullVendor = Exclude<BiometricsVendor, "generic_webhook">;

function isRecord(value: unknown): value is WebhookRecord {
  return typeof value === "object" && value !== null;
}

export function getBiometricsErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function getBasicAuthHeader(username?: string | null, password?: string | null) {
  if (!username) return undefined;
  return `Basic ${btoa(`${username}:${password ?? ""}`)}`;
}

function toOptionalString(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value) : undefined;
}

function inferPunchType(value: unknown) {
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (normalized.includes("out") || normalized.includes("exit") || normalized.includes("checkout") || normalized.includes("clock_out")) {
      return "out" as const;
    }
    return "in" as const;
  }

  return value === 0 || value === "0" ? "in" : "out";
}

export function normalizeWebhookRecords(payload: unknown): BiometricsAttendanceRecord[] {
  const rawRecords = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.records)
      ? payload.records
      : isRecord(payload) && Array.isArray(payload.events)
        ? payload.events
        : isRecord(payload) && Array.isArray(payload.payload)
          ? payload.payload
          : isRecord(payload) && payload.payload
            ? [payload.payload]
            : payload
              ? [payload]
              : [];

  return rawRecords.flatMap((rawRecord) => {
    if (!isRecord(rawRecord)) return [];

    const identifier =
      rawRecord.employee_identifier ??
      rawRecord.employeeIdentifier ??
      rawRecord.emp_code ??
      rawRecord.employee_code ??
      rawRecord.badge_id ??
      rawRecord.badgeId ??
      rawRecord.pin ??
      rawRecord.cardNo ??
      rawRecord.employeeNoString ??
      rawRecord.user_id ??
      rawRecord.userId;
    const timestamp =
      rawRecord.timestamp ??
      rawRecord.punch_time ??
      rawRecord.att_date ??
      rawRecord.datetime ??
      rawRecord.time ??
      rawRecord.event_time ??
      rawRecord.occurred_at;

    if (!identifier || !timestamp) return [];

    const normalizedTime = Date.parse(String(timestamp));
    if (Number.isNaN(normalizedTime)) return [];

    return [{
      employee_identifier: String(identifier),
      timestamp: new Date(normalizedTime).toISOString(),
      type: inferPunchType(rawRecord.type ?? rawRecord.direction ?? rawRecord.event_type ?? rawRecord.punch_state),
      device_serial: toOptionalString(
        rawRecord.device_serial ?? rawRecord.deviceSerial ?? rawRecord.terminal_sn ?? rawRecord.terminal ?? rawRecord.deviceName ?? rawRecord.device_id,
      ),
    }];
  });
}

const zktecoAdapter: VendorAdapter = {
  async testConnection(config) {
    try {
      const response = await fetch(`${config.apiUrl}/iclock/api/terminals/`, { headers: { Authorization: `Token ${config.apiKey}` } });
      return response.ok ? { success: true, message: `Connected to ZKTeco at ${config.apiUrl}` } : { success: false, message: `ZKTeco responded with status ${response.status}` };
    } catch (error: unknown) {
      return { success: false, message: `Cannot reach ZKTeco server: ${getBiometricsErrorMessage(error)}` };
    }
  },
  async fetchLogs(config, date) {
    const response = await fetch(`${config.apiUrl}/iclock/api/transactions/?start_time=${date} 00:00:00&end_time=${date} 23:59:59&page_size=1000`, {
      headers: { Authorization: `Token ${config.apiKey}` },
    });
    if (!response.ok) throw new Error(`ZKTeco API error: ${response.status}`);
    const payload = await response.json();
    const records = (Array.isArray(payload.data) ? payload.data : undefined) ?? (Array.isArray(payload.results) ? payload.results : undefined) ?? [];
    return records.flatMap((record: unknown) => {
      if (!isRecord(record)) return [];
      const timestamp = record.punch_time ?? record.att_date;
      if (timestamp === undefined || timestamp === null) return [];
      return [{
        employee_identifier: String(record.emp_code ?? record.pin ?? ""),
        timestamp: new Date(String(timestamp)).toISOString(),
        type: inferPunchType(record.punch_state),
        device_serial: typeof record.terminal_sn === "string" ? record.terminal_sn : undefined,
      }];
    });
  },
};

const biotimeAdapter: VendorAdapter = {
  async testConnection(config) {
    try {
      const response = await fetch(`${config.apiUrl}/api/v1/device/`, { headers: { "Content-Type": "application/json", Authorization: `JWT ${config.apiKey}` } });
      return response.ok ? { success: true, message: `Connected to BioTime at ${config.apiUrl}` } : { success: false, message: `BioTime responded with status ${response.status}` };
    } catch (error: unknown) {
      return { success: false, message: `Cannot reach BioTime: ${getBiometricsErrorMessage(error)}` };
    }
  },
  async fetchLogs(config, date) {
    const response = await fetch(`${config.apiUrl}/api/v1/transactions/?start_time=${date}&end_time=${date}&page_size=1000`, { headers: { Authorization: `JWT ${config.apiKey}` } });
    if (!response.ok) throw new Error(`BioTime API error: ${response.status}`);
    const payload = await response.json();
    const records = Array.isArray(payload.data) ? payload.data : [];
    return records.flatMap((record: unknown) => {
      if (!isRecord(record) || typeof record.emp_code !== "string" || typeof record.punch_time !== "string") return [];
      return [{ employee_identifier: record.emp_code, timestamp: new Date(record.punch_time).toISOString(), type: inferPunchType(record.punch_state), device_serial: typeof record.terminal_sn === "string" ? record.terminal_sn : undefined }];
    });
  },
};

const supremaAdapter: VendorAdapter = {
  async testConnection(config) {
    try {
      const headers: Record<string, string> = {};
      if (config.apiKey) {
        headers["bs-session-id"] = config.apiKey;
      }
      const response = await fetch(`${config.apiUrl}/api/v2/server/info`, { headers });
      return response.ok ? { success: true, message: "Connected to Suprema BioStar 2" } : { success: false, message: `Suprema responded with status ${response.status}` };
    } catch (error: unknown) {
      return { success: false, message: `Cannot reach Suprema: ${getBiometricsErrorMessage(error)}` };
    }
  },
  async fetchLogs(config, date) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (config.apiKey) {
      headers["bs-session-id"] = config.apiKey;
    }
    const response = await fetch(`${config.apiUrl}/api/v2/events/search`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        Query: {
          limit: 1000,
          conditions: [
            { column: "datetime", operator: 2, values: [`${date}T00:00:00`] },
            { column: "datetime", operator: 3, values: [`${date}T23:59:59`] },
          ],
        },
      }),
    });
    if (!response.ok) throw new Error(`Suprema API error: ${response.status}`);
    const payload = await response.json();
    const rows = isRecord(payload.EventCollection) && Array.isArray(payload.EventCollection.rows) ? payload.EventCollection.rows : [];
    return rows.flatMap((record: unknown) => {
      if (!isRecord(record)) return [];
      const userValue = isRecord(record.user_id) ? record.user_id.user_id : record.user_id;
      if ((typeof userValue !== "string" && typeof userValue !== "number") || typeof record.datetime !== "string") return [];
      const deviceId = isRecord(record.device_id) ? record.device_id.id : undefined;
      const eventType = isRecord(record.event_type_id) ? record.event_type_id.code : undefined;
      return [{ employee_identifier: String(userValue), timestamp: new Date(record.datetime).toISOString(), type: inferPunchType(eventType), device_serial: typeof deviceId === "string" || typeof deviceId === "number" ? String(deviceId) : undefined }];
    });
  },
};

const hikvisionAdapter: VendorAdapter = {
  async testConnection(config) {
    try {
      const response = await fetch(`${config.apiUrl}/ISAPI/System/deviceInfo`, { headers: { Authorization: getBasicAuthHeader(config.apiKey, config.apiSecret) ?? "" } });
      return response.ok ? { success: true, message: "Connected to HikVision device" } : { success: false, message: `HikVision responded with status ${response.status}` };
    } catch (error: unknown) {
      return { success: false, message: `Cannot reach HikVision: ${getBiometricsErrorMessage(error)}` };
    }
  },
  async fetchLogs(config, date) {
    const response = await fetch(`${config.apiUrl}/ISAPI/AccessControl/AcsEvent?format=json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: getBasicAuthHeader(config.apiKey, config.apiSecret) ?? "" },
      body: JSON.stringify({
        AcsEventCond: {
          searchID: crypto.randomUUID(),
          searchResultPosition: 0,
          maxResults: 1000,
          startTime: `${date}T00:00:00Z`,
          endTime: `${date}T23:59:59Z`,
        },
      }),
    });
    if (!response.ok) throw new Error(`HikVision API error: ${response.status}`);
    const payload = await response.json();
    const records = isRecord(payload.AcsEvent) && Array.isArray(payload.AcsEvent.InfoList) ? payload.AcsEvent.InfoList : [];
    return records.flatMap((record: unknown) => {
      if (!isRecord(record)) return [];
      const identifier = record.employeeNoString ?? record.cardNo;
      if ((typeof identifier !== "string" && typeof identifier !== "number") || typeof record.time !== "string") return [];
      return [{ employee_identifier: String(identifier), timestamp: new Date(record.time).toISOString(), type: inferPunchType(record.currentEvent), device_serial: typeof record.deviceName === "string" ? record.deviceName : undefined }];
    });
  },
};

const biometricsAdapters: Record<SupportedPullVendor, VendorAdapter> = {
  zkteco: zktecoAdapter,
  biotime: biotimeAdapter,
  suprema: supremaAdapter,
  hikvision: hikvisionAdapter,
};

export async function requireAdminAction(ctx: ActionCtx) {
  const currentUser = await ctx.runQuery(api.users.current, {});
  if (!currentUser || !currentUser.roles.includes("hr_admin")) {
    throw new Error("Forbidden");
  }
  return currentUser;
}

export function isBiometricsSyncDue(config: BiometricsConfigDoc, currentTimestamp: number) {
  if (config.vendor === "generic_webhook") return false;
  if (!config.lastSyncAt) return true;
  return currentTimestamp - config.lastSyncAt >= Math.max(1, Math.floor(config.syncFrequencyMinutes)) * 60_000;
}

export async function syncBiometricsConfig(ctx: ActionCtx, config: BiometricsConfigDoc): Promise<{
  success: boolean;
  total_synced: number;
  unmatched?: number;
  message: string;
}> {
  if (config.vendor === "generic_webhook") {
    await ctx.runMutation(internal.admin.setBiometricsSyncStatusInternal, { configId: config._id, status: "awaiting_webhook", records: config.lastSyncRecords ?? 0 });
    return { success: true, total_synced: 0, message: "Generic webhook devices push attendance events to /biometrics/webhook; manual pull sync is not available." };
  }

  const adapter = biometricsAdapters[config.vendor];
  if (!adapter) throw new Error(`No adapter configured for vendor ${config.vendor}`);

  const syncDate = new Date().toISOString().slice(0, 10);
  try {
    await ctx.runMutation(internal.admin.setBiometricsSyncStatusInternal, { configId: config._id, status: "syncing", records: config.lastSyncRecords ?? 0 });
    const records = await adapter.fetchLogs(config, syncDate);
    const result = await ctx.runMutation(internal.admin.ingestBiometricsRecordsInternal, { configId: config._id, source: config.vendor, records });
    return {
      success: true,
      total_synced: result.processed,
      unmatched: result.unmatched,
      message: `Processed ${result.processed} attendance record${result.processed === 1 ? "" : "s"}${result.unmatched ? ` (${result.unmatched} unmatched)` : ""}.`,
    };
  } catch (error: unknown) {
    await ctx.runMutation(internal.admin.setBiometricsSyncStatusInternal, { configId: config._id, status: `error:${getBiometricsErrorMessage(error)}`, records: 0 });
    throw error;
  }
}

export function currentConvexSiteUrl() {
  return getConvexSiteUrl();
}

export function getMissingSiteUrlMessage() {
  return "Set CONVEX_SITE_URL (preferred) or VITE_CONVEX_SITE_URL before testing the generic biometrics webhook endpoint.";
}

export function getWebhookReadyMessage(convexSiteUrl: string, webhookSecret?: string | null) {
  return `Generic webhook is ready. Send POST requests to ${convexSiteUrl}/biometrics/webhook${webhookSecret ? " with the configured secret header." : "."}`;
}

export async function ingestBiometricsRecords(ctx: MutationCtx, args: { configId: BiometricsConfigDoc["_id"]; source: string; records: BiometricsAttendanceRecord[] }) {
  const config = await ctx.db.get(args.configId);
  if (!config) throw new Error("Biometrics config not found");

  const profiles = await ctx.db.query("profiles").collect();
  const profileByIdentifier = new Map<string, string>();
  for (const profile of profiles) {
    profileByIdentifier.set(profile.userId.toLowerCase(), profile.userId);
    if (profile.email) profileByIdentifier.set(profile.email.toLowerCase(), profile.userId);
    if (profile.fullName) profileByIdentifier.set(profile.fullName.toLowerCase(), profile.userId);
  }

  let processed = 0;
  let unmatched = 0;
  const changedBy = `system:biometrics:${String(args.configId)}`;

  for (const record of args.records) {
    const identifier = record.employee_identifier.trim();
    const normalizedIdentifier = identifier.toLowerCase();
    const badgeSpecific = await ctx.db.query("badgeMappings").withIndex("by_vendorKey", (q) => q.eq("vendorKey", vendorKey(identifier, config.vendor))).unique();
    const badgeUniversal = badgeSpecific ?? await ctx.db.query("badgeMappings").withIndex("by_vendorKey", (q) => q.eq("vendorKey", vendorKey(identifier))).unique();

    const employeeId = badgeUniversal?.employeeId ?? profileByIdentifier.get(normalizedIdentifier);
    if (!employeeId) {
      unmatched += 1;
      continue;
    }

    const eventTimestamp = new Date(record.timestamp).getTime();
    if (Number.isNaN(eventTimestamp)) {
      unmatched += 1;
      continue;
    }

    const recordDate = new Date(record.timestamp).toISOString().slice(0, 10);
    const existing = await ctx.db.query("attendanceLogs").withIndex("by_employeeId_date", (q) => q.eq("employeeId", employeeId).eq("date", recordDate)).unique();
    const nextClockIn = record.type === "in" ? Math.min(existing?.clockIn ?? eventTimestamp, eventTimestamp) : existing?.clockIn;
    const nextClockOut = record.type === "out" ? Math.max(existing?.clockOut ?? eventTimestamp, eventTimestamp) : existing?.clockOut;
    const patch = {
      employeeId,
      date: recordDate,
      siteId: config.siteId ?? existing?.siteId,
      clockIn: nextClockIn,
      clockOut: nextClockOut,
      status: "present" as const,
      source: args.source,
      notes: `Synced from ${config.name}${record.device_serial ? ` (${record.device_serial})` : ""}`,
      updatedAt: now(),
    };

    if (existing) {
      const nextState = { ...existing, ...patch };
      if (hasAuditDiff(existing, nextState)) {
        await ctx.db.patch(existing._id, patch);
        await recordAudit(ctx, {
          tableName: "attendance_logs",
          recordId: String(existing._id),
          action: "UPDATE",
          changedBy,
          oldData: existing,
          newData: nextState,
        });
      }
    } else {
      const logId = await ctx.db.insert("attendanceLogs", { ...patch, createdAt: now() });
      await recordAudit(ctx, {
        tableName: "attendance_logs",
        recordId: String(logId),
        action: "INSERT",
        changedBy,
        newData: await ctx.db.get(logId),
      });
    }

    processed += 1;
  }

  await ctx.db.patch(args.configId, {
    lastSyncAt: now(),
    lastSyncStatus: unmatched > 0 ? `success_with_unmatched:${unmatched}` : "success",
    lastSyncRecords: processed,
    updatedAt: now(),
  });

  return { processed, unmatched };
}
