import React, { useState } from 'react';
import { LandingPreloader } from '@/components/landing/LandingPreloader';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingHeroBg } from '@/components/landing/LandingHeroBg';
import { LandingFeatures } from '@/components/landing/LandingFeatures';
import { LandingTestimonials } from '@/components/landing/LandingTestimonials';
import { LandingCTA } from '@/components/landing/LandingCTA';

export const PremiumLanding = () => {
  const [isPreloading, setIsPreloading] = useState(true);

  return (
    <div className="bg-[#FDFBF7] text-[#1A1815] selection:bg-[#C9A962] selection:text-white font-['Outfit'] overflow-x-hidden relative min-h-[100dvh]">
      <LandingPreloader onComplete={() => setIsPreloading(false)} />

      {/* Primary content renders underneath but waits for Preloader to fade out to look seamless */}
      <LandingNavbar />
      
      <main>
        <section id="product"><LandingHeroBg /></section>
        <section id="engine"><LandingFeatures /></section>
        <section id="global"><LandingTestimonials /></section>
        <section id="company"><LandingCTA /></section>
      </main>
      
      <Footer />
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Footer                                                                     */
/* -------------------------------------------------------------------------- */
const Footer = () => {
  return (
    <footer className="px-4 w-full border-t border-black/5 pb-12 pt-32 bg-white flex justify-center">
      <div className="max-w-[1240px] w-full">
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
