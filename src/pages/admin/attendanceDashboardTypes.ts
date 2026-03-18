import { format } from "date-fns";

import type { AttendanceLogId, LatLng, StorageId } from "@/lib/convexTypes";

export interface AttendanceLog {
  id: AttendanceLogId;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  selfie_clock_in: StorageId | null;
  selfie_clock_out: StorageId | null;
  location_clock_in: LatLng | null;
  location_clock_out: LatLng | null;
  status: string;
  employee_id: string;
  site_id: string | null;
  site_name: string | null;
  shift: { name: string; startTime: string; endTime: string; gracePeriodMinutes: number | null } | null;
  profiles: { full_name: string | null; email: string | null; department_id: string | null } | null;
}

export interface Department {
  id: string;
  name: string;
}

export interface SiteOption {
  id: string;
  name: string;
}

export interface EmployeeOption {
  id: string;
  full_name: string | null;
  email: string | null;
}

export type AttendanceEditorState = {
  logId?: AttendanceLogId;
  employeeId: string;
  siteId: string;
  date: string;
  clockIn: string;
  clockOut: string;
  status: string;
  source: string;
  notes: string;
};

export function toDateTimeInputValue(value: string | null) {
  return value ? format(new Date(value), "yyyy-MM-dd'T'HH:mm") : "";
}
