import { internalAction as typedInternalAction, mutation as typedMutation, query as typedQuery } from "./_generated/server";
import { internal as typedInternal } from "./_generated/api";
import { v } from "convex/values";

import { attendanceStatusValidator, locationValidator } from "./constants";
import { applySiteScope, assertRequestedSiteInScope, canManageEmployee, getAccessibleSiteIds, now, recordAudit, requireAnyRole, requireDirectAnyRole, requireIdentity, toIso } from "./lib/auth";
import { assertAttendanceSelfieOwnership, getSettingsDoc, linkAttendanceSelfie, parseOptionalTimestamp, serializeSettings, validateManagedAttendanceValues } from "./attendanceHelpers";
import type { AttendanceLogDoc, ProfileDoc } from "./lib/types";

type ConvexBuilder = (config: unknown) => unknown;
type InternalApi = {
  absenceNotifications: { runDailyAttendanceAutomation: unknown };
};

const internalAction = typedInternalAction as unknown as ConvexBuilder;
const mutation = typedMutation as unknown as ConvexBuilder;
const query = typedQuery as unknown as ConvexBuilder;
const internal = typedInternal as unknown as InternalApi;

export const getAdminAttendanceDashboard = query({
  args: {
    view: v.union(v.literal("today"), v.literal("month")),
    siteId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { identity, roles } = await requireAnyRole(ctx, ["manager", "hr_admin"]);
    const accessibleSiteIds = await getAccessibleSiteIds(ctx, identity.subject, roles);
    assertRequestedSiteInScope(args.siteId, accessibleSiteIds);
    const today = new Date();
    const start = args.view === "today"
      ? today.toISOString().slice(0, 10)
      : new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    const end = args.view === "today"
      ? today.toISOString().slice(0, 10)
      : new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

    const logsPromise = args.view === "today"
      ? ctx.db.query("attendanceLogs").withIndex("by_date", (q) => q.eq("date", start)).take(500)
      : ctx.db.query("attendanceLogs").withIndex("by_date", (q) => q.gte("date", start).lte("date", end)).order("desc").take(500);
    const [scopedLogs, departments, allShifts, allRosters, allSites] = await Promise.all([
      logsPromise,
      ctx.db.query("departments").collect(),
      ctx.db.query("shifts").collect(),
      ctx.db.query("shiftRosters").collect(),
      ctx.db.query("sites").collect(),
    ]);
    const filteredLogs = applySiteScope(scopedLogs as AttendanceLogDoc[], accessibleSiteIds, args.siteId);
    const employeeIds = new Set(filteredLogs.map((log) => log.employeeId));
    const profiles = (await ctx.db.query("profiles").collect() as ProfileDoc[])
      .filter((profile) => employeeIds.has(profile.userId));
    const profilesByUserId = new Map<string, ProfileDoc>(
      profiles.map((profile) => [profile.userId, profile]),
    );
    const visibleSites = accessibleSiteIds
      ? allSites.filter((site) => accessibleSiteIds.includes(String(site._id)))
      : allSites;
    const siteNamesById = new Map(visibleSites.map((site) => [String(site._id), site.name] as const));

    return {
      departments: departments.map((department) => ({ id: department._id, name: department.name })),
      sites: visibleSites.map((site) => ({ id: String(site._id), name: site.name })),
      logs: filteredLogs.map((log) => {
        const profile = profilesByUserId.get(log.employeeId);
        
        // Resolve Shift
        const roster = allRosters.find(r => 
          r.employeeId === log.employeeId && 
          r.effectiveFrom <= log.date && 
          (!r.effectiveTo || r.effectiveTo >= log.date)
        );
        const shift = roster ? allShifts.find(s => s._id === roster.shiftId) : null;

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
          site_id: log.siteId ?? null,
          site_name: log.siteId ? siteNamesById.get(log.siteId) ?? null : null,
          shift: shift
            ? {
                name: shift.name,
                startTime: shift.startTime,
                endTime: shift.endTime,
                gracePeriodMinutes: shift.gracePeriodMinutes ?? null,
              }
            : null,
          profiles: profile
            ? {
                full_name: profile.fullName ?? null,
                email: profile.email ?? null,
                department_id: profile.departmentId ?? null,
              }
            : null,
        };
      }),
    };
  },
});

export const getAttendanceSettings = query({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx);
    return serializeSettings(await getSettingsDoc(ctx));
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
    siteId: v.optional(v.string()),
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
    validateManagedAttendanceValues({ date: args.date, clockIn, clockOut });

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
        siteId: args.siteId,
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
      siteId: args.siteId ?? existing.siteId,
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
  args: { logId: v.id("attendanceLogs") },
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

export const getTrustReviewQueue = query({
  args: {},
  handler: async (ctx) => {
    const { identity, roles } = await requireAnyRole(ctx, ["hr_admin", "manager"]);
    const accessibleSiteIds = await getAccessibleSiteIds(ctx, identity.subject, roles);
    
    // Fetch logs that are unverified or flagged
    const unscopedLogs = await ctx.db
      .query("attendanceLogs")
      .withIndex("by_trustState")
      .filter((q) => 
        q.or(
          q.eq(q.field("trustState"), "unverified"),
          q.eq(q.field("trustState"), "flagged")
        )
      )
      .order("desc")
      .collect();
    const logs = applySiteScope(unscopedLogs as AttendanceLogDoc[], accessibleSiteIds);

    // Join with profiles
    const employeeIds = new Set(logs.map((log) => log.employeeId));
    const profiles = (await ctx.db.query("profiles").collect() as ProfileDoc[])
      .filter((profile) => employeeIds.has(profile.userId));
    const profilesByUserId = new Map<string, ProfileDoc>(
      profiles.map((profile) => [profile.userId, profile]),
    );

    return logs.map((log) => {
      const profile = profilesByUserId.get(log.employeeId);
      return {
        id: log._id,
        employeeName: profile?.fullName || profile?.email || "Unknown",
        employeeEmail: profile?.email ?? null,
        date: log.date,
        clock_in: toIso(log.clockIn),
        clock_out: toIso(log.clockOut),
        selfie_clock_in: log.selfieClockInStorageId ?? null,
        selfie_clock_out: log.selfieClockOutStorageId ?? null,
        location_clock_in: log.locationClockIn ?? null,
        location_clock_out: log.locationClockOut ?? null,
        status: log.status,
        trustState: log.trustState,
        reviewNotes: log.reviewNotes,
      };
    });
  },
});

export const setTrustState = mutation({
  args: {
    logId: v.id("attendanceLogs"),
    trustState: v.union(v.literal("verified"), v.literal("flagged"), v.literal("unverified")),
    reviewNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const authz = await requireAnyRole(ctx, ["hr_admin", "manager"]);
    const reviewerSubject = authz.identity.subject;
    const accessibleSiteIds = await getAccessibleSiteIds(ctx, reviewerSubject, authz.roles);
    const existing = await ctx.db.get(args.logId);
    
    if (!existing) {
      throw new Error("Attendance log not found");
    }
    assertRequestedSiteInScope(existing.siteId, accessibleSiteIds);

    const timestamp = now();
    const nextState = {
      ...existing,
      trustState: args.trustState,
      reviewedBy: reviewerSubject,
      reviewedAt: timestamp,
      reviewNotes: args.reviewNotes,
    };

    await ctx.db.patch(args.logId, {
      trustState: args.trustState,
      reviewedBy: reviewerSubject,
      reviewedAt: timestamp,
      reviewNotes: args.reviewNotes,
      updatedAt: timestamp,
    });

    await recordAudit(ctx, {
      tableName: "attendance_logs",
      recordId: String(args.logId),
      action: "UPDATE",
      changedBy: reviewerSubject,
      oldData: existing,
      newData: nextState,
    });

    return { ok: true };
  },
});
