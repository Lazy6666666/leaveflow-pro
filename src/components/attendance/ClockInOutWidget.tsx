import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { format, differenceInMinutes } from "date-fns";
import { useMutation, useQuery } from "convex/react";
import { ArrowRight, Clock, LogOut, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/lib/errors";
import { api } from "@/lib/convexApi";
import type { AttendanceLogId, StorageId } from "@/lib/convexTypes";

import { SelfieCaptureDialog } from "./SelfieCaptureDialog";

interface AttendanceLog {
  id: AttendanceLogId;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
  date: string;
}

const SLIDE_THRESHOLD = 0.8;

function FlipText({ value }: { value: string }) {
  return (
    <div className="flex min-h-7 items-center overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={value}
          initial={{ y: 14, opacity: 0, filter: "blur(8px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: -14, opacity: 0, filter: "blur(8px)" }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="text-sm font-medium tabular-nums text-foreground"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

function SlideToAction({
  label,
  busyLabel,
  onComplete,
  disabled,
}: {
  label: string;
  busyLabel: string;
  onComplete: () => void;
  disabled?: boolean;
}) {
  const controls = useDragControls();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragX, setDragX] = useState(0);
  const [maxX, setMaxX] = useState(0);

  useEffect(() => {
    const resize = () => {
      if (!trackRef.current) return;
      const width = trackRef.current.offsetWidth;
      setMaxX(Math.max(0, width - 52));
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const progress = maxX > 0 ? Math.min(dragX / maxX, 1) : 0;
  const currentLabel = disabled ? busyLabel : label;

  return (
    <div className="space-y-2">
      <div
        ref={trackRef}
        className="glass glass-panel relative flex h-14 items-center overflow-hidden rounded-full border border-white/12 bg-white/10 px-2 dark:bg-white/5"
      >
        <div
          aria-hidden="true"
          className="absolute inset-y-2 left-2 rounded-full bg-[hsl(var(--glass-accent)/0.2)] transition-[width] duration-300 ease-apple-ease"
          style={{ width: `calc(${progress * 100}% + 2.5rem)` }}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
            {currentLabel}
          </span>
        </div>
        <motion.button
          type="button"
          drag="x"
          dragControls={controls}
          dragListener={false}
          dragConstraints={{ left: 0, right: maxX }}
          dragElastic={0.04}
          whileTap={{ scale: 0.98 }}
          animate={{ x: dragX }}
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
          onPointerDown={(event) => {
            if (!disabled) controls.start(event);
          }}
          onDrag={(_, info) => setDragX(Math.max(0, Math.min(info.offset.x, maxX)))}
          onDragEnd={(_, info) => {
            if (disabled) {
              setDragX(0);
              return;
            }

            const nextProgress = maxX > 0 ? Math.min(Math.max(info.point.x - (trackRef.current?.getBoundingClientRect().left ?? 0) - 24, 0) / maxX, 1) : 0;
            if (nextProgress >= SLIDE_THRESHOLD) {
              setDragX(maxX);
              onComplete();
            }
            setTimeout(() => setDragX(0), 220);
          }}
          onKeyDown={(event) => {
            if (disabled) return;
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onComplete();
            }
          }}
          disabled={disabled}
          aria-label={currentLabel}
          className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white text-foreground shadow-lg disabled:cursor-not-allowed dark:bg-white/90"
        >
          <ArrowRight className="h-4 w-4" />
        </motion.button>
      </div>
      <p className="text-center text-[11px] text-muted-foreground">Drag to confirm or press Enter.</p>
    </div>
  );
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
  const requireClockInLocation = requireLocation || !!data?.settings?.geofence_enabled;
  const requireClockOutLocation = requireLocation;
  const loading = data === undefined;

  useEffect(() => {
    if (!todayLog?.clock_in || todayLog?.clock_out) {
      setElapsed("");
      return;
    }

    const update = () => {
      const minutes = differenceInMinutes(new Date(), new Date(todayLog.clock_in!));
      const hours = Math.floor(minutes / 60);
      const remainder = minutes % 60;
      setElapsed(`${hours}h ${remainder}m`);
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [todayLog?.clock_in, todayLog?.clock_out]);

  const getLocation = (): Promise<{ lat: number; lng: number } | null> =>
    new Promise((resolve, reject) => {
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
            lng: position.coords.longitude,
          });
        },
        (error) => {
          toast.error("Location access denied. Please enable location permissions to clock in or out.");
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    });

  const processClockIn = async (selfiePath?: StorageId) => {
    if (!user) return;
    setActing(true);
    try {
      const location = requireClockInLocation ? await getLocation() : null;
      const result = await clockInMutation({
        selfieClockInStorageId: selfiePath,
        locationClockIn: location ?? undefined,
      });
      toast.success(result.status === "late" ? "Clocked in late" : "Clocked in successfully");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to clock in"));
    } finally {
      setActing(false);
    }
  };

  const processClockOut = async (selfiePath?: StorageId) => {
    if (!todayLog) return;
    setActing(true);
    try {
      const location = requireClockOutLocation ? await getLocation() : null;
      await clockOutMutation({
        logId: todayLog.id,
        selfieClockOutStorageId: selfiePath,
        locationClockOut: location ?? undefined,
      });
      toast.success("Clocked out successfully");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to clock out"));
    } finally {
      setActing(false);
    }
  };

  const handleClockIn = () => {
    if (requireSelfie) {
      setSelfieType("clock_in");
      setSelfieOpen(true);
      return;
    }
    void processClockIn();
  };

  const handleClockOut = () => {
    if (requireSelfie) {
      setSelfieType("clock_out");
      setSelfieOpen(true);
      return;
    }
    void processClockOut();
  };

  const isClockedIn = Boolean(todayLog?.clock_in && !todayLog?.clock_out);
  const sessionTotal = useMemo(() => {
    if (!todayLog?.clock_in || !todayLog?.clock_out) return "";
    const minutes = differenceInMinutes(new Date(todayLog.clock_out), new Date(todayLog.clock_in));
    if (minutes >= 60) {
      return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  }, [todayLog?.clock_in, todayLog?.clock_out]);

  const statusColor = (status: string) => {
    switch (status) {
      case "present":
        return "default";
      case "late":
        return "destructive";
      case "absent":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (loading) return null;

  return (
    <Card className="glass glass-panel rounded-[1.75rem] border border-white/10 bg-white/10 shadow-xl dark:bg-white/5">
      <CardContent className="space-y-4 p-5">
        <div className="mb-1 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Attendance</p>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              <span>{todayLog?.date ? format(new Date(todayLog.date), "EEEE") : "Today"}</span>
            </div>
          </div>
          {todayLog ? (
            <Badge variant={statusColor(todayLog.status)} className="text-xs capitalize">
              {todayLog.status}
            </Badge>
          ) : null}
        </div>

        {!todayLog ? (
          <div className="space-y-3">
            <div>
              <p className="text-sm text-foreground">Ready to start your shift</p>
              <p className="text-xs text-muted-foreground">Slide once to capture your start time.</p>
            </div>
            <SlideToAction label="Slide to Clock In" busyLabel="Clocking In" onComplete={handleClockIn} disabled={acting} />
          </div>
        ) : isClockedIn ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-foreground">In since {format(new Date(todayLog.clock_in!), "h:mm a")}</p>
              {elapsed ? (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <FlipText value={`${elapsed} elapsed`} />
                </div>
              ) : null}
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <SlideToAction label="Slide to Clock Out" busyLabel="Clocking Out" onComplete={handleClockOut} disabled={acting} />
              <Button variant="ios-glass" size="icon" className="hidden h-14 w-14 rounded-full sm:flex" onClick={handleClockOut} disabled={acting}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm text-foreground">
              {format(new Date(todayLog.clock_in!), "h:mm a")} - {format(new Date(todayLog.clock_out!), "h:mm a")}
            </p>
            <p className="text-xs text-muted-foreground">{sessionTotal} total</p>
          </div>
        )}

        <SelfieCaptureDialog
          open={selfieOpen}
          onOpenChange={setSelfieOpen}
          type={selfieType}
          onCaptureComplete={(path) => {
            if (selfieType === "clock_in") {
              void processClockIn(path);
            } else {
              void processClockOut(path);
            }
          }}
        />
      </CardContent>
    </Card>
  );
}
