import { ReactNode } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  UserCog,
  CheckSquare,
  Users,
  Settings,
  LogOut,
  Fingerprint,
  Bot,
  PanelLeftClose,
  PanelLeftOpen,
  PlusCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const employeeItems = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: "AI Workspace", href: "/ai-workspace", icon: <Bot className="h-5 w-5" /> },
  { label: "Leave & Time Off", href: "/my-leave", icon: <CalendarDays className="h-5 w-5" /> },
  { label: "Attendance", href: "/attendance", icon: <Fingerprint className="h-5 w-5" /> },
  { label: "Identity & Security", href: "/profile", icon: <UserCog className="h-5 w-5" /> },
];

const managerItems = [
  { label: "Manager Hub", href: "/manager/hub", icon: <CheckSquare className="h-5 w-5" /> },
];

const adminItems = [
  { label: "HR Operations", href: "/admin/hr-operations", icon: <Users className="h-5 w-5" /> },
  { label: "System Admin", href: "/admin/system", icon: <Settings className="h-5 w-5" /> },
];

interface AppSidebarProps {
  onRequestLeave?: () => void;
}

export function AppSidebar({ onRequestLeave }: AppSidebarProps) {
  const { open, setOpen } = useSidebar();
  const location = useLocation();
  const { hasManagerAccess, hasRole, signOut, needsAdminSetup } = useAuth();
  const { track } = useAnalytics();

  const isActive = (path: string) => location.pathname === path;
  const trackSidebarClick = (item: string, toPath: string) => {
    void track(
      "sidebar_nav_clicked",
      { item, from_path: location.pathname, to_path: toPath },
      { path: location.pathname },
    );
  };

  return (
    <SidebarBody className="bg-[#171411] border-r border-white/5 text-white">
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-3">
        {/* Workspace Header */}
        <div className="mb-4 px-3 flex items-center justify-between">
          <Logo size="sm" showText={open} variant="white" />
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
            className="ml-auto p-1.5 rounded-lg text-white hover:bg-white/10 transition-colors shrink-0 hidden md:block"
          >
            {open ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </button>
        </div>

        {/* Action Button - Mobile gets priority if they click menu */}
        <div className="px-2 mb-6">
           <Button 
            onClick={() => {
              onRequestLeave?.();
              if (window.innerWidth < 768) setOpen(false);
            }} 
            className={cn("w-full transition-all duration-200 bg-primary/20 text-primary hover:bg-primary/30 flex justify-start pl-3", open ? "" : "px-0 justify-center group relative")} 
            variant="ghost"
           >
            <PlusCircle className={cn("h-5 w-5 shrink-0", open ? "mr-2.5" : "")} />
            <motion.span
              animate={{ opacity: open ? 1 : 0, width: open ? "auto" : 0 }}
              className="overflow-hidden whitespace-nowrap font-medium"
            >
              New Request
            </motion.span>
           </Button>
        </div>

        {/* Employee */}
        <SidebarGroup label="Employee" open={open}>
          {employeeItems.map((link, idx) => (
            <SidebarLink
              key={idx}
              link={link}
              onClick={() => trackSidebarClick(link.label, link.href)}
              className={cn(
                "hover:bg-white/5 rounded-xl px-2 py-2.5 transition-[background-color,border-color] duration-200",
                isActive(link.href) && "border-l-2 border-emerald-500/60 bg-white/10 text-white font-semibold pl-2"
              )}
            />
          ))}
        </SidebarGroup>

        {hasManagerAccess && (
          <>
            <Separator className="my-4 bg-white/5" />
            <SidebarGroup label="Manager" open={open}>
              {managerItems.map((link, idx) => (
                <SidebarLink
                  key={idx}
                  link={link}
                  onClick={() => trackSidebarClick(link.label, link.href)}
                  className={cn(
                    "hover:bg-white/5 rounded-xl px-2 py-2.5 transition-all duration-200",
                    isActive(link.href) && "bg-white/10 text-white font-bold"
                  )}
                />
              ))}
            </SidebarGroup>
          </>
        )}

        {hasRole("hr_admin") && (
          <>
            <Separator className="my-4 bg-white/5" />
            <SidebarGroup label="HR Admin" open={open}>
              {adminItems.map((link, idx) => (
                <SidebarLink
                  key={idx}
                  link={link}
                  onClick={() => trackSidebarClick(link.label, link.href)}
                  className={cn(
                    "hover:bg-white/5 rounded-xl px-2 py-2.5 transition-all duration-200",
                    isActive(link.href) && "bg-white/10 text-white font-bold"
                  )}
                />
              ))}
            </SidebarGroup>
          </>
        )}

        {needsAdminSetup && !hasRole("hr_admin") && (
          <>
            <Separator className="my-4 bg-white/5" />
            <SidebarGroup label="Setup" open={open}>
              <SidebarLink
                link={{ label: "Admin Setup", href: "/admin-setup", icon: <Settings className="h-5 w-5" /> }}
                onClick={() => trackSidebarClick("Admin Setup", "/admin-setup")}
                className={cn(
                  "hover:bg-white/5 rounded-xl px-2 py-2.5 transition-all duration-200",
                  isActive("/admin-setup") && "bg-white/10 text-white font-bold"
                )}
              />
            </SidebarGroup>
          </>
        )}
      </div>

      {/* User Footer */}
      <div className="mt-auto pt-6 px-2 pb-3">
        <button
          type="button"
          onClick={signOut}
          aria-label="Sign Out"
          title="Sign Out"
          className="flex items-center gap-3 w-full p-2.5 rounded-xl border border-transparent hover:bg-white/5 transition-[background-color,border-color] duration-200 group"
        >
          <LogOut className="h-5 w-5 text-white/70 group-hover:text-red-400 shrink-0" />
          <motion.span
            animate={{ opacity: open ? 1 : 0, display: open ? "block" : "none" }}
            className="text-sm font-medium text-white/70 group-hover:text-red-400"
          >
            Sign Out
          </motion.span>
        </button>
      </div>
    </SidebarBody>
  );
}

const SidebarGroup = ({ label, children, open }: { label: string; children: ReactNode; open: boolean }) => (
  <div className="space-y-1 mb-6">
    <motion.p
      animate={{ opacity: open ? 1 : 0, display: open ? "block" : "none" }}
      className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/40"
    >
      {label}
    </motion.p>
    <div className="space-y-0.5">{children}</div>
  </div>
);
