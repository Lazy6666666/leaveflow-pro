import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, Globe, Layers, Zap, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const navLinks = [
  { name: 'Product', href: '#' },
  { name: 'Engine', href: '#' },
  { name: 'Global', href: '#' },
  { name: 'Company', href: '#' },
];

export const PureWhiteLanding = () => {
  return (
    <div className="min-h-[100dvh] bg-[#FDFBF7] text-[#1A1815] selection:bg-[#C9A962] selection:text-white font-['Outfit'] overflow-x-hidden relative">
      {/* Vibe Texture: Subtle Grain Overlay */}
      <div 
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
      
      <FluidIslandNav />
      
      <main>
        <HeroSection />
        <TransitionSection />
        <DoubleBezelEcosystem />
        <InfrastructureEditorial />
        <ZAxisCascade />
        <FinalCTA />
      </main>
      
      <Footer />
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* A. Fluid Island Nav (Hamburger Morph & Staggered Reveal)                   */
/* -------------------------------------------------------------------------- */
const FluidIslandNav = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Prevent scroll when menu is open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  return (
    <>
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-[800px] pointer-events-none">
        <div className="flex items-center justify-between p-2 pl-6 bg-white/70 backdrop-blur-3xl border border-black/[0.04] rounded-full shadow-[0_8px_32px_-12px_rgba(0,0,0,0.08)] pointer-events-auto transition-all duration-700 ease-premium">
          {/* Logo */}
          <div className="flex items-center gap-3 relative z-20">
            <span className="font-['Cormorant_Garamond'] text-xl font-medium tracking-[0.08em] uppercase text-[#1A1815]">
              Balance.
            </span>
          </div>

          {/* Desktop Links (Hidden on Mobile) */}
          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} className="text-xs font-semibold uppercase tracking-widest text-black/50 hover:text-black transition-colors duration-500">
                {link.name}
              </a>
            ))}
          </nav>

          {/* Right Side: CTA + Hamburger Wrapper */}
          <div className="flex items-center gap-2 relative z-20">
            <Link
              to="/auth/register"
              className="hidden md:flex group relative items-center justify-between gap-6 pl-6 pr-1.5 py-1.5 bg-[#1A1815] text-[#FDFBF7] rounded-full active:scale-[0.98] transition-all duration-500 ease-premium shadow-[0_4px_16px_-4px_rgba(26,24,21,0.4)]"
            >
              <span className="text-[10px] uppercase font-bold tracking-[0.2em]">Start Trial</span>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center transition-all duration-500 group-hover:bg-white/20 group-hover:scale-105">
                <ArrowUpRight strokeWidth={1} size={16} className="transition-transform duration-500 ease-premium group-hover:translate-x-[2px] group-hover:-translate-y-[2px]" />
              </div>
            </Link>
            
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden w-12 h-12 rounded-full bg-black/5 flex items-center justify-center relative active:scale-95 transition-all duration-500"
            >
              <div className="relative w-5 h-5 flex flex-col justify-center items-center">
                <span className={`absolute h-[1px] w-5 bg-black transition-all duration-700 ease-premium ${isOpen ? 'rotate-45' : '-translate-y-1.5'}`} />
                <span className={`absolute h-[1px] w-5 bg-black transition-all duration-500 ease-premium ${isOpen ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'}`} />
                <span className={`absolute h-[1px] w-5 bg-black transition-all duration-700 ease-premium ${isOpen ? '-rotate-45' : 'translate-y-1.5'}`} />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Expanded Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(24px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-0 z-50 bg-[#FDFBF7]/90 md:hidden flex flex-col items-center justify-center px-8"
          >
            <nav className="flex flex-col items-center gap-12 w-full">
              {navLinks.map((link, i) => (
                <motion.a 
                  key={link.name} 
                  href={link.href} 
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
                  transition={{ duration: 0.8, delay: 0.1 * i, ease: [0.32, 0.72, 0, 1] }}
                  className="font-['Cormorant_Garamond'] text-5xl text-[#1A1815]"
                >
                  {link.name}
                </motion.a>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4, ease: [0.32, 0.72, 0, 1] }}
                className="mt-8"
              >
                <Link
                  to="/auth/register"
                  className="group relative flex items-center justify-between gap-8 pl-8 pr-2 py-2 bg-[#1A1815] text-[#FDFBF7] rounded-full active:scale-[0.98] transition-all duration-500 ease-premium"
                >
                  <span className="text-xs uppercase font-bold tracking-[0.2em]">Start Trial</span>
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center transition-all duration-500 group-hover:bg-white/20 group-hover:scale-105">
                    <ArrowUpRight strokeWidth={1} size={18} className="transition-transform duration-500 ease-premium group-hover:translate-x-[2px] group-hover:-translate-y-[2px]" />
                  </div>
                </Link>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/* -------------------------------------------------------------------------- */
/* B. Hero Section (Reverted to Minimal Outfit Bold Design)                   */
/* -------------------------------------------------------------------------- */
const HeroSection = () => {
  return (
    <section className="relative pt-[240px] pb-[160px] flex justify-center bg-transparent overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[1360px] px-8 text-center relative z-10"
      >
        <h1 className="font-['Outfit'] text-[5rem] md:text-[8rem] lg:text-[10rem] font-black leading-[0.9] tracking-[-0.04em] text-[#1A1815] drop-shadow-sm mb-6">
          Harmony in<br />
          Motion.
        </h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.32, 0.72, 0, 1] }}
          className="text-lg md:text-xl text-black/50 max-w-[500px] mx-auto leading-relaxed font-light"
        >
          The most elegant abstraction for human capital. Orchestrated with impossible precision.
        </motion.p>
      </motion.div>

      {/* Atmospheric Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-1/2 bg-[#C9A962]/5 blur-[120px] rounded-full pointer-events-none -z-10" />
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/* C. Transition Section (Double-Bezel Image Shell)                           */
/* -------------------------------------------------------------------------- */
const TransitionSection = () => {
  return (
    <section className="py-32 md:py-48 px-4 w-full">
      <div className="max-w-[1240px] mx-auto flex flex-col gap-24">
        {/* Double-Bezel Architecture Container */}
        <motion.div 
          initial={{ opacity: 0, y: 80, filter: 'blur(12px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.4, ease: [0.32, 0.72, 0, 1] }}
          className="w-full p-2 bg-black/[0.03] ring-1 ring-black/[0.08] rounded-[2rem] md:rounded-[3rem]"
        >
          <div className="relative w-full aspect-square md:aspect-[21/9] bg-white rounded-[calc(2rem-0.5rem)] md:rounded-[calc(3rem-0.5rem)] overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
            <img 
              src="/images/landing/hero-5.png" 
              alt="Engineered Scale" 
              className="w-full h-full object-cover object-center scale-105"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/* D. Double-Bezel Ecosystem (The Asymmetrical Bento Variant)                 */
/* -------------------------------------------------------------------------- */
const DoubleBezelEcosystem = () => {
  return (
    <section className="py-32 md:py-48 px-4 w-full">
      <div className="max-w-[1240px] mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: [0.32, 0.72, 0, 1] }}
          className="mb-24"
        >
          <div className="inline-block rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.25em] font-bold border border-black/10 text-black/60 mb-8">
            The Ecosystem
          </div>
          <h2 className="font-['Cormorant_Garamond'] text-6xl md:text-8xl font-medium text-[#1A1815] leading-[0.9] tracking-[-0.04em] max-w-[800px]">
            A unified suite.<br/>Flawlessly executed.
          </h2>
        </motion.div>

        {/* Asymmetrical Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full">
          
          {/* Card 1: Wide */}
          <motion.div 
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 1, delay: 0, ease: [0.32, 0.72, 0, 1] }}
            className="md:col-span-8 p-1.5 bg-black/[0.03] ring-1 ring-black/[0.06] rounded-[2rem]"
          >
            <div className="w-full h-[400px] md:h-[500px] bg-white rounded-[calc(2rem-0.375rem)] overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] relative p-8 md:p-12 flex flex-col justify-between group">
              <div className="relative z-10 max-w-sm">
                <h3 className="font-['Cormorant_Garamond'] text-4xl font-medium mb-4">Effortless Tracking</h3>
                <p className="font-light text-black/50 text-sm leading-relaxed">Real-time attendance that runs entirely in the background. GPS verification matched with autonomous privacy guards.</p>
              </div>
              <div className="absolute right-0 bottom-0 w-2/3 h-2/3 translate-x-12 translate-y-12 bg-zinc-50 rounded-tl-3xl border-t border-l border-zinc-100 p-6 transition-transform duration-1000 ease-premium group-hover:-translate-x-4 group-hover:-translate-y-4">
                <img src="/images/landing/feature_dashboard.png" className="w-full h-full object-cover rounded-xl shadow-2xl" alt="Dashboard" />
              </div>
            </div>
          </motion.div>

          {/* Card 2: Tall */}
          <motion.div 
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 1, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
            className="md:col-span-4 p-1.5 bg-black/[0.03] ring-1 ring-black/[0.06] rounded-[2rem]"
          >
            <div className="w-full h-[400px] md:h-[500px] bg-[#1A1815] text-[#FDFBF7] rounded-[calc(2rem-0.375rem)] shadow-[inset_0_2px_4px_rgba(255,255,255,0.05)] relative p-8 md:p-12 flex flex-col justify-between overflow-hidden">
              <div className="relative z-10">
                <h3 className="font-['Cormorant_Garamond'] text-4xl font-medium mb-4 text-[#C9A962]">Leave Parameters</h3>
                <p className="font-light text-white/50 text-sm leading-relaxed">Approval in seconds. Real-time accruals. No friction.</p>
              </div>
              <img src="/images/landing/feature_leave.png" className="mt-8 rounded-xl opacity-90 object-cover" alt="Leave" />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/* E. Infrastructure Editorial (The Editorial Split)                            */
/* -------------------------------------------------------------------------- */
const InfrastructureEditorial = () => {
  return (
    <section className="py-32 md:py-48 px-4 w-full border-t border-black/[0.05]">
      <div className="max-w-[1240px] mx-auto flex flex-col md:flex-row items-center gap-16 md:gap-32">
        {/* Left: Huge Editorial Type */}
        <motion.div 
          initial={{ opacity: 0, x: -60, filter: 'blur(12px)' }}
          whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.4, ease: [0.32, 0.72, 0, 1] }}
          className="w-full md:w-1/2"
        >
          <div className="inline-block rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.25em] font-bold border border-black/10 text-black/60 mb-12">
            The Foundation
          </div>
          <h2 className="font-['Cormorant_Garamond'] text-[4rem] md:text-[6rem] font-medium leading-[0.9] tracking-[-0.04em] text-[#1A1815] mb-12">
            The solid<br/>infrastructure<br/><span className="italic text-[#C9A962]">of work.</span>
          </h2>
          <p className="font-light text-black/50 text-lg leading-relaxed max-w-[400px] mb-16">
            A distributed ledger of human effort. Real-time, peer-verified, and completely secure. Balance isn't just an application—it's the underlying substrate for the global workforce.
          </p>
          
          <div className="flex flex-col gap-8">
            <div className="flex items-start gap-6 group">
              <div className="w-12 h-12 rounded-full border border-black/10 flex items-center justify-center shrink-0 transition-colors duration-500 group-hover:bg-[#1A1815] group-hover:text-white">
                <Zap strokeWidth={1} size={20} />
              </div>
              <div>
                <h4 className="font-bold text-sm tracking-widest uppercase mb-2">Zero-Latency Sync</h4>
                <p className="font-light text-sm text-black/50">Changes propagate across the globe in milliseconds.</p>
              </div>
            </div>
            <div className="flex items-start gap-6 group">
              <div className="w-12 h-12 rounded-full border border-black/10 flex items-center justify-center shrink-0 transition-colors duration-500 group-hover:bg-[#1A1815] group-hover:text-white">
                <Layers strokeWidth={1} size={20} />
              </div>
              <div>
                <h4 className="font-bold text-sm tracking-widest uppercase mb-2">Enterprise Governance</h4>
                <p className="font-light text-sm text-black/50">Granular permissions built on a zero-trust model.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right: Double-Bezel Floating Image */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, filter: 'blur(12px)' }}
          whileInView={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.4, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
          className="w-full md:w-1/2 p-2 bg-black/[0.03] ring-1 ring-black/[0.06] rounded-[2rem] md:rounded-[3rem]"
        >
          <div className="relative w-full aspect-square bg-white rounded-[calc(2rem-0.5rem)] md:rounded-[calc(3rem-0.5rem)] overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
            <img src="/images/landing/vctr_labyrinth.png" alt="Node Graph" className="w-full h-full object-cover scale-110 opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-tr from-white via-transparent to-transparent opacity-50" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/* F. Global Scale (Z-Axis Cascade variant)                                   */
/* -------------------------------------------------------------------------- */
const ZAxisCascade = () => {
  return (
    <section className="py-32 md:py-48 px-4 w-full bg-[#1A1815] text-[#FDFBF7] relative overflow-hidden">
      {/* Vantablack backdrop with ethereal noise */}
      <div 
        className="pointer-events-none absolute inset-0 z-0 opacity-20 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
      
      <div className="max-w-[1240px] mx-auto relative z-10 flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.2, ease: [0.32, 0.72, 0, 1] }}
          className="text-center mb-24"
        >
          <div className="inline-block rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.25em] font-bold border border-white/20 text-white/60 mb-8">
            Borderless Global
          </div>
          <h2 className="font-['Cormorant_Garamond'] text-[5rem] md:text-[8rem] font-medium leading-[0.9] tracking-[-0.04em] mb-12">
            Compute anywhere.<br/>Reside <span className="text-[#C9A962] italic">everywhere.</span>
          </h2>
        </motion.div>

        {/* The Cascade Cards */}
        <div className="relative w-full max-w-[800px] aspect-square md:aspect-video flex items-center justify-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 100, rotate: 0 }}
            whileInView={{ opacity: 1, y: 0, rotate: -4 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.4, ease: [0.32, 0.72, 0, 1] }}
            className="absolute z-10 w-3/4 md:w-2/3 p-1.5 bg-white/5 ring-1 ring-white/10 rounded-[2rem] shadow-2xl backdrop-blur-xl -translate-x-12"
          >
            <div className="bg-[#1A1815] border border-white/10 rounded-[calc(2rem-0.375rem)] p-8">
              <Globe strokeWidth={1} size={32} className="text-[#C9A962] mb-6" />
              <div className="font-['Outfit'] font-black text-6xl mb-2">99.9%</div>
              <div className="text-xs tracking-widest uppercase text-white/40">Guaranteed SLA Uptime</div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 140, rotate: 0 }}
            whileInView={{ opacity: 1, y: 0, rotate: 6 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.4, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
            className="absolute z-20 w-3/4 md:w-2/3 p-1.5 bg-white/10 ring-1 ring-white/20 rounded-[2rem] shadow-2xl backdrop-blur-3xl translate-x-12 translate-y-12"
          >
            <div className="bg-[#FDFBF7] text-[#1A1815] rounded-[calc(2rem-0.375rem)] overflow-hidden aspect-video flex flex-col justify-end p-8 relative">
              <div className="absolute inset-0">
                <img src="/images/landing/feature_geo.png" alt="Geo" className="w-full h-full object-cover mix-blend-multiply opacity-80" />
              </div>
              <div className="relative z-10 bg-white/80 backdrop-blur-md p-4 rounded-xl border border-black/5 w-fit">
                <div className="font-['Outfit'] font-black text-4xl mb-1">&lt;50ms</div>
                <div className="text-[10px] font-bold tracking-widest uppercase text-black/40">Global Latency</div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/* G. Final CTA (Macro-Whitespace & Button-in-Button)                         */
/* -------------------------------------------------------------------------- */
const FinalCTA = () => {
  return (
    <section className="py-48 px-4 w-full flex justify-center items-center">
      <motion.div 
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1.2, ease: [0.32, 0.72, 0, 1] }}
        className="max-w-[800px] w-full text-center flex flex-col items-center"
      >
        <h2 className="font-['Cormorant_Garamond'] text-[6rem] md:text-[8rem] font-medium leading-[0.9] tracking-[-0.04em] text-[#1A1815] mb-16">
          Experience the<br />
          <span className="italic text-[#C9A962]">Difference.</span>
        </h2>
        
        <Link
          to="/auth/register"
          className="group relative flex items-center justify-between gap-12 pl-12 pr-2 py-2 bg-[#1A1815] text-[#FDFBF7] rounded-full active:scale-[0.98] transition-all duration-500 ease-premium shadow-[0_20px_40px_-10px_rgba(26,24,21,0.2)]"
        >
          <span className="text-sm uppercase font-bold tracking-[0.2em] relative z-10">Start Enterprise Trial</span>
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center transition-all duration-500 group-hover:bg-[#C9A962] group-hover:scale-105 relative z-10">
            <ArrowUpRight strokeWidth={1} size={24} className="transition-transform duration-500 ease-premium group-hover:translate-x-[2px] group-hover:-translate-y-[2px]" />
          </div>
        </Link>
      </motion.div>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/* H. Footer                                                                  */
/* -------------------------------------------------------------------------- */
const Footer = () => {
  return (
    <footer className="px-4 w-full border-t border-black/5 pb-12 pt-32 bg-white">
      <div className="max-w-[1240px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start gap-24 mb-32">
          
          <div className="max-w-[300px]">
            <span className="font-['Cormorant_Garamond'] text-3xl font-medium tracking-[0.08em] uppercase text-[#1A1815] mb-8 block">
              Balance.
            </span>
            <p className="font-light text-sm text-black/50 leading-relaxed">
              The high-end standard for workforce orchestration. Designed in California, engineered globally.
            </p>
          </div>

          <div className="flex gap-24 font-light">
            <div className="flex flex-col gap-6">
              <span className="text-[10px] font-bold tracking-widest uppercase text-black/30 mb-2">Platform</span>
              <a href="#" className="text-sm text-black/60 hover:text-black transition-colors duration-500">Architecture</a>
              <a href="#" className="text-sm text-black/60 hover:text-black transition-colors duration-500">Ecosystem</a>
              <a href="#" className="text-sm text-black/60 hover:text-black transition-colors duration-500">Security</a>
            </div>
            <div className="flex flex-col gap-6">
              <span className="text-[10px] font-bold tracking-widest uppercase text-black/30 mb-2">Company</span>
              <a href="#" className="text-sm text-black/60 hover:text-black transition-colors duration-500">About</a>
              <a href="#" className="text-sm text-black/60 hover:text-black transition-colors duration-500">Careers</a>
              <a href="#" className="text-sm text-black/60 hover:text-black transition-colors duration-500">Contact</a>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center py-8 border-t border-black/5 gap-8">
          <p className="text-[10px] font-bold tracking-widest uppercase text-black/30">
            © {new Date().getFullYear()} BALANCE TECHNOLOGIES
          </p>
          <div className="flex gap-8">
            <a href="#" className="text-[10px] font-bold tracking-widest uppercase text-black/30 hover:text-black transition-colors duration-500">Privacy</a>
            <a href="#" className="text-[10px] font-bold tracking-widest uppercase text-black/30 hover:text-black transition-colors duration-500">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
