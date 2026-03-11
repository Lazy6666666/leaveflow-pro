import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import AIChatPanel from "@/components/AIChatPanel";
import NotificationBell from "@/components/NotificationBell";

const AppLayout = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <SidebarProvider>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-9 w-9 rounded-full border border-border bg-background shadow-none" />
              <div className="hidden sm:block">
                <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">BALANCE</p>
                <h1 className="text-sm font-semibold text-foreground">Workforce control center</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <Button
                variant="ios-glass"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9 rounded-full"
                aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              >
                {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
            </div>
          </header>
          <main id="main-content" className="flex-1 overflow-auto px-4 py-6 sm:px-6 sm:py-8">
            <div className="min-h-full">
              <div className="animate-reveal">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>
      <AIChatPanel />
    </SidebarProvider>
  );
};

export default AppLayout;
