import { format } from "date-fns";
import { AlertTriangle, Bot, Building2, CalendarClock, Camera, Clock, MapPin, Pencil, Users } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StorageId } from "@/lib/convexTypes";

import type { AttendanceLog } from "../../attendanceDashboardTypes";
import type { AttendanceView } from "../types";
import { getInitials, getShiftCompliance, getStatusBadgeVariant } from "../utils";

type RecordsCardProps = {
  canEditAttendance: boolean;
  filteredLogs: AttendanceLog[];
  lateArrivals: AttendanceLog[];
  loading: boolean;
  onAskAi: (log: AttendanceLog) => void;
  onEdit: (log: AttendanceLog) => void;
  onOpenSelfie: (path: StorageId) => void;
  view: AttendanceView;
};

export function RecordsCard({
  canEditAttendance,
  filteredLogs,
  lateArrivals,
  loading,
  onAskAi,
  onEdit,
  onOpenSelfie,
  view,
}: RecordsCardProps) {
  const rows = view === "today" && lateArrivals.length > 0 ? lateArrivals : filteredLogs.slice(0, 20);

  return (
    <Card className="lg:col-span-3">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium text-foreground">
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
          <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
        ) : filteredLogs.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No records found.</p>
        ) : (
          <div className="max-h-[300px] space-y-1 overflow-y-auto">
            {rows.map((log) => (
              <div key={log.id} className="flex items-center gap-3 border-b border-border/40 py-2.5 last:border-0">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-muted text-[10px] text-muted-foreground">
                    {getInitials(log.profiles?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{log.profiles?.full_name || log.profiles?.email || "Unknown"}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>In: {log.clock_in ? format(new Date(log.clock_in), "h:mm a") : "-"}</span>
                    {log.selfie_clock_in && (
                      <button
                        type="button"
                        aria-label="View clock-in selfie"
                        title="View clock-in selfie"
                        className="ml-0.5 inline-flex items-center text-primary hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                        onClick={() => onOpenSelfie(log.selfie_clock_in)}
                      >
                        <Camera aria-hidden="true" className="h-3 w-3" />
                      </button>
                    )}
                    {log.location_clock_in && (
                      <a
                        href={`https://www.google.com/maps?q=${log.location_clock_in.lat},${log.location_clock_in.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View clock-in location"
                        aria-label="View clock-in location"
                        className="ml-0.5 inline-flex items-center text-primary hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                      >
                        <MapPin aria-hidden="true" className="h-3 w-3" />
                      </a>
                    )}
                    {log.clock_out && (
                      <>
                        <span className="mx-1 opacity-50">|</span>
                        <span>Out: {format(new Date(log.clock_out), "h:mm a")}</span>
                        {log.selfie_clock_out && (
                          <button
                            type="button"
                            aria-label="View clock-out selfie"
                            title="View clock-out selfie"
                            className="ml-0.5 inline-flex items-center text-primary hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                            onClick={() => onOpenSelfie(log.selfie_clock_out)}
                          >
                            <Camera aria-hidden="true" className="h-3 w-3" />
                          </button>
                        )}
                        {log.location_clock_out && (
                          <a
                            href={`https://www.google.com/maps?q=${log.location_clock_out.lat},${log.location_clock_out.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View clock-out location"
                            aria-label="View clock-out location"
                            className="ml-0.5 inline-flex items-center text-primary hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                          >
                            <MapPin aria-hidden="true" className="h-3 w-3" />
                          </a>
                        )}
                      </>
                    )}
                    {view === "month" && (
                      <span className="ml-2 font-medium">{format(new Date(`${log.date}T00:00:00`), "MMM d")}</span>
                    )}
                    {log.site_name && (
                      <>
                        <span className="mx-1 opacity-50">|</span>
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {log.site_name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <Badge variant={getStatusBadgeVariant(log.status)} className="text-xs capitalize">
                  {log.status.replace("_", " ")}
                </Badge>
                {(() => {
                  const compliance = getShiftCompliance(log);
                  return (
                    <Badge
                      variant={compliance.variant}
                      title={compliance.title}
                      className="text-xs hidden sm:inline-flex gap-1 max-w-[320px] truncate"
                    >
                      <CalendarClock className="h-3 w-3" />
                      <span className="truncate">{compliance.label}</span>
                    </Badge>
                  );
                })()}
                {(log.status === "late" || log.status === "absent") && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    title="Ask AI about this record"
                    aria-label="Ask AI about this record"
                    onClick={() => onAskAi(log)}
                  >
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </Button>
                )}
                {canEditAttendance && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    aria-label="Edit attendance record"
                    onClick={() => onEdit(log)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
