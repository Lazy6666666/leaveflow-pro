import React from 'react';
import { Link } from 'react-router-dom';
import { Player } from '@remotion/player';
import { HeroVideo } from '@/remotion/HeroVideo';
import { motion } from 'framer-motion';

export const Hero = () => {
    return (
        <section
            id="hero"
            className="relative w-full h-[85vh] min-h-[700px] flex flex-col items-center justify-center overflow-hidden border-b border-white/5 bg-[#050505]"
            aria-labelledby="hero-heading"
        >
            {/* Structural Lines (Editorial Style) */}
            <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden" aria-hidden="true">
                <div className="absolute top-[12%] left-0 w-full h-[1px] bg-white/[0.05]" />
                <div className="absolute bottom-[12%] left-0 w-full h-[1px] bg-white/[0.05]" />
                <div className="absolute left-[8%] top-0 h-full w-[1px] bg-white/[0.05]" />
                <div className="absolute right-[8%] top-0 h-full w-[1px] bg-white/[0.05]" />
                
                {/* Secondary Intersection lines */}
                <div className="absolute top-[12%] left-[8%] w-4 h-4 -translate-x-1/2 -translate-y-1/2 border-white/20 border-l border-t" />
                <div className="absolute top-[12%] right-[8%] w-4 h-4 translate-x-1/2 -translate-y-1/2 border-white/20 border-r border-t" />
                <div className="absolute bottom-[12%] left-[8%] w-4 h-4 -translate-x-1/2 translate-y-1/2 border-white/20 border-l border-b" />
                <div className="absolute bottom-[12%] right-[8%] w-4 h-4 translate-x-1/2 translate-y-1/2 border-white/20 border-r border-b" />
            </div>

            {/* Corner Metadata (Editorial Accents) */}
            <div className="absolute top-12 left-12 flex flex-col gap-2 z-40 opacity-30 select-none hidden lg:flex" aria-hidden="true">
                <span className="text-white font-['Manrope'] text-[8px] font-bold tracking-[0.5em] uppercase whitespace-nowrap">Status: Operational</span>
                <span className="text-white font-['Manrope'] text-[8px] font-bold tracking-[0.5em] uppercase whitespace-nowrap">Identity: Balance_v03</span>
            </div>
            
            <div className="absolute top-12 right-12 flex flex-col gap-2 z-40 opacity-30 text-right select-none hidden lg:flex" aria-hidden="true">
                <span className="text-white font-['Manrope'] text-[8px] font-bold tracking-[0.5em] uppercase whitespace-nowrap">LOC: 34.05°N / 118.24°W</span>
                <span className="text-white font-['Manrope'] text-[8px] font-bold tracking-[0.5em] uppercase whitespace-nowrap">GRID: X-722.92</span>
            </div>
            {/* Remotion Animated Background */}
            <div className="absolute inset-0 z-0 opacity-40 grayscale pointer-events-none" aria-hidden="true">
                <Player
                    component={HeroVideo}
                    durationInFrames={300}
                    fps={30}
                    compositionWidth={1920}
                    compositionHeight={1080}
                    style={{
                        width: '100%',
                        height: '100%',
                    }}
                    loop
                    autoPlay
                    controls={false}
                />
            </div>

            {/* Subtle Texture/Hero Image Layer */}
            <div className="absolute inset-0 z-0 opacity-[0.08] mix-blend-overlay pointer-events-none filter blur-[2px]">
                <img src="/images/landing/hero.png" alt="" className="w-full h-full object-cover scale-110" />
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505] z-0" aria-hidden="true" />

            {/* Hero Content Layer */}
            <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-5xl w-full">

                {/* Animated Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center gap-3 bg-white/5 px-5 py-2 rounded-full border border-white/10 backdrop-blur-xl mb-12"
                >
                    <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-pulse" aria-hidden="true" />
                    <span className="text-white font-['Manrope'] text-[10px] font-bold tracking-[0.3em] uppercase opacity-80">
                        Productivity Infrastructure
                    </span>
                </motion.div>

                {/* Responsive Headline */}
                <motion.h1
                    id="hero-heading"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="text-white font-['Cormorant_Garamond'] text-[clamp(60px,11vw,150px)] font-medium leading-[0.82] tracking-tighter mb-10"
                >
                    Workforce<br />
                    <span className="italic font-light text-white/40">Equilibrium.</span>
                </motion.h1>

                {/* Refined Subtext */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="text-white font-['Manrope'] text-lg md:text-xl lg:text-2xl max-w-3xl leading-relaxed tracking-tight font-normal mb-14"
                >
                    The architectural standard for enterprise fluidity.<br />
                    Harmonizing human potential with systemic precision.
                </motion.p>

                {/* Interactive Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col sm:flex-row items-center gap-6"
                >
                    <Link
                        to="/auth?signup=true"
                        className="group relative bg-white text-black font-['Inter'] text-sm font-semibold px-12 py-5 rounded-sm overflow-hidden transition-transform active:scale-95 shadow-xl"
                        aria-label="Start your free trial with BALANCE"
                    >
                        <span className="relative z-10">Start Free Trial</span>
                        <div className="absolute inset-0 bg-neutral-200 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
                    </Link>

                    <a
                        href="#features"
                        className="group bg-transparent text-white font-['Inter'] text-sm font-semibold px-12 py-5 rounded-sm border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all active:scale-95"
                        aria-label="Learn more about BALANCE system features"
                    >
                        See System →
                    </a>
                </motion.div>

                {/* Decorative Scroll Hint */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    transition={{ duration: 1, delay: 1.2 }}
                    className="absolute bottom-[-100px] md:bottom-[-150px] flex flex-col items-center gap-4"
                    aria-hidden="true"
                >
                    <span className="text-white font-['Inter'] text-[9px] uppercase tracking-[0.5em] vertical-text">
                        SCROLL
                    </span>
                    <div className="w-[1px] h-12 bg-gradient-to-b from-white/40 to-transparent" />
                </motion.div>
            </div>

            {/* Decorative Corner Accents */}
            <div className="absolute top-12 left-12 w-24 h-[1px] bg-white/20 hidden lg:block" aria-hidden="true" />
            <div className="absolute top-12 left-12 w-[1px] h-24 bg-white/20 hidden lg:block" aria-hidden="true" />
            <div className="absolute bottom-12 right-12 w-24 h-[1px] bg-white/20 hidden lg:block" aria-hidden="true" />
            <div className="absolute bottom-12 right-12 w-[1px] h-24 bg-white/20 hidden lg:block" aria-hidden="true" />

            {/* White Glow Bloom */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-white/[0.03] blur-[120px] rounded-full pointer-events-none" />
        </section>
    );
};
