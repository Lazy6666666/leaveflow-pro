"use client";
import React, { useRef, useState, useEffect } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import { cn } from "../../lib/utils";
import { Badge } from "../ui/badge";
import { IconArrowRight } from "@tabler/icons-react";
import { Link } from "react-router-dom";

const heroImages = [
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1200",
  "https://images.unsplash.com/photo-1519781542704-957ee19f6e9b?q=80&w=1200",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200",
  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200",
];

const ApertureCard = ({ 
  src, 
  index, 
  total,
  mouseX 
}: { 
  src: string; 
  index: number; 
  total: number;
  mouseX: number;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isCentered, setIsCentered] = useState(false);

  // 3D positioning logic
  const centerIndex = (total - 1) / 2;
  const relativeIndex = index - centerIndex;
  
  // Angle and X-offset for the fan
  const rotateY = relativeIndex * 25;
  const xOffset = relativeIndex * 180;
  const zOffset = Math.abs(relativeIndex) * -100;

  useEffect(() => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const screenCenter = window.innerWidth / 2;
    
    // If the card is in the right half of the screen, it's 'After' (Color)
    // If it's in the left half, it's 'Before' (Grayscale)
    setIsCentered(centerX > screenCenter);
  }, [mouseX]);

  return (
    <motion.div
      ref={cardRef}
      style={{
        perspective: "1200px",
      }}
      initial={{ opacity: 0, y: 50 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        rotateY: rotateY,
        x: xOffset,
        z: zOffset,
      }}
      transition={{ 
        type: "spring", 
        stiffness: 120, 
        damping: 20,
        delay: index * 0.1 
      }}
      className="absolute w-[280px] h-[380px] md:w-[320px] md:h-[440px] rounded-[2rem] overflow-hidden shadow-2xl group cursor-pointer"
    >
      <div className="relative w-full h-full">
        {/* Before State (Grayscale/Dither) */}
        <div className={cn(
          "absolute inset-0 transition-opacity duration-1000 ease-in-out",
          isCentered ? "opacity-0" : "opacity-100"
        )}>
           <img 
            src={src} 
            className="w-full h-full object-cover grayscale brightness-75 contrast-125" 
            alt="Before" 
          />
           <div className="absolute inset-0 bg-black/40 mix-blend-multiply" />
           {/* Dither Texture Overlay */}
           <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <filter id="dither">
                  <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
                  <feColorMatrix type="saturate" values="0" />
                </filter>
                <rect width="100%" height="100%" filter="url(#dither)" />
              </svg>
           </div>
        </div>

        {/* After State (Color) */}
        <div className={cn(
          "absolute inset-0 transition-opacity duration-1000 ease-in-out",
          isCentered ? "opacity-100" : "opacity-0"
        )}>
           <img 
            src={src} 
            className="w-full h-full object-cover" 
            alt="After" 
          />
           <div className="absolute inset-0 bg-[#C9A962]/5" />
        </div>

        {/* Glossy Reflection Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none group-hover:opacity-100 opacity-30 transition-opacity" />
      </div>
    </motion.div>
  );
};

export const LandingHeroBg = () => {
  const [mouseX, setMouseX] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden antialiased bg-[#0A0A0A] flex flex-col items-center pt-32 pb-48">
      {/* Premium Noise Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.05] mix-blend-overlay">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <filter id="hero-noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" />
          </filter>
          <rect width="100%" height="100%" filter="url(#hero-noise)" />
        </svg>
      </div>

      {/* Grid Pattern Background */}
      <div className="absolute inset-0 opacity-[0.1] bg-[radial-gradient(#C9A962_0.5px,transparent_0.5px)] [background-size:24px_24px] pointer-events-none" />

      {/* Hero Content */}
      <div className="container relative mx-auto px-6 z-10 flex flex-col items-center text-center">
        
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 1 }}
           className="mb-12"
        >
          <Badge variant="outline" className="border-white/10 text-white/40 px-5 py-2 text-[10px] tracking-[0.4em] font-black uppercase bg-white/5 backdrop-blur-md">
            The Sovereign Standard v2.0
          </Badge>
        </motion.div>

        <h1 className="font-['Outfit'] text-[4rem] md:text-[6.5rem] lg:text-[7.5rem] font-black leading-[0.85] tracking-[-0.05em] text-[#FDFBF7] mb-12">
          Transform Your vision <br/>
          <span className="font-['Cormorant_Garamond'] font-thin italic text-[#C9A962] opacity-90">Into Reality.</span>
        </h1>

        <p className="max-w-xl text-lg md:text-xl font-light text-[#FDFBF7]/40 leading-relaxed font-['Outfit'] mb-16">
          Bring your creative ideas to life with powerful tools. <br/>
          No experience required, just imagination.
        </p>

        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.8 }}
           className="mb-32"
        >
          <Link
            to="/auth/register"
            className="group relative inline-flex px-14 py-6 rounded-full bg-[#FDFBF7] text-[#1A1815] font-['DM_Sans'] text-xs font-black uppercase tracking-[0.3em] overflow-hidden transition-all duration-700 hover:shadow-[0_20px_40px_rgba(201,169,98,0.4)]"
          >
            <span className="relative z-10 flex items-center gap-3">
              Get Started <IconArrowRight className="size-4" />
            </span>
            <div className="absolute inset-0 bg-[#C9A962] translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
          </Link>
        </motion.div>
        <a
          href="#engine"
          className="text-[11px] uppercase tracking-[0.35em] font-black text-[#FDFBF7]/50 hover:text-[#FDFBF7] transition-colors duration-500"
        >
          View Infrastructure
        </a>

        {/* 3D Card Fan Section */}
        <div className="relative w-full h-[500px] flex items-center justify-center translate-y-10 scale-[0.85] md:scale-100">
          {/* Centered Splitter (Aperture) */}
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: "120%" }}
            transition={{ duration: 1.5, delay: 0.5, ease: "circOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[2px] bg-gradient-to-b from-transparent via-[#C9A962] to-transparent z-40 shadow-[0_0_20px_rgba(201,169,98,0.8)]"
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[4px] h-[50px] bg-white z-50 blur-[1px] opacity-80" />

          {/* Cards */}
          <div className="relative w-full flex items-center justify-center">
            {heroImages.map((src, i) => (
              <ApertureCard 
                key={i} 
                src={src} 
                index={i} 
                total={heroImages.length} 
                mouseX={mouseX} 
              />
            ))}
          </div>

          {/* Floating labels at the bottom of the fan */}
          <div className="absolute -bottom-20 w-screen flex justify-between px-[15vw] pointer-events-none opacity-20 uppercase tracking-[0.5em] text-[10px] font-black text-[#FDFBF7]">
            <span>Legacy Workflow</span>
            <span className="text-[#C9A962]">Orchestrated Vision</span>
          </div>
        </div>
      </div>
    </div>
  );
};
