"use client";
import React, { useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { cn } from "../../lib/utils";
import { IconPointerFilled } from "@tabler/icons-react";

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
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseY = useSpring(y, { stiffness: 300, damping: 30 });

  function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    x.set((clientX - left) / width);
    y.set((clientY - top) / height);
  }

  const rotateX = useTransform(mouseY, [0, 1], [5, -5]);
  const rotateY = useTransform(mouseX, [0, 1], [-5, 5]);

  return (
    <motion.article
      aria-labelledby={`feature-${title.replace(/\s+/g, '-').toLowerCase()}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay }}
      viewport={{ once: true }}
      onMouseMove={onMouseMove}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={cn(
        "group relative overflow-hidden rounded-none border-2 border-border bg-[#131316] shadow-[0_20px_40px_rgba(0,0,0,0.5)] transition-all duration-700 hover:shadow-[0_0_0_2px_#e879f9]",
        className
      )}
    >
      {/* Dynamic Spotlight Effect */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-none transition duration-300 opacity-0 group-hover:opacity-100"
        style={{
          background: useTransform(
            [mouseX, mouseY],
            ([mx, my]) => `radial-gradient(600px circle at ${(mx as number) * 100}% ${(my as number) * 100}%, rgba(232,121,249,0.06), transparent 80%)`
          ),
        }}
      />

      <div className="absolute inset-0 z-0">
        <img
          src={image}
          width="1200"
          height="900"
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale-[100%] group-hover:grayscale-0 opacity-20 group-hover:opacity-40"
          alt={`Balance feature interface showing ${title}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#131316] via-[#131316]/60 to-transparent" />
      </div>

      <div
        className="feature-content-layer relative z-10 flex h-full flex-col justify-end p-8 md:p-12"
      >
        <div className="mb-6 inline-flex size-14 items-center justify-center rounded-none border border-border bg-white/10 text-[#e879f9] shadow-2xl transition-all duration-500 group-hover:bg-[#e879f9] group-hover:text-[#131316]">
          <IconPointerFilled className="size-6" />
        </div>

        <div className="space-y-4">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#e879f9] block">Capability</span>
            <h3 id={`feature-${title.replace(/\s+/g, '-').toLowerCase()}`} className="font-['Outfit'] text-3xl md:text-4xl font-black tracking-tight text-white leading-[1.1] group-hover:text-[#e879f9] transition-colors duration-500">
            {title}
            </h3>
            <p className="font-['Outfit'] font-light text-base leading-relaxed text-white/60 block max-w-sm">
            {description}
            </p>
        </div>
      </div>

      {/* Luxury Border Gradient */}
      <div className="absolute inset-0 rounded-none pointer-events-none" />
    </motion.article>
  );
};

export const LandingFeatures = () => {
  const features = [
    {
      title: "Global Resilience Infrastructure",
      description: "Scale your workforce orchestration with infinite resilience across every continent and jurisdiction.",
      image: "/images/team-collaboration.png",
      className: "md:col-span-2 md:row-span-2 h-[600px]",
      delay: 0,
    },
    {
      title: "Intelligent Governance",
      description: "Automate compliance and regulatory sync with zero-latency precision.",
      image: "/images/focused-workspace.png",
      className: "md:col-span-1 md:row-span-1 h-[280px]",
      delay: 0.2,
    },
    {
      title: "Strategic Insight",
      description: "Transform complex human resource data into pure aesthetic clarity.",
      image: "/images/hr-dashboard-detail.png",
      className: "md:col-span-1 md:row-span-1 h-[280px]",
      delay: 0.4,
    },
    {
      title: "Human Synergy",
      description: "Unite teams through fluid collaborative environments designed for global motion.",
      image: "/images/office-lounge.png",
      className: "md:col-span-3 md:row-span-1 h-[350px]",
      delay: 0.6,
    },
  ];

  return (
    <section id="product" aria-labelledby="features-heading" className="px-4 pb-32 pt-8 md:px-8 md:pb-48 lg:px-16">
      <div className="max-w-7xl mx-auto mb-32 text-center flex flex-col items-center">
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="inline-flex items-center gap-3 px-4 py-1.5 rounded-none bg-white/5 border border-white/10 mb-8"
        >
            <span className="w-2 h-2 rounded-none bg-[#e879f9] animate-pulse"></span>
            <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-white/40 leading-none">The Capabilities</span>
        </motion.div>

        {/* GEO/SEO Visually Hidden Summary for AI Crawlers */}
        <div className="sr-only">
          Balance's core features include Global Resilience Infrastructure, Intelligent Governance for compliance, Strategic Insight reporting, and Human Synergy collaboration environments.
        </div>

        <h2 id="features-heading" className="font-['Outfit'] text-4xl md:text-7xl lg:text-9xl font-black text-white tracking-tight leading-[0.85] max-w-5xl">
          Sovereign Control. <br/>
          <span className="font-['Cormorant_Garamond'] font-light italic text-[#e879f9]">By Design.</span>
        </h2>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 md:grid-cols-3 gap-8 auto-rows-fr">
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </section>
  );
};
