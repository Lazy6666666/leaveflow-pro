import { useEffect } from "react";
import { SignIn, SignUp } from "@clerk/react";
import { Navigate, useLocation } from "react-router-dom";
import { Moon, Sun, Sparkles } from "lucide-react";

import { useAnalytics } from "@/hooks/useAnalytics";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/ui/Logo";

const Auth = () => {
  const location = useLocation();
  const { session, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { trackOnce } = useAnalytics();
  const isSignUp = location.pathname.includes("/sign-up");

  useEffect(() => {
    if (!loading) {
      void trackOnce(`auth_viewed:${isSignUp ? "sign_up" : "sign_in"}`, "auth_viewed", {
        mode: isSignUp ? "sign_up" : "sign_in",
        redirect_target: "/dashboard",
      }, { surface: "auth" });
    }
  }, [isSignUp, loading, trackOnce]);

  useEffect(() => {
    if (session?.userId) {
      void trackOnce(`auth_completed:${session.userId}`, "auth_completed", {
        auth_mode: isSignUp ? "sign_up" : "sign_in",
        is_new_user: isSignUp,
      }, { surface: "auth" });
    }
  }, [isSignUp, session?.userId, trackOnce]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFDFB]">
        <div className="animate-pulse text-[#686055] font-medium tracking-widest uppercase text-xs">Loading Balance...</div>
      </div>
    );
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#FDFDFB]">
      {/* Left Column - Animated Background & Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#171411]">
        {/* Professional HR-themed Background Image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ 
            backgroundImage: "url('/images/landing/hero-1.png')",
          }}
        >
          {/* Subtle dark overlay to ensure text legibility */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          {/* Bottom vignette for even better logo/text separation */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-between p-16 w-full text-white">
          <Logo size="lg" variant="white" showText={true} />

          <div className="max-w-md space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-teal-400" strokeWidth={2.5} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-300">Workforce Control Center</span>
            </div>
            
            <h1 className="text-6xl font-black leading-[0.95] tracking-tighter">
              Manage <br /> 
              <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">workforce</span> <br /> 
              with clarity.
            </h1>
            
            <p className="text-xl leading-relaxed text-white/80 font-medium">
              Track leave balances, submit requests, and stay aligned with your team in one unified workspace.
            </p>

            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-white/10">
              <div>
                <p className="text-3xl font-black text-white">100%</p>
                <p className="text-xs font-bold uppercase tracking-widest text-white/60 mt-1">Paperless</p>
              </div>
              <div>
                <p className="text-3xl font-black text-white">2x</p>
                <p className="text-xs font-bold uppercase tracking-widest text-white/60 mt-1">Faster</p>
              </div>
              <div>
                <p className="text-3xl font-black text-white">24/7</p>
                <p className="text-xs font-bold uppercase tracking-widest text-white/60 mt-1">Service</p>
              </div>
            </div>
          </div>

          <p className="text-sm font-medium text-white/60">© 2026 BALANCE. All rights reserved.</p>
        </div>
      </div>

      {/* Right Column - Auth Form */}
      <div className="relative flex flex-1 items-center justify-center bg-[#FDFDFB] p-6 lg:p-12 overflow-hidden">
        {/* Background Decorative Glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />
        
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

        <div className="w-full max-w-md relative z-10">
          <div className="mb-12 flex justify-center lg:hidden">
            <Logo size="md" showText={true} />
          </div>

          <div className="space-y-8 animate-reveal">
            <div className="text-center lg:text-left space-y-2">
              <h2 className="text-4xl font-black tracking-tighter text-[#171411]">
                {isSignUp ? "Create your account" : "Welcome back"}
              </h2>
              <p className="text-[#686055] font-medium">
                {isSignUp ? "Start your journey towards elegant HR." : "Sign in to manage your workforce."}
              </p>
            </div>

            <div className="bg-white rounded-[32px] p-2 shadow-2xl shadow-[#171411]/5 border border-[#171411]/5 overflow-hidden">
              <div className="auth-card-container">
                {isSignUp ? (
                  <SignUp routing="hash" signInUrl="/auth" fallbackRedirectUrl="/dashboard" />
                ) : (
                  <SignIn routing="hash" signUpUrl="/auth/sign-up" fallbackRedirectUrl="/dashboard" />
                )}
              </div>
            </div>

            <div className="text-center lg:text-left">
              <p className="text-xs font-medium text-white/60 leading-relaxed max-w-[280px] lg:max-w-none">
                By continuing, you agree to our <a href="#" className="underline text-[#171411]">Terms of Service</a> and <a href="#" className="underline text-[#171411]">Privacy Policy</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
