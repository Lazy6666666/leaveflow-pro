import { format } from "date-fns";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { Department, SiteOption } from "../../attendanceDashboardTypes";
import type { AttendanceView } from "../types";

type DashboardHeaderProps = {
  canEditAttendance: boolean;
  departments: Department[];
  deptFilter: string;
  onCreateRecord: () => void;
  setSiteFilter: (value: string) => void;
  setDeptFilter: (value: string) => void;
  setView: (value: AttendanceView) => void;
  siteFilter: string;
  sites: SiteOption[];
  view: AttendanceView;
};

export function DashboardHeader({
  canEditAttendance,
  departments,
  deptFilter,
  onCreateRecord,
  setSiteFilter,
  setDeptFilter,
  setView,
  siteFilter,
  sites,
  view,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">HR Admin</p>
        <h1 className="text-2xl font-serif font-semibold tracking-tight text-foreground">Attendance Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {view === "today" ? format(new Date(), "EEEE, MMMM d, yyyy") : format(new Date(), "MMMM yyyy")}
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        {canEditAttendance && (
          <Button type="button" onClick={onCreateRecord}>
            <Plus className="mr-2 h-4 w-4" />
            Add Record
          </Button>
        )}
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((department) => (
              <SelectItem key={department.id} value={department.id}>
                {department.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={siteFilter} onValueChange={setSiteFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Site" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sites</SelectItem>
            {sites.map((site) => (
              <SelectItem key={site.id} value={site.id}>
                {site.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={view} onValueChange={(next) => setView(next as AttendanceView)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
