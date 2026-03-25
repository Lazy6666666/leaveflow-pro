import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAnalytics } from "@/hooks/useAnalytics";
import { ArrowRight, Sparkles } from "lucide-react";
import { NavbarUnderline } from "@/components/landing/NavbarUnderline";
import { ParallaxHeroImages } from "@/components/ui/parallax-hero-images";
import { Logo } from "@/components/ui/Logo";
import { useState, useMemo } from "react";

export const Hero = () => {
  const { track } = useAnalytics();
  const [activeNav, setActiveNav] = useState("Home");

  const navItems = useMemo(() => [
    { name: "Home", href: "/" },
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "About", href: "#about" },
  ], []);

  /**
   * Refined 3D Background Layout
   * 
   * Strategy: Alternating between "Human Connection" (Employees) and "Technical Proof" (Dashboards)
   * to balance the emotional and functional value of the platform.
   */
  const parallaxImages = useMemo(() => [
    // LEFT SIDE - Dynamic human elements - Expansive
    { 
      src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop", 
      x: "8%", y: "15%", rotate: -8 
    },
    { 
      src: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=800&auto=format&fit=crop", 
      x: "12%", y: "45%", rotate: 12 
    },
    { 
      src: "https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=800&auto=format&fit=crop", 
      x: "5%", y: "75%", rotate: -5 
    },
    
    // RIGHT SIDE - Technical and atmospheric proof - Expansive
    { 
      src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop", 
      x: "78%", y: "12%", rotate: 10 
    },
    { 
      src: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop", 
      x: "74%", y: "48%", rotate: -12 
    },
    { 
      src: "https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=800&auto=format&fit=crop", 
      x: "82%", y: "80%", rotate: 6 
    },
  ], []);

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-[#FDFDFB] flex flex-col">
      {/* 3D Parallax Background Layer */}
      <div className="absolute inset-0 z-0 opacity-40 lg:opacity-100">
        <ParallaxHeroImages 
          images={parallaxImages} 
          imageClassName="w-40 h-40 md:w-72 md:h-72 lg:w-96 lg:h-64 object-cover rounded-2xl border border-black/5"
        />
      </div>

      {/* Decorative Overlays for depth and readability */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#FDFDFB]/85 via-transparent to-[#FDFDFB]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_20%,#FDFDFB_100%)] opacity-70" />
      </div>

      {/* Content Layer */}
      <div className="relative z-20 flex flex-col flex-1 max-w-[1600px] mx-auto px-6 w-full pt-10 pb-32">
        {/* Navigation */}
        <nav className="flex items-center justify-between mb-32 lg:mb-48" aria-label="Top navigation">
          <div className="flex items-center gap-16 md:gap-24">
            <Link 
              to="/" 
              className="flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-lg"
              aria-label="Balance Home"
            >
              <Logo size="md" showText={true} />
            </Link>
            
            <div className="hidden lg:block">
              <NavbarUnderline 
                items={navItems} 
                activeItem={activeNav} 
                onSelect={setActiveNav} 
              />
            </div>
          </div>

          <div className="flex items-center gap-8 md:gap-12">
            <Link
              to="/auth"
              className="hidden sm:block text-sm font-bold text-[#5A6270] transition hover:text-[#171411] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-sm"
            >
              Sign in
            </Link>
            <Link
              to="/auth?signup=true"
              className="rounded-full bg-[#171411] px-8 py-3 text-sm font-black uppercase tracking-widest text-white transition hover:bg-[#2b2621] shadow-xl hover:shadow-2xl hover:shadow-teal-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
            >
              Book a walkthrough
            </Link>
          </div>
        </nav>

        <div className="flex flex-col items-center text-center max-w-4xl mx-auto flex-1 justify-center -mt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col items-center"
          >
            {/* Brand Label */}
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-teal-500/5 border border-teal-500/10 mb-12 w-fit">
              <Sparkles className="w-4 h-4 text-teal-500" strokeWidth={2.5} aria-hidden="true" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-600">Unified HR Infrastructure</span>
            </div>

            {/* Headline Stack */}
            <h1 className="text-6xl md:text-8xl lg:text-[120px] font-black tracking-[-0.05em] text-[#0B0B0B] leading-[0.8] mb-12">
              Balance <br /> 
              <span className="text-[#3b3e43]">simplifies</span> <br /> 
              <span className="bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent italic">workforce</span>
            </h1>

            {/* Value Proposition */}
            <p className="max-w-2xl text-lg md:text-2xl font-medium text-[#5A6270] leading-relaxed mb-12">
              Modern infrastructure for leave management and attendance. 
              Automated workflows meet intelligent burnout prevention.
            </p>

            {/* CTA Group */}
            <div className="flex flex-col sm:flex-row gap-5">
              <Link
                to="/auth?signup=true"
                onClick={() => void track("landing_cta_clicked", {
                  cta_location: "hero_primary",
                  target_path: "/auth?signup=true",
                }, { surface: "landing", path: "/" })}
                className="group inline-flex items-center justify-center gap-3 bg-[#0B0B0B] text-white px-10 py-5 rounded-full transition-all hover:bg-black/95 hover:shadow-2xl hover:shadow-teal-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FDFDFB]"
              >
                <span className="font-['DM_Sans'] text-[15px] font-black tracking-[0.12em] uppercase">Book a Demo</span>
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ArrowRight className="w-5 h-5" strokeWidth={3} aria-hidden="true" />
                </motion.div>
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-3 px-10 py-5 rounded-full border-2 border-[#0B0B0B]/10 text-[#0B0B0B] font-bold text-[15px] uppercase tracking-widest hover:bg-[#0B0B0B]/5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0B0B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FDFDFB]"
              >
                Explore features
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="mt-20 flex items-center gap-8">
              <div className="flex -space-x-4">
                {[
                  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop"
                ].map((src, i) => (
                  <div key={i} className="relative">
                    <img
                      src={src}
                      alt={`User ${i + 1}`}
                      className="w-12 h-12 rounded-full border-4 border-[#FDFDFB] object-cover shadow-sm bg-neutral-200"
                    />
                  </div>
                ))}
              </div>
              <div className="text-left space-y-0.5">
                <p className="text-sm font-black text-[#0B0B0B] tabular-nums tracking-tight">500+ companies</p>
                <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">trust Balance</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
