import { motion } from "framer-motion";
import {
  Users,
  Search,
  Filter,
  ChevronRight,
  MapPin,
  Clock,
  CheckCircle2,
  Bot
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const EASE_CONCIERGE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const TEAM = [
  { name: "Sarah Jenkins", role: "Engineering", status: "Active", loc: "HQ Berlin", avatar: null },
  { name: "Michael Chang", role: "Design", status: "Off-site", loc: "Remote", avatar: null },
  { name: "Anais Lebrun", role: "Operations", status: "Active", loc: "HQ Berlin", avatar: null },
  { name: "David Wilson", role: "HR", status: "Away", loc: "Sick Leave", avatar: null },
];

/**
 * Redesigned MobileTeam: "The Digital Concierge"
 */
export default function MobileTeam() {
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
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">Team Telemetry</span>
        </div>
        <h1 className="text-4xl font-display font-bold tracking-tighter text-foreground">Unit Proximity</h1>
      </motion.div>

      {/* ── SEARCH BOX ──────────────────────────── */}
      <div className="relative group">
         <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/40 group-focus-within:text-primary transition-colors" />
         <input
           type="text"
           placeholder="Query workforce..."
           className="w-full h-16 bg-card shadow-float border-0 rounded-[24px] pl-14 pr-6 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40"
         />
      </div>

      {/* ── TEAM LIST ───────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: EASE_CONCIERGE }}
      >
        <div className="flex items-center justify-between mb-6 px-1">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Active Units</h2>
          <div className="bg-primary/5 text-primary text-[10px] font-bold px-3 py-1 rounded-full">
             {TEAM.length} Total
          </div>
        </div>

        <div className="bg-card shadow-float rounded-[32px] overflow-hidden p-2">
          {TEAM.map((member, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-5 p-5 rounded-[24px] transition-all active:scale-95",
                i % 2 === 0 ? "bg-muted/30" : "bg-transparent"
              )}
            >
              <div className="relative">
                 <Avatar className="h-14 w-14 rounded-2xl shadow-sm border-0">
                    <AvatarFallback className="bg-white text-primary font-display font-bold">
                       {member.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                 </Avatar>
                 <div className={cn(
                    "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-4 border-card",
                    member.status === 'Active' ? 'bg-emerald-500' : member.status === 'Away' ? 'bg-red-500' : 'bg-amber-500'
                 )} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate uppercase tracking-tight">{member.name}</p>
                <div className="flex items-center gap-3 mt-1 opacity-60">
                   <div className="flex items-center gap-1">
                      <MapPin size={10} className="text-primary" />
                      <span className="text-[9px] font-bold uppercase tracking-widest">{member.loc}</span>
                   </div>
                   <div className="h-1 w-1 bg-muted-foreground/30 rounded-full" />
                   <span className="text-[9px] font-bold uppercase tracking-widest">{member.role}</span>
                </div>
              </div>

              <button className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary active:scale-90 transition-transform">
                 <ChevronRight size={18} />
              </button>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── CONCIERGE HUD ───────────────────────── */}
      <div className="bg-card p-10 rounded-[40px] shadow-float text-center space-y-6 relative overflow-hidden group">
         <div className="absolute top-0 left-0 w-full h-1 terracotta-gradient opacity-20" />
         <div className="h-16 w-16 bg-primary/5 rounded-[24px] flex items-center justify-center mx-auto text-primary group-hover:scale-110 transition-transform duration-700">
            <Bot size={32} />
         </div>
         <div className="space-y-2">
            <h3 className="font-display text-xl font-bold">Workforce Pulse</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">System telemetry indicates 82% team synchronization for the current cycle.</p>
         </div>
         <button className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary hover:opacity-70 transition-opacity">
            Request Audit Ledger
         </button>
      </div>
    </div>
  );
}
