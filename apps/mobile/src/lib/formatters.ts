type AttendanceHistoryItem = {
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
};

type AttendanceSettings = {
  work_start_time: string;
  work_end_time: string;
  require_selfie: boolean;
  require_location: boolean;
  geofence_enabled: boolean;
  geofence_label: string | null;
};

export function formatTimeLabel(isoValue: string | null) {
  if (!isoValue) {
    return "--:--";
  }

  const date = new Date(isoValue);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatDateLabel(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

export function formatWorkWindow(settings: AttendanceSettings | null | undefined) {
  if (!settings) {
    return "Schedule unavailable";
  }

  const start = settings.work_start_time.slice(0, 5);
  const end = settings.work_end_time.slice(0, 5);
  return `${start} - ${end}`;
}

export function formatStatusLabel(status: string | null | undefined) {
  if (!status) {
    return "Ready";
  }

  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatAttendanceSummary(item: AttendanceHistoryItem) {
  const clockIn = formatTimeLabel(item.clock_in);
  const clockOut = item.clock_out ? formatTimeLabel(item.clock_out) : "Active shift";
  return `Clock in ${clockIn} | Clock out ${clockOut}`;
}

export function getRequirementSummary(settings: AttendanceSettings | null | undefined) {
  if (!settings) {
    return "Sign in to load attendance requirements.";
  }

  const parts: string[] = [];

  if (settings.require_selfie) {
    parts.push("Selfie required");
  }

  if (settings.require_location) {
    parts.push("Location required");
  }

  if (settings.geofence_enabled) {
    parts.push(
      settings.geofence_label
        ? `Geofence: ${settings.geofence_label}`
        : "Geofence active",
    );
  }

  if (parts.length === 0) {
    return "No extra capture requirements are enabled.";
  }

  return parts.join(" | ");
}
