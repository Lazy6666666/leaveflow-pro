import { useEffect } from "react";
import { SignIn, SignUp } from "@clerk/react";
import { Navigate, useLocation } from "react-router-dom";
import { Moon, Sun, Sparkles } from "lucide-react";

import { useAnalytics } from "@/hooks/useAnalytics";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";

const Auth = () => {
  const location = useLocation();
  const { session, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { trackOnce } = useAnalytics();
  const searchParams = new URLSearchParams(location.search);
  const isSignUp = location.pathname.includes("/sign-up") ||
    location.pathname.includes("/register") ||
    searchParams.get("signup") === "true";

  useEffect(() => {
    if (!loading) {
      void trackOnce(
        `auth_viewed:${isSignUp ? "sign_up" : "sign_in"}`,
        "auth_viewed",
        {
          mode: isSignUp ? "sign_up" : "sign_in",
          redirect_target: "/dashboard",
        },
        { surface: "auth" },
      );
    }
  }, [isSignUp, loading, trackOnce]);

  useEffect(() => {
    if (session?.userId) {
      void trackOnce(
        `auth_completed:${session.userId}`,
        "auth_completed",
        {
          auth_mode: isSignUp ? "sign_up" : "sign_in",
          is_new_user: isSignUp,
        },
        { surface: "auth" },
      );
    }
  }, [isSignUp, session?.userId, trackOnce]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFDFB]">
        <div className="animate-pulse text-xs font-medium uppercase tracking-widest text-[#686055]">
          Loading Balance...
        </div>
      </div>
    );
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#FDFDFB]">
      <div className="relative hidden overflow-hidden bg-[#171411] lg:flex lg:w-1/2">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/landing/hero-1.png')" }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>

        <div className="relative z-10 flex w-full flex-col justify-between p-16 text-white">
          <Logo size="lg" variant="white" showText={true} />

          <div className="max-w-md space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md">
              <Sparkles className="h-4 w-4 text-teal-400" strokeWidth={2.5} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-300">
                Workforce Control Center
              </span>
            </div>

            <h1 className="text-6xl font-black leading-[0.95] tracking-tighter">
              Manage <br />
              <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                workforce
              </span>{" "}
              <br />
              with clarity.
            </h1>

            <p className="text-xl font-medium leading-relaxed text-white/80">
              Track leave balances, submit requests, and stay aligned with your team in one unified workspace.
            </p>

            <div className="grid grid-cols-3 gap-8 border-t border-white/10 pt-8">
              <div>
                <p className="text-3xl font-black text-white">100%</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-white/60">Paperless</p>
              </div>
              <div>
                <p className="text-3xl font-black text-white">2x</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-white/60">Faster</p>
              </div>
              <div>
                <p className="text-3xl font-black text-white">24/7</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-white/60">Service</p>
              </div>
            </div>
          </div>

          <p className="text-sm font-medium text-white/60">Copyright 2026 BALANCE. All rights reserved.</p>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#FDFDFB] p-6 lg:p-12">
        <div className="pointer-events-none absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-teal-500/5 blur-[120px]" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="absolute right-6 top-6 rounded-full border border-stone-200"
          aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>

        <div className="relative z-10 w-full max-w-md">
          <div className="mb-12 flex justify-center lg:hidden">
            <Logo size="md" showText={true} />
          </div>

          <div className="animate-reveal space-y-8">
            <div className="space-y-2 text-center lg:text-left">
              <h2 className="text-4xl font-black tracking-tighter text-[#171411]">
                {isSignUp ? "Create your account" : "Welcome back"}
              </h2>
              <p className="font-medium text-[#686055]">
                {isSignUp ? "Start your journey towards elegant HR." : "Sign in to manage your workforce."}
              </p>
            </div>

            <div className="overflow-hidden rounded-[32px] border border-[#171411]/5 bg-white p-2 shadow-2xl shadow-[#171411]/5">
              <div className="auth-card-container">
                {isSignUp ? (
                  <SignUp routing="hash" signInUrl="/auth" fallbackRedirectUrl="/dashboard" />
                ) : (
                  <SignIn routing="hash" signUpUrl="/auth/register" fallbackRedirectUrl="/dashboard" />
                )}
              </div>
            </div>

            <div className="text-center lg:text-left">
              <p className="max-w-[280px] text-xs font-medium leading-relaxed text-[#686055] lg:max-w-none">
                By continuing, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
