"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

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
    if (index === words.length) {
        setTimeout(() => {
            setIsActive(false);
            setTimeout(onComplete, 1000); // Wait for exit animation
        }, 1200); // Show logo for 1.2s at the end
        return;
    }
    const timeout = setTimeout(() => {
      setIndex(index + 1);
    }, index === 0 ? 1000 : index === words.length - 1 ? 800 : 150);
    return () => clearTimeout(timeout);
  }, [index, onComplete]);

  const initialPath = `M0 0 L${dimension.width} 0 L${dimension.width} ${dimension.height} Q${dimension.width / 2} ${dimension.height + 300} 0 ${dimension.height} L0 0`;
  const targetPath = `M0 0 L${dimension.width} 0 L${dimension.width} ${dimension.height} Q${dimension.width / 2} ${dimension.height} 0 ${dimension.height} L0 0`;
  const easing: [number, number, number, number] = [0.76, 0, 0.24, 1];

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
          className="fixed inset-0 z-[99] flex items-center justify-center bg-[#1A1815]"
        >
          {dimension.width > 0 && (
            <>
              <AnimatePresence mode="wait">
                <motion.div
                  key={index === words.length ? "logo" : index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
                  className="flex flex-col items-center absolute z-[1]"
                >
                  {index === words.length ? (
                    <div className="relative">
                       <motion.div 
                         className="absolute inset-0 bg-[#C9A962]/20 blur-xl rounded-full"
                         animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                         transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                       />
                       <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
                        <path d="M20 50C20 33.4315 33.4315 20 50 20C66.5685 20 80 33.4315 80 50" stroke="#C9A962" stroke-width="2" stroke-linecap="round"/>
                        <path d="M20 50C20 66.5685 33.4315 80 50 80C66.5685 80 80 66.5685 80 50" stroke="#FDFBF7" stroke-width="2" stroke-linecap="round"/>
                        <circle cx="50" cy="50" r="4" fill="#C9A962"/>
                      </svg>
                    </div>
                  ) : (
                    <div className="flex items-center text-[#FDFBF7] text-[42px] font-['Outfit'] font-light tracking-tight">
                      <span className="block w-[10px] h-[10px] bg-[#C9A962] rounded-full mr-[15px]"></span>
                      {words[index]}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
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
