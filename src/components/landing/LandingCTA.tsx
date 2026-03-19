"use client";
import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export const LandingCTA = () => {
  return (
    <section className="relative bg-[#1A1815] py-24 md:py-40 overflow-hidden">
      {/* Background patterns / mesh */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#C9A962_0%,transparent_50%)] blur-[100px]" />
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
                <span className="w-12 h-[1px] bg-[#C9A962]/40 block"></span>
                <span className="text-[10px] tracking-[0.3em] font-bold uppercase text-[#C9A962]/60">The Opportunity</span>
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="font-['Outfit'] text-5xl md:text-7xl font-black tracking-tight text-[#FDFBF7] leading-[0.95]"
            >
              Orchestrate your <br/>
              <span className="font-['Cormorant_Garamond'] font-light italic text-[#C9A962]">legacy today.</span>
            </motion.h2>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="mt-10 text-lg md:text-xl font-light text-[#FDFBF7]/60 max-w-[500px] leading-relaxed font-['Outfit']"
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
                className="group relative flex items-center justify-between gap-8 pl-8 pr-2 py-2 bg-[#FDFBF7] text-[#1A1815] rounded-[2.5rem] active:scale-[0.98] transition-all duration-500 ease-premium shadow-[0_20px_40px_-12px_rgba(0,0,0,0.3)] hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.4)]"
              >
                <span className="text-sm uppercase font-bold tracking-[0.2em]">Start Trial</span>
                <div className="w-12 h-12 rounded-full bg-[#1A1815] flex items-center justify-center transition-all duration-500 group-hover:bg-[#C9A962] group-hover:scale-105">
                  <ArrowUpRight strokeWidth={1.5} size={20} className="text-[#FDFBF7] transition-transform duration-500 ease-premium group-hover:translate-x-[2px] group-hover:-translate-y-[2px]" />
                </div>
              </Link>
              
              <a href="#product" className="group flex items-center gap-2 text-[#FDFBF7]/40 hover:text-[#FDFBF7] transition-all duration-500 text-xs uppercase font-bold tracking-widest">
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
                  src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=400&h=600"
                  alt="Professional collaboration"
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
                  src="https://images.unsplash.com/photo-1485217988980-11786ced9454?auto=format&fit=crop&q=80&w=400&h=600"
                  alt="Enterprise strategy"
                  className="aspect-[2/3] w-full object-cover"
                />
              </motion.div>
              <motion.div 
                 whileHover={{ y: -10 }}
                 className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10"
              >
                <img
                  src="https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&q=80&w=400&h=600"
                  alt="Modern office"
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
                  src="https://images.unsplash.com/photo-1670272504528-790c24957dda?auto=format&fit=crop&q=80&w=400&h=600"
                  alt="Human capital"
                  className="aspect-[2/3] w-full object-cover"
                />
              </motion.div>
              <motion.div 
                 whileHover={{ y: -10 }}
                 className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10"
              >
                <img
                  src="https://images.unsplash.com/photo-1670272505284-8faba1c31f7d?auto=format&fit=crop&q=80&w=400&h=600"
                  alt="Growth"
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
