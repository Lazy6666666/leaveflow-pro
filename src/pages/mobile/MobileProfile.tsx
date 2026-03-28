import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  ShieldCheck,
  Bell,
  CreditCard,
  LogOut,
  ChevronRight,
  Bot,
  Fingerprint,
  Smartphone,
  Lock
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";

const EASE_CONCIERGE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * Redesigned MobileProfile: "The Digital Concierge"
 */
export default function MobileProfile() {
  const { user, signOut } = useAuth();
  const fullName = user?.user_metadata?.full_name ?? "User Unit";
  const email = user?.email ?? "unit@balance.io";
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const menuGroups = [
    {
      label: "Identity & Governance",
      items: [
        { label: "Profile Telemetry", icon: User, desc: "Personal metadata" },
        { label: "Biometric Auth", icon: Fingerprint, desc: "Bio-verification keys" },
        { label: "Compliance Status", icon: ShieldCheck, desc: "Regulatory standing" },
      ]
    },
    {
      label: "System Preferences",
      items: [
        { label: "Notifications", icon: Bell, desc: "Protocol alerts" },
        { label: "Device Access", icon: Smartphone, desc: "Linked hardware" },
        { label: "Privacy Vault", icon: Lock, desc: "Sovereign data controls" },
      ]
    }
  ];

  return (
    <div className="px-6 pt-16 pb-24 space-y-10 max-w-lg mx-auto bg-background min-h-screen font-sans">

      {/* ── PROFILE HEADER ──────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE_CONCIERGE }}
        className="flex flex-col items-center text-center space-y-6"
      >
        <div className="relative">
           <div className="h-32 w-32 terracotta-gradient rounded-[40px] absolute -inset-1 blur-xl opacity-20 animate-pulse" />
           <Avatar className="h-32 w-32 rounded-[40px] shadow-float border-0 relative z-10">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-white text-3xl font-display font-bold text-primary">
                {fullName.split(" ").map(n => n[0]).join("").toUpperCase()}
              </AvatarFallback>
           </Avatar>
           <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-white rounded-2xl shadow-lg flex items-center justify-center z-20">
              <ShieldCheck size={20} className="text-emerald-500" />
           </div>
        </div>

        <div className="space-y-1">
           <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">{fullName}</h1>
           <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">{email}</p>
        </div>
      </motion.div>

      {/* ── MENU GROUPS ─────────────────────────── */}
      <div className="space-y-10">
        {menuGroups.map((group, idx) => (
          <motion.section
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 * idx, ease: EASE_CONCIERGE }}
          >
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-6 px-1">
              {group.label}
            </h2>
            <div className="bg-card shadow-float rounded-[32px] overflow-hidden p-2">
              {group.items.map((item, i) => (
                <React.Fragment key={item.label}>
                  <button
                    type="button"
                    aria-expanded={expandedItem === item.label}
                    onClick={() => setExpandedItem((prev) => prev === item.label ? null : item.label)}
                    className={cn(
                      "w-full flex items-center gap-5 p-5 rounded-[24px] transition-all active:scale-95",
                      i % 2 === 0 ? "bg-muted/30" : "bg-transparent"
                    )}
                  >
                    <div className="h-12 w-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-primary shrink-0">
                       <item.icon size={22} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold text-foreground tracking-tight">{item.label}</p>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-0.5">{item.desc}</p>
                    </div>
                    <ChevronRight size={16} className={cn("text-muted-foreground/30 transition-transform", expandedItem === item.label && "rotate-90")} />
                  </button>
                  <AnimatePresence initial={false}>
                    {expandedItem === item.label ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden px-5 pb-5 text-left"
                      >
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {item.desc}. Live mobile controls will attach here as the concierge profile workflows are wired to production data.
                        </p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </React.Fragment>
              ))}
            </div>
          </motion.section>
        ))}
      </div>

      {/* ── SECURITY MASCOT ─────────────────────── */}
      <div className="bg-slate-800 p-8 rounded-[32px] text-white flex items-center gap-6 relative overflow-hidden">
         <div className="absolute top-0 right-0 opacity-10 translate-x-1/4 -translate-y-1/4">
            <ShieldCheck size={160} />
         </div>
         <div className="relative z-10 h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
            <Bot size={28} />
         </div>
         <div className="relative z-10 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Sovereign Link</p>
            <p className="text-sm font-medium leading-relaxed">Your identity telemetry is cryptographically secured.</p>
         </div>
      </div>

      {/* ── SIGN OUT ────────────────────────────── */}
      <button
        onClick={signOut}
        className="w-full h-16 bg-red-500/5 text-red-600 rounded-[32px] font-bold uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 active:scale-95 transition-all"
      >
        <LogOut size={18} />
        Terminate Session
      </button>
    </div>
  );
}
