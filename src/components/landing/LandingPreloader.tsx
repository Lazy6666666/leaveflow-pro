"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

const words = [
  "Welcome",
  "Warmth",
  "Authority",
  "Sophistication",
  "Orchestration",
  "Concierge",
  "Sovereignty",
  "Balance.",
];

/**
 * Redesigned LandingPreloader: "The Digital Concierge"
 * Aesthetic: Soft, organic transitions, warm palette.
 */
export const LandingPreloader = ({ onComplete }: { onComplete: () => void }) => {
  const [index, setIndex] = useState(0);
  const [dimension, setDimension] = useState({ width: 0, height: 0 });
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    setDimension({ width: window.innerWidth, height: window.innerHeight });

    const safetyTimer = setTimeout(() => {
      setIsActive(false);
      setTimeout(onComplete, 1000);
    }, 5000);

    return () => clearTimeout(safetyTimer);
  }, [onComplete]);

  useEffect(() => {
    if (index === words.length) {
      setTimeout(() => {
        setIsActive(false);
        setTimeout(onComplete, 1000);
      }, 1000);
      return;
    }

    const timeout = setTimeout(() => {
      setIndex(index + 1);
    }, index === words.length - 1 ? 800 : 250);

    return () => clearTimeout(timeout);
  }, [index, onComplete]);

  const initialPath = `M0 0 L${dimension.width} 0 L${dimension.width} ${dimension.height} Q${dimension.width / 2} ${dimension.height + 300} 0 ${dimension.height} L0 0`;
  const targetPath = `M0 0 L${dimension.width} 0 L${dimension.width} ${dimension.height} Q${dimension.width / 2} ${dimension.height} 0 ${dimension.height} L0 0`;
  const easing: [number, number, number, number] = [0.16, 1, 0.3, 1];

  const curve: Variants = {
    initial: {
      d: initialPath,
      transition: { duration: 0.7, ease: easing },
    },
    exit: {
      d: targetPath,
      transition: { duration: 0.7, ease: easing, delay: 0.3 },
    },
  };

  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key="preloader"
          variants={{
            initial: { top: 0 },
            exit: { top: "-100vh", transition: { duration: 0.8, ease: easing, delay: 0.2 } },
          }}
          initial="initial"
          animate="initial"
          exit="exit"
          className="fixed inset-0 z-[99] flex items-center justify-center bg-[#171411]"
        >
          {dimension.width > 0 && (
            <>
              <AnimatePresence mode="wait">
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute z-[1] flex flex-col items-center"
                >
                  <div className="flex items-center text-4xl font-display font-bold tracking-tight text-[#f8f9fa]">
                    <span className="mr-5 block h-2.5 w-2.5 terracotta-gradient rounded-full" />
                    {words[index]}
                  </div>
                </motion.div>
              </AnimatePresence>
              <svg className="pointer-events-none absolute top-0 h-[calc(100%+300px)] w-full">
                <motion.path variants={curve} initial="initial" exit="exit" fill="#171411" />
              </svg>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
