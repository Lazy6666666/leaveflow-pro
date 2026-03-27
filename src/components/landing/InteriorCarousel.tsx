"use client";
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { motion, PanInfo } from "framer-motion";

interface Product {
  title: string;
  thumbnail: string;
  variant?: "color" | "dot-heavy" | "dot-fine";
}

const products: Product[] = [
  { title: "Sovereign Dashboard", thumbnail: "/images/landing/hero-1.png", variant: "dot-heavy" },
  { title: "Orchestrated Attendance", thumbnail: "/images/landing/hero-2.png", variant: "dot-fine" },
  { title: "Dynamic Leave Flow", thumbnail: "/images/landing/hero-3.png", variant: "color" },
  { title: "Intelligent Insights", thumbnail: "/images/landing/hero-4.png", variant: "dot-fine" },
  { title: "Global Compliance", thumbnail: "/images/landing/hero-5.png", variant: "dot-heavy" },
  { title: "Unified Registry", thumbnail: "/images/landing/hero-6.png", variant: "color" },
  { title: "Automated Triggers", thumbnail: "/images/landing/hero.png", variant: "dot-fine" },
];

export const InteriorCarousel = () => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Double the products to 14 so the cylinder radius is larger.
  // This physically fits ~5 cards in the visible rear concave arc perfectly.
  const extendedProducts = [...products, ...products];
  const N = extendedProducts.length;
  const angle = 360 / N;

  return (
    <div 
      // Adjusted margins to sit a little bit lower
      className="relative w-full flex flex-col items-center select-none overflow-visible -mt-4 sm:-mt-10 md:-mt-16"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <style dangerouslySetInnerHTML={{__html: `
        .cheatcode-stage {
          --cw: clamp(160px, 18vw, 320px);
          --ch: calc(var(--cw) * 0.75);
          --cr: clamp(8px, 1vw, 24px);
          --pad: clamp(4px, 0.5vw, 10px);
          --ir: clamp(5px, 0.7vw, 16px);
          --persp: clamp(900px, 140vw, 2200px);
          
          /* Much larger radius for 14 cards to flatten the curve */
          --tz: calc(var(--cw) * 2.25);
          
          width: 100%;
          height: calc(var(--ch) + clamp(60px, 9vw, 120px));
          perspective: var(--persp);
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: visible;
        }
        .cheatcode-track {
          position: relative;
          width: var(--cw);
          height: var(--ch);
          transform-style: preserve-3d;
          /* Bring track center forward so back wall cards are visible */
          transform: translateZ(calc(var(--tz) * 0.75));
          /* Smooth infinite rotation */
          animation: smooth-rotate 60s linear infinite;
        }
        .cheatcode-track.paused {
          animation-play-state: paused;
        }
        @keyframes smooth-rotate {
          from { transform: translateZ(calc(var(--tz) * 0.85)) rotateY(0deg); }
          to { transform: translateZ(calc(var(--tz) * 0.85)) rotateY(360deg); }
        }
        .cheatcode-card {
          position: absolute;
          width: var(--cw);
          height: var(--ch);
          border-radius: var(--cr);
          padding: var(--pad);
          background: #0d0d10;
          box-shadow: 0 20px 60px -10px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 1px rgba(255,255,255,0.1);
          /* Push backwards to form a concave wall facing inward */
          transform: rotateY(var(--ry)) translateZ(calc(var(--tz) * -1));
          backface-visibility: hidden;
        }
        .cheatcode-card-inner {
          border-radius: var(--ir);
          background: #131316;
          width: 100%;
          height: 100%;
          position: relative;
          overflow: hidden;
        }
      `}} />

      <div className="cheatcode-stage w-full">
        <div className={cn("cheatcode-track", isHovered && "paused")}>
          {extendedProducts.map((product, i) => {
            const ry = i * angle;

            return (
              <div 
                key={i}
                className="cheatcode-card"
                style={{ "--ry": `${ry}deg` } as React.CSSProperties}
              >
                <div className="cheatcode-card-inner">
                  <img 
                    src={product.thumbnail} 
                    className={cn(
                      "absolute inset-0 w-full h-full object-cover",
                      product.variant === "dot-heavy" && "grayscale contrast-[1.18] brightness-[1.04]",
                      product.variant === "dot-fine" && "grayscale contrast-[1.1] brightness-[1.08]"
                    )} 
                    alt={product.title} 
                  />
                  
                  {/* Overlays */}
                  {product.variant === "dot-heavy" && (
                    <div className="absolute inset-0 z-10 pointer-events-none mix-blend-screen bg-[radial-gradient(circle,#fff_40%,#0000_40%)] [background-size:5px_5px]" />
                  )}
                  {product.variant === "dot-fine" && (
                    <div className="absolute inset-0 z-10 pointer-events-none mix-blend-screen bg-[radial-gradient(circle,#fff_44%,#0000_44%)] [background-size:3px_3px]" />
                  )}
                  {product.variant === "color" && (
                    <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(140%_140%_at_50%_50%,#0000_44%,#0004_100%)]" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col items-center gap-[clamp(12px,1.8vh,20px)] mt-[clamp(20px,3vh,40px)]">
        <div className="flex items-center gap-4">
          <span className="font-['Outfit'] text-[clamp(9px,0.75vw,11px)] font-medium uppercase tracking-[0.26em] text-white/25">
             Flow
          </span>
          <div className="w-[1px] h-3.5 bg-[#e879f9]/25" />
          <span className="font-['Outfit'] text-[clamp(9px,0.75vw,11px)] font-medium uppercase tracking-[0.26em] text-[#e879f9]/50">
            Rotate
          </span>
        </div>
      </div>
    </div>
  );
};

