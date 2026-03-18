"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const words = [
  "Hello", "Hola", "Bonjour", "Ciao", "Olà", "Jambo", "Namaste", "नमस्ते", 
  "G'day", "Hoi", "Hallo", "Ahoj", "Hei", "Cześć", "Zdravo", "Privet", 
  "Szia", "Pryvit", "Salaam", "Shalom", "Marhaba", "Namaskar", "Sawasdee", 
  "Xin chào", "Konnichiwa", "Annyeong", "Ni hao"
];

export const LandingPreloader = ({ onComplete }: { onComplete: () => void }) => {
  const [index, setIndex] = useState(0);
  const [dimension, setDimension] = useState({ width: 0, height: 0 });
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    setDimension({ width: window.innerWidth, height: window.innerHeight });
    
    // Safety timeout to ensure preloader is removed even if animation hangs
    const safetyTimer = setTimeout(() => {
        setIsActive(false);
        setTimeout(onComplete, 1000);
    }, 6000);

    return () => clearTimeout(safetyTimer);
  }, [onComplete]);

  useEffect(() => {
    if (index === words.length - 1) {
        setTimeout(() => {
            setIsActive(false);
            setTimeout(onComplete, 1000); // Wait for exit animation
        }, 500);
        return;
    }
    const timeout = setTimeout(() => {
      setIndex(index + 1);
    }, index === 0 ? 1000 : 150);
    return () => clearTimeout(timeout);
  }, [index, onComplete]);

  const initialPath = `M0 0 L${dimension.width} 0 L${dimension.width} ${dimension.height} Q${dimension.width / 2} ${dimension.height + 300} 0 ${dimension.height} L0 0`;
  const targetPath = `M0 0 L${dimension.width} 0 L${dimension.width} ${dimension.height} Q${dimension.width / 2} ${dimension.height} 0 ${dimension.height} L0 0`;

  const curve = {
    initial: {
      d: initialPath,
      transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] },
    },
    exit: {
      d: targetPath,
      transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1], delay: 0.3 },
    },
  };

  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key="preloader"
          variants={{
            initial: { top: 0 },
            exit: { top: "-100vh", transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1], delay: 0.2 } },
          }}
          initial="initial"
          animate="initial"
          exit="exit"
          className="fixed inset-0 z-[99] flex items-center justify-center bg-[#1A1815]"
        >
          {dimension.width > 0 && (
            <>
              <motion.div
                variants={{
                  initial: { opacity: 0 },
                  enter: { opacity: 0.75, transition: { duration: 1, delay: 0.2 } },
                }}
                initial="initial"
                animate="enter"
                className="flex items-center absolute z-[1] text-[#FDFBF7] text-[42px] font-['Outfit'] font-light tracking-tight"
              >
                <span className="block w-[10px] h-[10px] bg-[#C9A962] rounded-full mr-[15px]"></span>
                {words[index]}
              </motion.div>
              <svg className="absolute top-0 w-full h-[calc(100%+300px)] pointer-events-none">
                <motion.path variants={curve} initial="initial" exit="exit" fill="#1A1815" />
              </svg>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
