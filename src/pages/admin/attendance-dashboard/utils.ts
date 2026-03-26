import { format } from "date-fns";

import type { AttendanceLog } from "../attendanceDashboardTypes";
import type { BadgeVariant } from "./types";

export function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getStatusBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case "present":
      return "default";
    case "late":
      return "destructive";
    case "absent":
      return "secondary";
    default:
      return "outline";
  }
}

export function getShiftCompliance(
  log: AttendanceLog,
): { label: string; variant: BadgeVariant; title: string } {
  if (!log.shift) return { label: "No shift", variant: "outline", title: "No shift assigned" };

  const shift = log.shift;
  const gracePeriodMinutes = shift.gracePeriodMinutes ?? 15;
  const shiftTitle = `Shift: ${shift.name} (${shift.startTime}-${shift.endTime}), grace ${gracePeriodMinutes}m`;

  const shiftStart = new Date(`${log.date}T${shift.startTime}:00`);
  const shiftEnd = new Date(`${log.date}T${shift.endTime}:00`);
  if (shiftEnd <= shiftStart) {
    shiftEnd.setDate(shiftEnd.getDate() + 1);
  }

  const clockIn = log.clock_in ? new Date(log.clock_in) : null;
  const clockOut = log.clock_out ? new Date(log.clock_out) : null;
  const clockInMs = clockIn ? clockIn.getTime() : null;
  const clockOutMs = clockOut ? clockOut.getTime() : null;

  const actualTitleParts: string[] = [];
  if (clockIn) actualTitleParts.push(`In: ${format(clockIn, "HH:mm")}`);
  if (clockOut) actualTitleParts.push(`Out: ${format(clockOut, "HH:mm")}`);
  const actualTitle = actualTitleParts.length ? `Actual: ${actualTitleParts.join(" / ")}` : "Actual: (missing)";

  const lateMin = clockInMs == null ? null : Math.max(0, Math.round((clockInMs - shiftStart.getTime()) / 60000));
  const earlyMin = clockOutMs == null ? null : Math.max(0, Math.round((shiftEnd.getTime() - clockOutMs) / 60000));

  if (clockInMs == null && clockOutMs == null) {
    return { label: `${shift.name}: missing`, variant: "secondary", title: `${shiftTitle} | ${actualTitle}` };
  }
  if (clockInMs == null) {
    return { label: `${shift.name}: missing in`, variant: "secondary", title: `${shiftTitle} | ${actualTitle}` };
  }
  if (clockOutMs == null) {
    return { label: `${shift.name}: missing out`, variant: "secondary", title: `${shiftTitle} | ${actualTitle}` };
  }

  if ((lateMin ?? 0) > gracePeriodMinutes) {
    return { label: `${shift.name}: late +${lateMin}m`, variant: "destructive", title: `${shiftTitle} | ${actualTitle}` };
  }
  if ((lateMin ?? 0) > 0) {
    return { label: `${shift.name}: late ${lateMin}m`, variant: "secondary", title: `${shiftTitle} | ${actualTitle}` };
  }
  if ((earlyMin ?? 0) > 0) {
    return { label: `${shift.name}: early ${earlyMin}m`, variant: "secondary", title: `${shiftTitle} | ${actualTitle}` };
  }

  return { label: `${shift.name}: on time`, variant: "default", title: `${shiftTitle} | ${actualTitle}` };
}

