import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export const FinalCTA = () => {
    return (
        <section
            id="final-cta"
            className="relative w-full py-[160px] bg-[#050505] overflow-hidden flex items-center justify-center"
            aria-labelledby="cta-heading"
        >
            {/* Structural Lines (Editorial Style) */}
            <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden" aria-hidden="true">
                <div className="absolute top-[8%] left-0 w-full h-[1px] bg-white/[0.04]" />
                <div className="absolute bottom-[8%] left-0 w-full h-[1px] bg-white/[0.04]" />
                <div className="absolute left-[12%] top-0 h-full w-[1px] bg-white/[0.04]" />
                <div className="absolute right-[12%] top-0 h-full w-[1px] bg-white/[0.04]" />
            </div>

            {/* Texture Layer */}
            <div className="absolute inset-0 opacity-[0.05] grayscale pointer-events-none filter blur-[3px]" aria-hidden="true">
                <img src="/images/landing/hero.png" alt="" className="w-full h-full object-cover scale-125" />
            </div>

            {/* Background Graphic Box */}
            <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[60%] bg-white/[0.03] rounded-full blur-[140px] pointer-events-none" aria-hidden="true" />
            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[60%] bg-white/[0.02] rounded-full blur-[140px] pointer-events-none" aria-hidden="true" />

            {/* Content */}
            <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center gap-12 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 bg-white/[0.03] px-5 py-2 rounded-sm border border-white/10 backdrop-blur-3xl mb-4"
                >
                    <div className="w-1 h-1 rounded-full bg-white/40" />
                    <span className="text-white font-['Manrope'] text-[8px] font-bold tracking-[0.5em] uppercase opacity-60">
                        Final System Protocol
                    </span>
                </motion.div>

                <motion.h2
                    id="cta-heading"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                    className="text-white font-['Cormorant_Garamond'] text-[clamp(48px,8vw,100px)] font-medium leading-[0.9] tracking-tighter"
                >
                    Precision starts <br />
                    <span className="italic opacity-80 text-white/60">with one decision.</span>
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="text-white font-['Manrope'] text-base md:text-lg lg:text-xl font-normal max-w-2xl leading-relaxed opacity-70"
                >
                    Join the organizations redefining HR efficiency with BALANCE. <br className="hidden md:block" />
                    Transparent, automated, and built for the future of work.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="flex flex-col sm:flex-row items-center gap-6 mt-4"
                >
                    <Link
                        to="/auth?signup=true"
                        className="group relative bg-white text-black font-['Inter'] text-sm font-semibold px-16 py-6 rounded-sm overflow-hidden transition-all active:scale-95 shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)] hover:shadow-[0_25px_50px_-12px_rgba(255,255,255,0.3)]"
                    >
                        <span className="relative z-10">Request Access Now</span>
                        <div className="absolute inset-0 bg-neutral-200 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
                    </Link>
                    <a
                        href="#features"
                        className="text-white font-['Manrope'] text-sm font-bold tracking-widest transition-colors flex items-center gap-3 opacity-40 hover:opacity-100"
                    >
                        SYSTEM OVERVIEW <span className="text-xl">→</span>
                    </a>
                </motion.div>
            </div>

            {/* Decorative Line Accents */}
            <div className="absolute left-0 bottom-1/2 w-32 h-[1px] bg-white/5 opacity-50" />
            <div className="absolute right-0 top-1/2 w-32 h-[1px] bg-white/5 opacity-50" />
        </section>
    );
};
