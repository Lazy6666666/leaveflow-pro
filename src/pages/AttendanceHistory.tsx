import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Clock, CalendarDays } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import PaginationControls from "@/components/PaginationControls";

interface AttendanceLog {
  id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
  source: string;
  notes: string | null;
}

const AttendanceHistory = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthOffset, setMonthOffset] = useState("0");
  const { page, totalPages, paginatedItems, setPage, totalItems } = usePagination(logs, 20);

  useEffect(() => {
    if (!user) return;
    const fetchLogs = async () => {
      setLoading(true);
      const targetDate = subMonths(new Date(), parseInt(monthOffset));
      const start = format(startOfMonth(targetDate), "yyyy-MM-dd");
      const end = format(endOfMonth(targetDate), "yyyy-MM-dd");

      const { data } = await supabase
        .from("attendance_logs")
        .select("id, date, clock_in, clock_out, status, source, notes")
        .eq("employee_id", user.id)
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: false });

      setLogs((data as AttendanceLog[]) || []);
      setLoading(false);
    };
    fetchLogs();
  }, [user, monthOffset]);

  const statusColor = (s: string) => {
    switch (s) {
      case "present": return "default";
      case "late": return "destructive";
      case "absent": return "secondary";
      case "half_day": return "outline";
      case "on_leave": return "outline";
      default: return "outline";
    }
  };

  const formatDuration = (clockIn: string | null, clockOut: string | null) => {
    if (!clockIn || !clockOut) return "—";
    const mins = Math.round((new Date(clockOut).getTime() - new Date(clockIn).getTime()) / 60000);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const stats = {
    present: logs.filter(l => l.status === "present").length,
    late: logs.filter(l => l.status === "late").length,
    absent: logs.filter(l => l.status === "absent").length,
    total: logs.length,
  };

  const targetDate = subMonths(new Date(), parseInt(monthOffset));

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold tracking-tight text-foreground">
            Attendance History
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {format(targetDate, "MMMM yyyy")}
          </p>
        </div>
        <Select value={monthOffset} onValueChange={setMonthOffset}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">This Month</SelectItem>
            <SelectItem value="1">Last Month</SelectItem>
            <SelectItem value="2">{format(subMonths(new Date(), 2), "MMM yyyy")}</SelectItem>
            <SelectItem value="3">{format(subMonths(new Date(), 3), "MMM yyyy")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Days Logged</p>
            <p className="text-2xl font-semibold tabular-nums text-foreground">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Present</p>
            <p className="text-2xl font-semibold tabular-nums text-foreground">{stats.present}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Late</p>
            <p className="text-2xl font-semibold tabular-nums text-destructive">{stats.late}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Absent</p>
            <p className="text-2xl font-semibold tabular-nums text-muted-foreground">{stats.absent}</p>
          </CardContent>
        </Card>
      </div>

      {/* Logs */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Daily Log
            <Badge variant="secondary" className="text-xs ml-1">{totalItems}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No attendance records for this month.</p>
          ) : (
            <>
              <div className="space-y-1">
                {paginatedItems.map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-3 border-b border-border/40 last:border-0">
                    <div className="flex items-center gap-4">
                      <div className="w-16 text-center">
                        <p className="text-sm font-medium text-foreground">
                          {format(parseISO(log.date), "EEE")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(log.date), "MMM d")}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-sm text-foreground">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          {log.clock_in ? format(new Date(log.clock_in), "h:mm a") : "—"}
                          <span className="text-muted-foreground">→</span>
                          {log.clock_out ? format(new Date(log.clock_out), "h:mm a") : "—"}
                        </div>
                        {log.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5">{log.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatDuration(log.clock_in, log.clock_out)}
                      </span>
                      <Badge variant={statusColor(log.status)} className="capitalize text-xs">
                        {log.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceHistory;
