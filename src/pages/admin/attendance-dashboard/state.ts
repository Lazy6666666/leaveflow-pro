import type { AttendanceEditorState, AttendanceLog, EmployeeOption } from "../attendanceDashboardTypes";
import { toDateTimeInputValue } from "../attendanceDashboardTypes";

export type EditorDialogPending = "idle" | "saving" | "deleting";

export type EditorDialogState =
  | { type: "closed"; draft: AttendanceEditorState }
  | { type: "open"; draft: AttendanceEditorState; pending: EditorDialogPending };

export function createNewEditorDraft(employees: EmployeeOption[]): AttendanceEditorState {
  return {
    employeeId: employees[0]?.id ?? "",
    siteId: "",
    date: new Date().toISOString().slice(0, 10),
    clockIn: "",
    clockOut: "",
    status: "present",
    source: "manual",
    notes: "",
  };
}

export function createEditEditorDraft(log: AttendanceLog): AttendanceEditorState {
  return {
    logId: log.id,
    employeeId: log.employee_id,
    siteId: log.site_id ?? "",
    date: log.date,
    clockIn: toDateTimeInputValue(log.clock_in),
    clockOut: toDateTimeInputValue(log.clock_out),
    status: log.status,
    source: "manual",
    notes: "",
  };
}
