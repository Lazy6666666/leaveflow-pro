import { motion } from "framer-motion";
import {
  CalendarDays,
  Plus,
  ChevronRight,
  Clock,
  History,
  Sparkles,
  ArrowRight,
  Bot
} from "lucide-react";
import { cn } from "@/lib/utils";

const EASE_CONCIERGE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const HISTORY = [
  { type: "Annual Leave", range: "Apr 12 - Apr 15", days: "4d", status: "approved" },
  { type: "Sick Leave", range: "Mar 18", days: "1d", status: "approved" },
  { type: "Public Holiday", range: "Mar 29", days: "1d", status: "upcoming" },
];

/**
 * Redesigned MobileLeave: "The Digital Concierge"
 */
export default function MobileLeave() {
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
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">Governance Layer</span>
        </div>
        <h1 className="text-4xl font-display font-bold tracking-tighter text-foreground">Time & Flow</h1>
      </motion.div>

      {/* ── ACTION CARD ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.1, ease: EASE_CONCIERGE }}
        className="relative p-10 terracotta-gradient rounded-[40px] shadow-xl shadow-primary/20 overflow-hidden text-white group"
      >
        <div className="absolute -top-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-1000">
           <CalendarDays size={200} />
        </div>

        <div className="relative z-10 space-y-8">
           <div className="space-y-2">
              <h2 className="text-3xl font-display font-bold leading-tight">Initiate New <br />Request.</h2>
              <p className="text-white/70 text-sm leading-relaxed max-w-[20ch]">The Digital Concierge will handle your application flow.</p>
           </div>

           <button className="h-14 px-8 bg-white text-primary rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-lg flex items-center gap-3 active:scale-95 transition-all">
              <Plus size={18} />
              <span>Begin Flow</span>
           </button>
        </div>
      </motion.div>

      {/* ── SUMMARY GRID ────────────────────────── */}
      <div className="grid grid-cols-2 gap-5">
         <div className="bg-card p-8 rounded-[32px] shadow-float space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Available</span>
            <div className="text-4xl font-display font-bold text-foreground">18<span className="text-sm text-primary ml-1">d</span></div>
            <div className="h-1 w-full bg-muted rounded-full">
               <div className="h-full w-3/4 terracotta-gradient rounded-full" />
            </div>
         </div>
         <div className="bg-card p-8 rounded-[32px] shadow-float space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Utilized</span>
            <div className="text-4xl font-display font-bold text-foreground">02<span className="text-sm text-muted-foreground ml-1">d</span></div>
            <div className="h-1 w-full bg-muted rounded-full">
               <div className="h-full w-1/4 bg-slate-800 rounded-full" />
            </div>
         </div>
      </div>

      {/* ── HISTORY LEDGER ──────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: EASE_CONCIERGE }}
      >
        <div className="flex items-center justify-between mb-6 px-1">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Historical Ledger</h2>
          <History size={14} className="text-muted-foreground/30" />
        </div>

        <div className="bg-card shadow-float rounded-[32px] overflow-hidden p-2">
          {HISTORY.map((item, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-4 p-5 rounded-[24px] transition-all",
                i % 2 === 0 ? "bg-muted/30" : "bg-transparent"
              )}
            >
              <div className={cn(
                "h-10 w-10 rounded-xl shadow-sm flex items-center justify-center",
                item.status === 'upcoming' ? 'bg-primary/5 text-primary' : 'bg-white text-muted-foreground'
              )}>
                 <CalendarDays size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground uppercase tracking-tight">{item.type}</p>
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-0.5">
                  {item.range}
                </p>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <span className="text-[10px] font-bold text-foreground font-mono">{item.days}</span>
                <span className={cn(
                  "text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full",
                  item.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-primary/10 text-primary'
                )}>
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── MASCOT ADVICE ───────────────────────── */}
      <div className="bg-muted/40 p-8 rounded-[32px] flex items-start gap-5">
         <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
            <Bot size={24} className="text-primary" />
         </div>
         <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Concierge Tip</p>
            <p className="text-sm text-muted-foreground leading-relaxed">Initiating leave 30 days in advance increases approval velocity by 40%.</p>
         </div>
      </div>
    </div>
  );
}
