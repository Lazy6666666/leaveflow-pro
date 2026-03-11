import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery } from "convex/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogIn, LogOut, Clock } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { toast } from "sonner";
import { SelfieCaptureDialog } from "./SelfieCaptureDialog";
import { api } from "@/lib/convexApi";
import { getErrorMessage } from "@/lib/errors";
import type { AttendanceLogId, StorageId } from "@/lib/convexTypes";

interface AttendanceLog {
  id: AttendanceLogId;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
  date: string;
}

export function ClockInOutWidget() {
  const { user } = useAuth();
  const [acting, setActing] = useState(false);
  const [elapsed, setElapsed] = useState("");
  const [selfieOpen, setSelfieOpen] = useState(false);
  const [selfieType, setSelfieType] = useState<"clock_in" | "clock_out">("clock_in");
  const data = useQuery(api.attendance.getClockWidgetData, user ? {} : "skip");
  const clockInMutation = useMutation(api.attendance.clockIn);
  const clockOutMutation = useMutation(api.attendance.clockOut);
  const todayLog = data?.todayLog as AttendanceLog | null;
  const requireSelfie = !!data?.settings?.require_selfie;
  const requireLocation = !!data?.settings?.require_location;
  const loading = data === undefined;

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

  const processClockIn = async (selfiePath?: StorageId) => {
    if (!user) return;
    setActing(true);
    try {
      let location = null;
      if (requireLocation) {
        location = await getLocation();
      }

      // Fetch settings for late threshold
      const result = await clockInMutation({
        selfieClockInStorageId: selfiePath,
        locationClockIn: location ?? undefined,
      });
      toast.success(result.status === "late" ? "Clocked in (late)" : "Clocked in successfully");
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to clock in"));
    } finally {
      setActing(false);
    }
  };

  const processClockOut = async (selfiePath?: StorageId) => {
    if (!todayLog) return;
    setActing(true);
    try {
      let location = null;
      if (requireLocation) {
        location = await getLocation();
      }

      await clockOutMutation({
        logId: todayLog.id,
        selfieClockOutStorageId: selfiePath,
        locationClockOut: location ?? undefined,
      });
      toast.success("Clocked out successfully");
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to clock out"));
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
