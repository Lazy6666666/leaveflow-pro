"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';

const words = ["LeaveFlow", "Pro", "Optimized", "Loading..."];

interface PreloaderProps {
    onComplete: () => void;
}

/**
 * Preloader Component
 * 
 * Aesthetic: Minimal, editorial, high-contrast, text-reveal.
 */
export const Preloader = ({ onComplete }: PreloaderProps) => {
    const [index, setIndex] = useState(0);
    const [dimension, setDimension] = useState({ width: 0, height: 0 });
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const updateDimensions = () => {
            setDimension({ width: window.innerWidth, height: window.innerHeight });
        };
        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    useEffect(() => {
        if (index === words.length) {
            const timer = setTimeout(() => {
                setIsExiting(true);
                setTimeout(onComplete, 1200);
            }, 1000);
            return () => clearTimeout(timer);
        }

        const timeout = setTimeout(() => {
            setIndex(index + 1);
        }, 500);

        return () => clearTimeout(timeout);
    }, [index, onComplete]);

    const easeOutExpo = [0.76, 0, 0.24, 1] as const;

    const containerVariants: Variants = {
        initial: { y: 0 },
        exit: { 
            y: "-100vh", 
            transition: { duration: 1.2, ease: easeOutExpo } 
        }
    };

    const textVariants: Variants = {
        initial: { opacity: 0, y: 20 },
        enter: { 
            opacity: 1, 
            y: 0, 
            transition: { duration: 0.6, ease: "easeOut" } 
        },
        exit: { 
            opacity: 0, 
            y: -20, 
            transition: { duration: 0.4, ease: "easeIn" } 
        }
    };

    if (dimension.width === 0) return <div className="fixed inset-0 bg-background z-[100]" />;

    return (
        <motion.div 
            variants={containerVariants} 
            initial="initial" 
            animate={isExiting ? "exit" : "initial"} 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
        >
            <div className="flex flex-col items-center justify-center">
                <AnimatePresence mode="wait">
                    {index < words.length ? (
                        <motion.div 
                            key={`word-${index}`}
                            variants={textVariants} 
                            initial="initial" 
                            animate="enter" 
                            exit="exit"
                        >
                            <p className="text-4xl md:text-6xl font-black tracking-tighter uppercase text-foreground">
                                {words[index]}
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                           <div className="h-1 w-24 bg-foreground rounded-full animate-pulse" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};
