import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { AlertTriangle, BarChart3, Camera, Clock, MapPin, Pencil, Plus, Trash2, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { SelfieLightbox } from "@/components/attendance/SelfieLightbox";
import type { AttendanceLogId, LatLng, StorageId } from "@/lib/convexTypes";
import { getErrorMessage } from "@/lib/errors";
import { toast } from "sonner";

interface AttendanceLog {
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
  profiles: { full_name: string | null; email: string | null; department_id: string | null } | null;
}

interface Department {
  id: string;
  name: string;
}

interface EmployeeOption {
  id: string;
  full_name: string | null;
  email: string | null;
}

type AttendanceEditorState = {
  logId?: AttendanceLogId;
  employeeId: string;
  date: string;
  clockIn: string;
  clockOut: string;
  status: string;
  source: string;
  notes: string;
};

function toDateTimeInputValue(value: string | null) {
  return value ? format(new Date(value), "yyyy-MM-dd'T'HH:mm") : "";
}

const AttendanceDashboard = () => {
  const { hasExplicitRole } = useAuth();
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"today" | "month">("today");
  const [deptFilter, setDeptFilter] = useState("all");
  const [lightboxPath, setLightboxPath] = useState<StorageId | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorSaving, setEditorSaving] = useState(false);
  const [editorDeleting, setEditorDeleting] = useState(false);
  const [editorState, setEditorState] = useState<AttendanceEditorState>({
    employeeId: "",
    date: new Date().toISOString().slice(0, 10),
    clockIn: "",
    clockOut: "",
    status: "present",
    source: "manual",
    notes: "",
  });

  const canEditAttendance = hasExplicitRole("hr_admin");

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const [data, employeesData] = await Promise.all([
        convex.query(api.attendance.getAdminAttendanceDashboard, { view }),
        convex.query(api.admin.getEmployeesData, {}),
      ]);
      setDepartments(data.departments as Department[]);
      setLogs((data.logs as AttendanceLog[]) || []);
      setEmployees((employeesData.employees as EmployeeOption[]) || []);
      setLoading(false);
    };
    fetchLogs();
  }, [view]);

  const filteredLogs = deptFilter === "all"
    ? logs
    : logs.filter(l => l.profiles?.department_id === deptFilter);

  const stats = {
    total: filteredLogs.length,
    present: filteredLogs.filter(l => l.status === "present").length,
    late: filteredLogs.filter(l => l.status === "late").length,
    absent: filteredLogs.filter(l => l.status === "absent").length,
  };

  const chartData = [
    { name: "Present", value: stats.present, color: "hsl(var(--foreground))" },
    { name: "Late", value: stats.late, color: "hsl(var(--muted-foreground))" },
    { name: "Absent", value: stats.absent, color: "hsl(var(--border))" },
  ];

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "present": return "default";
      case "late": return "destructive";
      case "absent": return "secondary";
      default: return "outline";
    }
  };

  // Find employees with unapproved absences (absent but no approved leave)
  const lateArrivals = view === "today"
    ? filteredLogs.filter(l => l.status === "late")
    : [];

  const updateEditorState = <K extends keyof AttendanceEditorState>(key: K, value: AttendanceEditorState[K]) => {
    setEditorState((current) => ({ ...current, [key]: value }));
  };

  const resetEditor = () => {
    setEditorState({
      employeeId: employees[0]?.id ?? "",
      date: new Date().toISOString().slice(0, 10),
      clockIn: "",
      clockOut: "",
      status: "present",
      source: "manual",
      notes: "",
    });
  };

  const openCreate = () => {
    resetEditor();
    setEditorOpen(true);
  };

  const openEdit = (log: AttendanceLog) => {
    setEditorState({
      logId: log.id,
      employeeId: log.employee_id,
      date: log.date,
      clockIn: toDateTimeInputValue(log.clock_in),
      clockOut: toDateTimeInputValue(log.clock_out),
      status: log.status,
      source: "manual",
      notes: "",
    });
    setEditorOpen(true);
  };

  const refreshDashboard = async () => {
    const data = await convex.query(api.attendance.getAdminAttendanceDashboard, { view });
    setDepartments(data.departments as Department[]);
    setLogs((data.logs as AttendanceLog[]) || []);
  };

  const handleSave = async () => {
    if (!editorState.employeeId || !editorState.date) {
      toast.error("Employee and date are required");
      return;
    }

    setEditorSaving(true);
    try {
      await convex.mutation(api.attendance.saveManagedAttendanceLog, {
        logId: editorState.logId,
        employeeId: editorState.employeeId,
        date: editorState.date,
        clockIn: editorState.clockIn ? new Date(editorState.clockIn).toISOString() : undefined,
        clockOut: editorState.clockOut ? new Date(editorState.clockOut).toISOString() : undefined,
        status: editorState.status as "present" | "late" | "absent" | "half_day" | "on_leave",
        source: editorState.source.trim() || undefined,
        notes: editorState.notes.trim() || undefined,
      });
      await refreshDashboard();
      setEditorOpen(false);
      toast.success(editorState.logId ? "Attendance record updated" : "Attendance record created");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save attendance record"));
    } finally {
      setEditorSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editorState.logId) {
      return;
    }

    setEditorDeleting(true);
    try {
      await convex.mutation(api.attendance.deleteAttendanceLog, { logId: editorState.logId });
      await refreshDashboard();
      setEditorOpen(false);
      toast.success("Attendance record deleted");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete attendance record"));
    } finally {
      setEditorDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">HR Admin</p>
          <h1 className="text-2xl font-serif font-semibold tracking-tight text-foreground">
            Attendance Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {view === "today" ? format(new Date(), "EEEE, MMMM d, yyyy") : format(new Date(), "MMMM yyyy")}
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {canEditAttendance && (
            <Button type="button" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Record
            </Button>
          )}
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(d => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={view} onValueChange={(v) => setView(v as "today" | "month")}>
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

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Total Records</p>
            <p className="text-3xl font-semibold tabular-nums text-foreground">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Present</p>
            <p className="text-3xl font-semibold tabular-nums text-foreground">{stats.present}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Late</p>
            <p className="text-3xl font-semibold tabular-nums text-foreground">{stats.late}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Absent</p>
            <p className="text-3xl font-semibold tabular-nums text-muted-foreground">{stats.absent}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.total === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No data available</p>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Late Arrivals / Recent Logs */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
              {view === "today" && lateArrivals.length > 0 ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Late Arrivals
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  Recent Records
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
            ) : filteredLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No records found.</p>
            ) : (
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {(view === "today" && lateArrivals.length > 0 ? lateArrivals : filteredLogs.slice(0, 20)).map((log) => (
                  <div key={log.id} className="flex items-center gap-3 py-2.5 border-b border-border/40 last:border-0">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                        {getInitials(log.profiles?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">
                        {log.profiles?.full_name || log.profiles?.email || "Unknown"}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap mt-1">
                        <Clock className="h-3 w-3" />
                        <span>In: {log.clock_in ? format(new Date(log.clock_in), "h:mm a") : "—"}</span>
                        {log.selfie_clock_in && (
                          <div title="View clock-in selfie" className="ml-0.5 inline-flex items-center">
                            <Camera
                              className="h-3 w-3 text-primary cursor-pointer hover:opacity-80"
                              onClick={() => setLightboxPath(log.selfie_clock_in)}
                            />
                          </div>
                        )}

                        {log.location_clock_in && (
                          <a
                            href={`https://www.google.com/maps?q=${log.location_clock_in.lat},${log.location_clock_in.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View clock-in location"
                            className="ml-0.5 inline-flex items-center text-primary hover:opacity-80"
                          >
                            <MapPin className="h-3 w-3" />
                          </a>
                        )}

                        {log.clock_out && (
                          <>
                            <span className="mx-1 opacity-50">|</span>
                            <span>Out: {format(new Date(log.clock_out), "h:mm a")}</span>
                            {log.selfie_clock_out && (
                              <div title="View clock-out selfie" className="ml-0.5 inline-flex items-center">
                                <Camera
                                  className="h-3 w-3 text-primary cursor-pointer hover:opacity-80"
                                  onClick={() => setLightboxPath(log.selfie_clock_out)}
                                />
                              </div>
                            )}

                            {log.location_clock_out && (
                              <a
                                href={`https://www.google.com/maps?q=${log.location_clock_out.lat},${log.location_clock_out.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="View clock-out location"
                                className="ml-0.5 inline-flex items-center text-primary hover:opacity-80"
                              >
                                <MapPin className="h-3 w-3" />
                              </a>
                            )}
                          </>
                        )}

                        {view === "month" && (
                          <span className="ml-2 font-medium">{format(new Date(log.date + "T00:00:00"), "MMM d")}</span>
                        )}
                      </div>
                    </div>
                    <Badge variant={statusColor(log.status)} className="capitalize text-xs">
                      {log.status.replace("_", " ")}
                    </Badge>
                    {canEditAttendance && (
                      <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(log)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <SelfieLightbox
        path={lightboxPath}
        onClose={() => setLightboxPath(null)}
      />

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editorState.logId ? "Edit Attendance Record" : "Create Attendance Record"}</DialogTitle>
            <DialogDescription>
              Update attendance safely without changing the existing dashboard flow.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select
                value={editorState.employeeId}
                onValueChange={(value) => updateEditorState("employeeId", value)}
                disabled={!!editorState.logId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.full_name || employee.email || employee.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={editorState.date}
                onChange={(event) => updateEditorState("date", event.target.value)}
                disabled={!!editorState.logId}
              />
            </div>

            <div className="space-y-2">
              <Label>Clock In</Label>
              <Input
                type="datetime-local"
                value={editorState.clockIn}
                onChange={(event) => updateEditorState("clockIn", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Clock Out</Label>
              <Input
                type="datetime-local"
                value={editorState.clockOut}
                onChange={(event) => updateEditorState("clockOut", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editorState.status} onValueChange={(value) => updateEditorState("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="half_day">Half day</SelectItem>
                  <SelectItem value="on_leave">On leave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Source</Label>
              <Input
                value={editorState.source}
                onChange={(event) => updateEditorState("source", event.target.value)}
                placeholder="manual"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={editorState.notes}
              onChange={(event) => updateEditorState("notes", event.target.value)}
              placeholder="Optional correction notes"
            />
          </div>

          <DialogFooter className="gap-2">
            {editorState.logId && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => void handleDelete()}
                disabled={editorSaving || editorDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {editorDeleting ? "Deleting..." : "Delete"}
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => setEditorOpen(false)} disabled={editorSaving || editorDeleting}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleSave()} disabled={editorSaving || editorDeleting}>
              {editorSaving ? "Saving..." : editorState.logId ? "Save Changes" : "Create Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttendanceDashboard;
