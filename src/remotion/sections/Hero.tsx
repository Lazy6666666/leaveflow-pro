import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { motion } from 'framer-motion';

export const Hero: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const opacity = interpolate(frame, [0, 20, 130, 150], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const titleSpring = spring({
    frame: frame - 5,
    fps: 30,
    config: { stiffness: 80, damping: 20 },
  });

  const badgeSpring = spring({
    frame: frame - 15,
    fps: 30,
    config: { stiffness: 100, damping: 20 },
  });

  return (
    <AbsoluteFill className="bg-white flex flex-col justify-center items-center px-12 lg:px-24">
      <div style={{ opacity }} className="w-full max-w-[1400px] relative">
        
        {/* Massive Outfit Title */}
        <div className="relative z-10">
          <motion.div
            style={{ 
              transform: `translateX(${interpolate(titleSpring, [0, 1], [-100, 0])}px)`,
              opacity: titleSpring
            }}
            className="flex flex-col gap-8"
          >
            {/* Status Badge */}
            <div 
              style={{ transform: `scale(${badgeSpring})`, opacity: badgeSpring }}
              className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-zinc-50/80 backdrop-blur-sm border border-zinc-100 w-fit"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)] animate-pulse" />
              <span className="text-[9px] font-mono font-bold tracking-[0.3em] text-zinc-400 uppercase">System Live</span>
            </div>

            <h1 className="text-[12vw] lg:text-[10vw] font-black tracking-[-0.04em] leading-[0.9] text-zinc-950 font-['Outfit']">
              Balance<span className="text-emerald-500">.</span>
            </h1>
            
            <p className="max-w-2xl text-lg lg:text-xl text-zinc-500 leading-relaxed font-medium">
              The elegant standard for modern HR attendance and leave management. Uncomplicate your team's rhythm.
            </p>
          </motion.div>
        </div>

        {/* 3D Image Layer (Liquid Glass feel) */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[45vw] aspect-square pointer-events-none opacity-40 mix-blend-multiply overflow-hidden">
           <motion.div
             animate={{ 
               y: [0, -20, 0],
               rotate: [0, 2, 0] 
             }}
             transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
             className="w-full h-full relative"
           >
             <div className="absolute inset-0 bg-emerald-500/10 blur-[100px] rounded-full" />
             <img 
               src="./images/generated-1773781826459.png" 
               className="w-full h-full object-contain relative z-10"
               alt="Balance Hero Visual"
             />
           </motion.div>
        </div>

        {/* Parallax Micro-elements */}
        <div className="absolute left-[40%] top-[-10%] z-0 opacity-20">
           <div className="w-px h-64 bg-gradient-to-b from-emerald-500/50 to-transparent" />
        </div>
      </div>
    </AbsoluteFill>
  );
};
