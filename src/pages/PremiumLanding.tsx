import React, { useState } from "react";
import { LandingPreloader } from "@/components/landing/LandingPreloader";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingHeroBg } from "@/components/landing/LandingHeroBg";
import { motion } from "framer-motion";
import { Bot, Sparkles, ChevronRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

/**
 * Redesigned Landing Page: "The Digital Concierge"
 * Aesthetic: Warm, Layered, Authoritative.
 */
export const PremiumLanding = () => {
  const [isPreloading, setIsPreloading] = useState(true);

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-background font-sans text-foreground selection:bg-primary/20">
      <LandingPreloader onComplete={() => setIsPreloading(false)} />

      <LandingNavbar />

      <main id="premium-landing-main" tabIndex={-1} className="outline-none">
        {/* Hero Section */}
        <section id="hero-section" className="relative">
          <LandingHeroBg />
        </section>

        {/* The "Concierge" Philosophy Section */}
        <section id="philosophy" className="bg-muted/30 py-32 md:py-64 relative overflow-hidden">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center justify-center text-center space-y-12"
            >
              <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white rounded-full shadow-sm text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                <Bot size={14} />
                <span>The Concierge Protocol</span>
              </div>

              <h2 className="font-display text-5xl md:text-7xl font-bold tracking-tighter text-foreground max-w-4xl leading-[0.95]">
                HR is no longer a filing cabinet. <br />
                <span className="text-primary italic font-medium">It's a curated experience.</span>
              </h2>

              <p className="max-w-2xl text-xl text-muted-foreground leading-relaxed">
                We believe workforce management should feel like a premium service.
                Our "No-Line" design philosophy ensures your data breathes, while our
                deterministic neural engine handles the complexity.
              </p>

              {/* Editorial Feature Grid: Soft layers, no lines */}
              <div className="mt-24 grid w-full max-w-6xl gap-10 md:grid-cols-3">
                <div className="bg-white p-12 rounded-[40px] shadow-float text-left hover:scale-[1.02] transition-transform duration-500">
                   <div className="h-14 w-14 bg-primary/5 rounded-2xl flex items-center justify-center text-primary mb-8">
                      <Sparkles size={28} />
                   </div>
                   <h3 className="font-display text-2xl font-bold mb-4">Precision Flow</h3>
                   <p className="text-muted-foreground leading-relaxed">Deterministic orchestration of leave policies with zero friction.</p>
                </div>
                <div className="bg-white p-12 rounded-[40px] shadow-float text-left hover:scale-[1.02] transition-transform duration-500">
                   <div className="h-14 w-14 bg-primary/5 rounded-2xl flex items-center justify-center text-primary mb-8">
                      <Bot size={28} />
                   </div>
                   <h3 className="font-display text-2xl font-bold mb-4">Neural Insight</h3>
                   <p className="text-muted-foreground leading-relaxed">Real-time telemetry and predictive risk assessment for legal compliance.</p>
                </div>
                <div className="bg-white p-12 rounded-[40px] shadow-float text-left hover:scale-[1.02] transition-transform duration-500">
                   <div className="h-14 w-14 bg-primary/5 rounded-2xl flex items-center justify-center text-primary mb-8">
                      <ChevronRight size={28} />
                   </div>
                   <h3 className="font-display text-2xl font-bold mb-4">Sovereign Data</h3>
                   <p className="text-muted-foreground leading-relaxed">End-to-end cryptographic security for your organization's human capital.</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Decorative Bloom */}
          <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
        </section>
      </main>

      <SimpleFooter />
    </div>
  );
};

const SimpleFooter = () => {
  return (
    <footer className="bg-background py-24 relative">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-3">
               <Logo size="sm" showText={false} />
               <span className="font-display text-2xl font-bold tracking-tighter uppercase">Balance.</span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/40 text-center md:text-left">
               © {new Date().getFullYear()} Balance Orchestration Systems. <br className="sm:hidden" /> All Rights Reserved.
            </p>
          </div>
          <div className="flex gap-12 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Legal</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Concierge</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
