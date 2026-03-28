import { motion } from "framer-motion";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Bot,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

const EASE_CONCIERGE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const EVENTS = [
  { day: 24, type: "shift", time: "09:00 - 18:00", loc: "HQ Berlin" },
  { day: 25, type: "shift", time: "09:00 - 18:00", loc: "HQ Berlin" },
  { day: 26, type: "leave", time: "All Day", loc: "Sick Leave" },
  { day: 27, type: "shift", time: "09:00 - 18:00", loc: "HQ Berlin" },
];

/**
 * Redesigned MobileSchedule: "The Digital Concierge"
 */
export default function MobileSchedule() {
  const [monthOffset, setMonthOffset] = useState(0);
  const activeMonth = useMemo(() => {
    const next = new Date(2026, 2 + monthOffset, 1);
    return next;
  }, [monthOffset]);
  const daysInMonth = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 0).getDate();
  const highlightedDay = Math.min(28, daysInMonth);

  return (
    <div className="px-6 pt-16 pb-24 space-y-10 max-w-lg mx-auto bg-background min-h-screen font-sans">

      {/* ── HEADER ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE_CONCIERGE }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="h-1 w-8 terracotta-gradient rounded-full" />
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">Timeline Node</span>
        </div>
        <h1 className="text-4xl font-display font-bold tracking-tighter text-foreground">Work Flow</h1>
      </motion.div>

      {/* ── CALENDAR COMPONENT ──────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: EASE_CONCIERGE }}
        className="bg-card shadow-float rounded-[40px] p-8 space-y-8 border-0"
      >
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary">
                 <CalendarDays size={20} />
              </div>
              <h2 className="font-display text-xl font-bold">
                {activeMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
              </h2>
           </div>
           <div className="flex gap-2">
              <button
                 type="button"
                 aria-label="Previous month"
                 onClick={() => setMonthOffset((value) => value - 1)}
                 className="h-10 w-10 bg-muted/50 rounded-xl flex items-center justify-center text-muted-foreground active:scale-90 transition-all"
              >
                 <ChevronLeft size={18} />
              </button>
              <button
                 type="button"
                 aria-label="Next month"
                 onClick={() => setMonthOffset((value) => value + 1)}
                 className="h-10 w-10 bg-muted/50 rounded-xl flex items-center justify-center text-muted-foreground active:scale-90 transition-all"
              >
                 <ChevronRight size={18} />
              </button>
           </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
           {DAYS.map(d => (
             <div key={d} className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 py-2">
                {d}
             </div>
           ))}
           {Array.from({ length: daysInMonth }).map((_, i) => {
             const day = i + 1;
             const hasEvent = EVENTS.find(e => e.day === day);
             return (
               <div key={i} className="aspect-square relative flex items-center justify-center">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all",
                    day === highlightedDay ? "terracotta-gradient text-white shadow-lg shadow-primary/20 scale-110" : "text-muted-foreground/60 hover:bg-muted/50"
                  )}>
                     {day}
                  </div>
                  {hasEvent && day !== highlightedDay && (
                    <div className={cn(
                      "absolute bottom-1 h-1 w-1 rounded-full",
                      hasEvent.type === 'leave' ? "bg-red-400" : "bg-primary"
                    )} />
                  )}
               </div>
             );
           })}
        </div>
      </motion.section>

      {/* ── DAILY AGENDA ────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: EASE_CONCIERGE }}
      >
        <div className="flex items-center justify-between mb-6 px-1">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Protocol Agenda</h2>
          <Sparkles size={14} className="text-primary/40" />
        </div>

        <div className="bg-card shadow-float rounded-[32px] overflow-hidden p-2">
           {EVENTS.map((event, i) => (
             <div key={i} className={cn(
               "flex items-center gap-5 p-6 rounded-[24px] transition-all group",
               i === 0 ? "bg-primary/5" : "hover:bg-muted/30"
             )}>
                <div className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0",
                  event.type === 'leave' ? "bg-red-500/10 text-red-600" : "bg-white text-primary shadow-sm"
                )}>
                   {event.type === 'leave' ? <CalendarDays size={22} /> : <Clock size={22} />}
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-sm font-bold text-foreground uppercase tracking-tight">{event.time}</p>
                   <div className="flex items-center gap-2 mt-1 opacity-60">
                      <MapPin size={10} className="text-primary" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{event.loc}</span>
                   </div>
                </div>
                {i === 0 && (
                  <div className="bg-primary/10 text-primary text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-full">
                     Active
                  </div>
                )}
             </div>
           ))}
        </div>
      </motion.section>

      {/* ── MASCOT FOOTER ───────────────────────── */}
      <div className="bg-slate-800 p-8 rounded-[32px] text-white flex items-center gap-6 relative overflow-hidden">
         <div className="absolute top-0 right-0 opacity-10 translate-x-1/4 -translate-y-1/4">
            <Clock size={160} />
         </div>
         <div className="relative z-10 h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
            <Bot size={28} />
         </div>
         <div className="relative z-10 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Timeline Sync</p>
            <p className="text-sm font-medium leading-relaxed">Your workflow schedule is synchronized across all 4 terminal nodes.</p>
         </div>
      </div>
    </div>
  );
}
