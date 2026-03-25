import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence, type MotionProps } from "framer-motion";
import { ScanFace, ShieldCheck, RefreshCw, CheckCircle2, AlertCircle, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelfieCaptureDialog } from "@/components/attendance/SelfieCaptureDialog";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import { useConvexQuery } from "@/hooks/useConvexQuery";
import { getErrorMessage } from "@/lib/errors";
import type { StorageId } from "@/lib/convexTypes";

type Step = "idle" | "capture" | "confirm" | "enrolling" | "done";

const SPRING = { type: "spring", stiffness: 300, damping: 30 } as const;
const EASING: [number, number, number, number] = [0.32, 0.72, 0, 1];
const FADE_UP = {
  initial: { opacity: 0, y: 24, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -16, filter: "blur(4px)" },
  transition: { duration: 0.5, ease: EASING },
} satisfies MotionProps;

// Animated scanning ring
const ScanRing = ({ active }: { active: boolean }) => (
  <div className="relative flex items-center justify-center w-32 h-32">
    {/* Outer pulse */}
    {active && (
      <>
        <motion.div
          className="absolute inset-0 rounded-full border border-teal-400/30"
          animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border border-teal-400/20"
          animate={{ scale: [1, 1.7], opacity: [0.4, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
        />
      </>
    )}
    {/* Spinning arc */}
    <motion.div
      className="absolute inset-2 rounded-full border-2 border-transparent border-t-teal-400"
      animate={active ? { rotate: 360 } : { rotate: 0 }}
      transition={active ? { duration: 2, repeat: Infinity, ease: "linear" } : {}}
    />
    {/* Core */}
    <div className="relative z-10 w-20 h-20 rounded-full bg-[#0d1117] border border-white/10 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <ScanFace className="w-9 h-9 text-teal-400" strokeWidth={1.5} />
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: string | null }) => {
  if (!status) return null;
  const map: Record<string, { label: string; color: string }> = {
    active:  { label: "Enrolled",  color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
    pending: { label: "Pending",   color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
    revoked: { label: "Revoked",   color: "text-red-400 bg-red-400/10 border-red-400/20" },
  };
  const cfg = map[status] ?? { label: status, color: "text-white/40 bg-white/5 border-white/10" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold border ${cfg.color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {cfg.label}
    </span>
  );
};

const FaceEnrollment = () => {
  const [step, setStep] = useState<Step>("idle");
  const [captureOpen, setCaptureOpen] = useState(false);
  const [storageId, setStorageId] = useState<StorageId | null>(null);

  const { data: enrollment, refetch } = useConvexQuery(
    api.faceVerification.getEnrollmentStatus,
    {},
    [],
  );

  // If already enrolled, jump to done view
  useEffect(() => {
    if (enrollment?.status === "active" && step === "idle") {
      setStep("done");
    }
  }, [enrollment, step]);

  const handleCapture = (id?: StorageId) => {
    setCaptureOpen(false);
    if (id) { setStorageId(id); setStep("confirm"); }
  };

  const handleEnroll = async () => {
    if (!storageId) return;
    setStep("enrolling");
    try {
      await convex.mutation(api.faceVerification.enrollFace, { storageId });
      await refetch();
      setStep("done");
      toast.success("Face enrolled — you're verified.");
    } catch (e) {
      toast.error(getErrorMessage(e, "Enrollment failed. Please try again."));
      setStep("confirm");
    }
  };

  const handleReset = () => { setStorageId(null); setStep("idle"); };

  return (
    <div className="min-h-[100dvh] bg-[#060810] flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">

      {/* Ambient background orbs */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-20%] left-[10%] w-[500px] h-[500px] bg-teal-500/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[5%] w-[400px] h-[400px] bg-indigo-500/6 rounded-full blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-8">

        {/* Header */}
        <motion.div {...FADE_UP} className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-[0.25em] text-white/40 font-bold">
            <ShieldCheck className="w-3 h-3" strokeWidth={2} />
            Identity Verification
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Face Enrollment</h1>
          <p className="text-sm text-white/40 leading-relaxed max-w-[28ch] mx-auto">
            Register your face once. Clock in with a glance.
          </p>
        </motion.div>

        {/* Current enrollment status */}
        {enrollment && (
          <motion.div {...FADE_UP} transition={{ ...FADE_UP.transition, delay: 0.1 }}>
            <StatusBadge status={enrollment.status} />
          </motion.div>
        )}

        {/* Main card */}
        <AnimatePresence mode="wait">

          {/* IDLE */}
          {step === "idle" && (
            <motion.div key="idle" {...FADE_UP} className="w-full">
              <div className="p-px rounded-[2rem] bg-gradient-to-b from-white/10 to-white/5">
                <div className="bg-[#0d1117] rounded-[calc(2rem-1px)] p-8 flex flex-col items-center gap-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <ScanRing active={false} />
                  <div className="space-y-2 text-center">
                    <p className="text-sm text-white/60 leading-relaxed">
                      Stand in good lighting, face the camera directly, and remove glasses if possible.
                    </p>
                  </div>
                  <div className="w-full space-y-3">
                    {[
                      { icon: Camera, text: "Camera access required" },
                      { icon: ShieldCheck, text: "Data encrypted at rest" },
                      { icon: ScanFace, text: "Used only for clock-in verification" },
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-center gap-3 text-xs text-white/30">
                        <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                        {text}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => { setStep("capture"); setCaptureOpen(true); }}
                    className="group w-full flex items-center justify-between gap-4 rounded-full px-6 py-4 bg-teal-500 text-black font-bold text-sm uppercase tracking-[0.15em] transition-all hover:bg-teal-400 active:scale-[0.98]"
                  >
                    <span>Begin Enrollment</span>
                    <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center transition-transform group-hover:translate-x-1">
                      <Camera className="w-4 h-4" strokeWidth={2} />
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* CAPTURE (dialog open) */}
          {step === "capture" && (
            <motion.div key="capture" {...FADE_UP} className="w-full">
              <div className="p-px rounded-[2rem] bg-gradient-to-b from-white/10 to-white/5">
                <div className="bg-[#0d1117] rounded-[calc(2rem-1px)] p-8 flex flex-col items-center gap-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <ScanRing active />
                  <p className="text-sm text-white/50 text-center">Camera is opening…</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* CONFIRM */}
          {step === "confirm" && (
            <motion.div key="confirm" {...FADE_UP} className="w-full">
              <div className="p-px rounded-[2rem] bg-gradient-to-b from-white/10 to-white/5">
                <div className="bg-[#0d1117] rounded-[calc(2rem-1px)] p-8 flex flex-col items-center gap-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={SPRING}
                    className="w-20 h-20 rounded-full bg-teal-500/10 border border-teal-400/30 flex items-center justify-center"
                  >
                    <CheckCircle2 className="w-9 h-9 text-teal-400" strokeWidth={1.5} />
                  </motion.div>
                  <div className="text-center space-y-1">
                    <p className="text-white font-semibold">Selfie captured</p>
                    <p className="text-sm text-white/40">Confirm to save this as your face ID, or retake.</p>
                  </div>
                  <div className="w-full flex gap-3">
                    <button
                      onClick={() => { setStep("capture"); setCaptureOpen(true); }}
                      className="flex-1 flex items-center justify-center gap-2 rounded-full px-5 py-3.5 bg-white/5 border border-white/10 text-white/60 text-sm font-semibold hover:bg-white/10 transition-all active:scale-[0.98]"
                    >
                      <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
                      Retake
                    </button>
                    <button
                      onClick={() => void handleEnroll()}
                      className="flex-1 rounded-full px-5 py-3.5 bg-teal-500 text-black text-sm font-bold uppercase tracking-[0.15em] hover:bg-teal-400 transition-all active:scale-[0.98]"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ENROLLING */}
          {step === "enrolling" && (
            <motion.div key="enrolling" {...FADE_UP} className="w-full">
              <div className="p-px rounded-[2rem] bg-gradient-to-b from-white/10 to-white/5">
                <div className="bg-[#0d1117] rounded-[calc(2rem-1px)] p-8 flex flex-col items-center gap-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <ScanRing active />
                  <div className="text-center space-y-1">
                    <p className="text-white font-semibold">Enrolling…</p>
                    <p className="text-sm text-white/40">Securing your biometric data.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* DONE */}
          {step === "done" && (
            <motion.div key="done" {...FADE_UP} className="w-full">
              <div className="p-px rounded-[2rem] bg-gradient-to-b from-emerald-400/20 to-white/5">
                <div className="bg-[#0d1117] rounded-[calc(2rem-1px)] p-8 flex flex-col items-center gap-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ ...SPRING, delay: 0.1 }}
                    className="relative"
                  >
                    <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center">
                      <CheckCircle2 className="w-11 h-11 text-emerald-400" strokeWidth={1.5} />
                    </div>
                    <motion.div
                      className="absolute inset-0 rounded-full border border-emerald-400/20"
                      animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                    />
                  </motion.div>
                  <div className="text-center space-y-1">
                    <p className="text-white text-lg font-bold">You're enrolled</p>
                    <p className="text-sm text-white/40 leading-relaxed max-w-[24ch] mx-auto">
                      Your face ID is active. Clock-in verification is now enabled.
                    </p>
                  </div>
                  <StatusBadge status="active" />
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Re-enroll with new photo
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Error state hint */}
        {step === "idle" && enrollment?.status === "revoked" && (
          <motion.div {...FADE_UP} className="flex items-center gap-2 text-xs text-amber-400/70">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
            Previous enrollment was revoked. Please re-enroll.
          </motion.div>
        )}

      </div>

      <SelfieCaptureDialog
        open={captureOpen}
        onOpenChange={(open) => { if (!open) setStep("idle"); setCaptureOpen(open); }}
        type="clock_in"
        onCaptureComplete={handleCapture}
      />
    </div>
  );
};

export default FaceEnrollment;
