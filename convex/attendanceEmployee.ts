import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

import { insertAnalyticsEvent } from "./lib/analytics";
import { locationValidator } from "./constants";
import { getManagedEmployeeIds, getProfileByUserId, now, recordAudit, requireDirectAnyRole, requireIdentity, toIso } from "./lib/auth";
import { assertAttendanceRequirements, assertAttendanceSelfieOwnership, calculateAttendanceStatus, getSettingsDoc, linkAttendanceSelfie, serializeAttendanceLog, serializeSettings } from "./attendanceHelpers";
import { getEmployeeShiftByDateInternal } from "./rosters";

type Identity = { subject: string };

type ClockInAnalytics = {
  sessionId: string;
  path?: string;
  roleScope?: string;
  surface: string;
  hasSelfie: boolean;
  hasLocation: boolean;
};

type ClockInArgs = {
  selfieClockInStorageId?: Id<"_storage">;
  locationClockIn?: { lat: number; lng: number };
  analytics?: ClockInAnalytics;
  offlineSyncId?: string;
  offlineTimestamp?: number;
};

export const getClockWidgetData = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const today = new Date().toISOString().slice(0, 10);
    const todayLog = await ctx.db
      .query("attendanceLogs")
      .withIndex("by_employeeId_date", (q) => q.eq("employeeId", identity.subject).eq("date", today))
      .unique();
    const settings = await getSettingsDoc(ctx);

    return {
      todayLog: todayLog ? serializeAttendanceLog(todayLog) : null,
      settings: serializeSettings(settings),
    };
  },
});

export const clockIn = mutation({
  args: {
    selfieClockInStorageId: v.optional(v.id("_storage")),
    locationClockIn: v.optional(locationValidator),
    analytics: v.optional(v.object({
      sessionId: v.string(),
      path: v.optional(v.string()),
      roleScope: v.optional(v.string()),
      surface: v.string(),
      hasSelfie: v.boolean(),
      hasLocation: v.boolean(),
    })),
    offlineSyncId: v.optional(v.string()),
    offlineTimestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    return await applyClockIn(ctx, identity, args);
  },
});

export async function applyClockIn(ctx: MutationCtx, identity: Identity, args: ClockInArgs) {
  if (args.offlineSyncId) {
    const existingOffline = await ctx.db
      .query("attendanceLogs")
      .withIndex("by_offlineSyncId", (q) => q.eq("offlineSyncId", args.offlineSyncId!))
      .unique();
    if (existingOffline) {
      return { id: existingOffline._id, status: existingOffline.status, replayed: true };
    }
  }

  const timestamp = args.offlineTimestamp || now();
  const today = new Date(timestamp).toISOString().slice(0, 10);
  const existing = await ctx.db
    .query("attendanceLogs")
    .withIndex("by_employeeId_date", (q) => q.eq("employeeId", identity.subject).eq("date", today))
    .unique();
  if (existing?.clockIn && !existing.clockOut) {
    throw new Error("Already clocked in");
  }

  const settings = serializeSettings(await getSettingsDoc(ctx));
  const attendanceRequirements = await assertAttendanceRequirements(ctx, settings, "clock_in", {
    selfieStorageId: args.selfieClockInStorageId,
    location: args.locationClockIn,
  });
  await assertAttendanceSelfieOwnership(ctx, args.selfieClockInStorageId, identity.subject);

  const shift = await getEmployeeShiftByDateInternal(ctx, { employeeId: identity.subject, date: today });
  const status = calculateAttendanceStatus(settings, shift, timestamp);

  if (existing) {
    const nextState = {
      ...existing,
      clockIn: timestamp,
      status,
      siteId: attendanceRequirements.siteId ?? existing.siteId,
      selfieClockInStorageId: args.selfieClockInStorageId,
      locationClockIn: args.locationClockIn,
      updatedAt: timestamp,
    };
    await ctx.db.patch(existing._id, {
      clockIn: timestamp,
      status,
      siteId: attendanceRequirements.siteId ?? existing.siteId,
      selfieClockInStorageId: args.selfieClockInStorageId,
      locationClockIn: args.locationClockIn,
      offlineSyncId: args.offlineSyncId,
      updatedAt: timestamp,
      trustState: "unverified",
    });
    await linkAttendanceSelfie(ctx, args.selfieClockInStorageId, identity.subject, existing._id);
    await recordAudit(ctx, {
      tableName: "attendance_logs",
      recordId: String(existing._id),
      action: "UPDATE",
      changedBy: identity.subject,
      oldData: existing,
      newData: nextState,
    });
    if (args.analytics) {
      await insertAnalyticsEvent(ctx, {
        eventName: "clock_in_succeeded",
        sessionId: args.analytics.sessionId,
        userId: identity.subject,
        roleScope: args.analytics.roleScope,
        path: args.analytics.path,
        surface: args.analytics.surface,
        properties: {
          log_id: String(existing._id),
          status,
          source: nextState.source,
          has_selfie: args.analytics.hasSelfie,
          has_location: args.analytics.hasLocation,
        },
      });
    }
    return { id: existing._id };
  }

  const logId = await ctx.db.insert("attendanceLogs", {
    employeeId: identity.subject,
    date: today,
    clockIn: timestamp,
    status,
    source: args.offlineSyncId ? "offline" : "manual",
    siteId: attendanceRequirements.siteId,
    selfieClockInStorageId: args.selfieClockInStorageId,
    locationClockIn: args.locationClockIn,
    offlineSyncId: args.offlineSyncId,
    createdAt: timestamp,
    updatedAt: timestamp,
    trustState: "unverified",
  });

  await recordAudit(ctx, {
    tableName: "attendance_logs",
    recordId: String(logId),
    action: "INSERT",
    changedBy: identity.subject,
    newData: await ctx.db.get(logId),
  });
  await linkAttendanceSelfie(ctx, args.selfieClockInStorageId, identity.subject, logId);

  if (args.analytics) {
    await insertAnalyticsEvent(ctx, {
      eventName: "clock_in_succeeded",
      sessionId: args.analytics.sessionId,
      userId: identity.subject,
      roleScope: args.analytics.roleScope,
      path: args.analytics.path,
      surface: args.analytics.surface,
      properties: {
        log_id: String(logId),
        status,
        source: args.offlineSyncId ? "offline" : "manual",
        has_selfie: args.analytics.hasSelfie,
        has_location: args.analytics.hasLocation,
      },
    });
  }

  return { id: logId, status };
}

export const clockOut = mutation({
  args: {
    logId: v.id("attendanceLogs"),
    selfieClockOutStorageId: v.optional(v.id("_storage")),
    locationClockOut: v.optional(locationValidator),
    analytics: v.optional(v.object({
      sessionId: v.string(),
      path: v.optional(v.string()),
      roleScope: v.optional(v.string()),
      surface: v.string(),
      workDurationBucketHours: v.optional(v.string()),
    })),
    offlineSyncId: v.optional(v.string()),
    offlineTimestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    return await applyClockOut(ctx, identity, args);
  },
});

type ClockOutAnalytics = {
  sessionId: string;
  path?: string;
  roleScope?: string;
  surface: string;
  workDurationBucketHours?: string;
};

type ClockOutArgs = {
  logId: Id<"attendanceLogs">;
  selfieClockOutStorageId?: Id<"_storage">;
  locationClockOut?: { lat: number; lng: number };
  analytics?: ClockOutAnalytics;
  offlineSyncId?: string;
  offlineTimestamp?: number;
};

export async function applyClockOut(ctx: MutationCtx, identity: Identity, args: ClockOutArgs) {
  if (args.offlineSyncId) {
    const existingOffline = await ctx.db
      .query("attendanceLogs")
      .withIndex("by_offlineSyncId", (q) => q.eq("offlineSyncId", args.offlineSyncId!))
      .unique();
    if (existingOffline && existingOffline.clockOut) {
      return { ok: true, replayed: true };
    }
  }
  const log = await ctx.db.get(args.logId);
  if (!log || log.employeeId !== identity.subject) {
    throw new Error("Attendance log not found");
  }
  if (!log.clockIn) {
    throw new Error("Cannot clock out before clocking in");
  }
  if (log.clockOut) {
    throw new Error("Already clocked out");
  }

  const settings = serializeSettings(await getSettingsDoc(ctx));
  await assertAttendanceRequirements(ctx, settings, "clock_out", {
    selfieStorageId: args.selfieClockOutStorageId,
    location: args.locationClockOut,
  });
  await assertAttendanceSelfieOwnership(ctx, args.selfieClockOutStorageId, identity.subject);

  const clockOutAt = args.offlineTimestamp || now();
  const nextState = {
    ...log,
    clockOut: clockOutAt,
    selfieClockOutStorageId: args.selfieClockOutStorageId,
    locationClockOut: args.locationClockOut,
    offlineSyncId: args.offlineSyncId || log.offlineSyncId,
    updatedAt: clockOutAt,
  };
  await ctx.db.patch(args.logId, {
    clockOut: clockOutAt,
    selfieClockOutStorageId: args.selfieClockOutStorageId,
    locationClockOut: args.locationClockOut,
    offlineSyncId: args.offlineSyncId || log.offlineSyncId,
    updatedAt: clockOutAt,
  });
  await linkAttendanceSelfie(ctx, args.selfieClockOutStorageId, identity.subject, args.logId);

  await recordAudit(ctx, {
    tableName: "attendance_logs",
    recordId: String(args.logId),
    action: "UPDATE",
    changedBy: identity.subject,
    oldData: log,
    newData: nextState,
  });

  if (args.analytics) {
    await insertAnalyticsEvent(ctx, {
      eventName: "clock_out_succeeded",
      sessionId: args.analytics.sessionId,
      userId: identity.subject,
      roleScope: args.analytics.roleScope,
      path: args.analytics.path,
      surface: args.analytics.surface,
      properties: {
        log_id: String(args.logId),
        source: nextState.source,
        work_duration_bucket_hours: args.analytics.workDurationBucketHours,
      },
    });
  }

    return { ok: true };
}

export const replayOfflineLog = mutation({
  args: {
    offlineSyncId: v.string(),
    eventType: v.union(v.literal("clock_in"), v.literal("clock_out")),
    timestamp: v.number(),
    selfieStorageId: v.optional(v.id("_storage")),
    locationData: v.optional(locationValidator),
    logId: v.optional(v.id("attendanceLogs")),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);

    const existingQueue = await ctx.db
      .query("offlineQueuedLogs")
      .withIndex("by_employeeId_status", (q) => q.eq("employeeId", identity.subject))
      .filter((q) => q.eq(q.field("offlineSyncId"), args.offlineSyncId))
      .unique();

    if (existingQueue?.replayStatus === "replayed") {
      return { ok: true, replayed: true };
    }

    let queueId = existingQueue?._id;
    if (!queueId) {
      queueId = await ctx.db.insert("offlineQueuedLogs", {
        employeeId: identity.subject,
        offlineSyncId: args.offlineSyncId,
        eventType: args.eventType,
        timestamp: args.timestamp,
        selfieStorageId: args.selfieStorageId,
        locationData: args.locationData,
        replayStatus: "pending",
        createdAt: now(),
      });
    }

    try {
      if (args.eventType === "clock_in") {
        await applyClockIn(ctx, identity, {
          selfieClockInStorageId: args.selfieStorageId,
          locationClockIn: args.locationData,
          offlineSyncId: args.offlineSyncId,
          offlineTimestamp: args.timestamp,
        });
        if (!args.logId) {
          const today = new Date(args.timestamp).toISOString().slice(0, 10);
          const existing = await ctx.db
            .query("attendanceLogs")
            .withIndex("by_employeeId_date", (q) => q.eq("employeeId", identity.subject).eq("date", today))
            .unique();
          if (!existing) {
            throw new Error("Missing logId for clock_out, and no clock-in found for this date.");
          }
          args.logId = existing._id;
        }
        await applyClockOut(ctx, identity, {
          logId: args.logId,
          selfieClockOutStorageId: args.selfieStorageId,
          locationClockOut: args.locationData,
          offlineSyncId: args.offlineSyncId,
          offlineTimestamp: args.timestamp,
        });
      }

      await ctx.db.patch(queueId, { replayStatus: "replayed", replayedAt: now() });
      return { ok: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      await ctx.db.patch(queueId, { replayStatus: "failed", failureReason: message });
      throw error;
    }
  },
});

export const getAttendanceHistory = query({
  args: { monthOffset: v.number() },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const target = new Date();
    target.setMonth(target.getMonth() - args.monthOffset);
    const start = new Date(target.getFullYear(), target.getMonth(), 1).toISOString().slice(0, 10);
    const end = new Date(target.getFullYear(), target.getMonth() + 1, 0).toISOString().slice(0, 10);

    const logs = await ctx.db.query("attendanceLogs").withIndex("by_employeeId", (q) => q.eq("employeeId", identity.subject)).collect();
    return logs
      .filter((log) => log.date >= start && log.date <= end)
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((log) => serializeAttendanceLog(log));
  },
});

export const getTeamAttendance = query({
  args: { dayOffset: v.number() },
  handler: async (ctx, args) => {
    const { identity, roles } = await requireDirectAnyRole(ctx, ["manager", "hr_admin"]);
    const target = new Date();
    target.setDate(target.getDate() - args.dayOffset);
    const targetDate = target.toISOString().slice(0, 10);
    const managedEmployeeIds = roles.includes("hr_admin") ? null : await getManagedEmployeeIds(ctx, identity.subject);

    const logs = await ctx.db.query("attendanceLogs").withIndex("by_date", (q) => q.eq("date", targetDate)).collect();
    const visible = roles.includes("hr_admin") ? logs : logs.filter((log) => managedEmployeeIds.includes(log.employeeId));

    return await Promise.all(
      visible.sort((a, b) => (a.clockIn ?? 0) - (b.clockIn ?? 0)).map(async (log) => {
        const profile = await getProfileByUserId(ctx, log.employeeId);
        return {
          id: log._id,
          date: log.date,
          clock_in: toIso(log.clockIn),
          clock_out: toIso(log.clockOut),
          status: log.status,
          profiles: profile
            ? {
              full_name: profile.fullName ?? null,
              email: profile.email ?? null,
            }
            : null,
        };
      }),
    );
  },
});
