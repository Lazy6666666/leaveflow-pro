import React from 'react';
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
 * High-contrast, architectural mark representing stable geometry.
 */
export const Logo = ({ className, size = 'md', variant = 'default', showText = true }: LogoProps) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-20 h-20',   // 80px
    hero: 'w-48 h-48'  // 192px
  };

  const textSizes = {
    sm: 'text-lg tracking-tight',
    md: 'text-2xl tracking-tighter',
    lg: 'text-4xl tracking-tighter',
    hero: 'text-8xl tracking-tighter'
  };

  const colorVariants = {
    default: 'text-foreground',
    white: 'text-white',
    dark: 'text-black',
  };

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <motion.div
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className={cn("relative flex items-center justify-center shrink-0", sizeClasses[size], colorVariants[variant])}
      >
        <img
          src="/BALANCE-FINAL-01-01.svg"
          alt="Balance Logo"
          className="w-full h-full object-contain"
        />
      </motion.div>
      {showText && (
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
          "font-display font-bold leading-none mt-1",
          textSizes[size],
          colorVariants[variant]
        )}>
          Balance
        </motion.span>
      )}
    </div>
  );
};
