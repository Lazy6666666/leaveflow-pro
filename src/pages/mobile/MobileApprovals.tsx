import { motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  ChevronRight,
  Clock,
  User,
  AlertCircle,
  ShieldCheck,
  Bot
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import { toast } from "sonner";

const EASE_CONCIERGE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const PENDING = [
  { id: 1, name: "Sarah Jenkins", type: "Annual Leave", range: "Apr 12 - Apr 15", days: "4d" },
  { id: 2, name: "Michael Chang", type: "Sick Leave", range: "Mar 28", days: "1d" },
];

/**
 * Redesigned MobileApprovals: "The Digital Concierge"
 */
export default function MobileApprovals() {
  const [pending, setPending] = useState(PENDING);

  const handleDecision = (requestId: number, decision: "approved" | "rejected") => {
    const request = pending.find((item) => item.id === requestId);
    if (!request) return;
    setPending((prev) => prev.filter((item) => item.id !== requestId));
    toast.success(
      decision === "approved"
        ? `${request.name}'s request approved.`
        : `${request.name}'s request rejected.`,
    );
  };

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
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">Authority Node</span>
        </div>
        <h1 className="text-4xl font-display font-bold tracking-tighter text-foreground">Decision Queue</h1>
      </motion.div>

      {/* ── PENDING LIST ────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: EASE_CONCIERGE }}
      >
        <div className="flex items-center justify-between mb-6 px-1">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Pending Requests</h2>
          <div className="bg-amber-500/10 text-amber-600 text-[10px] font-bold px-3 py-1 rounded-full animate-pulse">
             {pending.length} Awaiting
          </div>
        </div>

        <div className="space-y-6">
          {pending.map((req, i) => (
            <div key={req.id} className="bg-card shadow-float rounded-[32px] p-8 space-y-8 relative overflow-hidden group">
               <div className="flex items-start gap-5">
                  <Avatar className="h-12 w-12 rounded-2xl shadow-sm border-0">
                     <AvatarFallback className="bg-muted text-primary font-display font-bold">
                        {req.name.split(" ").map(n => n[0]).join("")}
                     </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                     <p className="text-base font-bold text-foreground uppercase tracking-tight">{req.name}</p>
                     <p className="text-[11px] font-bold text-primary/60 uppercase tracking-widest mt-1">{req.type}</p>
                  </div>
                  <div className="text-right">
                     <span className="text-lg font-display font-bold text-foreground">{req.days}</span>
                  </div>
               </div>

               <div className="bg-muted/40 p-5 rounded-2xl flex items-center gap-4">
                  <Clock size={16} className="text-muted-foreground/40" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{req.range}</span>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <button
                     type="button"
                     onClick={() => handleDecision(req.id, "rejected")}
                     className="h-14 bg-red-500/5 text-red-600 rounded-2xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                     <XCircle size={16} />
                     Reject
                  </button>
                  <button
                     type="button"
                     onClick={() => handleDecision(req.id, "approved")}
                     className="h-14 terracotta-gradient text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
                  >
                     <CheckCircle2 size={16} />
                     Approve
                  </button>
               </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── CONCIERGE INSIGHT ───────────────────── */}
      <div className="bg-slate-800 p-8 rounded-[32px] text-white flex items-start gap-6">
         <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
            <Bot size={24} className="text-primary" />
         </div>
         <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">System Integrity</p>
            <p className="text-sm font-medium leading-relaxed">{pending.length === 0 ? "The queue is clear. Workforce thresholds remain within target parameters." : "Approving Sarah Jenkins' request will maintain departmental minimum staffing threshold (currently at 85%)."}</p>
         </div>
      </div>
    </div>
  );
}
