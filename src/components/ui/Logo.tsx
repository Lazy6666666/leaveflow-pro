import React from 'react';
import { PulsingBorder } from '@paper-design/shaders-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  variant?: 'default' | 'white' | 'dark';
  showText?: boolean;
}

/**
 * Balance Logo Component
 * Integrated with Paper Design dynamic shader for a premium, pulsing brand effect.
 */
export const Logo = ({ className, size = 'md', variant = 'default', showText = false }: LogoProps) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    hero: 'w-48 h-48'
  };

  const textSizes = {
    sm: 'text-lg tracking-[0.1em]',
    md: 'text-2xl tracking-[0.15em]',
    lg: 'text-4xl tracking-[0.2em]',
    hero: 'text-8xl tracking-[0.3em]'
  };

  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <div className={cn("relative flex items-center justify-center shrink-0", sizeClasses[size])}>
        {/* Ambient Glow */}
        <motion.div 
          className="absolute inset-0 bg-teal-500/20 blur-xl rounded-full"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <PulsingBorder 
          speed={1} 
          roundness={1} 
          thickness={0.08} 
          softness={0.8} 
          intensity={0.2} 
          bloom={0.4} 
          spots={0} 
          pulse={0.4} 
          smoke={0} 
          scale={0.9} 
          colors={['#C9A962', '#1A1815']} 
          colorBack="#00000000" 
          className="w-full h-full bg-contain bg-center bg-no-repeat relative z-10" 
          style={{ 
            backgroundImage: 'url(/logo.svg)' 
          }} 
        />
      </div>
      {showText && (
        <span className={cn(
          "font-['Fraunces'] font-black uppercase leading-none mt-1",
          textSizes[size],
          variant === 'white' ? "text-white" : "text-[#181512]"
        )}>
          Balance
        </span>
      )}
    </div>
  );
};
