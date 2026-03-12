import { SignIn, SignUp } from "@clerk/react";
import { Navigate, useLocation } from "react-router-dom";
import { Moon, Sun } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Auth = () => {
  const location = useLocation();
  const { session, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isSignUp = location.pathname.includes("/sign-up");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between border-r border-border bg-card p-12 text-foreground">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-stone-300 bg-stone-100 px-2 py-1">
            <img src="/BALNOBG.png" alt="BALANCE logo" className="h-10 w-auto object-contain mix-blend-multiply" />
          </div>
          <span className="text-xl font-semibold tracking-[0.14em]">BALANCE</span>
        </div>

        <div className="max-w-md space-y-6">
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Workforce control center</p>
          <h1 className="font-serif text-5xl font-semibold leading-tight tracking-tight">
            Manage time off
            <br />
            with clarity.
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            Track leave balances, submit requests, and stay aligned with your team in one monochrome workspace.
          </p>
          <div className="flex gap-10 pt-4">
            <div>
              <p className="text-3xl font-bold">100%</p>
              <p className="text-sm text-muted-foreground">Paperless</p>
            </div>
            <div>
              <p className="text-3xl font-bold">2x</p>
              <p className="text-sm text-muted-foreground">Faster approvals</p>
            </div>
            <div>
              <p className="text-3xl font-bold">24/7</p>
              <p className="text-sm text-muted-foreground">Self-service</p>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">© 2026 BALANCE. All rights reserved.</p>
      </div>

      <div className="relative flex flex-1 items-center justify-center bg-background p-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="absolute right-6 top-6 rounded-full"
          aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>

        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <div className="rounded-2xl border border-stone-300 bg-stone-100 px-2 py-1">
              <img src="/BALNOBG.png" alt="BALANCE logo" className="h-10 w-auto object-contain mix-blend-multiply" />
            </div>
            <span className="text-xl font-semibold tracking-[0.14em] text-foreground">BALANCE</span>
          </div>

          <Card>
            <CardHeader className="pb-2 text-center">
              <CardTitle className="text-2xl font-semibold text-foreground">
                {isSignUp ? "Create your account" : "Welcome back"}
              </CardTitle>
              <CardDescription>
                {isSignUp ? "Sign up to manage leave requests." : "Sign in to manage leave requests."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pt-4">
              {isSignUp ? (
                <SignUp routing="path" path="/auth/sign-up" signInUrl="/auth" fallbackRedirectUrl="/dashboard" />
              ) : (
                <SignIn routing="path" path="/auth" signUpUrl="/auth/sign-up" fallbackRedirectUrl="/dashboard" />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
