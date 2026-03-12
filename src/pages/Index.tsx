import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
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
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground selection:bg-foreground selection:text-background font-inter">
      <Helmet>
        <title>BALANCE | Modern Employee Leave & Attendance Management</title>
        <meta name="description" content="Elevating workforce management into a fluid, intelligent interface for the modern enterprise. Track attendance, manage leave, and eliminate time fraud with BALANCE." />
        <meta name="keywords" content="HR software, leave management, attendance tracking, geolocation clock-in, employee self-service, modern HR interface" />
        <meta property="og:title" content="BALANCE | Next-Gen HR Infrastructure" />
        <meta property="og:description" content="Elevating workforce management into a fluid, intelligent interface for the modern enterprise." />
        <meta property="og:image" content="/balance-logo.png" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://leaveflow-pro.com" />
      </Helmet>

      <Navbar />
      <main id="main-content">
        <Hero />
        <ProblemManifest />
        <FeaturesGrid />
        <PricingTier />
        <StatsRow />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
