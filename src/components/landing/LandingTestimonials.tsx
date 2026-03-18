"use client";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

type Testimonial = {
  quote: string;
  name: string;
  designation: string;
  src: string;
};

const testimonials: Testimonial[] = [
  {
    quote: "The orchestration of our global payroll through Balance has been nothing short of transformative. It’s a masterclass in engineering and aesthetic synergy.",
    name: "Helena Voss",
    designation: "Chief People Officer at Luminous",
    src: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=500&h=500",
  },
  {
    quote: "Precision meets elegance. Balance hasn't just replaced our legacy systems; it has redefined how we perceive human capital and strategic growth.",
    name: "Julian Thorne",
    designation: "VP of Talent at NexaCorp",
    src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=500&h=500",
  },
  {
    quote: "In the world of high-stakes HR, friction is the enemy. Balance is the friction-less standard we've been waiting for.",
    name: "Marcus Chen",
    designation: "Strategy Director at Azure",
    src: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=500&h=500",
  },
];

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

export const LandingTestimonials = () => {
  const [active, setActive] = useState(0);
  const [logoIndex, setLogoIndex] = useState(0);
  const [isLogoAnimating, setIsLogoAnimating] = useState(false);

  const handleNext = () => {
    setActive((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrev = () => {
    setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const isActive = (index: number) => {
    return index === active;
  };

  useEffect(() => {
    const interval = setInterval(handleNext, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isLogoAnimating) {
      const timer = setTimeout(() => {
        setIsLogoAnimating(true);
        setLogoIndex((prev) => (prev + 1) % logoSets.length);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isLogoAnimating, logoIndex]);

  const randomRotateY = () => {
    return Math.floor(Math.random() * 21) - 10;
  };

  return (
    <section className="bg-[#FDFBF7] py-24 md:py-40">
      <div className="mx-auto max-w-sm px-6 antialiased md:max-w-6xl md:px-12 lg:px-24">
         <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="flex flex-col items-center mb-12 text-center"
        >
            <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-[#1A1815]/30 mb-6">Endorsements</span>
            <h2 className="font-['Outfit'] text-3xl md:text-5xl font-black text-[#1A1815] tracking-tight">
              Endorsed by the <span className="font-['Cormorant_Garamond'] font-light italic text-[#C9A962]">EXTRAORDINARY.</span>
            </h2>
        </motion.div>

        {/* Combined Brand Logos Section */}
        <div className="relative mb-24 flex h-16 w-full items-center justify-center overflow-hidden">
          <AnimatePresence 
            mode="popLayout" 
            onExitComplete={() => setIsLogoAnimating(false)}
          >
            <motion.div 
               key={`logo-set-${logoIndex}`}
               className="flex flex-wrap justify-center gap-12 md:gap-20"
            >
              {logoSets[logoIndex].map((logo, idx) => (
                <motion.div
                  key={logo.name}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  transition={{
                    duration: 0.8,
                    delay: 0.1 * idx,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                  className="flex items-center justify-center grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all duration-700"
                >
                  <img
                    src={logo.src}
                    alt={logo.name}
                    className="h-6 md:h-8 w-auto object-contain"
                  />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative grid grid-cols-1 gap-20 md:grid-cols-2">
          {/* ... (rest of testimonials section) */}
          <div>
            <div className="relative h-96 w-full lg:h-[450px]">
              <AnimatePresence>
                {testimonials.map((testimonial, index) => (
                  <motion.div
                    key={testimonial.src}
                    initial={{
                      opacity: 0,
                      scale: 0.9,
                      z: -100,
                      rotate: randomRotateY(),
                    }}
                    animate={{
                      opacity: isActive(index) ? 1 : 0.7,
                      scale: isActive(index) ? 1 : 0.95,
                      z: isActive(index) ? 0 : -100,
                      rotate: isActive(index) ? 0 : randomRotateY(),
                      zIndex: isActive(index)
                        ? 40
                        : testimonials.length + 2 - index,
                      y: isActive(index) ? [0, -80, 0] : 0,
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.9,
                      z: 100,
                      rotate: randomRotateY(),
                    }}
                    transition={{
                      duration: 0.5,
                      ease: [0.32, 0.72, 0, 1],
                    }}
                    className="absolute inset-0 origin-bottom"
                  >
                    <div className="h-full w-full rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-[#1A1815]/5 bg-white p-2">
                        <img
                        src={testimonial.src}
                        alt={testimonial.name}
                        draggable={false}
                        className="h-full w-full rounded-[2rem] object-cover object-center"
                        />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
          <div className="flex flex-col justify-between py-10 lg:py-20">
            <motion.div
              key={active}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            >
              <h3 className="font-['Outfit'] text-3xl font-bold text-[#1A1815] tracking-tight">
                {testimonials[active].name}
              </h3>
              <p className="font-['Outfit'] text-sm uppercase tracking-widest font-bold text-[#C9A962] mt-2">
                {testimonials[active].designation}
              </p>
              <motion.p className="mt-10 font-['Outfit'] text-lg md:text-xl font-light leading-relaxed text-[#1A1815]/60 italic">
                "{testimonials[active].quote.split(" ").map((word, index) => (
                  <motion.span
                    key={index}
                    initial={{ filter: "blur(10px)", opacity: 0, y: 5 }}
                    animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.02 * index }}
                    className="inline-block"
                  >
                    {word}&nbsp;
                  </motion.span>
                ))}"
              </motion.p>
            </motion.div>
            <div className="flex gap-4 pt-16">
              <button
                onClick={handlePrev}
                className="group/button flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-[#1A1815]/5 transition-all duration-300 hover:scale-110 active:scale-95"
              >
                <IconArrowLeft className="h-6 w-6 text-[#1A1815] transition-transform duration-300 group-hover/button:-translate-x-1" />
              </button>
              <button
                onClick={handleNext}
                className="group/button flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-[#1A1815]/5 transition-all duration-300 hover:scale-110 active:scale-95"
              >
                <IconArrowRight className="h-6 w-6 text-[#1A1815] transition-transform duration-300 group-hover/button:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
