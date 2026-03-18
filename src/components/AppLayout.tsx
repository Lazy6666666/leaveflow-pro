import React, { useState } from "react";
import { Sidebar, SidebarBody } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet, useLocation } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import AIChatPanel from "@/components/AIChatPanel";
import NotificationBell from "@/components/NotificationBell";
import { OfflineSyncStatusBadge } from "@/components/OfflineSyncStatusBadge";
import { NetworkStatusBanner } from "@/components/NetworkStatusBanner";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { Logo } from "@/components/ui/Logo";

const AppLayout = () => {
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(true);
  const location = useLocation();
  const showFloatingAiPanel = !location.pathname.startsWith("/ai-workspace");
  const { pendingCount, drain } = useOfflineQueue();

  return (
    <>
      <NetworkStatusBanner queueStatus={{ pending: pendingCount }} onReconnect={drain} />
      <div className="flex min-h-screen w-full overflow-x-hidden bg-background">
      <Sidebar open={open} setOpen={setOpen}>
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-4">
                <Logo size="sm" showText={true} />
                <h1 className="text-sm font-semibold text-foreground border-l border-border pl-4">Workforce control center</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <OfflineSyncStatusBadge pendingCount={pendingCount} />
              <NotificationBell />
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9 rounded-full border border-border"
                aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              >
                {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
            </div>
          </header>
          <main id="main-content" className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
            <div className="min-h-full min-w-0">
              <div className="animate-reveal">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </Sidebar>
      {showFloatingAiPanel ? <AIChatPanel /> : null}
    </div>
    </>
  );
};

export default AppLayout;
