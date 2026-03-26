import { describe, expect, it } from "vitest";

import { buildAttendanceRecordPrompt } from "./aiPrompt";
import type { AttendanceLog } from "../attendanceDashboardTypes";

const baseLog: AttendanceLog = {
  id: "log-1" as never,
  date: "2026-03-18",
  clock_in: "2026-03-18T09:18:00.000Z",
  clock_out: null,
  selfie_clock_in: null,
  selfie_clock_out: null,
  location_clock_in: null,
  location_clock_out: null,
  status: "late",
  employee_id: "emp_123",
  site_id: "site-a",
  site_name: "HQ",
  shift: {
    name: "Morning",
    startTime: "09:00",
    endTime: "17:00",
    gracePeriodMinutes: 10,
  },
  profiles: {
    full_name: "Avery Johnson",
    email: "avery@example.com",
    department_id: null,
  },
};

describe("buildAttendanceRecordPrompt", () => {
  it("includes the key record details for contextual AI review", () => {
    const prompt = buildAttendanceRecordPrompt(baseLog);

    expect(prompt).toContain("Employee: Avery Johnson");
    expect(prompt).toContain("Status: late");
    expect(prompt).toContain("Shift: Morning (09:00-17:00)");
    expect(prompt).toContain("Clock out: missing");
    expect(prompt).toContain("payroll review impact");
  });
});
