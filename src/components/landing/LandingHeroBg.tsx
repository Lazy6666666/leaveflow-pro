"use client";
import React from "react";
import { motion } from "framer-motion";
import { Badge } from "../ui/badge";
import { IconArrowRight } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { useAnalytics } from "@/hooks/useAnalytics";
import { RisingLines } from "./RisingLines";
import { InteriorCarousel } from "./InteriorCarousel";

export const LandingHeroBg = () => {
  const { track } = useAnalytics();

  return (
    <header
      id="hero"
      aria-labelledby="hero-heading"
      className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#f8f9fa] pb-48 pt-24 antialiased md:pb-64"
    >
      {/* Generative Engine Optimization (GEO) / SEO Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Leaveflow Pro",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            description:
              "Execute compliance and deployment operations with zero latency. Built for distributed teams requiring programmatic precision.",
          }),
        }}
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,148,98,0.18),transparent_34%),radial-gradient(circle_at_78%_16%,rgba(144,79,30,0.08),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,249,250,0.98))]" />

      <RisingLines
        backgroundColor="#f8f9fa"
        linesColor="#af642d"
        particlesColor="#c98a58"
        riseSpeed={0.85}
        horizonHeight={0.09}
        lineCount={84}
        particleCount={110}
      />

      <div className="container relative z-10 mx-auto mt-4 flex flex-col items-start px-6 text-left md:mt-8 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="mb-8"
        >
          <Badge className="border-0 bg-white/80 px-5 py-2 font-['Inter'] text-[11px] uppercase tracking-[0.24em] text-[#904f1e] shadow-[0_20px_45px_-32px_rgba(144,79,30,0.45)] backdrop-blur-md">
            Active Baseline • v5.0
          </Badge>
        </motion.div>

        <h1
          id="hero-heading"
          className="mb-6 font-['Manrope'] text-[3.5rem] font-semibold leading-[0.9] tracking-[-0.04em] text-[#191c1d] md:text-[5rem] lg:text-[6rem]"
        >
          Global Operations.<br />
          <span className="text-[#af642d]">Deterministically.</span>
        </h1>

        <p className="mb-10 max-w-xl font-['Inter'] text-base font-normal leading-relaxed text-[#5d5348] md:text-lg">
          Execute compliance and deployment operations with zero latency. Built for distributed teams requiring
          programmatic precision.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 flex flex-wrap items-center gap-4"
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
            className="group relative inline-flex overflow-hidden rounded-full bg-[linear-gradient(135deg,#af642d,#904f1e)] px-8 py-4 font-['Inter'] text-sm font-semibold tracking-[0.01em] text-white shadow-[0_26px_60px_-28px_rgba(144,79,30,0.58)] transition-all duration-300 hover:scale-[0.98]"
          >
            <span className="relative z-10 flex items-center gap-2">
              Deploy Infrastructure <IconArrowRight className="size-4" />
            </span>
          </Link>
          <button className="rounded-full bg-white px-8 py-4 font-['Inter'] text-sm font-medium text-[#3a3128] shadow-[0_24px_60px_-36px_rgba(87,61,35,0.28)] transition-colors duration-300 hover:bg-[#fff7f0]">
            View Documentation
          </button>
        </motion.div>
      </div>

      <div className="relative z-10 mt-4 flex w-full flex-col items-center md:mt-8">
        <InteriorCarousel />
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 h-48 bg-gradient-to-t from-[#f8f9fa] via-[#f8f9fa]/92 to-transparent" />
    </header>
  );
};
