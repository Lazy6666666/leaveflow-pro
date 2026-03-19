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
} from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

const employeeItems = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: "AI Workspace", href: "/ai-workspace", icon: <Bot className="h-5 w-5" /> },
  { label: "Leave & Holidays", href: "/leave-hub", icon: <CalendarDays className="h-5 w-5" /> },
  { label: "Attendance", href: "/attendance", icon: <Fingerprint className="h-5 w-5" /> },
  { label: "Identity & Security", href: "/identity-hub", icon: <UserCog className="h-5 w-5" /> },
];

const managerItems = [
  { label: "Manager Hub", href: "/manager/hub", icon: <CheckSquare className="h-5 w-5" /> },
];

const adminItems = [
  { label: "HR Operations", href: "/admin/hr-operations", icon: <Users className="h-5 w-5" /> },
  { label: "System Admin", href: "/admin/system", icon: <Settings className="h-5 w-5" /> },
];

export function AppSidebar() {
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
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
        {/* Workspace Header */}
        <div className="mb-6 px-2 pt-2 flex items-center justify-between">
          <Logo size="sm" showText={open} variant="white" />
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
            className="ml-auto p-1.5 rounded-lg text-white hover:bg-white/10 transition-colors shrink-0"
          >
            {open ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </button>
        </div>

        {/* Employee */}
        <SidebarGroup label="Employee" open={open}>
          {employeeItems.map((link, idx) => (
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
      <div className="mt-auto pt-10 px-2 pb-2">
        <button
          type="button"
          onClick={signOut}
          aria-label="Sign Out"
          title="Sign Out"
          className="flex items-center gap-3 w-full p-3 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all group"
        >
          <LogOut className="h-5 w-5 text-white group-hover:text-red-300" />
          <motion.span
            animate={{ opacity: open ? 1 : 0, display: open ? "block" : "none" }}
            className="text-sm font-bold text-white group-hover:text-white"
          >
            Sign Out
          </motion.span>
        </button>
      </div>
    </SidebarBody>
  );
}

const SidebarGroup = ({ label, children, open }: { label: string; children: ReactNode; open: boolean }) => (
  <div className="space-y-2 mb-6">
    <motion.p
      animate={{ opacity: open ? 1 : 0, display: open ? "block" : "none" }}
      className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/90"
    >
      {label}
    </motion.p>
    <div className="space-y-1">{children}</div>
  </div>
);
