import { useCallback, useEffect, useState } from "react";

import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";

import type { AttendanceLog, Department, EmployeeOption, SiteOption } from "../../attendanceDashboardTypes";
import type { AttendanceView } from "../types";

export function useAttendanceDashboardData(view: AttendanceView, siteId: string) {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchLogs = async () => {
      setLoading(true);
      const [data, employeesData] = await Promise.all([
        convex.query(api.attendance.getAdminAttendanceDashboard, { view, siteId: siteId || undefined }),
        convex.query(api.admin.getEmployeesData, {}),
      ]);
      if (cancelled) return;
      setDepartments(data.departments as Department[]);
      setSites((data.sites as SiteOption[]) || []);
      setLogs((data.logs as AttendanceLog[]) || []);
      setEmployees((employeesData.employees as EmployeeOption[]) || []);
      setLoading(false);
    };
    void fetchLogs();
    return () => {
      cancelled = true;
    };
  }, [siteId, view]);

  const refreshAttendance = useCallback(async () => {
    const data = await convex.query(api.attendance.getAdminAttendanceDashboard, { view, siteId: siteId || undefined });
    setDepartments(data.departments as Department[]);
    setSites((data.sites as SiteOption[]) || []);
    setLogs((data.logs as AttendanceLog[]) || []);
  }, [siteId, view]);

  return { departments, employees, loading, logs, refreshAttendance, sites };
}
