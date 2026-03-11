import { useEffect, useState } from "react";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subDays } from "date-fns";
import { Users, Clock } from "lucide-react";

interface TeamLog {
  id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
  profiles: { full_name: string | null; email: string | null } | null;
}

const TeamAttendance = () => {
  const [logs, setLogs] = useState<TeamLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("0");

  useEffect(() => {
    const fetchTeam = async () => {
      setLoading(true);
      const data = await convex.query(api.attendance.getTeamAttendance, { dayOffset: parseInt(selectedDate) });
      setLogs((data as unknown as TeamLog[]) || []);
      setLoading(false);
    };
    fetchTeam();
  }, [selectedDate]);

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
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold tracking-tight text-foreground">
            Team Attendance
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {format(targetDate, "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <Select value={selectedDate} onValueChange={setSelectedDate}>
          <SelectTrigger className="w-[160px]">
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
      <div className="grid gap-4 grid-cols-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold tabular-nums text-foreground">{stats.present}</p>
            <p className="text-xs text-muted-foreground mt-1">Present</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold tabular-nums text-destructive">{stats.late}</p>
            <p className="text-xs text-muted-foreground mt-1">Late</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold tabular-nums text-muted-foreground">{stats.absent}</p>
            <p className="text-xs text-muted-foreground mt-1">Absent</p>
          </CardContent>
        </Card>
      </div>

      {/* Team List */}
      <Card className="border-0 shadow-sm">
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
                <div key={log.id} className="flex items-center gap-3 py-3 border-b border-border/40 last:border-0">
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
  );
};

export default TeamAttendance;
