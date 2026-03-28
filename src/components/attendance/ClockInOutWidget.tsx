import { useRef, useState, useEffect } from "react";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { format } from "date-fns";
import { ArrowRight, Clock, LogOut, Sparkles, MapPin, Camera } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { SelfieCaptureDialog } from "./SelfieCaptureDialog";
import { useClockInOutController } from "./useClockInOutController";

const SLIDE_THRESHOLD = 0.8;

function FlipText({ value }: { value: string }) {
  return (
    <div className="flex min-h-8 items-center overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={value}
          initial={{ y: 20, opacity: 0, filter: "blur(4px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: -20, opacity: 0, filter: "blur(4px)" }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="font-display text-lg font-bold text-primary"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

/**
 * Redesigned Slide Action: "The Digital Concierge"
 * Aesthetic: Warm, tactile, depth-based (no lines).
 */
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
      setMaxX(Math.max(0, width - 56)); // Handle width
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const progress = maxX > 0 ? Math.min(dragX / maxX, 1) : 0;
  const currentLabel = disabled ? busyLabel : label;

  return (
    <div className="space-y-4">
      <div
        ref={trackRef}
        className="relative flex h-16 items-center overflow-hidden rounded-xl bg-muted/50 p-1.5"
      >
        {/* Progress Fill: Terracotta Bloom */}
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 bg-primary/10 transition-[width] duration-300 ease-concierge"
          style={{ width: `calc(${progress * 100}% + 2rem)` }}
        />

        {/* Floating Label */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
            {currentLabel}
          </span>
        </div>

        {/* Tactile Handle: Terracotta Gradient */}
        <motion.button
          type="button"
          drag="x"
          dragControls={controls}
          dragListener={false}
          dragConstraints={{ left: 0, right: maxX }}
          dragElastic={0.05}
          whileTap={{ scale: 0.95 }}
          animate={{ x: dragX }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          onPointerDown={(event) => {
            if (!disabled) controls.start(event);
          }}
          onDrag={(_, info) => setDragX(Math.max(0, Math.min(info.offset.x, maxX)))}
          onDragEnd={(_, info) => {
            if (disabled) {
              setDragX(0);
              return;
            }

            const trackLeft = trackRef.current?.getBoundingClientRect().left ?? 0;
            const currentX = info.point.x - trackLeft - 28;
            const nextProgress = maxX > 0 ? Math.min(Math.max(currentX, 0) / maxX, 1) : 0;

            if (nextProgress >= SLIDE_THRESHOLD) {
              setDragX(maxX);
              onComplete();
            }
            setTimeout(() => setDragX(0), 400);
          }}
          disabled={disabled}
          aria-label={currentLabel}
          className="relative z-10 flex h-12 w-12 items-center justify-center rounded-xl terracotta-gradient text-white shadow-lg shadow-primary/20 transition-transform active:scale-95 disabled:bg-muted-foreground disabled:cursor-not-allowed"
        >
          <ArrowRight className="h-5 w-5" />
        </motion.button>
      </div>
      <p className="text-center text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground opacity-40 italic">
        Slide to verify session
      </p>
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

  if (loading) return null;

  return (
    <div className="flex h-full flex-col bg-card p-10 font-sans">
        <div className="mb-10 flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-display text-lg font-bold text-foreground">Attendance Concierge</h3>
            <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
              <Sparkles className="h-3 w-3" />
              <span>{todayLog?.date ? format(new Date(todayLog.date), "EEEE") : format(new Date(), "EEEE")} / Online</span>
            </div>
          </div>
          {todayLog ? (
            <div className={`status-badge ${
              todayLog.status === 'present' ? 'status-approved' :
              todayLog.status === 'late' ? 'bg-red-500/10 text-red-600' :
              'bg-muted text-muted-foreground'
            }`}>
              {todayLog.status}
            </div>
          ) : (
            <div className="bg-primary/5 text-primary text-[10px] font-bold px-3 py-1 rounded-full animate-pulse tracking-widest uppercase">
              Awaiting Bio-Auth
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-center">
          {!todayLog ? (
            <div className="space-y-8">
              <div className="space-y-2">
                <p className="font-display text-2xl font-bold tracking-tight text-foreground">Ready to start your day?</p>
                <p className="text-sm text-muted-foreground leading-relaxed">System protocols are ready for initialization. Slide to begin your session.</p>
              </div>
              <SlideToAction label="Initialize Shift" busyLabel="Processing..." onComplete={handleClockIn} disabled={acting} />
            </div>
          ) : isClockedIn ? (
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                   <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Session Start:</span>
                   <span className="font-display text-2xl font-bold text-foreground">{format(new Date(todayLog.clock_in!), "h:mm:ss a")}</span>
                </div>
                {elapsed ? (
                  <div className="flex items-center gap-4 bg-muted/40 p-5 rounded-xl">
                    <Clock className="h-5 w-5 text-primary" />
                    <FlipText value={`${elapsed} Active`} />
                  </div>
                ) : null}
              </div>
              <SlideToAction label="Terminate Session" busyLabel="Closing Log..." onComplete={handleClockOut} disabled={acting} />
            </div>
          ) : (
            <div className="space-y-8">
               <div className="bg-muted/40 p-6 rounded-xl space-y-4">
                  <div className="flex justify-between items-center">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Duration</span>
                     <span className="font-display text-xl font-bold text-primary tracking-tight">{sessionTotal}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-muted">
                     <div>
                        <span className="block text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Clock In</span>
                        <span className="font-semibold text-sm">{format(new Date(todayLog.clock_in!), "h:mm a")}</span>
                     </div>
                     <div>
                        <span className="block text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Clock Out</span>
                        <span className="font-semibold text-sm">{format(new Date(todayLog.clock_out!), "h:mm a")}</span>
                     </div>
                  </div>
               </div>
               <Button
                 variant="ghost"
                 className="w-full h-12 rounded-xl bg-muted/50 font-bold uppercase tracking-widest text-[11px] text-primary hover:bg-muted"
                 onClick={handleClockIn}
                 disabled={acting}
               >
                 Re-enter Environment
               </Button>
            </div>
          )}
        </div>

        {(permissionState === "location_denied" || permissionState === "camera_denied") && (
          <div className="mt-10 p-6 rounded-xl bg-red-500/5 border-0 text-center">
            <div className="flex justify-center gap-3 mb-3">
               {permissionState === "location_denied" ? <MapPin className="h-5 w-5 text-red-600" /> : <Camera className="h-5 w-5 text-red-600" />}
               <p className="text-xs font-bold uppercase tracking-widest text-red-600">Protocol Disrupted</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Bio-verification requires {permissionState === "location_denied" ? "spatial telemetry" : "optical data"}. Please enable access.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-4 w-full h-10 bg-red-500/10 hover:bg-red-500/20 text-red-700 font-bold uppercase tracking-widest text-[10px]"
              onClick={permissionState === "location_denied" ? acknowledgePermissionRecovered : requestCameraPermission}
            >
              Resolve Access
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
    </div>
  );
}
