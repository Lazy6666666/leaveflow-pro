import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  TrendingUp,
  Sparkles,
  ChevronRight,
  ArrowUpRight,
  Bot
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";

const EASE_CONCIERGE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_CONCIERGE } },
};

const LEAVE_BALANCES = [
  { type: "Annual", remaining: 18, total: 20, color: "terracotta-gradient" },
  { type: "Sick",   remaining: 8,  total: 10, color: "bg-amber-500" },
  { type: "Unpaid", remaining: 5,  total: 5,  color: "bg-muted-foreground/30" },
];

const RECENT_ACTIVITY = [
  { label: "Annual leave approved",  date: "Mar 24",    status: "approved"  },
  { label: "Sick day auto-logged",   date: "Mar 18",    status: "approved"  },
  { label: "Leave request pending",  date: "Apr 1–3",   status: "pending"   },
];

/**
 * Redesigned MobileHome: "The Digital Concierge"
 */
export default function MobileHome() {
  const { user } = useAuth();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";

  return (
    <div className="px-6 pt-16 pb-20 space-y-10 max-w-lg mx-auto bg-background min-h-screen font-sans animate-in fade-in duration-700">

      {/* ── GREETING HEADER ─────────────────────── */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="space-y-3"
      >
        <motion.div variants={fadeUp} className="flex items-center gap-3 pb-2">
          <Logo size="sm" showText={false} />
          <span className="font-display text-2xl font-bold tracking-tighter uppercase text-foreground">
            Balance.
          </span>
        </motion.div>
        <motion.div variants={fadeUp} className="flex items-center gap-3">
          <div className="h-1 w-8 terracotta-gradient rounded-full" />
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
            Concierge Active
          </span>
        </motion.div>
        <motion.h1 variants={fadeUp} className="text-5xl font-display font-bold tracking-tighter text-foreground leading-[0.95]">
          {greeting}, <br />
          <span className="text-primary italic font-medium">{firstName}.</span>
        </motion.h1>
        <motion.p variants={fadeUp} className="text-base text-muted-foreground font-medium">
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        </motion.p>
      </motion.div>

      {/* ── LEAVE BALANCE CARDS ─────────────────── */}
      <motion.section
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        <motion.div variants={fadeUp} className="flex items-center justify-between mb-6 px-1">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Resources
          </h2>
          <Link
            to="/mobile/leave"
            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-primary hover:opacity-70 transition-all"
          >
            Ledger <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 gap-4">
          {LEAVE_BALANCES.slice(0, 2).map((b, i) => (
            <motion.div
              key={b.type}
              variants={fadeUp}
              className="relative p-6 bg-card shadow-float rounded-[32px] overflow-hidden group"
            >
              <div className="flex justify-between items-end">
                 <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{b.type} Inventory</p>
                    <p className="text-4xl font-display font-bold text-foreground tabular-nums tracking-tight">
                      {b.remaining} <span className="text-lg text-muted-foreground/40 font-medium">Days</span>
                    </p>
                 </div>
                 <div className="h-12 w-12 bg-muted/50 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <TrendingUp size={20} />
                 </div>
              </div>

              <div className="mt-6 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={cn("h-full rounded-full", b.color)}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(b.remaining / b.total) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.2 + i * 0.1, ease: EASE_CONCIERGE }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── QUICK ACTIONS ────────────────────────── */}
      <motion.section
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        <motion.div variants={fadeUp} className="mb-6 px-1">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Concierge Services
          </h2>
        </motion.div>
        <div className="grid grid-cols-2 gap-5">
          {[
            { label: "Request",  to: "/mobile/leave",   icon: Calendar, gradient: "terracotta-gradient" },
            { label: "Clocking", to: "/mobile/clock",   icon: Clock, gradient: "bg-slate-800" },
            { label: "Security",   to: "/mobile/profile",   icon: Bot, gradient: "bg-slate-800" },
            { label: "Assistant",   to: "/mobile/ai",      icon: Sparkles, gradient: "terracotta-gradient" },
          ].map((a, i) => (
            <motion.div key={a.label} variants={fadeUp}>
              <Link
                to={a.to}
                className="group relative flex flex-col justify-between p-6 bg-card shadow-float rounded-[32px] aspect-square transition-all active:scale-95"
              >
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-lg", a.gradient)}>
                   <a.icon size={22} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground tracking-tight">{a.label}</span>
                  <ArrowUpRight size={16} className="text-muted-foreground/30 group-hover:text-primary transition-colors" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── RECENT ACTIVITY ──────────────────────── */}
      <motion.section
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        <motion.div variants={fadeUp} className="mb-6 px-1">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Recent Logs
          </h2>
        </motion.div>
        <motion.div variants={fadeUp} className="bg-card shadow-float rounded-[32px] overflow-hidden p-2">
          {RECENT_ACTIVITY.map((item, i) => (
            <div key={i} className={cn(
              "flex items-center gap-4 px-5 py-5 rounded-[24px] transition-all",
              i % 2 === 0 ? "bg-muted/30" : "bg-transparent"
            )}>
              <div className={cn(
                "h-2 w-2 rounded-full",
                item.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
              )} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate uppercase tracking-tight">{item.label}</p>
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-0.5">{item.date}</p>
              </div>
              <ChevronRight size={14} className="text-muted-foreground/20" />
            </div>
          ))}
        </motion.div>
      </motion.section>
    </div>
  );
}
