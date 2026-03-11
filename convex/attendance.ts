import { internalAction, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { attendanceStatusValidator, locationValidator } from "./constants";
import {
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
  };
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

function assertAttendanceRequirements(
  settings: ReturnType<typeof serializeSettings>,
  input: {
    selfieStorageId?: string;
    location?: { lat: number; lng: number };
  },
) {
  if (settings.require_selfie && !input.selfieStorageId) {
    throw new Error("A selfie is required for this attendance action");
  }

  if (settings.require_location && !input.location) {
    throw new Error("Location is required for this attendance action");
  }
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
    assertAttendanceRequirements(settings, {
      selfieStorageId: args.selfieClockInStorageId,
      location: args.locationClockIn,
    });
    const [workHour, workMinute] = settings.work_start_time.split(":").map(Number);
    const lateThreshold = settings.late_threshold_minutes;
    const lateCutoff = new Date();
    lateCutoff.setHours(workHour, workMinute + lateThreshold, 0, 0);
    const status = new Date(timestamp) > lateCutoff ? "late" : "present";

    if (existing) {
      await ctx.db.patch(existing._id, {
        clockIn: timestamp,
        status,
        selfieClockInStorageId: args.selfieClockInStorageId,
        locationClockIn: args.locationClockIn,
        updatedAt: timestamp,
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
    assertAttendanceRequirements(settings, {
      selfieStorageId: args.selfieClockOutStorageId,
      location: args.locationClockOut,
    });

    const clockOutAt = now();
    await ctx.db.patch(args.logId, {
      clockOut: clockOutAt,
      selfieClockOutStorageId: args.selfieClockOutStorageId,
      locationClockOut: args.locationClockOut,
      updatedAt: clockOutAt,
    });

    await recordAudit(ctx, {
      tableName: "attendance_logs",
      recordId: String(args.logId),
      action: "UPDATE",
      changedBy: identity.subject,
      oldData: log,
      newData: { ...log, clockOut: clockOutAt },
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
  },
  handler: async (ctx, args) => {
    const { identity } = await requireAnyRole(ctx, ["hr_admin"]);
    const settings = await getSettingsDoc(ctx);
    const payload = {
      singleton: "default",
      workStartTime: args.workStartTime,
      workEndTime: args.workEndTime,
      lateThresholdMinutes: args.lateThresholdMinutes,
      halfDayHours: args.halfDayHours,
      autoMarkAbsent: args.autoMarkAbsent,
      requireSelfie: args.requireSelfie,
      requireLocation: args.requireLocation,
      updatedAt: now(),
    };

    if (!settings) {
      const settingsId = await ctx.db.insert("attendanceSettings", {
        ...payload,
        createdAt: now(),
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
