import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

const features = [
  {
    id: "01",
    title: "Geolocation Intelligence",
    description: "Verified clock-ins using radius-locked GPS coordinates. Eliminate time fraud with spatial certainty.",
    category: "Security",
    size: "lg",
    image: "/images/landing/feature_geo.png"
  },
  {
    id: "02",
    title: "Request Autonomy",
    description: "Digital leave workflows that empower employees and automate management bottlenecks.",
    category: "Workflow",
    size: "sm",
    image: "/images/landing/feature_leave.png"
  },
  {
    id: "03",
    title: "Live Attendance Surface",
    description: "A real-time panoramic view of your entire workforce. Distinguish presence from absence at a glance.",
    category: "Observation",
    size: "sm",
    image: "/images/landing/feature_dashboard.png"
  },
  {
    id: "04",
    title: "Analytic Reporting",
    description: "Convert attendance history into strategic insights with one-click report generation.",
    category: "Data",
    size: "lg",
    image: "/images/landing/feature_report.png"
  },
  {
    id: "05",
    title: "Infrastructure Guardrails",
    description: "Role-based permission sets that maintain data integrity across all organizational levels.",
    category: "Access",
    size: "sm",
    image: "/images/landing/feature_report.png"
  }
];

export const FeaturesGrid = () => {
  const containerRef = useRef(null);

  return (
    <section
      id="features"
      ref={containerRef}
      className="w-full bg-[#050505] py-[160px] px-6 md:px-[72px] lg:px-[120px]"
      aria-labelledby="features-heading"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-32 gap-8">
          <div className="space-y-6">
            <span className="text-white/40 font-['Manrope'] text-[10px] font-bold tracking-[0.5em] uppercase">
              Section 02 / Capability
            </span>
            <h2 id="features-heading" className="text-white font-['Cormorant_Garamond'] text-[clamp(40px,5vw,72px)] font-medium leading-[0.95] tracking-tight">
              Refined Control. <br />
              <span className="italic opacity-80 text-white/60">Distributed Anywhere.</span>
            </h2>
          </div>
          <p className="text-white font-['Manrope'] text-sm md:text-base leading-relaxed font-normal max-w-sm">
            A modular ecosystem designed to handle the complexity of modern HR logistics with effortless simplicity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
          {/* Main Feature 1 */}
          <FeatureCard feature={features[0]} className="md:col-span-8 h-[400px] lg:h-[450px]" />

          {/* Small Feature 1 */}
          <FeatureCard feature={features[1]} className="md:col-span-4 h-[400px] lg:h-[450px]" />

          {/* Small Feature 2 */}
          <FeatureCard feature={features[2]} className="md:col-span-4 h-[400px] lg:h-[450px]" />

          {/* Main Feature 2 */}
          <FeatureCard feature={features[3]} className="md:col-span-8 h-[400px] lg:h-[450px]" />

          {/* Full Width or Offset Feature */}
          <FeatureCard feature={features[4]} className="md:col-span-12 h-[300px]" />
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({ feature, className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`group relative overflow-hidden bg-white/[0.02] border border-white/[0.08] rounded-sm p-12 md:p-14 flex flex-col justify-between hover:border-white/25 transition-all duration-700 ${className}`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/[0.01] blur-3xl pointer-events-none" />

      {/* Texture Background */}
      <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]" />

      <div className="relative z-10 flex justify-between items-center pb-8 border-b border-white/[0.05]">
        <span className="text-white/30 font-['Manrope'] text-[8px] font-bold tracking-[0.6em] uppercase">
          {feature.category}
        </span>
        <div className="flex gap-1">
          <div className="w-1 h-1 rounded-full bg-white/20" />
          <div className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-white/60 transition-colors" />
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-center py-12">
        <div className="w-full h-56 overflow-hidden rounded-sm mb-10 grayscale opacity-30 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-1000 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]">
          <img
            src={feature.image}
            alt={feature.title}
            className="w-full h-full object-cover transform scale-110 group-hover:scale-100 transition-transform [transition-duration:2000ms] ease-out"
          />
        </div>
        <h3 className="text-white font-['Cormorant_Garamond'] text-3xl md:text-4xl font-medium tracking-tight mb-4 group-hover:text-white/90 transition-colors">
          {feature.title}
        </h3>
        <p className="text-white font-['Manrope'] text-sm md:text-base leading-relaxed max-w-sm font-light">
          {feature.description}
        </p>
      </div>

      {/* Interactive Element */}
      <div className="relative z-10 pt-6">
        <div className="flex items-center gap-4">
          <div className="w-8 h-[1px] bg-white/20 group-hover:w-16 group-hover:bg-white transition-all duration-700" />
          <span className="text-white/40 group-hover:text-white font-['Manrope'] text-[9px] font-bold uppercase tracking-widest transition-colors">
            Discover Logic
          </span>
        </div>
      </div>
    </motion.div>
  );
};
