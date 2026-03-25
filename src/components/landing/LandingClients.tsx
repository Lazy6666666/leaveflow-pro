"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const logoSets = [
  [
    { name: "Goldman", src: "https://upload.wikimedia.org/wikipedia/commons/6/61/Goldman_Sachs_logo.svg" },
    { name: "BlackRock", src: "https://upload.wikimedia.org/wikipedia/commons/b/b7/BlackRock_wordmark.svg" },
    { name: "Morgan Stanley", src: "https://upload.wikimedia.org/wikipedia/commons/3/34/Morgan_Stanley_Logo_1.svg" },
    { name: "J.P. Morgan", src: "https://upload.wikimedia.org/wikipedia/commons/a/af/J_P_Morgan_Chase_Logo_2008.svg" },
  ],
  [
    { name: "Apple", src: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" },
    { name: "Google", src: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" },
    { name: "Microsoft", src: "https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg" },
    { name: "Amazon", src: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" },
  ],
];

export const LandingClients = () => {
  const [index, setIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!isAnimating) {
      const timer = setTimeout(() => {
        setIsAnimating(true);
        setIndex((prev) => (prev + 1) % logoSets.length);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isAnimating, index]);

  return (
    <section className="relative z-20 px-6 py-24 md:py-40 bg-[#FDFBF7] overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           whileInView={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8 }}
           className="flex items-center gap-3 mb-8"
        >
            <span className="text-[10px] tracking-[0.4em] font-bold uppercase text-[#1A1815]/30">The Network</span>
        </motion.div>
        
        <h2 className="font-['Outfit'] text-2xl md:text-4xl font-bold text-[#1A1815] text-center max-w-2xl leading-tight">
          Entrusted by the world’s most <br/>
          <span className="font-['Cormorant_Garamond'] font-light italic text-[#C9A962]">exacting institutions.</span>
        </h2>
        
        <div className="relative mt-24 flex h-24 w-full items-center justify-center">
          <AnimatePresence 
            mode="popLayout" 
            onExitComplete={() => setIsAnimating(false)}
          >
            <motion.div 
               key={`logo-set-${index}`}
               className="flex flex-wrap justify-center gap-12 md:gap-24"
            >
              {logoSets[index].map((logo, idx) => (
                <motion.div
                  key={logo.name}
                  initial={{ y: 20, opacity: 0, filter: "blur(10px)" }}
                  animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                  exit={{ y: -20, opacity: 0, filter: "blur(10px)" }}
                  transition={{
                    duration: 0.8,
                    delay: 0.1 * idx,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                  className="flex items-center justify-center grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700"
                >
                  <img
                    src={logo.src}
                    alt={logo.name}
                    className="h-8 md:h-12 w-auto object-contain"
                  />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-20 h-px w-32 bg-gradient-to-r from-transparent via-[#1A1815]/10 to-transparent"
        />
      </div>
    </section>
  );
};
