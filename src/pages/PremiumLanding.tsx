import React, { useState } from "react";
import { LandingPreloader } from "@/components/landing/LandingPreloader";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingHeroBg } from "@/components/landing/LandingHeroBg";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingTestimonials } from "@/components/landing/LandingTestimonials";
import { LandingCTA } from "@/components/landing/LandingCTA";

export const PremiumLanding = () => {
  const [isPreloading, setIsPreloading] = useState(true);

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-[#09090b] font-['Outfit'] text-white selection:bg-[#e879f9]/30 selection:text-white">
      <a href="#premium-landing-main" className="skip-link">
        Skip to content
      </a>
      <LandingPreloader onComplete={() => setIsPreloading(false)} />

      <LandingNavbar />

      <main id="premium-landing-main" tabIndex={-1}>
        <section id="product">
          <LandingHeroBg />
        </section>
        <section id="engine">
          <LandingFeatures />
        </section>
        <section id="global">
          <LandingTestimonials />
        </section>
        <section id="company">
          <LandingCTA />
        </section>
      </main>

      <Footer />
    </div>
  );
};

const Footer = () => {
  const platformLinks = [
    { label: "Architecture", href: "#product" },
    { label: "Ecosystem", href: "#engine" },
    { label: "Security", href: "#global" },
  ];
  const companyLinks = [
    { label: "About", href: "#company" },
    { label: "Careers" },
    { label: "Contact" },
  ];
  const legalItems = ["Privacy", "Terms"];

  return (
    <footer className="flex w-full justify-center border-t border-white/5 bg-[#09090b] px-4 pb-12 pt-32">
      <div className="w-full max-w-[1240px]">
        <div className="mb-32 flex flex-col items-start justify-between gap-24 md:flex-row">
          <div className="max-w-[300px]">
            <span className="mb-8 block font-['Cormorant_Garamond'] text-3xl font-medium uppercase tracking-[0.08em] text-white">
              Balance.
            </span>
            <p className="text-sm font-light leading-relaxed text-white/50">
              The high-end standard for workforce orchestration. Designed in California, engineered globally.
            </p>
          </div>

          <div className="flex gap-24 font-light">
            <div className="flex flex-col gap-6">
              <span className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/30">Platform</span>
              {platformLinks.map((link) => (
                <a key={link.label} href={link.href} className="text-sm text-white/60 transition-colors duration-500 hover:text-white">
                  {link.label}
                </a>
              ))}
            </div>
            <div className="flex flex-col gap-6">
              <span className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/30">Company</span>
              {companyLinks.map((link) =>
                link.href ? (
                  <a key={link.label} href={link.href} className="text-sm text-white/60 transition-colors duration-500 hover:text-white">
                    {link.label}
                  </a>
                ) : (
                  <span key={link.label} className="text-sm text-white/40">
                    {link.label}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-8 border-t border-white/5 py-8 md:flex-row">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
            Copyright {new Date().getFullYear()} BALANCE TECHNOLOGIES
          </p>
          <div className="flex gap-8">
            {legalItems.map((item) => (
              <span key={item} className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
