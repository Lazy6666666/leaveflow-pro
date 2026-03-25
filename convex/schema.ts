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

  recruitmentJobs: defineTable({
    title: v.string(),
    departmentId: v.optional(v.id("departments")),
    location: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("open"), v.literal("closed")),
    description: v.optional(v.string()),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_departmentId", ["departmentId"]),

  recruitmentCandidates: defineTable({
    fullName: v.string(),
    email: v.string(),
    jobId: v.id("recruitmentJobs"),
    stage: v.union(
      v.literal("applied"),
      v.literal("screening"),
      v.literal("interview"),
      v.literal("offer"),
      v.literal("hired"),
      v.literal("rejected"),
    ),
    notes: v.optional(v.string()),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_jobId", ["jobId"])
    .index("by_stage", ["stage"])
    .index("by_jobId_stage", ["jobId", "stage"]),

  onboardingTemplates: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    tasks: v.array(v.object({ id: v.string(), title: v.string() })),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_name", ["name"]),

  onboardingAssignments: defineTable({
    templateId: v.id("onboardingTemplates"),
    assigneeUserId: v.string(),
    managerUserId: v.optional(v.string()),
    status: v.union(v.literal("not_started"), v.literal("in_progress"), v.literal("completed")),
    tasks: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        completedAt: v.optional(v.number()),
      }),
    ),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_assigneeUserId", ["assigneeUserId"])
    .index("by_templateId", ["templateId"])
    .index("by_status", ["status"]),

  performanceReviewCycles: defineTable({
    name: v.string(),
    status: v.union(v.literal("draft"), v.literal("active"), v.literal("closed")),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_status", ["status"]),

  performanceReviewAssignments: defineTable({
    cycleId: v.id("performanceReviewCycles"),
    employeeUserId: v.string(),
    managerUserId: v.optional(v.string()),
    status: v.string(),
    rating: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_cycleId", ["cycleId"])
    .index("by_employeeUserId", ["employeeUserId"])
    .index("by_status", ["status"]),

  trainingCourses: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    required: v.boolean(),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_name", ["name"]),

  trainingAssignments: defineTable({
    courseId: v.id("trainingCourses"),
    employeeUserId: v.string(),
    status: v.string(),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_courseId", ["courseId"])
    .index("by_employeeUserId", ["employeeUserId"])
    .index("by_status", ["status"]),

  certificationRecords: defineTable({
    employeeUserId: v.string(),
    name: v.string(),
    issuedOn: v.string(),
    expiresOn: v.string(),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_employeeUserId", ["employeeUserId"])
    .index("by_expiresOn", ["expiresOn"]),

  expenses: defineTable({
    employeeUserId: v.string(),
    category: v.union(
      v.literal("travel"),
      v.literal("meals"),
      v.literal("lodging"),
      v.literal("supplies"),
      v.literal("client"),
      v.literal("mileage"),
      v.literal("other"),
    ),
    title: v.string(),
    amount: v.number(),
    currency: v.string(),
    expenseDate: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    reviewerUserId: v.optional(v.string()),
    reviewerComment: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_employeeUserId", ["employeeUserId"])
    .index("by_status", ["status"])
    .index("by_employeeUserId_status", ["employeeUserId", "status"])
    .index("by_expenseDate", ["expenseDate"]),

  expenseApprovalRecords: defineTable({
    expenseId: v.id("expenses"),
    action: v.union(v.literal("approved"), v.literal("rejected")),
    actedByUserId: v.string(),
    comment: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_expenseId", ["expenseId"])
    .index("by_actedByUserId", ["actedByUserId"]),

  policyAcknowledgements: defineTable({
    policyDocumentId: v.id("policyDocuments"),
    policyTitle: v.string(),
    assigneeUserId: v.string(),
    assignedByUserId: v.string(),
    status: v.union(v.literal("pending"), v.literal("acknowledged")),
    note: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    assignedAt: v.number(),
    acknowledgedAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_assigneeUserId", ["assigneeUserId"])
    .index("by_status", ["status"])
    .index("by_policyDocumentId", ["policyDocumentId"])
    .index("by_assigneeUserId_policyDocumentId", ["assigneeUserId", "policyDocumentId"]),

  integrationSettings: defineTable({
    providerKey: v.string(),
    enabled: v.boolean(),
    status: v.union(v.literal("not_configured"), v.literal("attention"), v.literal("connected")),
    configSummary: v.optional(v.string()),
    lastCheckedAt: v.optional(v.number()),
    updatedByUserId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_providerKey", ["providerKey"])
    .index("by_status", ["status"]),

  profiles: defineTable({
    userId: v.string(),
    fullName: v.optional(v.string()),
    email: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
    avatarUrl: v.optional(v.string()),
    departmentId: v.optional(v.id("departments")),
    siteId: v.optional(v.id("sites")),
    managerUserId: v.optional(v.string()),
    hourlyRate: v.optional(v.number()),
    baseSalary: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_managerUserId", ["managerUserId"])
    .index("by_siteId", ["siteId"])
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
    .index("by_status_startDate", ["status", "startDate"])
    .index("by_employeeId_status_startDate", ["employeeId", "status", "startDate"])
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
    offlineSyncId: v.optional(v.string()),
    selfieClockInStorageId: v.optional(v.id("_storage")),
    selfieClockOutStorageId: v.optional(v.id("_storage")),
    locationClockIn: v.optional(locationValidator),
    locationClockOut: v.optional(locationValidator),
    trustState: v.optional(v.union(
      v.literal("unverified"),
      v.literal("supervised"),
      v.literal("flagged"),
      v.literal("verified")
    )),
    reviewedBy: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
    reviewNotes: v.optional(v.string()),
    siteId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_trustState", ["trustState"])
    .index("by_employeeId_date", ["employeeId", "date"])
    .index("by_date", ["date"])
    .index("by_employeeId", ["employeeId"])
    .index("by_offlineSyncId", ["offlineSyncId"])
    .index("by_selfieClockInStorageId", ["selfieClockInStorageId"])
    .index("by_selfieClockOutStorageId", ["selfieClockOutStorageId"]),

  offlineQueuedLogs: defineTable({
    employeeId: v.string(),
    offlineSyncId: v.string(),
    eventType: v.union(v.literal("clock_in"), v.literal("clock_out")),
    timestamp: v.number(),
    selfieStorageId: v.optional(v.id("_storage")),
    locationData: v.optional(locationValidator),
    replayStatus: v.union(v.literal("pending"), v.literal("replayed"), v.literal("failed")),
    replayedAt: v.optional(v.number()),
    failureReason: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_employeeId_status", ["employeeId", "replayStatus"]),

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
    siteId: v.optional(v.string()),
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
    siteId: v.optional(v.string()),
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

  analyticsEvents: defineTable({
    eventName: v.string(),
    sessionId: v.string(),
    userId: v.optional(v.string()),
    roleScope: v.optional(v.string()),
    path: v.optional(v.string()),
    surface: v.string(),
    properties: v.optional(v.any()),
    timestamp: v.string(),
    createdAt: v.number(),
  })
    .index("by_eventName", ["eventName"])
    .index("by_createdAt", ["createdAt"])
    .index("by_userId_createdAt", ["userId", "createdAt"])
    .index("by_sessionId_createdAt", ["sessionId", "createdAt"]),

  assistantRateLimits: defineTable({
    userId: v.string(),
    scope: v.union(v.literal("assistant_chat"), v.literal("assistant_tool")),
    count: v.number(),
    windowStartedAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId_scope", ["userId", "scope"]),

  backendIncidents: defineTable({
    source: v.string(),
    message: v.string(),
    severity: v.union(v.literal("error"), v.literal("warning"), v.literal("info")),
    details: v.optional(v.any()),
    fingerprint: v.optional(v.array(v.string())),
    createdAt: v.number(),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_source", ["source"]),

  httpRateLimits: defineTable({
    bucketKey: v.string(),
    scope: v.union(
      v.literal("biometrics_webhook_ip"),
      v.literal("biometrics_webhook_replay"),
      v.literal("clerk_onboarding_ip"),
      v.literal("clerk_onboarding_replay"),
    ),
    count: v.number(),
    windowStartedAt: v.number(),
    updatedAt: v.number(),
  }).index("by_bucketKey_scope", ["bucketKey", "scope"]),

  storageFiles: defineTable({
    storageId: v.id("_storage"),
    fileClass: v.union(
      v.literal("avatar"),
      v.literal("leave_attachment"),
      v.literal("attendance_selfie"),
      v.literal("policy_document"),
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

  shifts: defineTable({
    name: v.string(),
    startTime: v.string(),           // "HH:MM"
    endTime: v.string(),             // "HH:MM"
    gracePeriodMinutes: v.number(),
    overtimeThresholdMinutes: v.number(),
    workDays: v.array(v.number()),   // 0=Sun ... 6=Sat
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_isActive", ["isActive"]),

  shiftRosters: defineTable({
    employeeId: v.string(),
    shiftId: v.id("shifts"),
    effectiveFrom: v.string(),
    effectiveTo: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_employeeId", ["employeeId"]).index("by_shiftId", ["shiftId"]),

  weeklyOffRules: defineTable({
    scope: v.union(v.literal("employee"), v.literal("department")),
    scopeId: v.string(),            // employeeId or departmentId
    offDays: v.array(v.number()),   // day numbers to treat as off
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_scopeId", ["scopeId"]),

  attendanceExceptions: defineTable({
    logId: v.id("attendanceLogs"),
    employeeId: v.string(),
    exceptionType: v.union(
      v.literal("late"), v.literal("half_day"), v.literal("absent"),
      v.literal("overtime"), v.literal("missed_punch")
    ),
    autoDetected: v.boolean(),
    resolvedAt: v.optional(v.number()),
    resolvedBy: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_employeeId", ["employeeId"]).index("by_logId", ["logId"]),

  payrollPeriods: defineTable({
    startDate: v.string(),
    endDate: v.string(),
    status: v.union(v.literal("open"), v.literal("locked")),
    lockedAt: v.optional(v.number()),
    lockedBy: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_status", ["status"]).index("by_startDate", ["startDate"]),

  payrollExceptions: defineTable({
    periodId: v.id("payrollPeriods"),
    employeeId: v.string(),
    exceptionType: v.string(),
    description: v.string(),
    resolvedAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_periodId", ["periodId"]).index("by_employeeId", ["employeeId"]),

  payrollExports: defineTable({
    periodId: v.optional(v.id("payrollPeriods")),
    startDate: v.string(),
    endDate: v.string(),
    siteId: v.optional(v.string()),
    exportedBy: v.string(),
    format: v.union(v.literal("csv")),
    fileName: v.string(),
    rowCount: v.number(),
    totalGrossPay: v.number(),
    createdAt: v.number(),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_periodId", ["periodId"])
    .index("by_siteId", ["siteId"]),

  sites: defineTable({
    name: v.string(),
    address: v.optional(v.string()),
    geofenceCenter: v.optional(locationValidator),
    geofenceRadiusMeters: v.optional(v.number()),
    timezone: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_isActive", ["isActive"]),

  siteSupervisors: defineTable({
    siteId: v.id("sites"),
    userId: v.string(),
    createdAt: v.number(),
  }).index("by_siteId", ["siteId"]).index("by_userId", ["userId"]),

  faceEnrollments: defineTable({
    employeeId: v.string(),
    storageId: v.id("_storage"),
    enrolledAt: v.number(),
    status: v.union(v.literal("pending"), v.literal("active"), v.literal("revoked")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_employeeId", ["employeeId"]).index("by_status", ["status"]),

  verificationResults: defineTable({
    attendanceLogId: v.id("attendanceLogs"),
    confidence: v.number(),
    result: v.union(v.literal("match"), v.literal("no_match"), v.literal("manual")),
    processedAt: v.number(),
    createdAt: v.number(),
  }).index("by_attendanceLogId", ["attendanceLogId"]),

  payrollMappingConfig: defineTable({
    singleton: v.string(),
    overtimeThresholdHours: v.number(),
    overtimeMultiplier: v.number(),
    defaultCurrency: v.string(),
    payPeriod: v.union(v.literal("monthly"), v.literal("biweekly"), v.literal("weekly")),
    deductUnpaidLeaveFromGross: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_singleton", ["singleton"]),
});
