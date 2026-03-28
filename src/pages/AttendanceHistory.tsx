import { useMemo, useState } from "react";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/convexApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Clock, CalendarDays, Camera, MapPin, ArrowRight } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import PaginationControls from "@/components/PaginationControls";
import { SelfieLightbox } from "@/components/attendance/SelfieLightbox";
import { useConvexQuery } from "@/hooks/useConvexQuery";
import type { LatLng, StorageId } from "@/lib/convexTypes";
import { useAnalytics } from "@/hooks/useAnalytics";

type AttendanceLog = {
  id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  selfie_clock_in: StorageId | null;
  selfie_clock_out: StorageId | null;
  location_clock_in: LatLng | null;
  location_clock_out: LatLng | null;
  status: string;
  source: string;
  notes: string | null;
};

const formatDuration = (start: string | null, end: string | null) => {
  if (!start || !end) return "—";
  const duration = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(duration / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

const AttendanceHistory = () => {
  const { user } = useAuth();
  const { trackOnce } = useAnalytics();
  const [monthOffset, setMonthOffset] = useState("0");
  const [lightboxPath, setLightboxPath] = useState<StorageId | null>(null);
  const monthOffsetNumber = useMemo(() => Number.parseInt(monthOffset, 10), [monthOffset]);
  const { data: logsData, loading } = useConvexQuery(
    api.attendance.getAttendanceHistory,
    { monthOffset: monthOffsetNumber },
    [monthOffsetNumber],
    { enabled: !!user },
  );
  const logs = (logsData as AttendanceLog[] | null) ?? [];
  const { page, totalPages, paginatedItems, setPage, totalItems } = usePagination(logs, 20);

  useEffect(() => {
    if (!loading) {
      void trackOnce(`attendance_history_viewed:${monthOffsetNumber}`, "attendance_history_viewed", {
        month_offset: monthOffsetNumber,
        log_count: logs.length,
      }, { surface: "attendance", path: "/attendance-history" });
    }
  }, [loading, logs.length, monthOffsetNumber, trackOnce]);

  const targetDate = subMonths(new Date(), parseInt(monthOffset));

  const stats = {
    present: logs.filter(l => l.status === "present").length,
    late: logs.filter(l => l.status === "late").length,
    absent: logs.filter(l => l.status === "absent").length,
    total: logs.length,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-12 pb-24 px-4 md:px-8">
      {/* Header */}
      <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between pb-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-primary">
            <Clock className="h-3.5 w-3.5" />
            <span>Time Ledger & Presence</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-display font-black tracking-tight text-foreground leading-[1.1]">
            Attendance <br />
            <span className="text-primary/40 italic font-light">History.</span>
          </h1>
          <p className="max-w-[45ch] text-lg text-muted-foreground font-sans leading-relaxed">
            A comprehensive audit trail of your professional presence for <span className="text-foreground font-bold">{format(targetDate, "MMMM yyyy")}</span>.
          </p>
        </div>

        <Select value={monthOffset} onValueChange={setMonthOffset}>
          <SelectTrigger className="h-12 w-full sm:w-[220px] rounded-xl border-none shadow-sm font-bold uppercase text-[11px] tracking-widest bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-none shadow-float">
            <SelectItem value="0" className="rounded-lg">Current Cycle</SelectItem>
            <SelectItem value="1" className="rounded-lg">Previous Cycle</SelectItem>
            <SelectItem value="2" className="rounded-lg">{format(subMonths(new Date(), 2), "MMM yyyy")}</SelectItem>
            <SelectItem value="3" className="rounded-lg">{format(subMonths(new Date(), 3), "MMM yyyy")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Bento Grid - Layered Approach */}
      <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Logs", value: stats.total, unit: "Entries" },
          { label: "Present", value: stats.present, unit: "Cycles", color: "text-primary" },
          { label: "Late", value: stats.late, unit: "Incidents", color: "text-amber-600" },
          { label: "Absent", value: stats.absent, unit: "Missed", color: "text-destructive" }
        ].map((s, i) => (
          <div key={i} className="bg-white p-8 rounded-xl shadow-float group hover:shadow-lg transition-all duration-300">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/60 mb-4">{s.label}</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-5xl font-display font-black tracking-tighter tabular-nums ${s.color || 'text-foreground'}`}>
                {s.value}
              </span>
              <span className="text-[11px] font-bold text-muted-foreground uppercase">{s.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Daily Logs Ledger - No-Line Table Container */}
      <section className="space-y-8">
        <div className="flex items-baseline gap-4">
          <h2 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-primary/60">Presence Ledger</h2>
          <div className="h-[2px] flex-1 bg-muted/40 rounded-full" />
          <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary border-none text-[10px] font-bold px-4 py-1">
            {totalItems} RECORDS
          </Badge>
        </div>

        <div className="bg-white rounded-xl shadow-float overflow-hidden">
          {loading ? (
            <div className="py-32 text-center">
              <span className="text-[11px] font-bold uppercase tracking-widest text-primary animate-pulse">Synchronizing Telemetry...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-32 text-center">
              <CalendarDays className="h-8 w-8 mx-auto mb-6 text-muted-foreground/20" />
              <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">No records found for this cycle</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-widest text-primary/60 w-32">Chronology</th>
                    <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-widest text-primary/60">Verification (In/Out)</th>
                    <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-widest text-primary/60 w-40">Duration</th>
                    <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-widest text-primary/60 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted/30">
                  {paginatedItems.map((log) => (
                    <tr key={log.id} className="group hover:bg-muted/10 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground uppercase tracking-wider">{format(parseISO(log.date), "EEE")}</span>
                          <span className="text-xs text-muted-foreground">{format(parseISO(log.date), "dd MMM yyyy")}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-8 text-sm">
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground/60 text-[10px] uppercase font-bold tracking-widest">In:</span>
                            <span className="text-foreground font-semibold">{log.clock_in ? format(new Date(log.clock_in), "HH:mm") : "—"}</span>
                            <div className="flex gap-2">
                              {log.selfie_clock_in && (
                                <button
                                  type="button"
                                  title="View clock-in selfie"
                                  aria-label="View clock-in selfie"
                                  className="inline-flex items-center text-primary hover:scale-110 transition-transform"
                                  onClick={() => setLightboxPath(log.selfie_clock_in)}
                                >
                                  <Camera className="h-4 w-4" />
                                </button>
                              )}
                              {log.location_clock_in && (
                                <a
                                  href={`https://www.google.com/maps?q=${log.location_clock_in.lat},${log.location_clock_in.lng}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:scale-110 transition-transform"
                                >
                                  <MapPin className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                          </div>

                          <ArrowRight className="h-4 w-4 text-muted-foreground/20" />

                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground/60 text-[10px] uppercase font-bold tracking-widest">Out:</span>
                            <span className="text-foreground font-semibold">{log.clock_out ? format(new Date(log.clock_out), "HH:mm") : "—"}</span>
                            <div className="flex gap-2">
                              {log.selfie_clock_out && (
                                <button
                                  type="button"
                                  title="View clock-out selfie"
                                  aria-label="View clock-out selfie"
                                  className="inline-flex items-center text-primary hover:scale-110 transition-transform"
                                  onClick={() => setLightboxPath(log.selfie_clock_out)}
                                >
                                  <Camera className="h-4 w-4" />
                                </button>
                              )}
                              {log.location_clock_out && (
                                <a
                                  href={`https://www.google.com/maps?q=${log.location_clock_out.lat},${log.location_clock_out.lng}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:scale-110 transition-transform"
                                >
                                  <MapPin className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                        {log.notes && (
                          <p className="text-[11px] text-muted-foreground mt-3 italic bg-muted/40 px-3 py-1.5 rounded-lg inline-block leading-relaxed">{log.notes}</p>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-bold text-foreground">
                          {formatDuration(log.clock_in, log.clock_out)}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <StatusBadge status={log.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {logs.length > 0 && (
            <div className="px-8 py-6 bg-muted/20">
              <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} />
            </div>
          )}
        </div>
      </section>

      <SelfieLightbox
        path={lightboxPath}
        onClose={() => setLightboxPath(null)}
      />
    </div>
  );
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    present: "bg-emerald-500/10 text-emerald-600",
    late: "bg-amber-500/10 text-amber-600",
    absent: "bg-destructive/10 text-destructive",
    half_day: "bg-zinc-500/10 text-zinc-600",
    on_leave: "bg-indigo-500/10 text-indigo-600",
  };

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] ${styles[status] || 'bg-muted text-muted-foreground'}`}>
      <span className={`w-1.5 h-1.5 rounded-full bg-current`} />
      {status.replace("_", " ")}
    </span>
  );
}

export default AttendanceHistory;
