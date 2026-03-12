import { internalAction, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { attendanceStatusValidator, locationValidator } from "./constants";
import {
  canManageEmployee,
  getManagedEmployeeIds,
  getProfileByUserId,
  getUserRoles,
  now,
  recordAudit,
  requireAnyRole,
  requireDirectAnyRole,
  requireIdentity,
  toIso,
} from "./lib/auth";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { AttendanceLogDoc, AttendanceSettingsDoc } from "./lib/types";
import { assertStorageFileOwnership, linkStorageFile } from "./lib/storage";

async function getSettingsDoc(ctx: QueryCtx | MutationCtx): Promise<AttendanceSettingsDoc | null> {
  return await ctx.db.query("attendanceSettings").withIndex("by_singleton", (q) => q.eq("singleton", "default")).unique();
}

function defaultSettings() {
  return {
    work_start_time: "09:00:00",
    work_end_time: "17:00:00",
    late_threshold_minutes: 15,
    half_day_hours: 4,
    auto_mark_absent: true,
    require_selfie: false,
    require_location: false,
    geofence_enabled: false,
    geofence_center: null,
    geofence_radius_meters: 150,
    geofence_label: null,
  };
}

function serializeSettings(settings: AttendanceSettingsDoc | null) {
  return {
    id: settings?._id ?? "default",
    work_start_time: settings?.workStartTime ?? defaultSettings().work_start_time,
    work_end_time: settings?.workEndTime ?? defaultSettings().work_end_time,
    late_threshold_minutes: settings?.lateThresholdMinutes ?? defaultSettings().late_threshold_minutes,
    half_day_hours: settings?.halfDayHours ?? defaultSettings().half_day_hours,
    auto_mark_absent: settings?.autoMarkAbsent ?? defaultSettings().auto_mark_absent,
    require_selfie: settings?.requireSelfie ?? defaultSettings().require_selfie,
    require_location: settings?.requireLocation ?? defaultSettings().require_location,
    geofence_enabled: settings?.geofenceEnabled ?? defaultSettings().geofence_enabled,
    geofence_center: settings?.geofenceCenter ?? defaultSettings().geofence_center,
    geofence_radius_meters: settings?.geofenceRadiusMeters ?? defaultSettings().geofence_radius_meters,
    geofence_label: settings?.geofenceLabel ?? defaultSettings().geofence_label,
  };
}

function requiresLocation(settings: ReturnType<typeof serializeSettings>) {
  return settings.require_location || settings.geofence_enabled;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getDistanceMeters(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const earthRadiusMeters = 6371000;
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);
  const fromLat = toRadians(from.lat);
  const toLat = toRadians(to.lat);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function serializeAttendanceLog(log: AttendanceLogDoc) {
  return {
    id: log._id,
    date: log.date,
    clock_in: toIso(log.clockIn),
    clock_out: toIso(log.clockOut),
    selfie_clock_in: log.selfieClockInStorageId ?? null,
    selfie_clock_out: log.selfieClockOutStorageId ?? null,
    location_clock_in: log.locationClockIn ?? null,
    location_clock_out: log.locationClockOut ?? null,
    status: log.status,
    source: log.source,
    notes: log.notes ?? null,
  };
}

function parseDateKey(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Date must be in YYYY-MM-DD format");
  }

  return date;
}

function parseOptionalTimestamp(value?: string) {
  if (!value) {
    return undefined;
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    throw new Error("Invalid attendance timestamp");
  }

  return parsed;
}

function validateManagedAttendanceValues(input: {
  date: string;
  clockIn?: number;
  clockOut?: number;
}) {
  parseDateKey(input.date);
  if (input.clockIn && input.clockOut && input.clockOut < input.clockIn) {
    throw new Error("Clock-out time must be after clock-in time");
  }
}

async function assertAttendanceSelfieOwnership(
  ctx: QueryCtx | MutationCtx,
  storageId: AttendanceLogDoc["selfieClockInStorageId"],
  employeeId: string,
) {
  if (!storageId) {
    return;
  }

  await assertStorageFileOwnership(ctx, {
    storageId,
    ownerUserId: employeeId,
    expectedClass: "attendance_selfie",
  });
}

async function linkAttendanceSelfie(
  ctx: MutationCtx,
  storageId: AttendanceLogDoc["selfieClockInStorageId"],
  employeeId: string,
  logId: AttendanceLogDoc["_id"],
) {
  if (!storageId) {
    return;
  }

  await linkStorageFile(ctx, {
    storageId,
    ownerUserId: employeeId,
    expectedClass: "attendance_selfie",
    linkedTable: "attendance_logs",
    linkedRecordId: String(logId),
  });
}

function assertAttendanceRequirements(
  settings: ReturnType<typeof serializeSettings>,
  action: "clock_in" | "clock_out",
  input: {
    selfieStorageId?: string;
    location?: { lat: number; lng: number };
  },
) {
  if (settings.require_selfie && !input.selfieStorageId) {
    throw new Error("A selfie is required for this attendance action");
  }

  if (requiresLocation(settings) && !input.location) {
    throw new Error("Location is required for this attendance action");
  }

  if (action !== "clock_in" || !settings.geofence_enabled) {
    return;
  }

  if (!settings.geofence_center || !settings.geofence_radius_meters || settings.geofence_radius_meters <= 0) {
    throw new Error("Attendance geofencing is not configured. Please contact HR.");
  }

  const distanceMeters = getDistanceMeters(input.location!, settings.geofence_center);
  if (distanceMeters <= settings.geofence_radius_meters) {
    return;
  }

  const locationLabel = settings.geofence_label?.trim() || "the approved work site";
  throw new Error(
    `You must be within ${Math.round(settings.geofence_radius_meters)} meters of ${locationLabel}. Current distance: ${Math.round(distanceMeters)} meters.`,
  );
}

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
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const timestamp = now();
    const today = new Date(timestamp).toISOString().slice(0, 10);
    const existing = await ctx.db
      .query("attendanceLogs")
      .withIndex("by_employeeId_date", (q) => q.eq("employeeId", identity.subject).eq("date", today))
      .unique();
    if (existing?.clockIn && !existing.clockOut) {
      throw new Error("Already clocked in");
    }

    const settings = serializeSettings(await getSettingsDoc(ctx));
    assertAttendanceRequirements(settings, "clock_in", {
      selfieStorageId: args.selfieClockInStorageId,
      location: args.locationClockIn,
    });
    await assertAttendanceSelfieOwnership(ctx, args.selfieClockInStorageId, identity.subject);
    const [workHour, workMinute] = settings.work_start_time.split(":").map(Number);
    const lateThreshold = settings.late_threshold_minutes;
    const lateCutoff = new Date();
    lateCutoff.setHours(workHour, workMinute + lateThreshold, 0, 0);
    const status = new Date(timestamp) > lateCutoff ? "late" : "present";

    if (existing) {
      const nextState = {
        ...existing,
        clockIn: timestamp,
        status,
        selfieClockInStorageId: args.selfieClockInStorageId,
        locationClockIn: args.locationClockIn,
        updatedAt: timestamp,
      };
      await ctx.db.patch(existing._id, {
        clockIn: timestamp,
        status,
        selfieClockInStorageId: args.selfieClockInStorageId,
        locationClockIn: args.locationClockIn,
        updatedAt: timestamp,
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
      return { id: existing._id };
    }

    const logId = await ctx.db.insert("attendanceLogs", {
      employeeId: identity.subject,
      date: today,
      clockIn: timestamp,
      status,
      source: "manual",
      selfieClockInStorageId: args.selfieClockInStorageId,
      locationClockIn: args.locationClockIn,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await recordAudit(ctx, {
      tableName: "attendance_logs",
      recordId: String(logId),
      action: "INSERT",
      changedBy: identity.subject,
      newData: await ctx.db.get(logId),
    });
    await linkAttendanceSelfie(ctx, args.selfieClockInStorageId, identity.subject, logId);

    return { id: logId, status };
  },
});

export const clockOut = mutation({
  args: {
    logId: v.id("attendanceLogs"),
    selfieClockOutStorageId: v.optional(v.id("_storage")),
    locationClockOut: v.optional(locationValidator),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
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
    assertAttendanceRequirements(settings, "clock_out", {
      selfieStorageId: args.selfieClockOutStorageId,
      location: args.locationClockOut,
    });
    await assertAttendanceSelfieOwnership(ctx, args.selfieClockOutStorageId, identity.subject);

    const clockOutAt = now();
    const nextState = {
      ...log,
      clockOut: clockOutAt,
      selfieClockOutStorageId: args.selfieClockOutStorageId,
      locationClockOut: args.locationClockOut,
      updatedAt: clockOutAt,
    };
    await ctx.db.patch(args.logId, {
      clockOut: clockOutAt,
      selfieClockOutStorageId: args.selfieClockOutStorageId,
      locationClockOut: args.locationClockOut,
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

    return { ok: true };
  },
});

export const getAttendanceHistory = query({
  args: {
    monthOffset: v.number(),
  },
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
  args: {
    dayOffset: v.number(),
  },
  handler: async (ctx, args) => {
    const { identity, roles } = await requireDirectAnyRole(ctx, ["manager", "hr_admin"]);
    const target = new Date();
    target.setDate(target.getDate() - args.dayOffset);
    const targetDate = target.toISOString().slice(0, 10);
    const managedEmployeeIds = roles.includes("hr_admin") ? null : await getManagedEmployeeIds(ctx, identity.subject);

    const logs = await ctx.db.query("attendanceLogs").withIndex("by_date", (q) => q.eq("date", targetDate)).collect();
    const visible = roles.includes("hr_admin")
      ? logs
      : logs.filter((log) => managedEmployeeIds.includes(log.employeeId));

    return await Promise.all(
      visible
        .sort((a, b) => (a.clockIn ?? 0) - (b.clockIn ?? 0))
        .map(async (log) => {
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

export const getAdminAttendanceDashboard = query({
  args: {
    view: v.union(v.literal("today"), v.literal("month")),
  },
  handler: async (ctx, args) => {
    await requireAnyRole(ctx, ["hr_admin"]);
    const today = new Date();
    const start = args.view === "today"
      ? today.toISOString().slice(0, 10)
      : new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    const end = args.view === "today"
      ? today.toISOString().slice(0, 10)
      : new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

    const logs = await ctx.db.query("attendanceLogs").collect();
    const scopedLogs = logs
      .filter((log) => log.date >= start && log.date <= end)
      .sort((a, b) => b.date.localeCompare(a.date));
    const departments = await ctx.db.query("departments").collect();

    return {
      departments: departments.map((department) => ({ id: department._id, name: department.name })),
      logs: await Promise.all(
        scopedLogs.slice(0, 500).map(async (log) => {
          const profile = await getProfileByUserId(ctx, log.employeeId);
          return {
            id: log._id,
            date: log.date,
            clock_in: toIso(log.clockIn),
            clock_out: toIso(log.clockOut),
            selfie_clock_in: log.selfieClockInStorageId ?? null,
            selfie_clock_out: log.selfieClockOutStorageId ?? null,
            location_clock_in: log.locationClockIn ?? null,
            location_clock_out: log.locationClockOut ?? null,
            status: log.status,
            employee_id: log.employeeId,
            profiles: profile
              ? {
                  full_name: profile.fullName ?? null,
                  email: profile.email ?? null,
                  department_id: profile.departmentId ?? null,
                }
              : null,
          };
        }),
      ),
    };
  },
});

export const getAttendanceSettings = query({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx);
    const settings = await getSettingsDoc(ctx);
    return serializeSettings(settings);
  },
});

export const saveAttendanceSettings = mutation({
  args: {
    workStartTime: v.string(),
    workEndTime: v.string(),
    lateThresholdMinutes: v.number(),
    halfDayHours: v.number(),
    autoMarkAbsent: v.boolean(),
    requireSelfie: v.boolean(),
    requireLocation: v.boolean(),
    geofenceEnabled: v.boolean(),
    geofenceCenter: v.optional(locationValidator),
    geofenceRadiusMeters: v.optional(v.number()),
    geofenceLabel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireAnyRole(ctx, ["hr_admin"]);
    const settings = await getSettingsDoc(ctx);
    const geofenceLabel = args.geofenceLabel?.trim() || undefined;

    if (args.geofenceEnabled) {
      if (!args.geofenceCenter) {
        throw new Error("Geofence center coordinates are required when geofencing is enabled");
      }

      if (!args.geofenceRadiusMeters || args.geofenceRadiusMeters <= 0) {
        throw new Error("Geofence radius must be greater than zero");
      }
    }

    const payload = {
      singleton: "default",
      workStartTime: args.workStartTime,
      workEndTime: args.workEndTime,
      lateThresholdMinutes: args.lateThresholdMinutes,
      halfDayHours: args.halfDayHours,
      autoMarkAbsent: args.autoMarkAbsent,
      requireSelfie: args.requireSelfie,
      requireLocation: args.requireLocation,
      geofenceEnabled: args.geofenceEnabled,
      geofenceCenter: args.geofenceEnabled ? args.geofenceCenter : undefined,
      geofenceRadiusMeters: args.geofenceEnabled ? args.geofenceRadiusMeters : undefined,
      geofenceLabel: args.geofenceEnabled ? geofenceLabel : undefined,
      updatedAt: now(),
    };

    if (!settings) {
      const settingsId = await ctx.db.insert("attendanceSettings", {
        ...payload,
        createdAt: now(),
      });
      await recordAudit(ctx, {
        tableName: "attendance_settings",
        recordId: String(settingsId),
        action: "INSERT",
        changedBy: identity.subject,
        newData: await ctx.db.get(settingsId),
      });
      return { id: settingsId };
    }

    await ctx.db.patch(settings._id, payload);
    await recordAudit(ctx, {
      tableName: "attendance_settings",
      recordId: String(settings._id),
      action: "UPDATE",
      changedBy: identity.subject,
      oldData: settings,
      newData: { ...settings, ...payload },
    });
    return { id: settings._id };
  },
});

export const saveManagedAttendanceLog = mutation({
  args: {
    logId: v.optional(v.id("attendanceLogs")),
    employeeId: v.string(),
    date: v.string(),
    clockIn: v.optional(v.string()),
    clockOut: v.optional(v.string()),
    status: attendanceStatusValidator,
    source: v.optional(v.string()),
    notes: v.optional(v.string()),
    selfieClockInStorageId: v.optional(v.id("_storage")),
    selfieClockOutStorageId: v.optional(v.id("_storage")),
    locationClockIn: v.optional(locationValidator),
    locationClockOut: v.optional(locationValidator),
  },
  handler: async (ctx, args) => {
    const { identity, roles } = await requireDirectAnyRole(ctx, ["manager", "hr_admin"]);
    const isHrAdmin = roles.includes("hr_admin");
    const clockIn = parseOptionalTimestamp(args.clockIn);
    const clockOut = parseOptionalTimestamp(args.clockOut);
    validateManagedAttendanceValues({
      date: args.date,
      clockIn,
      clockOut,
    });

    await assertAttendanceSelfieOwnership(ctx, args.selfieClockInStorageId, args.employeeId);
    await assertAttendanceSelfieOwnership(ctx, args.selfieClockOutStorageId, args.employeeId);

    if (!args.logId) {
      if (!isHrAdmin) {
        throw new Error("Only HR admins can create attendance logs");
      }

      const existing = await ctx.db
        .query("attendanceLogs")
        .withIndex("by_employeeId_date", (q) => q.eq("employeeId", args.employeeId).eq("date", args.date))
        .unique();
      if (existing) {
        throw new Error("Attendance log already exists for that employee and date");
      }

      const logId = await ctx.db.insert("attendanceLogs", {
        employeeId: args.employeeId,
        date: args.date,
        clockIn,
        clockOut,
        status: args.status,
        source: args.source?.trim() || "manual",
        notes: args.notes?.trim() || undefined,
        selfieClockInStorageId: args.selfieClockInStorageId,
        selfieClockOutStorageId: args.selfieClockOutStorageId,
        locationClockIn: args.locationClockIn,
        locationClockOut: args.locationClockOut,
        createdAt: now(),
        updatedAt: now(),
      });

      await linkAttendanceSelfie(ctx, args.selfieClockInStorageId, args.employeeId, logId);
      await linkAttendanceSelfie(ctx, args.selfieClockOutStorageId, args.employeeId, logId);
      await recordAudit(ctx, {
        tableName: "attendance_logs",
        recordId: String(logId),
        action: "INSERT",
        changedBy: identity.subject,
        newData: await ctx.db.get(logId),
      });
      return { id: logId, created: true };
    }

    const existing = await ctx.db.get(args.logId);
    if (!existing) {
      throw new Error("Attendance log not found");
    }

    if (args.employeeId !== existing.employeeId || args.date !== existing.date) {
      throw new Error("Employee and date cannot be changed when editing an existing attendance log");
    }

    if (!isHrAdmin && !(await canManageEmployee(ctx, identity.subject, existing.employeeId, roles))) {
      throw new Error("Forbidden");
    }

    const patch = {
      clockIn,
      clockOut,
      status: args.status,
      source: args.source?.trim() || existing.source,
      notes: args.notes?.trim() || undefined,
      selfieClockInStorageId: args.selfieClockInStorageId,
      selfieClockOutStorageId: args.selfieClockOutStorageId,
      locationClockIn: args.locationClockIn,
      locationClockOut: args.locationClockOut,
      updatedAt: now(),
    };

    await ctx.db.patch(args.logId, patch);
    await linkAttendanceSelfie(ctx, args.selfieClockInStorageId, args.employeeId, args.logId);
    await linkAttendanceSelfie(ctx, args.selfieClockOutStorageId, args.employeeId, args.logId);
    await recordAudit(ctx, {
      tableName: "attendance_logs",
      recordId: String(args.logId),
      action: "UPDATE",
      changedBy: identity.subject,
      oldData: existing,
      newData: { ...existing, ...patch },
    });

    return { id: args.logId, created: false };
  },
});

export const deleteAttendanceLog = mutation({
  args: {
    logId: v.id("attendanceLogs"),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireDirectAnyRole(ctx, ["hr_admin"]);
    const existing = await ctx.db.get(args.logId);
    if (!existing) {
      throw new Error("Attendance log not found");
    }

    await ctx.db.delete(args.logId);
    await recordAudit(ctx, {
      tableName: "attendance_logs",
      recordId: String(args.logId),
      action: "DELETE",
      changedBy: identity.subject,
      oldData: existing,
    });
    return { ok: true };
  },
});

export const runAbsenceNotificationAutomation = internalAction({
  args: {
    date: v.optional(v.string()),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) =>
    await ctx.runAction(internal.absenceNotifications.runDailyAttendanceAutomation, {
      date: args.date,
      dryRun: args.dryRun,
    }),
});
