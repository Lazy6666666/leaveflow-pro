"use client";
import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Sparkles, ChevronRight } from "lucide-react";
import { InteriorCarousel } from "./InteriorCarousel";

const EASE_CONCIERGE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * Redesigned LandingHeroBg: "The Digital Concierge"
 * Aesthetic: Warm, Editorial, Integrated Carousel.
 */
export const LandingHeroBg = () => {
  const { track } = useAnalytics();

  return (
    <header
      id="hero"
      className="relative flex min-h-[130dvh] flex-col pt-32 overflow-hidden bg-background antialiased selection:bg-primary/20"
    >
      {/* RESTORED: Hero Background Image - Increased opacity and visibility */}
      <div className="auth-hero-bg absolute inset-0 z-0 opacity-40 mix-blend-multiply" aria-hidden="true" />

      {/* Editorial Background Layers - Adjusted blending */}
      <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] h-[70%] w-[70%] bg-primary/10 blur-[120px] rounded-full opacity-60" />
        <div className="absolute bottom-[10%] -right-[5%] h-[60%] w-[60%] bg-primary/5 blur-[100px] rounded-full opacity-40" />
        <div className="absolute inset-0 bg-grid-small-black/[0.03] opacity-30" />
      </div>

      <div className="container relative z-20 mx-auto flex flex-col items-center text-center px-6 md:px-12">
        {/* Editorial Label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE_CONCIERGE }}
          className="mb-10 flex items-center gap-4 px-5 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md"
        >
          <Sparkles className="size-4 text-primary" />
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
            The Digital Concierge has Arrived
          </span>
        </motion.div>

        {/* Hero Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1, ease: EASE_CONCIERGE }}
          className="mb-10 font-display text-[4.5rem] font-bold leading-[0.9] tracking-tighter text-foreground md:text-[8rem] lg:text-[9.5rem] max-w-5xl"
        >
          Workforce <br />
          <span className="text-primary italic font-medium">Orchestrated.</span>
        </motion.h1>

        {/* Hero Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: EASE_CONCIERGE }}
          className="mb-16 max-w-2xl font-sans text-lg md:text-xl text-foreground font-medium leading-relaxed drop-shadow-sm"
        >
          Experience the "Digital Concierge" for HR. Precise leave management, real-time telemetry,
          and sovereign workforce tracking.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: EASE_CONCIERGE }}
          className="flex flex-col sm:flex-row items-center gap-8 mb-24"
        >
          <Link
            to="/auth/register"
            onClick={() => {
              void track(
                "landing_cta_clicked",
                { cta_location: "hero_primary", target_path: "/auth/register" },
                { surface: "landing", path: "/" },
              );
            }}
            className="group relative inline-flex items-center justify-center h-16 px-12 terracotta-gradient font-bold text-white shadow-xl shadow-primary/30 transition-all duration-500 hover:scale-105 active:scale-95 rounded-2xl text-lg"
          >
            Initiate Deployment <ChevronRight className="ml-3 size-5" />
          </Link>

          <a href="#philosophy" className="group flex items-center gap-3 font-bold text-foreground hover:text-primary transition-colors bg-white/50 backdrop-blur-sm px-6 py-3 rounded-2xl">
            View Philosophy <div className="h-10 w-10 bg-white rounded-full shadow-float flex items-center justify-center transition-colors"><ChevronRight size={18} /></div>
          </a>
        </motion.div>

        {/* RESTORED: Interior Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.5, ease: EASE_CONCIERGE }}
          className="w-full max-w-7xl"
        >
          <InteriorCarousel />
        </motion.div>
      </div>

      {/* Floating Trust Indicators */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1.5 }}
        className="absolute bottom-16 left-0 right-0 flex justify-center z-20"
      >
        <div className="flex items-center gap-12 text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/60 bg-white/20 backdrop-blur-md px-10 py-3 rounded-full shadow-sm">
           <span>Sovereign Data</span>
           <div className="h-1 w-1 bg-primary/40 rounded-full" />
           <span>Concierge Ethics</span>
        </div>
      </motion.div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-30 h-48 bg-gradient-to-t from-background to-transparent" />
    </header>
  );
};
