import { useEffect, useState } from "react";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subDays } from "date-fns";
import { Users, Clock } from "lucide-react";
import type { FunctionReturnType } from "convex/server";
import { useAnalytics } from "@/hooks/useAnalytics";

type TeamLog = FunctionReturnType<typeof api.attendance.getTeamAttendance>[number];

const TeamAttendance = () => {
  const [logs, setLogs] = useState<TeamLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("0");
  const { trackOnce } = useAnalytics();

  useEffect(() => {
    const fetchTeam = async () => {
      setLoading(true);
      const data = await convex.query(api.attendance.getTeamAttendance, { dayOffset: parseInt(selectedDate) });
      setLogs(data ?? []);
      setLoading(false);
    };
    fetchTeam();
  }, [selectedDate]);

  useEffect(() => {
    if (!loading) {
      void trackOnce(`team_attendance_viewed:${selectedDate}`, "team_attendance_viewed", {
        day_offset: Number.parseInt(selectedDate, 10),
        visible_employee_count: logs.length,
      }, { surface: "manager", path: "/manager/team-attendance" });
    }
  }, [loading, logs.length, selectedDate, trackOnce]);

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

  const targetDate = subDays(new Date(), parseInt(selectedDate));
  const stats = {
    present: logs.filter(l => l.status === "present").length,
    late: logs.filter(l => l.status === "late").length,
    absent: logs.filter(l => l.status === "absent").length,
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Manager</p>
          <h1 className="text-2xl font-serif font-semibold tracking-tight text-foreground">
            Team Attendance
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {format(targetDate, "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <Select value={selectedDate} onValueChange={setSelectedDate}>
          <SelectTrigger className="h-11 w-full sm:w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Today</SelectItem>
            <SelectItem value="1">Yesterday</SelectItem>
            <SelectItem value="2">{format(subDays(new Date(), 2), "EEE, MMM d")}</SelectItem>
            <SelectItem value="3">{format(subDays(new Date(), 3), "EEE, MMM d")}</SelectItem>
            <SelectItem value="4">{format(subDays(new Date(), 4), "EEE, MMM d")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold tabular-nums text-foreground">{stats.present}</p>
            <p className="text-xs text-muted-foreground mt-1">Present</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold tabular-nums text-foreground">{stats.late}</p>
            <p className="text-xs text-muted-foreground mt-1">Late</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold tabular-nums text-muted-foreground">{stats.absent}</p>
            <p className="text-xs text-muted-foreground mt-1">Absent</p>
          </CardContent>
        </Card>
      </div>

      {/* Team List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No attendance records for this day.</p>
          ) : (
            <div className="space-y-1">
              {logs.map((log) => (
                <div key={log.id} className="flex flex-col gap-3 border-b border-border/40 py-3 last:border-0 sm:flex-row sm:items-center">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                      {getInitials(log.profiles?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {log.profiles?.full_name || log.profiles?.email || "Unknown"}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      <Clock className="h-3 w-3" />
                      {log.clock_in ? format(new Date(log.clock_in), "h:mm a") : "—"}
                      {log.clock_out && (
                        <>
                          <span>→</span>
                          {format(new Date(log.clock_out), "h:mm a")}
                        </>
                      )}
                    </div>
                  </div>
                  <Badge variant={statusColor(log.status)} className="w-fit capitalize text-xs sm:ml-auto">
                    {log.status.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamAttendance;
