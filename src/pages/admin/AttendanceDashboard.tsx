import { useEffect, useState } from "react";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { BarChart3, Users, Clock, AlertTriangle, Camera, MapPin } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { SelfieLightbox } from "@/components/attendance/SelfieLightbox";
import type { LatLng, StorageId } from "@/lib/convexTypes";

interface AttendanceLog {
  id: string;
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

const AttendanceDashboard = () => {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"today" | "month">("today");
  const [deptFilter, setDeptFilter] = useState("all");
  const [lightboxPath, setLightboxPath] = useState<StorageId | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const data = await convex.query(api.attendance.getAdminAttendanceDashboard, { view });
      setDepartments(data.departments as Department[]);
      setLogs((data.logs as AttendanceLog[]) || []);
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
    { name: "Present", value: stats.present, color: "hsl(var(--primary))" },
    { name: "Late", value: stats.late, color: "hsl(var(--destructive))" },
    { name: "Absent", value: stats.absent, color: "hsl(var(--muted-foreground))" },
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

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold tracking-tight text-foreground">
            Attendance Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {view === "today" ? format(new Date(), "EEEE, MMMM d, yyyy") : format(new Date(), "MMMM yyyy")}
          </p>
        </div>
        <div className="flex gap-3">
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
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Total Records</p>
            <p className="text-3xl font-semibold tabular-nums text-foreground">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Present</p>
            <p className="text-3xl font-semibold tabular-nums text-foreground">{stats.present}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Late</p>
            <p className="text-3xl font-semibold tabular-nums text-destructive">{stats.late}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Absent</p>
            <p className="text-3xl font-semibold tabular-nums text-muted-foreground">{stats.absent}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Chart */}
        <Card className="border-0 shadow-sm lg:col-span-2">
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
        <Card className="border-0 shadow-sm lg:col-span-3">
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
    </div>
  );
};

export default AttendanceDashboard;
