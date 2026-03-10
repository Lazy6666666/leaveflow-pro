import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogIn, LogOut, Clock } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { toast } from "sonner";
import { SelfieCaptureDialog } from "./SelfieCaptureDialog";

interface AttendanceLog {
  id: string;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
  date: string;
}

export function ClockInOutWidget() {
  const { user } = useAuth();
  const [todayLog, setTodayLog] = useState<AttendanceLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [elapsed, setElapsed] = useState("");

  const [requireSelfie, setRequireSelfie] = useState(false);
  const [requireLocation, setRequireLocation] = useState(false);
  const [selfieOpen, setSelfieOpen] = useState(false);
  const [selfieType, setSelfieType] = useState<"clock_in" | "clock_out">("clock_in");

  const fetchToday = async () => {
    if (!user) return;
    const today = format(new Date(), "yyyy-MM-dd");

    // Fetch logs
    const { data: logData } = await supabase
      .from("attendance_logs")
      .select("id, clock_in, clock_out, status, date")
      .eq("employee_id", user.id)
      .eq("date", today)
      .maybeSingle();

    setTodayLog(logData);

    // Fetch requirement setting
    const { data: settings } = await supabase
      .from("attendance_settings")
      .select("require_selfie, require_location")
      .limit(1)
      .maybeSingle();

    if (settings) {
      setRequireSelfie(!!settings.require_selfie);
      setRequireLocation(!!settings.require_location);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchToday();

    // Realtime subscription
    const channel = supabase
      .channel("attendance-today")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "attendance_logs",
        filter: `employee_id=eq.${user?.id}`,
      }, () => fetchToday())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Update elapsed time every minute
  useEffect(() => {
    if (!todayLog?.clock_in || todayLog?.clock_out) {
      setElapsed("");
      return;
    }
    const update = () => {
      const mins = differenceInMinutes(new Date(), new Date(todayLog.clock_in!));
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      setElapsed(`${h}h ${m}m`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [todayLog?.clock_in, todayLog?.clock_out]);

  const getLocation = (): Promise<{ lat: number, lng: number } | null> => {
    return new Promise((resolve, reject) => {
      if (!requireLocation) {
        resolve(null);
        return;
      }

      if (!navigator.geolocation) {
        toast.error("Geolocation is not supported by your browser");
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          toast.error("Location access denied. Please enable location permissions to clock in/out.");
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const processClockIn = async (selfiePath?: string) => {
    if (!user) return;
    setActing(true);
    try {
      let location = null;
      if (requireLocation) {
        location = await getLocation();
      }

      // Fetch settings for late threshold
      const { data: settings } = await supabase
        .from("attendance_settings")
        .select("work_start_time, late_threshold_minutes")
        .limit(1)
        .maybeSingle();

      const now = new Date();
      let status: string = "present";

      if (settings && settings.work_start_time) {
        const [h, m] = settings.work_start_time.split(":").map(Number);
        const startTime = new Date();
        startTime.setHours(h, m + (settings.late_threshold_minutes || 15), 0, 0);
        if (now > startTime) status = "late";
      }

      const { error } = await supabase.from("attendance_logs").insert([{
        employee_id: user.id,
        clock_in: now.toISOString(),
        status: status as "present" | "late",
        date: format(now, "yyyy-MM-dd"),
        selfie_clock_in: selfiePath || null,
        location_clock_in: location,
      }]);

      if (error) throw error;
      toast.success(status === "late" ? "Clocked in (late)" : "Clocked in successfully");
      fetchToday();
    } catch (e: any) {
      toast.error(e.message || "Failed to clock in");
    } finally {
      setActing(false);
    }
  };

  const processClockOut = async (selfiePath?: string) => {
    if (!todayLog) return;
    setActing(true);
    try {
      let location = null;
      if (requireLocation) {
        location = await getLocation();
      }

      const { error } = await supabase
        .from("attendance_logs")
        .update({
          clock_out: new Date().toISOString(),
          selfie_clock_out: selfiePath || null,
          location_clock_out: location
        })
        .eq("id", todayLog.id);
      if (error) throw error;
      toast.success("Clocked out successfully");
      fetchToday();
    } catch (e: any) {
      toast.error(e.message || "Failed to clock out");
    } finally {
      setActing(false);
    }
  };

  const handleClockInClick = () => {
    if (requireSelfie) {
      setSelfieType("clock_in");
      setSelfieOpen(true);
    } else {
      processClockIn();
    }
  };

  const handleClockOutClick = () => {
    if (requireSelfie) {
      setSelfieType("clock_out");
      setSelfieOpen(true);
    } else {
      processClockOut();
    }
  };

  const isClockedIn = todayLog?.clock_in && !todayLog?.clock_out;

  const statusColor = (s: string) => {
    switch (s) {
      case "present": return "default";
      case "late": return "destructive";
      case "absent": return "secondary";
      default: return "outline";
    }
  };

  if (loading) return null;

  return (
    <Card className="border-0 shadow-sm bg-card">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Attendance</p>
          {todayLog && (
            <Badge variant={statusColor(todayLog.status)} className="capitalize text-xs">
              {todayLog.status}
            </Badge>
          )}
        </div>

        {!todayLog ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Not clocked in yet</p>
            <Button
              onClick={handleClockInClick}
              disabled={acting}
              className="w-full gap-2"
              size="sm"
            >
              <LogIn className="h-4 w-4" />
              Clock In
            </Button>
          </div>
        ) : isClockedIn ? (
          <div className="space-y-3">
            <div>
              <p className="text-sm text-foreground">
                In since {format(new Date(todayLog.clock_in!), "h:mm a")}
              </p>
              {elapsed && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                  <Clock className="h-3 w-3" />
                  <span>{elapsed} elapsed</span>
                </div>
              )}
            </div>
            <Button
              onClick={handleClockOutClick}
              disabled={acting}
              variant="outline"
              className="w-full gap-2"
              size="sm"
            >
              <LogOut className="h-4 w-4" />
              Clock Out
            </Button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-foreground">
              {format(new Date(todayLog.clock_in!), "h:mm a")} – {format(new Date(todayLog.clock_out!), "h:mm a")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {differenceInMinutes(new Date(todayLog.clock_out!), new Date(todayLog.clock_in!)) >= 60
                ? `${Math.floor(differenceInMinutes(new Date(todayLog.clock_out!), new Date(todayLog.clock_in!)) / 60)}h ${differenceInMinutes(new Date(todayLog.clock_out!), new Date(todayLog.clock_in!)) % 60}m`
                : `${differenceInMinutes(new Date(todayLog.clock_out!), new Date(todayLog.clock_in!))}m`
              } total
            </p>
          </div>
        )}

        <SelfieCaptureDialog
          open={selfieOpen}
          onOpenChange={setSelfieOpen}
          type={selfieType}
          onCaptureComplete={(path) => selfieType === "clock_in" ? processClockIn(path) : processClockOut(path)}
        />
      </CardContent>
    </Card>
  );
}
