import { useRef, useState, useEffect } from "react";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { format } from "date-fns";
import { ArrowRight, Clock, LogOut, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { SelfieCaptureDialog } from "./SelfieCaptureDialog";
import { useClockInOutController } from "./useClockInOutController";

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
        className="relative flex h-14 items-center overflow-hidden rounded-full border bg-card px-2 shadow-sm"
      >
        <div
          aria-hidden="true"
          className="absolute inset-y-2 left-2 rounded-full bg-primary/20 transition-[width] duration-300 ease-apple-ease"
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
          className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border bg-background text-foreground shadow-sm disabled:cursor-not-allowed"
        >
          <ArrowRight className="h-4 w-4" />
        </motion.button>
      </div>
      <p className="text-center text-[11px] text-muted-foreground">Drag to confirm or press Enter.</p>
    </div>
  );
}

export function ClockInOutWidget() {
  const {
    acting,
    elapsed,
    loading,
    todayLog,
    permissionState,
    selfieDialog,
    isClockedIn,
    sessionTotal,
    requestCameraPermission,
    handleClockIn,
    handleClockOut,
    setSelfieDialogOpen,
    handleSelfieCaptureComplete,
    handleSelfiePermissionDenied,
    acknowledgePermissionRecovered,
  } = useClockInOutController();

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
    <Card className="rounded-xl border bg-card text-card-foreground shadow-sm">
      <CardContent className="space-y-4 p-6">
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
              <Button variant="outline" size="icon" className="hidden h-14 w-14 rounded-full sm:flex shadow-sm" onClick={handleClockOut} disabled={acting}>
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

        {permissionState === "location_denied" && (
          <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-center">
            <p className="text-sm font-medium text-amber-600 dark:text-amber-500">Location Access Required</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Please allow location access in your browser settings, then try again.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full border-amber-500/30 font-medium text-foreground hover:bg-amber-500/20"
              onClick={acknowledgePermissionRecovered}
            >
              I've enabled it
            </Button>
          </div>
        )}

        {permissionState === "camera_denied" && (
          <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-center">
            <p className="text-sm font-medium text-amber-600 dark:text-amber-500">Camera Access Required</p>
            <p className="mt-1 text-xs text-muted-foreground">
              A selfie is required. Please allow camera access in your browser URL bar.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full border-amber-500/30 font-medium text-foreground hover:bg-amber-500/20"
              onClick={requestCameraPermission}
            >
              Re-request Camera
            </Button>
          </div>
        )}

        <SelfieCaptureDialog
          open={selfieDialog.open}
          onOpenChange={setSelfieDialogOpen}
          type={selfieDialog.type}
          onCaptureComplete={handleSelfieCaptureComplete}
          onPermissionDenied={handleSelfiePermissionDenied}
        />
      </CardContent>
    </Card>
  );
}
