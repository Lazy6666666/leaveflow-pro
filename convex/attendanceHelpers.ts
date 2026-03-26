import { toIso } from "./lib/auth";
import { assertStorageFileOwnership, linkStorageFile } from "./lib/storage";
import { findMatchingSiteGeofence, getDistanceMeters, hasConfiguredSiteGeofence } from "./siteScope";

import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { AttendanceLogDoc, AttendanceSettingsDoc } from "./lib/types";

export async function getSettingsDoc(ctx: QueryCtx | MutationCtx): Promise<AttendanceSettingsDoc | null> {
  return await ctx.db.query("attendanceSettings").withIndex("by_singleton", (q) => q.eq("singleton", "default")).unique();
}

export function defaultSettings() {
  return {
    work_start_time: "09:00:00",
    work_end_time: "17:00:00",
    late_threshold_minutes: 15,
    half_day_hours: 4,
    auto_mark_absent: true,
    require_selfie: true,
    require_location: false,
    geofence_enabled: false,
    geofence_center: null,
    geofence_radius_meters: 150,
    geofence_label: null,
  };
}

export function serializeSettings(settings: AttendanceSettingsDoc | null) {
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

export function serializeAttendanceLog(log: AttendanceLogDoc) {
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
    site_id: log.siteId ?? null,
  };
}

function parseDateKey(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Date must be in YYYY-MM-DD format");
  }

  return date;
}

export function parseOptionalTimestamp(value?: string) {
  if (!value) {
    return undefined;
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    throw new Error("Invalid attendance timestamp");
  }

  return parsed;
}

export function validateManagedAttendanceValues(input: { date: string; clockIn?: number; clockOut?: number }) {
  parseDateKey(input.date);
  if (input.clockIn && input.clockOut && input.clockOut < input.clockIn) {
    throw new Error("Clock-out time must be after clock-in time");
  }
}

export async function assertAttendanceSelfieOwnership(
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

export async function linkAttendanceSelfie(
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

export async function assertAttendanceRequirements(
  ctx: QueryCtx | MutationCtx,
  settings: ReturnType<typeof serializeSettings>,
  action: "clock_in" | "clock_out",
  input: {
    selfieStorageId?: string;
    location?: { lat: number; lng: number };
  },
) {
  const activeSites = action === "clock_in"
    ? await ctx.db.query("sites").withIndex("by_isActive", (q) => q.eq("isActive", true)).collect()
    : [];
  const siteGeofences = activeSites.filter(hasConfiguredSiteGeofence);
  const matchingSite = findMatchingSiteGeofence(activeSites, input.location);
  const requiresLocationForAction = requiresLocation(settings) || (action === "clock_in" && siteGeofences.length > 0);

  if (settings.require_selfie && !input.selfieStorageId) {
    throw new Error("A selfie is required for this attendance action");
  }

  if (requiresLocationForAction && !input.location) {
    throw new Error("Location is required for this attendance action");
  }

  if (action !== "clock_in") {
    return { siteId: undefined as string | undefined };
  }

  if (siteGeofences.length > 0) {
    if (!matchingSite) {
      throw new Error("You must be within an approved site geofence before clocking in.");
    }

    return { siteId: String(matchingSite._id) };
  }

  if (!settings.geofence_enabled) {
    return { siteId: matchingSite ? String(matchingSite._id) : undefined };
  }

  if (!settings.geofence_center || !settings.geofence_radius_meters || settings.geofence_radius_meters <= 0) {
    throw new Error("Attendance geofencing is not configured. Please contact HR.");
  }

  const distanceMeters = getDistanceMeters(input.location!, settings.geofence_center);
  if (distanceMeters <= settings.geofence_radius_meters) {
    return { siteId: matchingSite ? String(matchingSite._id) : undefined };
  }

  const locationLabel = settings.geofence_label?.trim() || "the approved work site";
  throw new Error(
    `You must be within ${Math.round(settings.geofence_radius_meters)} meters of ${locationLabel}. Current distance: ${Math.round(distanceMeters)} meters.`,
  );
}

/**
 * Calculates the attendance status based on shift timings and grace periods.
 */
export function calculateAttendanceStatus(
  settings: ReturnType<typeof serializeSettings>,
  shift: { startTime: string; gracePeriodMinutes: number } | null,
  clockInTimestamp: number,
) {
  if (!shift) {
    // Fallback to default settings if no specific shift is assigned
    const [h, m] = settings.work_start_time.split(":").map(Number);
    const workStart = new Date(clockInTimestamp);
    workStart.setHours(h, m, 0, 0);
    
    const diffMinutes = (clockInTimestamp - workStart.getTime()) / (1000 * 60);
    
    if (diffMinutes > settings.late_threshold_minutes) {
      return "late";
    }
    return "present";
  }

  // Use shift-specific start time and grace period
  const [h, m] = shift.startTime.split(":").map(Number);
  const workStart = new Date(clockInTimestamp);
  workStart.setHours(h, m, 0, 0);

  const diffMinutes = (clockInTimestamp - workStart.getTime()) / (1000 * 60);

  if (diffMinutes > shift.gracePeriodMinutes) {
    return "late";
  }
  return "present";
}
