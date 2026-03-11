import {
  LayoutDashboard, CalendarDays, PlusCircle, History, CalendarHeart,
  UserCog, CheckSquare, CalendarRange, Users, Settings,
  BarChart3, Building2, Wallet, LogOut, ShieldCheck, Fingerprint, CreditCard, ClipboardList, UserCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const employeeItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "My Leave", url: "/my-leave", icon: CalendarDays },
  { title: "Request Leave", url: "/request-leave", icon: PlusCircle },
  { title: "Leave History", url: "/leave-history", icon: History },
  { title: "Attendance", url: "/attendance", icon: Fingerprint },
  { title: "Holidays", url: "/holidays", icon: CalendarHeart },
  { title: "Profile", url: "/profile", icon: UserCog },
];

const delegateManagerItems = [
  { title: "Approvals", url: "/manager/approvals", icon: CheckSquare },
  { title: "Team Calendar", url: "/manager/team-calendar", icon: CalendarRange },
];

const managerOnlyItems = [
  { title: "Team Attendance", url: "/manager/team-attendance", icon: Fingerprint },
  { title: "Delegation", url: "/manager/delegation", icon: UserCheck },
];

const adminItems = [
  { title: "Employees", url: "/admin/employees", icon: Users },
  { title: "Departments", url: "/admin/departments", icon: Building2 },
  { title: "Policies", url: "/admin/policies", icon: Settings },
  { title: "Balances", url: "/admin/balances", icon: Wallet },
  { title: "Attendance", url: "/admin/attendance", icon: Fingerprint },
  { title: "Att. Settings", url: "/admin/attendance-settings", icon: Settings },
  { title: "Biometrics", url: "/admin/biometrics", icon: Fingerprint },
  { title: "Badge Maps", url: "/admin/badge-mappings", icon: CreditCard },
  { title: "Reports", url: "/admin/reports", icon: BarChart3 },
  { title: "Audit Log", url: "/admin/audit-log", icon: ClipboardList },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { hasExplicitRole, hasManagerAccess, hasRole, signOut, user, needsAdminSetup } = useAuth();
  const canAccessManagerOnlyTools = hasExplicitRole("manager") || hasExplicitRole("hr_admin");
  const managerItems = canAccessManagerOnlyTools
    ? [...delegateManagerItems, ...managerOnlyItems]
    : delegateManagerItems;

  const isActive = (path: string) => location.pathname === path;

  const renderNavItems = (items: typeof employeeItems) =>
    items.map((item) => (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild isActive={isActive(item.url)}>
          <NavLink
            to={item.url}
            end
            className="relative overflow-hidden rounded-2xl px-3.5 py-3 text-sidebar-foreground/72 transition-colors duration-300 ease-apple-ease hover:bg-black/[0.035] hover:text-sidebar-foreground"
            activeClassName="text-sidebar-foreground font-medium"
          >
            {isActive(item.url) ? (
              <motion.span
                layoutId="sidebar-active-pill"
                className="absolute inset-0 rounded-2xl border border-border bg-foreground/[0.045]"
                transition={{ type: "spring", stiffness: 420, damping: 30 }}
              />
            ) : null}
            <item.icon className="relative z-10 mr-3 h-4 w-4 shrink-0" />
            {!collapsed && <span className="relative z-10 text-[13.5px] leading-none">{item.title}</span>}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-background">
      <SidebarContent className="gap-1 pt-1">
        {!collapsed && (
          <div className="mx-5 mt-4 flex items-center gap-3.5 border-b border-border pb-5">
            <div className="flex h-[5.25rem] w-[5.25rem] shrink-0 items-center justify-center rounded-[1.5rem] border border-stone-300 bg-stone-100 p-2.5 shadow-[0_12px_28px_hsl(0_0%_0%/0.08)]">
              <img src="/favicon.ico" alt="BALANCE" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0 space-y-1.5">
              <p className="text-[10px] uppercase tracking-[0.28em] text-sidebar-foreground/42">Workspace</p>
              <h2 className="text-base font-semibold tracking-[0.18em] text-sidebar-foreground leading-none">BALANCE</h2>
              <p className="text-[11px] leading-5 text-sidebar-foreground/55 truncate">{user?.email}</p>
            </div>
          </div>
        )}

        <SidebarGroup className="pt-3">
          <SidebarGroupLabel className="px-5 pb-2 text-sidebar-foreground/38 text-[10px] uppercase tracking-[0.28em]">Employee</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1.5 px-3.5">{renderNavItems(employeeItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {hasManagerAccess && (
          <>
            <Separator className="mx-5 my-3 w-auto bg-border" />
            <SidebarGroup>
              <SidebarGroupLabel className="px-5 pb-2 text-sidebar-foreground/38 text-[10px] uppercase tracking-[0.28em]">Manager</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1.5 px-3.5">{renderNavItems(managerItems)}</SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {hasRole("hr_admin") && (
          <>
            <Separator className="mx-5 my-3 w-auto bg-border" />
            <SidebarGroup>
              <SidebarGroupLabel className="px-5 pb-2 text-sidebar-foreground/38 text-[10px] uppercase tracking-[0.28em]">HR Admin</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1.5 px-3.5">{renderNavItems(adminItems)}</SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {needsAdminSetup && !hasRole("hr_admin") && (
          <>
            <Separator className="mx-5 my-3 w-auto bg-border" />
            <SidebarGroup>
              <SidebarGroupLabel className="px-5 pb-2 text-sidebar-foreground/38 text-[10px] uppercase tracking-[0.28em]">Setup</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1.5 px-3.5">
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/admin-setup")}>
                      <NavLink
                        to="/admin-setup"
                        end
                        className="relative overflow-hidden rounded-2xl px-3.5 py-3 text-sidebar-foreground/72 transition-colors duration-300 ease-apple-ease hover:bg-black/[0.035] hover:text-sidebar-foreground"
                        activeClassName="text-sidebar-foreground font-medium"
                      >
                        {isActive("/admin-setup") ? (
                          <motion.span
                            layoutId="sidebar-active-pill"
                            className="absolute inset-0 rounded-2xl border border-border bg-foreground/[0.045]"
                            transition={{ type: "spring", stiffness: 420, damping: 30 }}
                          />
                        ) : null}
                        <ShieldCheck className="relative z-10 mr-3 h-4 w-4 shrink-0" />
                        {!collapsed && <span className="relative z-10 text-[13.5px] leading-none">Admin Setup</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="mx-3.5 mb-3.5 mt-auto rounded-[1.4rem] border border-border bg-card">
        <Button
          variant="ghost"
          className="w-full justify-start rounded-[1.2rem] px-3.5 py-6 text-black dark:text-white hover:bg-black/[0.035] hover:text-destructive dark:hover:bg-white/[0.06]"
          onClick={signOut}
        >
          <LogOut className="mr-3 h-4 w-4 shrink-0" />
          {!collapsed && <span className="text-[13.5px] leading-none">Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
