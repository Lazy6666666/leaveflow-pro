"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface Product {
  title: string;
  thumbnail: string;
  variant?: "color" | "dot-heavy" | "dot-fine";
}

const products: Product[] = [
  { title: "Sovereign Dashboard", thumbnail: "/images/hr-dashboard-detail.png", variant: "color" },
  { title: "Global Resilience", thumbnail: "/images/team-collaboration.png", variant: "color" },
  { title: "Intelligent Governance", thumbnail: "/images/focused-workspace.png", variant: "color" },
  { title: "Strategic Insight", thumbnail: "/images/office-lounge.png", variant: "color" },
  { title: "Human Synergy", thumbnail: "/images/team-collaboration.png", variant: "color" },
  { title: "Dynamic Leave Flow", thumbnail: "/images/hr-dashboard-detail.png", variant: "color" },
  { title: "Orchestrated Attendance", thumbnail: "/images/office-lounge.png", variant: "color" },
];

export const InteriorCarousel = () => {
  const [isHovered, setIsHovered] = useState(false);

  const extendedProducts = [...products, ...products];
  const N = extendedProducts.length;
  const angle = 360 / N;

  const productCards = extendedProducts.map((product, i) => {
    const ry = i * angle;
    return (
      <div
        key={i}
        className="cheatcode-card"
      >
        <div className="cheatcode-card-inner">
          <img
            src={product.thumbnail}
            className="absolute inset-0 w-full h-full object-cover"
            alt={product.title}
          />
          <div className="cheatcode-card-overlay" />
        </div>
      </div>
    );
  });

  return (
    <div
      className="relative w-full flex flex-col items-center select-none overflow-visible mt-0 md:mt-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <style dangerouslySetInnerHTML={{__html: `
        .cheatcode-stage {
          --cw: clamp(160px, 18vw, 320px);
          --ch: calc(var(--cw) * 0.75);
          --cr: 0px;
          --pad: clamp(4px, 0.5vw, 10px);
          --ir: 0px;
          --persp: clamp(900px, 140vw, 2200px);
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
          transform: translateZ(calc(var(--tz) * 0.75));
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
          transform: rotateY(calc(var(--ry) * 1deg)) translateZ(calc(var(--tz) * -1));
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
        .cheatcode-card-overlay {
          position: absolute;
          inset: 0;
          z-index: 10;
          pointer-events: none;
          background: radial-gradient(140% 140% at 50% 50%, transparent 44%, rgba(0,0,0,0.25) 100%);
        }
        ${extendedProducts.map((_, i) => `.cheatcode-card:nth-child(${i + 1}) { --ry: ${i * angle}; }`).join("\n")}
      `}} />

      <div className="cheatcode-stage w-full">
        <div className={cn("cheatcode-track", isHovered && "paused")}>
          {productCards}
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
