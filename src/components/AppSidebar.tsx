import { ReactNode } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  UserCog,
  ClipboardCheck,
  Users,
  Settings,
  LogOut,
  Fingerprint,
  Bot,
  PanelLeftClose,
  PanelLeftOpen,
  PlusCircle,
  FileWarning,
  BriefcaseBusiness,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useAuth, type AppFeature } from "@/contexts/AuthContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type AppSidebarItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  feature?: "agent_workspace" | "document_expiry" | "hr_operations" | "admin_system";
};

export const employeeItems: AppSidebarItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Leave & Time Off", href: "/my-leave", icon: CalendarDays },
  { label: "Attendance", href: "/attendance", icon: Fingerprint },
  { label: "Identity & Security", href: "/profile", icon: UserCog },
];

export const managerItems: AppSidebarItem[] = [
  { label: "Manager Hub", href: "/manager/hub", icon: ClipboardCheck },
];

export const adminItems: AppSidebarItem[] = [
  { label: "Agent Workspace", href: "/admin/agent-workspace", icon: Bot, feature: "agent_workspace" },
  { label: "Careers", href: "/careers", icon: BriefcaseBusiness, feature: "hr_operations" },
  { label: "Document Expiry", href: "/admin/document-expiry", icon: FileWarning, feature: "document_expiry" },
  { label: "HR Operations", href: "/admin/hr-operations", icon: Users, feature: "hr_operations" },
  { label: "System Admin", href: "/admin/system", icon: Settings, feature: "admin_system" },
];

interface AppSidebarProps {
  onRequestLeave?: () => void;
}

/**
 * Redesigned AppSidebar: "The Digital Concierge"
 * Aesthetic: Warm, Authoritative, No-Line Philosophy.
 */
export function AppSidebar({ onRequestLeave }: AppSidebarProps) {
  const { open, setOpen } = useSidebar();
  const location = useLocation();
  const auth = useAuth();
  const hasFeature = auth.hasFeature ?? ((feature: AppFeature) => {
    switch (feature) {
      case "manager_hub":
        return auth.hasManagerAccess ?? false;
      case "admin_system":
      case "hr_operations":
      case "document_expiry":
      case "agent_workspace":
        return auth.hasRole?.("hr_admin") ?? false;
      case "admin_setup":
        return (auth.needsAdminSetup ?? false) && !(auth.hasRole?.("hr_admin") ?? false);
      default:
        return false;
    }
  });
  const signOut = auth.signOut;
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
    <SidebarBody className="bg-[#171411] border-r-0 text-white/70 antialiased font-sans">
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-8">
        {/* Workspace Header */}
        <div className="mb-10 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo size="sm" showText={false} variant="white" className="h-7 w-7" />
            <motion.span
              animate={{ opacity: open ? 1 : 0, width: open ? "auto" : 0 }}
              className="font-display text-xl font-bold tracking-tight text-white uppercase overflow-hidden whitespace-nowrap"
            >
              Balance.
            </motion.span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
            title={open ? "Collapse sidebar" : "Expand sidebar"}
            className="ml-auto hidden shrink-0 p-1.5 text-white/30 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:block"
          >
            {open ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </button>
        </div>

        {/* Action Button: Terracotta Gradient */}
        <div className="px-4 mb-10">
           <Button
            onClick={() => {
              onRequestLeave?.();
              if (window.innerWidth < 768) setOpen(false);
            }}
            aria-label="New Request"
            title="New Request"
            className={cn(
              "w-full h-12 transition-all duration-300 rounded-xl border-0 terracotta-gradient text-white shadow-lg shadow-primary/10 flex justify-start px-4",
              open ? "" : "px-0 justify-center group relative"
            )}
           >
            <PlusCircle className={cn("h-5 w-5 shrink-0", open ? "mr-3" : "")} />
            <motion.span
              animate={{ opacity: open ? 1 : 0, width: open ? "auto" : 0 }}
              className="overflow-hidden whitespace-nowrap text-sm font-semibold tracking-wide"
            >
              New Request
            </motion.span>
           </Button>
        </div>

        {/* Navigation Groups */}
        <div className="space-y-10">
          <SidebarGroup label="Employee" open={open}>
                {employeeItems.map((link, idx) => (
                  <SidebarLink
                    key={idx}
                    link={{ ...link, icon: <link.icon className={cn("h-5 w-5 transition-colors", isActive(link.href) ? "text-primary" : "group-hover:text-white")} /> }}
                    onClick={() => trackSidebarClick(link.label, link.href)}
                    className={cn(
                  "hover:bg-white/5 rounded-xl mx-2 px-4 py-3 transition-all duration-200 group border-0",
                  isActive(link.href) && "bg-white/10 text-white font-semibold"
                )}
                labelClassName="text-sm font-medium tracking-wide"
              />
            ))}
          </SidebarGroup>

          {hasFeature("manager_hub") && (
            <SidebarGroup label="Manager" open={open}>
              {managerItems.map((link, idx) => (
                <SidebarLink
                  key={idx}
                  link={{ ...link, icon: <link.icon className={cn("h-5 w-5 transition-colors", isActive(link.href) ? "text-primary" : "group-hover:text-white")} /> }}
                  onClick={() => trackSidebarClick(link.label, link.href)}
                  className={cn(
                    "hover:bg-white/5 rounded-xl mx-2 px-4 py-3 transition-all duration-200 group border-0",
                    isActive(link.href) && "bg-white/10 text-white font-semibold"
                  )}
                  labelClassName="text-sm font-medium tracking-wide"
                />
              ))}
            </SidebarGroup>
          )}

          {adminItems.some((item) => !item.feature || hasFeature(item.feature)) && (
            <SidebarGroup label="HR Admin" open={open}>
              {adminItems
                .filter((link) => !link.feature || hasFeature(link.feature))
                .map((link, idx) => (
                  <SidebarLink
                    key={idx}
                    link={{ ...link, icon: <link.icon className={cn("h-5 w-5 transition-colors", isActive(link.href) ? "text-primary" : "group-hover:text-white")} /> }}
                    onClick={() => trackSidebarClick(link.label, link.href)}
                    className={cn(
                      "hover:bg-white/5 rounded-xl mx-2 px-4 py-3 transition-all duration-200 group border-0",
                      isActive(link.href) && "bg-white/10 text-white font-semibold"
                    )}
                    labelClassName="text-sm font-medium tracking-wide"
                  />
                ))}
            </SidebarGroup>
          )}

          {hasFeature("admin_setup") && (
            <SidebarGroup label="Setup" open={open}>
              <SidebarLink
                link={{
                  label: "Admin Setup",
                  href: "/admin-setup",
                  icon: <Settings className={cn("h-5 w-5 transition-colors", isActive("/admin-setup") ? "text-primary" : "group-hover:text-white")} />,
                }}
                onClick={() => trackSidebarClick("Admin Setup", "/admin-setup")}
                className={cn(
                  "hover:bg-white/5 rounded-xl mx-2 px-4 py-3 transition-all duration-200 group border-0",
                  isActive("/admin-setup") && "bg-white/10 text-white font-semibold"
                )}
                labelClassName="text-sm font-medium tracking-wide"
              />
            </SidebarGroup>
          )}
        </div>
      </div>

      {/* User Footer */}
      <div className="mt-auto px-4 pb-8">
        <button
          type="button"
          onClick={signOut}
          aria-label="Sign Out"
          title="Sign Out"
          className="flex items-center gap-4 w-full p-4 rounded-xl border-0 hover:bg-white/5 transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <LogOut className="h-5 w-5 text-white/30 group-hover:text-red-400 shrink-0 transition-colors" />
          <motion.span
            animate={{ opacity: open ? 1 : 0, display: open ? "block" : "none" }}
            className="text-sm font-medium text-white/30 group-hover:text-red-400 transition-colors"
          >
            Sign Out
          </motion.span>
        </button>
      </div>
    </SidebarBody>
  );
}

const SidebarGroup = ({ label, children, open }: { label: string; children: ReactNode; open: boolean }) => (
  <div className="space-y-2">
    <motion.p
      animate={{ opacity: open ? 1 : 0, display: open ? "block" : "none" }}
      className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 mb-3 px-6"
    >
      {label}
    </motion.p>
    {children}
  </div>
);
