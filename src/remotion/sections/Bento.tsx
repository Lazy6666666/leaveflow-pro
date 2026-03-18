import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame } from 'remotion';
import { motion } from 'framer-motion';

export const Bento: React.FC = () => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 30, 120, 150], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const cardSpring = spring({
    frame,
    fps: 30,
    config: { stiffness: 60, damping: 15 },
  });

  const textSpring = spring({
    frame: frame - 20,
    fps: 30,
    config: { stiffness: 80, damping: 20 },
  });

  return (
    <AbsoluteFill className="bg-white flex items-center justify-center px-12 lg:px-24">
      <div style={{ opacity }} className="w-full max-w-[1400px] grid lg:grid-cols-2 gap-24 items-center">
        
        {/* 3D Glass Card Side */}
        <div className="relative order-2 lg:order-1">
          <motion.div
            style={{ 
              transform: `scale(${interpolate(cardSpring, [0, 1], [0.8, 1])}) rotateY(${interpolate(cardSpring, [0, 1], [-20, 0])}deg)`,
              opacity: cardSpring
            }}
            className="relative aspect-square rounded-[40px] overflow-hidden bg-white border border-zinc-100 shadow-2xl p-[1px]"
          >
            {/* Liquid Glass Edge */}
            <div className="absolute inset-0 rounded-[40px] border border-black/5 pointer-events-none z-20" />
            
            <img 
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1000" 
              className="w-full h-full object-cover scale-110 opacity-90 mix-blend-multiply"
              alt="Disconnect Visual"
            />
            
            {/* Subtle light Overlay */}
            <div className="absolute inset-0 bg-gradient-to-bl from-white/20 via-transparent to-transparent z-10" />
          </motion.div>
          
          {/* Floating Accent */}
          <div className="absolute -top-10 -left-10 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full -z-10" />
        </div>

        {/* Content Side */}
        <div className="flex flex-col gap-10 relative z-10 order-1 lg:order-2">
          <motion.div
            style={{ 
              transform: `translateY(${interpolate(textSpring, [0, 1], [30, 0])}px)`,
              opacity: textSpring
            }}
            className="flex flex-col gap-6"
          >
            <div className="flex items-center gap-4">
              <span className="text-emerald-500 font-bold font-mono text-[10px] uppercase tracking-[0.5em]">02 // Seamless Leave</span>
            </div>

            <h2 className="text-7xl lg:text-8xl font-black tracking-tight text-zinc-950 font-['Outfit']">
              Disconnect
            </h2>
            
            <p className="max-w-lg text-lg text-zinc-500 leading-relaxed font-medium">
              True productivity requires rest. Request and manage time off through a beautifully simple interface that respects your peace of mind.
            </p>
          </motion.div>
        </div>

      </div>
    </AbsoluteFill>
  );
};
