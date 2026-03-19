"use client";
import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { IconPointerFilled } from "@tabler/icons-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const FeatureCard = ({ 
  title, 
  description, 
  image, 
  className,
  delay = 0 
}: { 
  title: string; 
  description: string; 
  image: string;
  className?: string;
  delay?: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay }}
      viewport={{ once: true }}
      className={cn(
        "group relative overflow-hidden rounded-3xl bg-white ring-1 ring-[#1A1815]/5 shadow-xl transition-all duration-700 hover:shadow-2xl hover:ring-[#1A1815]/10",
        className
      )}
    >
      <div className="absolute inset-0 z-0">
        <img 
          src={image} 
          className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale-[30%] group-hover:grayscale-0 opacity-40 group-hover:opacity-60" 
          alt={title} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
      </div>

      <div className="relative z-10 flex h-full flex-col justify-end p-8 md:p-12">
        <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-[#1A1815] text-[#C9A962] shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
          <IconPointerFilled className="size-5" />
        </div>
        <h3 className="font-['Outfit'] text-2xl font-black tracking-tight text-[#1A1815] mb-4 group-hover:text-[#C9A962] transition-colors duration-500">
          {title}
        </h3>
        <p className="font-['Outfit'] font-light text-base leading-relaxed text-[#1A1815]/60 block max-w-sm">
          {description}
        </p>
      </div>
    </motion.div>
  );
};

export const LandingFeatures = () => {
  const features = [
    {
      title: "Global Infrastructure",
      description: "Scale your workforce orchestration with infinite resilience across every continent.",
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop",
      className: "md:col-span-2 md:row-span-2 h-[500px]",
      delay: 0,
    },
    {
      title: "Intelligent Governance",
      description: "Automate compliance and regulatory sync with zero-latency precision.",
      image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop",
      className: "md:col-span-1 md:row-span-1 h-[240px]",
      delay: 0.2,
    },
    {
      title: "Strategic Insight",
      description: "Transform complex human resource data into pure aesthetic clarity.",
      image: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?q=80&w=1200&auto=format&fit=crop",
      className: "md:col-span-1 md:row-span-1 h-[240px]",
      delay: 0.4,
    },
    {
      title: "Human Synergy",
      description: "Unite teams through fluid collaborative environments designed for motion.",
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop",
      className: "md:col-span-3 md:row-span-1 h-[300px]",
      delay: 0.6,
    },
  ];

  return (
    <section id="product" className="px-4 py-32 md:px-8 md:py-48 lg:px-16 bg-[#FDFBF7]">
      <div className="max-w-7xl mx-auto mb-32 text-center flex flex-col items-center">
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-[#1A1815]/5 border border-[#1A1815]/10 mb-8"
        >
            <span className="w-2 h-2 rounded-full bg-[#C9A962] animate-pulse"></span>
            <span className="text-[10px] uppercase tracking-[0.4em] font-black text-[#1A1815]/40 leading-none">The Capabilities</span>
        </motion.div>
        <h2 className="font-['Outfit'] text-4xl md:text-7xl lg:text-8xl font-black text-[#1A1815] tracking-tight leading-[0.9] max-w-4xl">
          Sovereign Control for <br/>
          <span className="font-['Cormorant_Garamond'] font-light italic text-[#C9A962]">Modern Enterprises.</span>
        </h2>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr">
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </section>
  );
};
