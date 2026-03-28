import { Outlet, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Calendar,
  Clock,
  User,
  Users,
  CheckSquare,
  BarChart3,
  CalendarDays,
  MessageSquare,
  Bot,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const EASE_CONCIERGE: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const EMPLOYEE_NAV: NavItem[] = [
  { label: "Home",     path: "/mobile/home",         icon: Home },
  { label: "Flow",    path: "/mobile/leave",        icon: Calendar },
  { label: "Session",    path: "/mobile/clock",        icon: Clock },
  { label: "Identity",  path: "/mobile/profile",      icon: User },
  { label: "Concierge", path: "/mobile/ai",           icon: Sparkles },
];

const MANAGER_NAV: NavItem[] = [
  { label: "Home",      path: "/mobile/home",        icon: Home },
  { label: "Team",      path: "/mobile/team",        icon: Users },
  { label: "Queue", path: "/mobile/approvals",   icon: CheckSquare },
  { label: "Timeline",  path: "/mobile/schedule",    icon: CalendarDays },
  { label: "Audit",   path: "/mobile/reports",     icon: BarChart3 },
  { label: "Concierge", path: "/mobile/ai",          icon: Sparkles },
];

/**
 * Redesigned MobileLayout: "The Digital Concierge"
 * Aesthetic: Elevated Glassmorphism Tab Bar, Soft Layering.
 */
export function MobileLayout() {
  const location = useLocation();
  const { hasManagerAccess } = useAuth();
  const nav = hasManagerAccess ? MANAGER_NAV : EMPLOYEE_NAV;

  return (
    <div className="relative flex flex-col min-h-[100dvh] bg-background text-foreground overflow-hidden font-sans">
      {/* Page content */}
      <main className="flex-1 overflow-y-auto pb-32" id="mobile-main-content">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.5, ease: EASE_CONCIERGE }}
            className="min-h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── CONCIERGE FLOATING NAVIGATION ────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-8 px-6 pointer-events-none">
        <motion.nav
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: EASE_CONCIERGE }}
          className="pointer-events-auto flex items-center justify-around gap-1 p-2 bg-white/70 backdrop-blur-2xl shadow-float rounded-[32px] w-full max-w-md border-0"
          aria-label="Concierge Navigation"
        >
          {nav.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
            const isConcierge = item.label === "Concierge";

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex-1 flex flex-col items-center gap-1.5 py-3 transition-all duration-500 rounded-2xl group outline-none",
                  isActive && !isConcierge ? "bg-primary/5" : "hover:bg-muted/50"
                )}
              >
                {/* Visual indicator for Concierge/AI tab */}
                {isConcierge && (
                   <div className={cn(
                     "absolute inset-0 terracotta-gradient rounded-2xl opacity-0 transition-opacity duration-500",
                     isActive && "opacity-100"
                   )} />
                )}

                <div className="relative z-10">
                  <item.icon
                    size={20}
                    className={cn(
                      "transition-all duration-500",
                      isActive
                        ? isConcierge ? "text-white" : "text-primary scale-110"
                        : "text-muted-foreground/40 group-hover:text-primary"
                    )}
                  />
                </div>

                <span
                  className={cn(
                    "relative z-10 text-[9px] font-bold uppercase tracking-widest transition-all duration-500",
                    isActive
                      ? isConcierge ? "text-white" : "text-primary"
                      : "text-muted-foreground/30 group-hover:text-primary"
                  )}
                >
                  {item.label}
                </span>

                {/* Active Indicator Line (Concierge Style) */}
                {isActive && !isConcierge && (
                  <motion.div
                    layoutId="mobile-nav-dot"
                    className="absolute -bottom-1 h-1 w-4 terracotta-gradient rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </motion.nav>
      </div>
    </div>
  );
}
