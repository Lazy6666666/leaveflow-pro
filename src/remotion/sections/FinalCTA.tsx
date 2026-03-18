import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame } from 'remotion';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export const FinalCTA: React.FC = () => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 20, 130, 150], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const titleSpring = spring({
    frame,
    fps: 30,
    config: { stiffness: 100, damping: 20 },
  });

  const buttonSpring = spring({
    frame: frame - 40,
    fps: 30,
    config: { stiffness: 100, damping: 20 },
  });

  return (
    <AbsoluteFill className="bg-white flex flex-col justify-center items-center px-12 lg:px-24">
      <div style={{ opacity }} className="w-full max-w-[1400px] relative text-center flex flex-col items-center">
        
        {/* Subtle Background 3D Asset */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.05] grayscale mix-blend-multiply">
           <img 
             src="./images/generated-1773781181562.png" 
             className="w-full h-full object-cover"
             alt="Final Visual"
           />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <motion.div
            style={{ 
              transform: `translateY(${interpolate(titleSpring, [0, 1], [40, 0])}px)`,
              opacity: titleSpring
            }}
            className="flex flex-col gap-10"
          >
            <h2 className="text-[9vw] lg:text-[8vw] font-black tracking-[-0.04em] leading-[0.9] text-zinc-950 font-['Outfit']">
              Experience the<br />Balance<span className="text-emerald-500">.</span>
            </h2>
            
            <p className="max-w-2xl text-lg lg:text-xl text-zinc-500 leading-relaxed font-medium mx-auto">
              Join the collective of forward-thinking enterprises redefining human potential. The future of workforce logic starts here.
            </p>

            <div className="mt-8 flex justify-center">
              <motion.button
                style={{ 
                  transform: `scale(${buttonSpring})`,
                  opacity: buttonSpring
                }}
                className="group flex items-center gap-6 px-12 py-6 rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 transition-all duration-300 active:scale-95 hover:bg-emerald-600"
              >
                <span className="text-xs uppercase tracking-[0.3em] font-black">Begin Implementation</span>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center transition-transform group-hover:scale-110 group-hover:translate-x-1">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Floating Accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px] bg-emerald-500/5 blur-[150px] rounded-full -z-10" />
      </div>
    </AbsoluteFill>
  );
};
