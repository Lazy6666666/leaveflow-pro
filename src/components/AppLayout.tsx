import React, { useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet, useLocation } from "react-router-dom";
import { Moon, Sun, PlusCircle, Search } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import AIChatPanel from "@/components/AIChatPanel";
import NotificationBell from "@/components/NotificationBell";
import { OfflineSyncStatusBadge } from "@/components/OfflineSyncStatusBadge";
import { NetworkStatusBanner } from "@/components/NetworkStatusBanner";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { RequestLeaveSheet } from "@/components/leave/RequestLeaveSheet";
import { CommandPalette, commandPaletteShortcutLabel } from "@/components/CommandPalette";

const AppLayout = () => {
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(true);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
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
            <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-border/50 bg-background/95 px-4 shadow-[0_1px_0_hsl(var(--border)/0.5)] backdrop-blur-sm sm:h-16 sm:px-6">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  className="relative h-9 w-9 rounded-xl border-border/50 font-normal text-muted-foreground transition-colors hover:bg-muted sm:w-64 sm:justify-start sm:px-3 sm:py-2"
                  onClick={() => setIsCommandPaletteOpen(true)}
                  aria-label="Search or type a command"
                >
                  <Search className="h-4 w-4 sm:mr-2" />
                  <span className="hidden text-xs sm:inline-flex">Search or type a command...</span>
                  <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    {commandPaletteShortcutLabel()}
                  </kbd>
                </Button>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Button onClick={() => setIsRequestSheetOpen(true)} size="sm" className="hidden h-9 shadow-sm sm:flex">
                  <PlusCircle className="mr-2 h-4 w-4" /> New Request
                </Button>
                <div className="mx-1 hidden h-4 w-px bg-border sm:block" />
                <OfflineSyncStatusBadge pendingCount={pendingCount} />
                <NotificationBell />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="h-9 w-9 rounded-xl border border-border/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                >
                  {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </Button>
              </div>
            </header>
            <main id="main-content" className="scrollbar-hide flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
              <div className="mx-auto min-h-full min-w-0 max-w-7xl">
                <div className="animate-reveal">
                  <Outlet />
                </div>
              </div>
            </main>
          </div>
        </Sidebar>
        {showFloatingAiPanel ? <AIChatPanel /> : null}
        <RequestLeaveSheet open={isRequestSheetOpen} onOpenChange={setIsRequestSheetOpen} />
        <CommandPalette
          open={isCommandPaletteOpen}
          onOpenChange={setIsCommandPaletteOpen}
          onRequestLeave={() => setIsRequestSheetOpen(true)}
        />
      </div>
    </>
  );
};

export default AppLayout;
