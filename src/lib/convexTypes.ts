import type { Id } from "../../convex/_generated/dataModel";

export type DepartmentId = Id<"departments">;
export type LeaveTypeId = Id<"leaveTypes">;
export type LeaveBalanceId = Id<"leaveBalances">;
export type LeaveRequestId = Id<"leaveRequests">;
export type PublicHolidayId = Id<"publicHolidays">;
export type AttendanceLogId = Id<"attendanceLogs">;
export type BiometricsConfigId = Id<"biometricsConfigs">;
export type BadgeMappingId = Id<"badgeMappings">;
export type ManagerDelegationId = Id<"managerDelegations">;
export type NotificationId = Id<"notifications">;
export type StorageId = Id<"_storage">;

export type LatLng = {
  lat: number;
  lng: number;
};
