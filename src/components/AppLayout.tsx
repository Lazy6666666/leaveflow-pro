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

/**
 * Redesigned AppLayout: "The Digital Concierge"
 * Aesthetic: Clean layers, no harsh lines, editorial typography.
 */
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
      <div className="flex h-screen w-full overflow-hidden bg-background antialiased font-sans">
        <Sidebar open={open} setOpen={setOpen}>
          <AppSidebar onRequestLeave={() => setIsRequestSheetOpen(true)} />
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            {/* Header: No border, use glassmorphism & soft shadow */}
            <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between bg-background/70 backdrop-blur-xl px-6 sm:h-20 sm:px-10">
              <div className="flex items-center gap-6">
                <Button
                  variant="ghost"
                  className="relative h-12 w-12 sm:w-80 sm:justify-start rounded-xl bg-muted/50 text-muted-foreground transition-all hover:bg-muted px-3"
                  onClick={() => setIsCommandPaletteOpen(true)}
                  aria-label="Search or type a command"
                >
                  <Search className="h-4 w-4 sm:mr-3" />
                  <span className="hidden text-sm font-medium sm:inline-flex">How can I help you today?</span>
                  <kbd className="pointer-events-none absolute right-3 top-3.5 hidden h-5 select-none items-center gap-1 border border-border bg-background px-2 font-mono text-[10px] font-bold text-muted-foreground opacity-100 sm:flex">
                    {commandPaletteShortcutLabel()}
                  </kbd>
                </Button>
              </div>
              <div className="flex items-center gap-4 sm:gap-6">
                <Button
                  onClick={() => setIsRequestSheetOpen(true)}
                  className="hidden h-12 px-8 rounded-xl terracotta-gradient text-white font-semibold tracking-wide shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98] sm:flex"
                >
                  <PlusCircle className="mr-2 h-5 w-5" /> New Request
                </Button>
                <div className="mx-2 hidden h-8 w-px bg-border sm:block" />
                <OfflineSyncStatusBadge pendingCount={pendingCount} />
                <NotificationBell />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="h-11 w-11 rounded-xl bg-muted/30 text-muted-foreground transition-all hover:bg-muted hover:text-primary"
                  aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                >
                  {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </Button>
              </div>
            </header>

            {/* Main Content Area */}
            <main id="main-content" className="scrollbar-hide flex-1 overflow-y-auto px-6 py-10 sm:px-12 sm:py-16">
              <div className="mx-auto min-h-full min-w-0 max-w-7xl">
                {/* No-Line Philosophy: Sections are separated by spacing and depth */}
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
