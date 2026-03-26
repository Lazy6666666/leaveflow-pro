"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { Badge } from "../ui/badge";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAnalytics } from "@/hooks/useAnalytics";
import { RisingLines } from "./RisingLines";
import { InteriorCarousel } from "./InteriorCarousel";

export const LandingHeroBg = () => {
  const { track } = useAnalytics();

  return (
    <header id="hero" aria-labelledby="hero-heading" className="min-h-[100dvh] relative overflow-hidden antialiased bg-[#09090b] flex flex-col pt-24 pb-48 md:pb-64">
      {/* Generative Engine Optimization (GEO) / SEO Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Leaveflow Pro",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "description": "Execute compliance and deployment operations with zero latency. Built for distributed teams requiring programmatic precision."
          })
        }}
      />

      {/* Dynamic Rising Lines with Light Blue Accents */}
      <RisingLines 
        linesColor="#38bdf8" 
        particlesColor="#38bdf8" 
        riseSpeed={1.0}
      />

      {/* Asymmetric Hero Content (Anti-Center Bias) */}
      <div className="container relative mx-auto px-6 md:px-12 z-10 flex flex-col items-start text-left mt-4 md:mt-8">
        
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 1 }}
           className="mb-8"
        >
          <Badge variant="outline" className="border-white/10 text-white/70 px-5 py-2 text-[11px] font-mono tracking-tight uppercase bg-white/5 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            Active Baseline • v5.0
          </Badge>
        </motion.div>

        {/* Deterministic Typography */}
        <h1 id="hero-heading" className="font-['Outfit'] text-[3.5rem] md:text-[5rem] lg:text-[6rem] font-medium leading-[0.9] tracking-tighter text-white mb-6">
          Global Operations.<br/>
          <span className="text-zinc-600">Deterministically.</span>
        </h1>

        <p className="max-w-xl text-base md:text-lg font-normal text-zinc-400 leading-relaxed font-['Outfit'] mb-10">
          Execute compliance and deployment operations with zero latency. Built for distributed teams requiring programmatic precision.
        </p>

        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3 }}
           className="flex items-center gap-4 mb-8"
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
            className="group relative inline-flex px-8 py-4 rounded-full bg-white text-zinc-950 font-['Outfit'] text-sm font-medium tracking-tight overflow-hidden transition-all duration-300 hover:scale-[0.98] shadow-sm"
          >
            <span className="relative z-10 flex items-center gap-2">
              Deploy Infrastructure <ArrowRight className="size-4" />
            </span>
          </Link>
          <button className="px-8 py-4 rounded-full border border-white/10 text-white text-sm font-medium hover:bg-white/5 transition-colors duration-300">
            View Documentation
          </button>
        </motion.div>
      </div>

      {/* 3D Interior Carousel - Positioned Below Text */}
      <div className="relative w-full z-10 flex flex-col items-center mt-4 md:mt-8">
        <InteriorCarousel />
      </div>

      {/* Subtle fade overlay for scroll transition */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#09090b] to-transparent z-20 pointer-events-none" />
    </header>
  );
};
