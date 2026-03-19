"use client";
import React from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
  type Variants,
} from "framer-motion";

const products = [
  {
    title: "Enterprise Orchestration",
    link: "#",
    thumbnail: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800",
  },
  {
    title: "Capital Engineering",
    link: "#",
    thumbnail: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800",
  },
  {
    title: "Digital Ecosystems",
    link: "#",
    thumbnail: "https://images.unsplash.com/photo-1554469384-e58fac16e23a?auto=format&fit=crop&q=80&w=800",
  },
  {
    title: "Strategic Growth",
    link: "#",
    thumbnail: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&q=80&w=800",
  },
  {
    title: "Modern Collaboration",
    link: "#",
    thumbnail: "https://images.unsplash.com/photo-1522071823912-34974f44158d?auto=format&fit=crop&q=80&w=800",
  },
  {
    title: "Fluid Dynamics",
    link: "#",
    thumbnail: "https://images.unsplash.com/photo-1550745165-9bc0b252723f?auto=format&fit=crop&q=80&w=800",
  },
  {
    title: "Aesthetic Precision",
    link: "#",
    thumbnail: "https://images.unsplash.com/photo-1434626881859-194d67b2b80f?auto=format&fit=crop&q=80&w=800",
  },
  {
    title: "Human Capital",
    link: "#",
    thumbnail: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=800",
  },
  {
    title: "Innovation Hub",
    link: "#",
    thumbnail: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=800",
  },
  {
    title: "Luminous Design",
    link: "#",
    thumbnail: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=800",
  },
  {
    title: "Architecture of Trust",
    link: "#",
    thumbnail: "https://images.unsplash.com/photo-1707343843437-caacff5cfa74?auto=format&fit=crop&q=80&w=800",
  },
  {
    title: "Global Connectivity",
    link: "#",
    thumbnail: "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&q=80&w=800",
  },
  {
    title: "Pulse of Enterprise",
    link: "#",
    thumbnail: "https://images.unsplash.com/photo-1664575602276-acd073f104c1?auto=format&fit=crop&q=80&w=800",
  },
  {
    title: "Refined Motion",
    link: "#",
    thumbnail: "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&q=80&w=800",
  },
  {
    title: "Future of Work",
    link: "#",
    thumbnail: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800",
  },
];

export const LandingHeroBg = () => {
  const firstRow = products.slice(0, 5);
  const secondRow = products.slice(5, 10);
  const thirdRow = products.slice(10, 15);
  const ref = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const springConfig = { stiffness: 300, damping: 30, bounce: 100 };

  const beforeImage = "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1600&auto=format&fit=crop";
  const afterImage = "https://images.unsplash.com/photo-1519781542704-957ee19f6e9b?q=80&w=1600&auto=format&fit=crop";

  return (
    <div
      ref={ref}
      className="min-h-[200vh] overflow-visible antialiased relative flex flex-col bg-[#FDFBF7]"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Split Background Layer */}
        <div className="absolute inset-0 flex">
          {/* Left: THE PROBLEM (Before) */}
          <motion.div 
            style={{ 
              scale: useTransform(scrollYProgress, [0, 0.5], [1.1, 1]),
              filter: "grayscale(100%) brightness(0.7)",
            }}
            className="w-1/2 h-full relative overflow-hidden border-r border-[#1A1815]/5"
          >
            <img 
              src={beforeImage} 
              className="absolute inset-0 w-full h-full object-cover" 
              alt="The Problem" 
            />
            <div className="absolute inset-0 bg-[#1A1815]/20 mix-blend-multiply" />
          </motion.div>

          {/* Right: THE SOLUTION (After) */}
          <motion.div 
            style={{ 
              scale: useTransform(scrollYProgress, [0, 0.5], [1.1, 1.2]),
            }}
            className="w-1/2 h-full relative overflow-hidden"
          >
            <img 
              src={afterImage} 
              className="absolute inset-0 w-full h-full object-cover" 
              alt="The Solution" 
            />
            <div className="absolute inset-0 bg-[#C9A962]/5" />
          </motion.div>
        </div>

        {/* Dynamic Wipe/Divider Effect */}
        <motion.div 
          style={{ 
            left: useTransform(scrollYProgress, [0, 0.5], ["50%", "48%"]),
          }}
          className="absolute top-0 bottom-0 w-[1px] bg-[#C9A962]/30 z-20"
        />

        {/* Content Overlay */}
        <motion.div 
          style={{ 
            scale: useTransform(scrollYProgress, [0, 0.3, 0.5], [1, 1, 0]), 
            opacity: useTransform(scrollYProgress, [0, 0.3, 0.5], [1, 1, 0]),
            y: useTransform(scrollYProgress, [0, 0.5], [0, -50]),
          }} 
          className="relative z-30 h-full flex items-center justify-center pt-20"
        >
          <Header />
        </motion.div>

        {/* "Before / After" Labels */}
        <div className="absolute bottom-12 inset-x-0 px-12 flex justify-between z-30 pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="flex flex-col gap-2"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Infrastructure</span>
            <span className="text-2xl font-['Cormorant_Garamond'] italic text-white/60">The Deficit.</span>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.8, duration: 1 }}
            className="flex flex-col gap-2 items-end text-right"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#1A1815]/30">Orchestration</span>
            <span className="text-2xl font-['Cormorant_Garamond'] italic text-[#C9A962]">The Balance.</span>
          </motion.div>
        </div>
      </div>
      
      {/* Spacer to allow for the sticky content to be scrolled through */}
      <div className="h-[100vh]" />
    </div>
  );
};

export const Header = () => {
  const words = "Elevate your capital.".split(" ");
  const itemEase: [number, number, number, number] = [0.23, 1, 0.32, 1];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.4,
      },
    },
  };

  const item: Variants = {
    hidden: { y: 100, opacity: 0 },
    show: { 
      y: 0, 
      opacity: 1,
      transition: {
        duration: 1.2,
        ease: itemEase
      }
    },
  };

  return (
    <div className="max-w-[1400px] relative mx-auto py-32 md:py-56 px-6 w-full flex flex-col items-center text-center">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="mb-12 flex items-center gap-4 justify-center"
      >
        <span className="w-8 h-[1px] bg-[#C9A962] block"></span>
        <span className="text-[10px] tracking-[0.4em] font-bold uppercase text-[#1A1815]/40 italic font-['Cormorant_Garamond']">
          The New Standard
        </span>
        <span className="w-8 h-[1px] bg-[#C9A962] block"></span>
      </motion.div>

      <motion.h1 
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="font-['Outfit'] text-[4rem] md:text-[7.5rem] lg:text-[10rem] font-black leading-[0.85] tracking-[-0.05em] text-[#1A1815] mb-16"
      >
        {words.map((word, i) => (
          <span key={i} className="inline-block overflow-hidden pb-4 mr-4 last:mr-0">
             <motion.span variants={item} className="inline-block">
                {i === words.length - 1 || i === words.length - 2 ? (
                   <span className={i === words.length - 1 ? "font-['Cormorant_Garamond'] font-light italic text-[#C9A962]" : ""}>
                    {word}
                   </span>
                ) : word}
             </motion.span>
          </span>
        ))}
      </motion.h1>

      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1 }}
        className="max-w-2xl text-lg md:text-2xl mt-4 font-light text-[#1A1815]/60 leading-relaxed font-['Outfit'] mb-20"
      >
        Engineering flawless orchestration for forward-thinking enterprise. 
        Transform your workforce into a masterclass of strategic motion.
      </motion.p>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="flex flex-col sm:flex-row gap-6 mt-8"
      >
        <button className="px-12 py-5 rounded-full bg-[#1A1815] text-[#FDFBF7] font-['DM_Sans'] text-xs font-black uppercase tracking-[0.2em] hover:bg-[#C9A962] transition-all duration-700 shadow-xl hover:shadow-[#C9A962]/20">
          Begin Onboarding
        </button>
        <button className="px-12 py-5 rounded-full border border-[#1A1815]/10 text-[#1A1815] font-['DM_Sans'] text-xs font-black uppercase tracking-[0.2em] hover:bg-[#1A1815]/5 transition-all duration-700">
          View Infrastructure
        </button>
      </motion.div>
    </div>
  );
};

export const ProductCard = ({
  product,
  translate,
}: {
  product: {
    title: string;
    link: string;
    thumbnail: string;
  };
  translate: MotionValue<number>;
}) => {
  return (
    <motion.div
      style={{
        x: translate,
      }}
      whileHover={{
        y: -10,
      }}
      key={product.title}
      className="group/product h-96 w-[30rem] relative shrink-0"
    >
      <div className="block group-hover/product:shadow-2xl transition-all duration-500 rounded-2xl overflow-hidden bg-white ring-1 ring-black/5 p-2">
        <div className="relative w-full h-full aspect-[16/10] rounded-xl overflow-hidden bg-[#1A1815]">
           <img
            src={product.thumbnail}
            className="object-cover object-center absolute h-full w-full inset-0 transition-transform duration-700 group-hover/product:scale-105"
            alt={product.title}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/product:opacity-100 transition-opacity duration-500" />
        </div>
      </div>
      <div className="absolute bottom-6 left-8 opacity-0 group-hover/product:opacity-100 transition-all duration-500 translate-y-2 group-hover/product:translate-y-0 text-white font-['Outfit']">
        <p className="text-[10px] uppercase tracking-widest font-bold opacity-60 mb-1">Asset</p>
        <h2 className="text-xl font-bold tracking-tight">
          {product.title}
        </h2>
      </div>
    </motion.div>
  );
};
