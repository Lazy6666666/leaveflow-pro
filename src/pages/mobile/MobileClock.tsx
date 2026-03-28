import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, MapPin, CheckCircle2, AlertCircle, LogIn, LogOut, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const EASE_CONCIERGE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const CLOCK_LOG = [
  { date: "Thu, Mar 27", clockIn: "09:03", clockOut: "18:14", hours: "9h 11m", status: "normal" },
  { date: "Wed, Mar 26", clockIn: "09:17", clockOut: "18:02", hours: "8h 45m", status: "normal" },
  { date: "Tue, Mar 25", clockIn: "08:49", clockOut: "17:55", hours: "9h 06m", status: "normal" },
];

/**
 * Redesigned MobileClock: "The Digital Concierge"
 */
export default function MobileClock() {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockedInAt, setClockedInAt] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState("0h 00m");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!isClockedIn || !clockedInAt) return;
    const t = setInterval(() => {
      const ms = Date.now() - clockedInAt.getTime();
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      setElapsed(`${h}h ${String(m).padStart(2, "0")}m`);
    }, 10000);
    return () => clearInterval(t);
  }, [isClockedIn, clockedInAt]);

  const handleToggle = () => {
    setIsClockedIn(!isClockedIn);
    if (!isClockedIn) {
      setClockedInAt(new Date());
      setElapsed("0h 00m");
    } else {
      setClockedInAt(null);
    }
  };

  const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="px-6 pt-16 pb-24 space-y-8 max-w-lg mx-auto bg-background min-h-screen font-sans">

      {/* ── HEADER ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE_CONCIERGE }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="h-1 w-8 terracotta-gradient rounded-full" />
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">Attendance Console</span>
        </div>
        <h1 className="text-4xl font-display font-bold tracking-tighter text-foreground">Session Log</h1>
      </motion.div>

      {/* ── LIVE CLOCK ──────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.1, ease: EASE_CONCIERGE }}
        className="relative p-10 bg-card shadow-float rounded-[40px] text-center overflow-hidden border-0"
      >
        {/* Warm ambient glow */}
        <AnimatePresence>
          {isClockedIn && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-primary/5 pointer-events-none"
            />
          )}
        </AnimatePresence>

        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-6">{dateStr}</p>
        <p className="text-6xl font-display font-bold text-foreground tabular-nums tracking-tighter leading-none mb-8">
          {timeStr}
        </p>

        {/* Status indicator */}
        <div className="inline-flex items-center gap-3 px-5 py-2 bg-muted/50 rounded-full">
          <span className={cn("w-2 h-2 rounded-full", isClockedIn ? "bg-primary animate-pulse" : "bg-muted-foreground/30")} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">
            {isClockedIn ? `Session Active · ${elapsed}` : "Standby Mode"}
          </span>
        </div>

        {/* Location tactile node */}
        <div className="flex items-center justify-center gap-2 mt-8 opacity-40">
          <MapPin size={12} className="text-primary" />
          <span className="text-[9px] font-bold uppercase tracking-widest">HQ Berlin · Biometric Verified</span>
        </div>
      </motion.div>

      {/* ── CLOCK BUTTON: TACTILE SLIDE ────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: EASE_CONCIERGE }}
      >
        <button
          onClick={handleToggle}
          className={cn(
            "group w-full flex items-center justify-between p-2 rounded-3xl transition-all duration-500 active:scale-[0.98] shadow-lg",
            isClockedIn
              ? "bg-slate-800 text-white shadow-slate-900/20"
              : "terracotta-gradient text-white shadow-primary/20"
          )}
        >
          <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
             {isClockedIn ? <LogOut size={24} /> : <LogIn size={24} />}
          </div>
          <span className="text-sm font-bold uppercase tracking-[0.2em] mr-6">
            {isClockedIn ? "Terminate Session" : "Initialize Shift"}
          </span>
          <div className="mr-4">
             <ArrowRight size={20} className="opacity-40 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </motion.div>

      {/* ── ATTENDANCE LOG ──────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: EASE_CONCIERGE }}
      >
        <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-6 px-1">
          Recent Ledger
        </h2>
        <div className="bg-card shadow-float rounded-[32px] overflow-hidden p-2">
          {CLOCK_LOG.map((row, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-4 p-5 rounded-[24px] transition-all",
                i % 2 === 0 ? "bg-muted/30" : "bg-transparent"
              )}
            >
              <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary">
                 <CheckCircle2 size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground uppercase tracking-tight">{row.date}</p>
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-0.5">
                  {row.clockIn} — {row.clockOut}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-primary font-mono">{row.hours}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
