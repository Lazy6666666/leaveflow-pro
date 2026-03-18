"use client";
import React from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
} from "framer-motion";

export const products = [
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

  const translateX = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, 1000]),
    springConfig
  );
  const translateXReverse = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, -1000]),
    springConfig
  );
  const rotateX = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [15, 0]),
    springConfig
  );
  const opacity = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [0.2, 1]),
    springConfig
  );
  const rotateZ = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [20, 0]),
    springConfig
  );
  const translateY = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [-700, 500]),
    springConfig
  );
  return (
    <div
      ref={ref}
      className="h-[300vh] py-10 overflow-hidden antialiased relative flex flex-col self-auto [perspective:1000px] [transform-style:preserve-3d] bg-[#FDFBF7]"
    >
      <Header />
      <motion.div
        style={{
          rotateX,
          rotateZ,
          translateY,
          opacity,
        }}
        className=""
      >
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-20 mb-20">
          {firstRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateX}
              key={product.title}
            />
          ))}
        </motion.div>
        <motion.div className="flex flex-row mb-20 space-x-20 ">
          {secondRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateXReverse}
              key={product.title}
            />
          ))}
        </motion.div>
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-20">
          {thirdRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateX}
              key={product.title}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export const Header = () => {
  return (
    <div className="max-w-7xl relative mx-auto py-20 md:py-40 px-6 w-full left-0 top-0">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="mb-8 flex items-center gap-4"
      >
        <span className="w-12 h-[1px] bg-[#1A1815]/20 block"></span>
        <span className="text-[10px] tracking-[0.3em] font-bold uppercase text-[#1A1815]/50">
          The Standard
        </span>
      </motion.div>
      <h1 className="font-['Outfit'] text-[4rem] md:text-[6.5rem] lg:text-[8rem] font-black leading-[0.9] tracking-[-0.04em] text-[#1A1815]">
        Elevate<br />
        <span className="font-['Cormorant_Garamond'] font-light italic text-[#C9A962]">
          your capital.
        </span>
      </h1>
      <p className="max-w-xl text-base md:text-xl mt-12 font-light text-[#1A1815]/60 leading-relaxed font-['Outfit']">
        Engineering flawless orchestration for modern human resources. 
        Redefining enterprise friction into pure aesthetic motion through 
        advanced digital ecosystems and strategic growth frameworks.
      </p>
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
