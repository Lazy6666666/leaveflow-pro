import React, { useEffect } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { ProblemManifest } from '@/components/landing/ProblemManifest';
import { FeaturesGrid } from '@/components/landing/FeaturesGrid';
import { PricingTier } from '@/components/landing/PricingTier';
import { StatsRow } from '@/components/landing/StatsRow';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { Footer } from '@/components/landing/Footer';

const Index = () => {
  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-white selection:text-black font-['Inter'] overflow-x-hidden">
      <Navbar />
      <Hero />
      <ProblemManifest />
      <FeaturesGrid />
      <PricingTier />
      <StatsRow />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default Index;
