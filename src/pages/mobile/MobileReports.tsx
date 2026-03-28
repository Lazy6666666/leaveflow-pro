import { motion } from "framer-motion";
import {
  TrendingUp,
  Download,
  ChevronRight,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  Bot
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const EASE_CONCIERGE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const METRICS = [
  { label: "Utilization", value: "84%", trend: "+2.4%", desc: "vs last month" },
  { label: "Compliance", value: "99.2%", trend: "Stable", desc: "No violations" },
];

/**
 * Redesigned MobileReports: "The Digital Concierge"
 */
export default function MobileReports() {
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
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">Insight Engine</span>
        </div>
        <h1 className="text-4xl font-display font-bold tracking-tighter text-foreground">Audit Telemetry</h1>
      </motion.div>

      {/* ── METRIC CARDS ────────────────────────── */}
      <div className="grid grid-cols-2 gap-5">
        {METRICS.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * i, duration: 0.6, ease: EASE_CONCIERGE }}
            className="bg-card p-8 rounded-[32px] shadow-float space-y-4"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{m.label}</span>
            <div className="text-3xl font-display font-bold text-foreground">{m.value}</div>
            <div className="flex items-center gap-1.5">
               <span className="text-[10px] font-bold text-primary">{m.trend}</span>
               <span className="text-[9px] font-medium text-muted-foreground uppercase">{m.desc}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── VISUAL INSIGHT ──────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: EASE_CONCIERGE }}
        className="bg-slate-800 p-10 rounded-[40px] shadow-xl text-white space-y-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 opacity-10 translate-x-1/4 -translate-y-1/4">
           <Activity size={240} />
        </div>

        <div className="relative z-10">
           <div className="flex justify-between items-start mb-10">
              <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center">
                 <PieChart size={24} className="text-primary" />
              </div>
              <button
                 type="button"
                 onClick={() => toast.info("Detailed ledger export is being prepared for this reporting cycle.")}
                 className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
              >
                 Full Ledger
              </button>
           </div>

           <div className="space-y-2">
              <h3 className="font-display text-2xl font-bold">Leave Distribution</h3>
              <p className="text-white/60 text-sm leading-relaxed max-w-[25ch]">Predictive analysis indicates peak utilization in Q3 Cycle.</p>
           </div>

           <div className="mt-10 flex gap-3 h-16 items-end">
              {[40, 70, 55, 90, 60, 80, 45].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: 0.5 + (i * 0.05), duration: 1 }}
                  className="flex-1 bg-white/10 rounded-t-lg relative group"
                >
                   {i === 3 && <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />}
                </motion.div>
              ))}
           </div>
        </div>
      </motion.section>

      {/* ── EXPORT ACTION ───────────────────────── */}
      <button
         type="button"
         onClick={() => toast.success("Cycle report export queued.")}
         className="w-full h-20 bg-card shadow-float rounded-[32px] p-6 flex items-center justify-between group active:scale-[0.98] transition-all"
      >
         <div className="flex items-center gap-5">
            <div className="h-12 w-12 bg-muted/50 rounded-2xl flex items-center justify-center text-primary group-hover:terracotta-gradient group-hover:text-white transition-all">
               <Download size={20} />
            </div>
            <div className="text-left">
               <p className="text-sm font-bold text-foreground uppercase tracking-tight">Export Cycle Data</p>
               <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-0.5">PDF · Ledger v4.2</p>
            </div>
         </div>
         <ArrowUpRight size={20} className="text-muted-foreground/20 group-hover:text-primary transition-colors" />
      </button>

      {/* ── CONCIERGE REPORTING ──────────────────── */}
      <div className="bg-muted/40 p-8 rounded-[32px] flex items-center gap-6">
         <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
            <Bot size={24} className="text-primary" />
         </div>
         <p className="text-sm text-muted-foreground leading-relaxed">I have prepared 3 dynamic reporting views for your departmental review.</p>
      </div>
    </div>
  );
}
