import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export type ReaderCtx = QueryCtx | MutationCtx;
export type WriterCtx = MutationCtx;

export type DepartmentDoc = Doc<"departments">;
export type ProfileDoc = Doc<"profiles">;
export type UserRoleDoc = Doc<"userRoles">;
export type LeaveTypeDoc = Doc<"leaveTypes">;
export type LeaveBalanceDoc = Doc<"leaveBalances">;
export type LeaveRequestDoc = Doc<"leaveRequests">;
export type PublicHolidayDoc = Doc<"publicHolidays">;
export type AttendanceLogDoc = Doc<"attendanceLogs">;
export type AttendanceSettingsDoc = Doc<"attendanceSettings">;
export type BiometricsConfigDoc = Doc<"biometricsConfigs">;
export type BadgeMappingDoc = Doc<"badgeMappings">;
export type NotificationDoc = Doc<"notifications">;
export type ManagerDelegationDoc = Doc<"managerDelegations">;
export type AuditLogDoc = Doc<"auditLogs">;
export type StorageFileDoc = Doc<"storageFiles">;
export type PolicyDocumentDoc = Doc<"policyDocuments">;
export type PolicyAcknowledgementDoc = Doc<"policyAcknowledgements">;
export type IntegrationSettingDoc = Doc<"integrationSettings">;

export type DepartmentId = Id<"departments">;
export type LeaveTypeId = Id<"leaveTypes">;
export type LeaveBalanceId = Id<"leaveBalances">;
export type LeaveRequestId = Id<"leaveRequests">;
export type PublicHolidayId = Id<"publicHolidays">;
export type AttendanceLogId = Id<"attendanceLogs">;
export type BiometricsConfigId = Id<"biometricsConfigs">;
export type BadgeMappingId = Id<"badgeMappings">;
export type ManagerDelegationId = Id<"managerDelegations">;
export type StorageId = Id<"_storage">;
export type PolicyDocumentId = Id<"policyDocuments">;
export type PolicyAcknowledgementId = Id<"policyAcknowledgements">;
export type IntegrationSettingId = Id<"integrationSettings">;
