"use client";
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export const FinalCTA = () => {
  /**
   * High-Impact Vertical Masonry
   * 
   * Adjusted for high-visibility: Base heights increased to fill space 
   * and ensure density across the entire vertical axis.
   */
  const images = useMemo(() => [
    {
      src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=80",
      className: "h-[450px]", 
    },
    {
      src: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1000&q=80",
      className: "h-[320px]",
    },
    {
      src: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1000&q=80",
      className: "h-[400px]",
    },
    {
      src: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1000&q=80",
      className: "h-[500px]",
    },
    {
      src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=80",
      className: "h-[350px]",
    },
    {
      src: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1000&q=80",
      className: "h-[420px]",
    },
  ], []);

  return (
    <section className="w-full min-h-[900px] lg:h-screen py-24 lg:py-0 bg-[#FDFDFB] overflow-hidden relative flex items-center" aria-labelledby="cta-heading">
      {/* Dynamic Ambient Background - Adjusted for Light Theme */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20" aria-hidden="true">
        <div className="absolute -top-[15%] -left-[10%] w-[50%] h-[50%] bg-teal-500/20 rounded-full blur-[140px]" />
        <div className="absolute bottom-[10%] -right-[15%] w-[60%] h-[60%] bg-cyan-500/15 rounded-full blur-[160px]" />
      </div>

      <div className="max-w-[1440px] mx-auto px-6 md:px-10 w-full lg:pr-0 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[45%_55%] gap-16 lg:gap-0 items-center">
          
          {/* Left Content Column */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            viewport={{ once: true }}
            className="flex flex-col lg:pr-24 z-20"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 mb-10 w-fit"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-teal-600">Join the workforce evolution</span>
            </motion.div>

            <h2 id="cta-heading" className="text-5xl md:text-7xl lg:text-[100px] font-black text-[#171411] mb-10 leading-[0.85] tracking-tighter">
              Elevate your <br />
              <span className="bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 bg-clip-text text-transparent italic pr-4">strategy.</span>
            </h2>
            <p className="text-[#5A6270] text-lg md:text-2xl mb-14 max-w-lg leading-relaxed font-medium">
              Infrastructure built for clarity. Scale your team with confidence while we handle the complexities of workforce management.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6">
              <Link
                to="/auth?signup=true"
                className="group inline-flex items-center justify-center gap-3 bg-[#171411] text-white px-12 py-6 rounded-full font-black text-[15px] uppercase tracking-widest transition-all hover:bg-black/95 hover:shadow-2xl hover:shadow-teal-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FDFDFB]"
              >
                Get Started Now
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1.5" strokeWidth={3} />
              </Link>
              <button className="px-12 py-6 bg-transparent border-2 border-[#171411]/10 text-[#171411] hover:bg-[#171411]/5 rounded-full font-black text-[15px] uppercase tracking-widest transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171411] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FDFDFB]">
                Book a Demo
              </button>
            </div>

            <div className="mt-20 flex items-center gap-8">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-14 h-14 rounded-full border-[5px] border-[#FDFDFB] bg-neutral-200 flex items-center justify-center overflow-hidden shadow-lg">
                     <div className="w-full h-full bg-gradient-to-br from-neutral-300 to-neutral-500" />
                  </div>
                ))}
              </div>
              <div className="space-y-0.5">
                <p className="text-xl font-black text-[#171411] tabular-nums tracking-tight">120+ teams</p>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5A6270]">joined this week</p>
              </div>
            </div>
          </motion.div>

          {/* Right Masonry Column - Adjusted for Light Theme */}
          <div className="relative h-screen lg:absolute lg:right-0 lg:top-0 lg:bottom-0 lg:w-[55vw] flex items-center overflow-hidden pointer-events-none lg:pointer-events-auto">
            <div className="columns-2 gap-10 space-y-10 w-full max-w-[1100px] lg:translate-x-20">
              {images.map((img, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 60 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 1, 
                    delay: idx * 0.1,
                    ease: [0.23, 1, 0.32, 1] 
                  }}
                  viewport={{ once: true }}
                  className="break-inside-avoid"
                >
                  <div className="relative group overflow-hidden rounded-[48px] border border-[#171411]/10 shadow-xl bg-white">
                    <img
                      src={img.src}
                      alt={`Balance visual ${idx + 1}`}
                      loading="lazy"
                      className={cn(
                        "w-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-1000 ease-apple-ease scale-100 group-hover:scale-110",
                        img.className
                      )}
                    />
                    {/* Softened overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#FDFDFB]/60 via-transparent to-transparent opacity-40 group-hover:opacity-0 transition-opacity duration-700" />
                    
                    {/* Inner highlight */}
                    <div className="absolute inset-0 border border-black/5 rounded-[48px] pointer-events-none" />
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Soft Gradient Masks */}
            <div className="absolute top-0 left-0 right-0 h-[20vh] bg-gradient-to-b from-[#FDFDFB] via-[#FDFDFB]/80 to-transparent z-10" />
            <div className="absolute bottom-0 left-0 right-0 h-[20vh] bg-gradient-to-t from-[#FDFDFB] via-[#FDFDFB]/80 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#FDFDFB] via-[#FDFDFB]/40 to-transparent z-10 hidden lg:block" />
            
            {/* Ambient Edge Glow */}
            <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-96 h-full bg-teal-500/5 blur-[180px] pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
};
