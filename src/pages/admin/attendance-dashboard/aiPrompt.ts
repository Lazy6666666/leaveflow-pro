import { format } from "date-fns";

import type { AttendanceLog } from "../attendanceDashboardTypes";

function formatTimestamp(value: string | null) {
  return value ? format(new Date(value), "MMM d, yyyy h:mm a") : "missing";
}

export function buildAttendanceRecordPrompt(log: AttendanceLog) {
  const employeeLabel = log.profiles?.full_name || log.profiles?.email || log.employee_id;
  const shiftLabel = log.shift
    ? `${log.shift.name} (${log.shift.startTime}-${log.shift.endTime})`
    : "No shift assigned";

  return [
    "Review this attendance exception and explain the likely cause, operational risk, and recommended HR follow-up.",
    `Employee: ${employeeLabel}`,
    `Date: ${format(new Date(`${log.date}T00:00:00`), "MMMM d, yyyy")}`,
    `Status: ${log.status.replace(/_/g, " ")}`,
    `Clock in: ${formatTimestamp(log.clock_in)}`,
    `Clock out: ${formatTimestamp(log.clock_out)}`,
    `Shift: ${shiftLabel}`,
    "Include whether this looks like a lateness issue, missing punch, or other anomaly, and mention any likely payroll review impact.",
  ].join("\n");
}
