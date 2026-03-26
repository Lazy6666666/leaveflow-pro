"use client";
import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

function ParallaxHeroImageItem({
  img,
  index,
  x,
  y,
  imageClassName,
}: {
  img: { src: string; x: string; y: string; rotate: number };
  index: number;
  x: MotionValue<number>;
  y: MotionValue<number>;
  imageClassName?: string;
}) {
  // Depth determines how much the image moves
  const depth = (index % 5) + 1;
  const translateX = useTransform(x, [-0.5, 0.5], [depth * -40, depth * 40]);
  const translateY = useTransform(y, [-0.5, 0.5], [depth * -40, depth * 40]);

  return (
    <motion.div
      style={{
        x: translateX,
        y: translateY,
        left: img.x,
        top: img.y,
        rotate: img.rotate,
        zIndex: depth,
      }}
      className={cn(
        "absolute blur-[2px] hover:blur-0 transition-all duration-700",
        imageClassName
      )}
    >
      <div className="relative group overflow-hidden rounded-2xl shadow-2xl border border-white/10 bg-neutral-900">
        <img
          src={img.src}
          alt={`parallax-img-${index}`}
          className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent pointer-events-none" />
      </div>
    </motion.div>
  );
}

export const ParallaxHeroImages = ({
  images,
  className,
  imageClassName,
  variant = "default",
}: {
  images: { src: string; x: string; y: string; rotate: number }[];
  className?: string;
  imageClassName?: string;
  variant?: "default" | "edge-focus";
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 150, damping: 20, mass: 0.1 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const { left, top, width, height } = rect;
      // Map mouse position to -1 to 1 range
      const relativeX = (event.clientX - left) / width - 0.5;
      const relativeY = (event.clientY - top) / height - 0.5;
      mouseX.set(relativeX);
      mouseY.set(relativeY);
    }
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative w-full h-full overflow-hidden flex items-center justify-center",
        className
      )}
    >
      {images.map((img, index) => (
        <ParallaxHeroImageItem
          key={index}
          img={img}
          index={index}
          x={x}
          y={y}
          imageClassName={imageClassName}
        />
      ))}
    </div>
  );
};
