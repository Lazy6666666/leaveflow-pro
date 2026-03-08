import { useEffect, useState } from "react";
import {
  LayoutDashboard, CalendarDays, PlusCircle, History, CalendarHeart,
  UserCog, CheckSquare, CalendarRange, Users, Settings,
  BarChart3, Building2, Wallet, LogOut, ShieldCheck,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
  { title: "Holidays", url: "/holidays", icon: CalendarHeart },
  { title: "Profile", url: "/profile", icon: UserCog },
];

const managerItems = [
  { title: "Approvals", url: "/manager/approvals", icon: CheckSquare },
  { title: "Team Calendar", url: "/manager/team-calendar", icon: CalendarRange },
];

const adminItems = [
  { title: "Employees", url: "/admin/employees", icon: Users },
  { title: "Departments", url: "/admin/departments", icon: Building2 },
  { title: "Policies", url: "/admin/policies", icon: Settings },
  { title: "Balances", url: "/admin/balances", icon: Wallet },
  { title: "Reports", url: "/admin/reports", icon: BarChart3 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { hasRole, signOut, user } = useAuth();
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    supabase
      .from("user_roles")
      .select("id")
      .eq("role", "hr_admin")
      .limit(1)
      .then(({ data }) => {
        setShowSetup(!data || data.length === 0);
      });
  }, [hasRole("hr_admin")]);

  const isActive = (path: string) => location.pathname === path;

  const renderNavItems = (items: typeof employeeItems) =>
    items.map((item) => (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild isActive={isActive(item.url)}>
          <NavLink
            to={item.url}
            end
            className="hover:bg-sidebar-accent/60 transition-colors"
            activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
          >
            <item.icon className="mr-2 h-4 w-4" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {!collapsed && (
          <div className="px-4 py-5 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
              <CalendarDays className="h-4 w-4 text-sidebar-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-sidebar-foreground leading-tight">Leave Manager</h2>
              <p className="text-xs text-sidebar-foreground/50 truncate">{user?.email}</p>
            </div>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[11px] uppercase tracking-wider">Employee</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderNavItems(employeeItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {hasRole("manager") && (
          <>
            <Separator className="mx-4 w-auto bg-sidebar-border" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-sidebar-foreground/40 text-[11px] uppercase tracking-wider">Manager</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>{renderNavItems(managerItems)}</SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {hasRole("hr_admin") && (
          <>
            <Separator className="mx-4 w-auto bg-sidebar-border" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-sidebar-foreground/40 text-[11px] uppercase tracking-wider">HR Admin</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>{renderNavItems(adminItems)}</SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {showSetup && !hasRole("hr_admin") && (
          <>
            <Separator className="mx-4 w-auto bg-sidebar-border" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-sidebar-foreground/40 text-[11px] uppercase tracking-wider">Setup</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/admin-setup")}>
                      <NavLink
                        to="/admin-setup"
                        end
                        className="hover:bg-sidebar-accent/60 transition-colors"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      >
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        {!collapsed && <span>Admin Setup</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground/60 hover:text-destructive hover:bg-sidebar-accent/50"
          onClick={signOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
