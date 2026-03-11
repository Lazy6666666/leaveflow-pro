import { SignIn, SignUp } from "@clerk/react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import balanceLogo from "@/assets/balance-logo.png";

const Auth = () => {
  const location = useLocation();
  const { session, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isSignUp = location.pathname.includes("/sign-up");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel – branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar text-sidebar-foreground flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <img
            src={balanceLogo}
            alt="BALANCE logo"
            width={40}
            height={40}
            decoding="async"
            srcSet={balanceLogo}
            className="h-10 w-10 rounded-lg object-cover"
          />
          <span className="text-xl font-semibold tracking-tight">BALANCE</span>
        </div>
        <div className="space-y-6 max-w-md">
          <h1 className="text-4xl font-serif font-bold leading-tight">
            Manage time off<br />with clarity.
          </h1>
          <p className="text-sidebar-foreground/70 text-lg leading-relaxed">
            Track leave balances, submit requests, and stay aligned with your team — all in one place.
          </p>
          <div className="flex gap-8 pt-4">
            <div>
              <p className="text-3xl font-bold text-sidebar-primary">100%</p>
              <p className="text-sm text-sidebar-foreground/60">Paperless</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-sidebar-primary">2x</p>
              <p className="text-sm text-sidebar-foreground/60">Faster approvals</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-sidebar-primary">24/7</p>
              <p className="text-sm text-sidebar-foreground/60">Self-service</p>
            </div>
          </div>
        </div>
        <p className="text-sm text-sidebar-foreground/40">© 2026 BALANCE. All rights reserved.</p>
      </div>

      {/* Right panel – auth form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background relative">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="absolute top-6 right-6 rounded-full"
          aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <img
              src={balanceLogo}
              alt="BALANCE logo"
              width={40}
              height={40}
              decoding="async"
              srcSet={balanceLogo}
              className="h-10 w-10 rounded-lg object-cover"
            />
            <span className="text-xl font-semibold text-foreground tracking-tight">BALANCE</span>
          </div>

          <Card className="border-0 shadow-xl bg-card">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold text-foreground">
                {isSignUp ? "Create your account" : "Welcome back"}
              </CardTitle>
              <CardDescription>
                {isSignUp ? "Sign up with Clerk to manage leave requests" : "Sign in with Clerk to manage leave requests"}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex justify-center">
              {isSignUp ? (
                <SignUp
                  routing="path"
                  path="/auth/sign-up"
                  signInUrl="/auth"
                  fallbackRedirectUrl="/dashboard"
                />
              ) : (
                <SignIn
                  routing="path"
                  path="/auth"
                  signUpUrl="/auth/sign-up"
                  fallbackRedirectUrl="/dashboard"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
