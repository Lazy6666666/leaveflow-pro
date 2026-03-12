import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  appRoleValidator,
  attendanceStatusValidator,
  biometricsVendorValidator,
  halfDayTypeValidator,
  leaveRequestStatusValidator,
  locationValidator,
  notificationTypeValidator,
} from "./constants";

export default defineSchema({
  departments: defineTable({
    name: v.string(),
    createdAt: v.number(),
  }).index("by_name", ["name"]),

  profiles: defineTable({
    userId: v.string(),
    fullName: v.optional(v.string()),
    email: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
    avatarUrl: v.optional(v.string()),
    departmentId: v.optional(v.id("departments")),
    managerUserId: v.optional(v.string()),
    hourlyRate: v.optional(v.number()),
    baseSalary: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_managerUserId", ["managerUserId"])
    .index("by_departmentId", ["departmentId"])
    .index("by_avatarStorageId", ["avatarStorageId"]),

  userRoles: defineTable({
    userId: v.string(),
    role: appRoleValidator,
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_role", ["role"])
    .index("by_userId_role", ["userId", "role"]),

  leaveTypes: defineTable({
    name: v.string(),
    annualAllocation: v.number(),
    carryForwardLimit: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_isActive", ["isActive"]),

  leaveBalances: defineTable({
    employeeId: v.string(),
    leaveTypeId: v.id("leaveTypes"),
    year: v.number(),
    balance: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_employeeId_year", ["employeeId", "year"])
    .index("by_employeeId_leaveType_year", ["employeeId", "leaveTypeId", "year"])
    .index("by_leaveTypeId_year", ["leaveTypeId", "year"]),

  leaveRequests: defineTable({
    employeeId: v.string(),
    leaveTypeId: v.id("leaveTypes"),
    startDate: v.string(),
    endDate: v.string(),
    reason: v.optional(v.string()),
    attachmentStorageId: v.optional(v.id("_storage")),
    attachmentUrl: v.optional(v.string()),
    attachmentName: v.optional(v.string()),
    status: leaveRequestStatusValidator,
    managerComment: v.optional(v.string()),
    halfDayType: v.optional(halfDayTypeValidator),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_employeeId", ["employeeId"])
    .index("by_status", ["status"])
    .index("by_employeeId_status", ["employeeId", "status"])
    .index("by_createdAt", ["createdAt"])
    .index("by_attachmentStorageId", ["attachmentStorageId"]),

  publicHolidays: defineTable({
    name: v.string(),
    date: v.string(),
    description: v.optional(v.string()),
    isRecurring: v.boolean(),
    createdAt: v.number(),
  }).index("by_date", ["date"]),

  attendanceLogs: defineTable({
    employeeId: v.string(),
    date: v.string(),
    clockIn: v.optional(v.number()),
    clockOut: v.optional(v.number()),
    status: attendanceStatusValidator,
    source: v.string(),
    notes: v.optional(v.string()),
    selfieClockInStorageId: v.optional(v.id("_storage")),
    selfieClockOutStorageId: v.optional(v.id("_storage")),
    locationClockIn: v.optional(locationValidator),
    locationClockOut: v.optional(locationValidator),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_employeeId_date", ["employeeId", "date"])
    .index("by_date", ["date"])
    .index("by_employeeId", ["employeeId"])
    .index("by_selfieClockInStorageId", ["selfieClockInStorageId"])
    .index("by_selfieClockOutStorageId", ["selfieClockOutStorageId"]),

  attendanceSettings: defineTable({
    singleton: v.string(),
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
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_singleton", ["singleton"]),

  biometricsConfigs: defineTable({
    vendor: biometricsVendorValidator,
    name: v.string(),
    apiUrl: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    apiSecret: v.optional(v.string()),
    deviceSerial: v.optional(v.string()),
    locationName: v.optional(v.string()),
    syncFrequencyMinutes: v.number(),
    isActive: v.boolean(),
    lastSyncAt: v.optional(v.number()),
    lastSyncStatus: v.optional(v.string()),
    lastSyncRecords: v.optional(v.number()),
    webhookSecret: v.optional(v.string()),
    extraConfig: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_vendor", ["vendor"])
    .index("by_isActive", ["isActive"]),

  badgeMappings: defineTable({
    employeeId: v.string(),
    badgeId: v.string(),
    vendor: v.optional(v.string()),
    vendorKey: v.string(),
    createdAt: v.number(),
  })
    .index("by_employeeId", ["employeeId"])
    .index("by_vendorKey", ["vendorKey"]),

  notifications: defineTable({
    userId: v.string(),
    title: v.string(),
    message: v.string(),
    type: notificationTypeValidator,
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_createdAt", ["userId", "createdAt"])
    .index("by_userId_isRead", ["userId", "isRead"]),

  managerDelegations: defineTable({
    managerId: v.string(),
    delegateId: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_managerId", ["managerId"])
    .index("by_delegateId", ["delegateId"]),

  auditLogs: defineTable({
    tableName: v.string(),
    recordId: v.string(),
    action: v.string(),
    changedBy: v.optional(v.string()),
    oldData: v.optional(v.any()),
    newData: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_tableName", ["tableName"])
    .index("by_createdAt", ["createdAt"]),

  storageFiles: defineTable({
    storageId: v.id("_storage"),
    fileClass: v.union(
      v.literal("avatar"),
      v.literal("leave_attachment"),
      v.literal("attendance_selfie"),
    ),
    ownerUserId: v.string(),
    linkedTable: v.optional(v.string()),
    linkedRecordId: v.optional(v.string()),
    linkedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_storageId", ["storageId"])
    .index("by_ownerUserId", ["ownerUserId"])
    .index("by_ownerUserId_fileClass", ["ownerUserId", "fileClass"]),

  policyDocuments: defineTable({
    title: v.string(),
    content: v.string(),
    embedding: v.array(v.float64()),
    metadata: v.optional(v.any()),
    storageId: v.optional(v.id("_storage")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_title", ["title"])
    .vectorIndex("by_embedding", {
      dimensions: 1024,
      vectorField: "embedding",
      filterFields: ["title"],
    }),
});
