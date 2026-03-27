import { v } from "convex/values";

export const APP_ROLES = ["employee", "manager", "hr_admin", "convex_dev"] as const;
export const LEAVE_REQUEST_STATUSES = ["pending", "approved", "rejected", "cancelled"] as const;
export const ATTENDANCE_STATUSES = ["present", "late", "absent", "half_day", "on_leave"] as const;
export const BIOMETRICS_VENDORS = [
  "zkteco",
  "biotime",
  "suprema",
  "hikvision",
  "generic_webhook",
] as const;
export const NOTIFICATION_TYPES = ["info", "success", "warning", "error"] as const;
export const HALF_DAY_TYPES = ["start", "end", "single"] as const;
export const STORAGE_FILE_CLASSES = ["avatar", "leave_attachment", "attendance_selfie", "policy_document"] as const;

export type AppRole = (typeof APP_ROLES)[number];
export type LeaveRequestStatus = (typeof LEAVE_REQUEST_STATUSES)[number];
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];
export type BiometricsVendor = (typeof BIOMETRICS_VENDORS)[number];
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export type HalfDayType = (typeof HALF_DAY_TYPES)[number];
export type StorageFileClass = (typeof STORAGE_FILE_CLASSES)[number];

export const appRoleValidator = v.union(
  v.literal("employee"),
  v.literal("manager"),
  v.literal("hr_admin"),
  v.literal("convex_dev"),
);

export const leaveRequestStatusValidator = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected"),
  v.literal("cancelled"),
);

export const attendanceStatusValidator = v.union(
  v.literal("present"),
  v.literal("late"),
  v.literal("absent"),
  v.literal("half_day"),
  v.literal("on_leave"),
);

export const biometricsVendorValidator = v.union(
  v.literal("zkteco"),
  v.literal("biotime"),
  v.literal("suprema"),
  v.literal("hikvision"),
  v.literal("generic_webhook"),
);

export const notificationTypeValidator = v.union(
  v.literal("info"),
  v.literal("success"),
  v.literal("warning"),
  v.literal("error"),
);

export const halfDayTypeValidator = v.union(
  v.literal("start"),
  v.literal("end"),
  v.literal("single"),
);

export const storageFileClassValidator = v.union(
  v.literal("avatar"),
  v.literal("leave_attachment"),
  v.literal("attendance_selfie"),
  v.literal("policy_document"),
);

export const locationValidator = v.object({
  lat: v.number(),
  lng: v.number(),
});
