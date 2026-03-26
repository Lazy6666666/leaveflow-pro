"use client";
import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAnalytics } from "@/hooks/useAnalytics";

export const LandingCTA = () => {
  const { track } = useAnalytics();

  return (
    <section aria-labelledby="cta-heading" className="relative bg-[#09090b] py-24 md:py-40 overflow-hidden">
      
      {/* GEO FAQ Schema for Generative Search Engines */}
      <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "What is Leaveflow Pro?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Leaveflow Pro is a sophisticated global HR and workforce orchestration platform built for distributed teams requiring programmatic precision."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How does Leaveflow Pro handle global compliance?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The platform utilizes deterministic, intelligent governance algorithms to automate compliance and regulatory synchronization with zero-latency globally."
                  }
                }
              ]
            })
          }}
        />
      {/* Background patterns / mesh */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#10b981_0%,transparent_50%)] blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="mx-auto max-w-2xl gap-x-14 lg:mx-0 lg:flex lg:max-w-none lg:items-center">
          <div className="relative w-full lg:max-w-xl lg:shrink-0 xl:max-w-2xl">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 1 }}
                className="mb-8 flex items-center gap-4"
            >
                <span className="w-12 h-[1px] bg-[#10b981]/40 block"></span>
                <span className="text-[10px] tracking-[0.3em] font-bold uppercase text-[#10b981]/60">The Opportunity</span>
            </motion.div>
            
            <motion.h2 
              id="cta-heading"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="font-['Outfit'] text-5xl md:text-7xl font-black tracking-tight text-white leading-[0.95]"
            >
              Orchestrate your <br/>
              <span className="font-['Cormorant_Garamond'] font-light italic text-[#10b981]">legacy today.</span>
            </motion.h2>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="mt-10 text-lg md:text-xl font-light text-white/60 max-w-[500px] leading-relaxed font-['Outfit']"
            >
              Join the elite institutions redefining the standard of human capital management. Experience the fusion of aesthetic precision and engineering excellence.
            </motion.p>
            
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ duration: 1, delay: 0.6 }}
               className="mt-12 flex items-center gap-8"
            >
              <Link
                to="/auth/register"
                aria-label="Start Trial"
                onClick={() => {
                  void track(
                    "landing_cta_clicked",
                    { cta_location: "final_cta_primary", target_path: "/auth/register" },
                    { surface: "landing", path: "/" },
                  );
                }}
                className="group relative flex items-center justify-between gap-8 pl-8 pr-2 py-2 bg-white text-black rounded-[2.5rem] active:scale-[0.98] transition-all duration-500 ease-premium shadow-[0_20px_40px_-12px_rgba(0,0,0,0.3)] hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)]"
              >
                <span className="text-sm uppercase font-bold tracking-[0.2em]">Start Trial</span>
                <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center transition-all duration-500 group-hover:bg-[#10b981] group-hover:scale-105" aria-hidden="true">
                  <ArrowUpRight strokeWidth={1.5} size={20} className="text-white transition-transform duration-500 ease-premium group-hover:translate-x-[2px] group-hover:-translate-y-[2px]" />
                </div>
              </Link>
              
              <a
                href="#product"
                onClick={() => {
                  void track(
                    "landing_cta_clicked",
                    { cta_location: "final_cta_secondary", target_path: "#product" },
                    { surface: "landing", path: "/" },
                  );
                }}
                className="group flex items-center gap-2 text-white/40 hover:text-white transition-all duration-500 text-xs uppercase font-bold tracking-widest"
              >
                Explore Engine
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  &rarr;
                </motion.span>
              </a>
            </motion.div>
          </div>

          {/* Masonry Image Tiles Block */}
          <div className="mt-14 flex justify-end gap-8 sm:-mt-44 sm:justify-start sm:pl-20 lg:mt-0 lg:pl-0">
            <div className="ml-auto w-44 flex-none space-y-8 pt-32 sm:ml-0 sm:pt-80 lg:order-last lg:pt-36 xl:order-0 xl:pt-80">
              <motion.div 
                 whileHover={{ y: -10 }}
                 className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10"
              >
                <img
                  src="/images/landing/hero-1.png"
                  alt="Leaveflow Pro collaboration interface"
                  width="400"
                  height="600"
                  loading="lazy"
                  decoding="async"
                  className="aspect-[2/3] w-full object-cover"
                />
              </motion.div>
            </div>
            
            <div className="mr-auto w-44 flex-none space-y-8 sm:mr-0 sm:pt-52 lg:pt-36">
              <motion.div 
                 whileHover={{ y: -10 }}
                 className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10"
              >
                <img
                  src="/images/landing/feature_leave.png"
                  alt="Enterprise leave management strategy screen"
                  width="400"
                  height="600"
                  loading="lazy"
                  decoding="async"
                  className="aspect-[2/3] w-full object-cover"
                />
              </motion.div>
              <motion.div 
                 whileHover={{ y: -10 }}
                 className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10"
              >
                <img
                  src="/images/landing/feature_report.png"
                  alt="Workforce analytics and reporting dashboard"
                  width="400"
                  height="600"
                  loading="lazy"
                  decoding="async"
                  className="aspect-[2/3] w-full object-cover"
                />
              </motion.div>
            </div>
            
            <div className="w-44 flex-none space-y-8 pt-32 sm:pt-0">
              <motion.div 
                 whileHover={{ y: -10 }}
                 className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10"
              >
                <img
                  src="/images/landing/hero-5.png"
                  alt="Human capital organization view"
                  width="400"
                  height="600"
                  loading="lazy"
                  decoding="async"
                  className="aspect-[2/3] w-full object-cover"
                />
              </motion.div>
              <motion.div 
                 whileHover={{ y: -10 }}
                 className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10"
              >
                <img
                  src="/images/landing/feature_geo.png"
                  alt="Global compliance and policy tracking screen"
                  width="400"
                  height="600"
                  loading="lazy"
                  decoding="async"
                  className="aspect-[2/3] w-full object-cover"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
