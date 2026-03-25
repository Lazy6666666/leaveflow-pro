import React, { useState } from "react";
import { Sidebar, SidebarBody } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet, useLocation } from "react-router-dom";
import { Moon, Sun, PlusCircle } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import AIChatPanel from "@/components/AIChatPanel";
import NotificationBell from "@/components/NotificationBell";
import { OfflineSyncStatusBadge } from "@/components/OfflineSyncStatusBadge";
import { NetworkStatusBanner } from "@/components/NetworkStatusBanner";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { RequestLeaveSheet } from "@/components/leave/RequestLeaveSheet";

const AppLayout = () => {
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(true);
  const [isRequestSheetOpen, setIsRequestSheetOpen] = useState(false);
  const location = useLocation();
  const showFloatingAiPanel = !location.pathname.startsWith("/ai-workspace");
  const { pendingCount, drain } = useOfflineQueue();

  return (
    <>
      <NetworkStatusBanner queueStatus={{ pending: pendingCount }} onReconnect={drain} />
      <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar open={open} setOpen={setOpen}>
        <AppSidebar onRequestLeave={() => setIsRequestSheetOpen(true)} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background">
          <header className="sticky top-0 z-10 flex h-14 sm:h-16 shrink-0 items-center justify-between border-b border-border/50 bg-background/95 px-4 shadow-[0_1px_0_hsl(var(--border)/0.5)] backdrop-blur-sm sm:px-6">
            <div className="flex items-center gap-3">
              {/* Sidebar toggle is in AppSidebar for desktop, mobile handles it via ui/sidebar */}
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button onClick={() => setIsRequestSheetOpen(true)} size="sm" className="hidden sm:flex h-9 shadow-sm">
                <PlusCircle className="mr-2 h-4 w-4" /> New Request
              </Button>
              <div className="h-4 w-px bg-border hidden sm:block mx-1" />
              <OfflineSyncStatusBadge pendingCount={pendingCount} />
              <NotificationBell />
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9 rounded-xl border border-border/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              >
                {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
            </div>
          </header>
          <main id="main-content" className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8 scrollbar-hide">
            <div className="min-h-full min-w-0 mx-auto max-w-7xl">
              <div className="animate-reveal">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </Sidebar>
      {showFloatingAiPanel ? <AIChatPanel /> : null}
      <RequestLeaveSheet open={isRequestSheetOpen} onOpenChange={setIsRequestSheetOpen} />
    </div>
    </>
  );
};

export default AppLayout;
