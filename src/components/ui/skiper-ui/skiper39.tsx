"use client";

import { gsap } from "gsap";
import { useEffect, useRef } from "react";

interface CrowdCanvasProps {
  src: string;
  rows?: number;
  cols?: number;
}

interface Peep {
  image: HTMLImageElement;
  rect: number[];
  width: number;
  height: number;
  x: number;
  y: number;
  anchorY: number;
  scaleX: number;
  opacity: number;
  walk: gsap.core.Timeline | null;
  setRect: (rect: number[]) => void;
  render: (ctx: CanvasRenderingContext2D) => void;
}

const CrowdCanvas = ({ src, rows = 15, cols = 10 }: CrowdCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const config = {
      src,
      rows,
      cols,
    };

    // UTILS
    const randomRange = (min: number, max: number) =>
      min + Math.random() * (max - min);
    const randomIndex = <T,>(array: readonly T[]) => (randomRange(0, array.length) | 0);
    const removeFromArray = <T,>(array: T[], i: number) => array.splice(i, 1)[0] as T;
    const removeItemFromArray = <T,>(array: T[], item: T) =>
      removeFromArray(array, array.indexOf(item));
    const removeRandomFromArray = <T,>(array: T[]) =>
      removeFromArray(array, randomIndex(array));
    const getRandomFromArray = <T,>(array: readonly T[]) => array[randomIndex(array) | 0] as T;

    // TWEEN FACTORIES
    type Stage = { width: number; height: number };

    const resetPeep = ({ stage, peep }: { stage: Stage; peep: Peep }) => {
      const direction = Math.random() > 0.5 ? 1 : -1;
      // Vary height slightly for depth
      const heightVar = Math.random() * 0.2 + 0.8; 
      const scale = (Math.random() * 0.3 + 0.7) * heightVar;
      
      const offsetY = (100 - 250 * gsap.parseEase("power2.in")(Math.random())) * scale;
      const startY = stage.height - (peep.height * scale) + offsetY;
      
      let startX: number;
      let endX: number;

      if (direction === 1) {
        startX = -peep.width * scale;
        endX = stage.width;
        peep.scaleX = scale;
      } else {
        startX = stage.width + peep.width * scale;
        endX = -peep.width * scale;
        peep.scaleX = -scale;
      }

      peep.x = startX;
      peep.y = startY;
      peep.anchorY = startY;
      peep.opacity = 0;

      return {
        startX,
        startY,
        endX,
        scale,
      };
    };

    const normalWalk = ({ peep, props }: { peep: Peep; props: ReturnType<typeof resetPeep> }) => {
      const { startX, startY, endX, scale } = props;
      const xDuration = randomRange(8, 15); // Varied speeds
      const yDuration = 0.25;

      const tl = gsap.timeline();
      
      // Fade in/out at edges
      tl.to(peep, { duration: 1, opacity: 1, ease: "power1.inOut" }, 0);
      tl.to(peep, { duration: 1, opacity: 0, ease: "power1.inOut" }, xDuration - 1);

      tl.to(
        peep,
        {
          duration: xDuration,
          x: endX,
          ease: "none",
        },
        0,
      );
      tl.to(
        peep,
        {
          duration: yDuration,
          repeat: Math.ceil(xDuration / yDuration),
          y: startY - (5 * scale),
          yoyo: true,
          ease: "sine.inOut",
        },
        0,
      );

      return tl;
    };

    const walks = [normalWalk];

    // FACTORY FUNCTIONS
    const createPeep = ({ image, rect }: { image: HTMLImageElement; rect: number[] }): Peep => {
      const peep: Peep = {
        image,
        rect: [],
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        anchorY: 0,
        scaleX: 1,
        opacity: 0,
        walk: null,
        setRect: (rect: number[]) => {
          peep.rect = rect;
          peep.width = rect[2];
          peep.height = rect[3];
        },
        render: (ctx: CanvasRenderingContext2D) => {
          if (peep.opacity <= 0) return;
          ctx.save();
          ctx.globalAlpha = peep.opacity;
          ctx.translate(peep.x, peep.y);
          ctx.scale(peep.scaleX, Math.abs(peep.scaleX));
          ctx.drawImage(
            peep.image,
            peep.rect[0],
            peep.rect[1],
            peep.rect[2],
            peep.rect[3],
            0,
            0,
            peep.width,
            peep.height,
          );
          ctx.restore();
        },
      };
      peep.setRect(rect);
      return peep;
    };

    // MAIN
    const img = document.createElement("img");
    const stage = { width: 0, height: 0 };
    const allPeeps: Peep[] = [];
    const availablePeeps: Peep[] = [];
    const crowd: Peep[] = [];

    const createPeeps = () => {
      const { rows, cols } = config;
      const { naturalWidth: width, naturalHeight: height } = img;
      
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

      for (let i = 0; i < rows * cols; i++) {
        const row = i % rows;
        const col = Math.floor(i / rows);
        
        // Precise integer-based slicing to avoid drift and gaps
        const x1 = Math.floor(row * (width / rows));
        const x2 = Math.floor((row + 1) * (width / rows));
        const y1 = Math.floor(col * (height / cols));
        const y2 = Math.floor((col + 1) * (height / cols));
        
        const w = x2 - x1;
        const h = y2 - y1;

        // Content detection: Skip empty or mostly transparent cells
        if (tempCtx) {
          tempCanvas.width = w;
          tempCanvas.height = h;
          tempCtx.clearRect(0, 0, w, h);
          tempCtx.drawImage(img, x1, y1, w, h, 0, 0, w, h);
          const imageData = tempCtx.getImageData(0, 0, w, h).data;
          
          let alphaSum = 0;
          for (let j = 3; j < imageData.length; j += 4) {
            alphaSum += imageData[j];
          }
          
          // If the cell is less than 2% opaque, skip it
          if (alphaSum < (w * h * 255) * 0.02) continue;
        }

        allPeeps.push(
          createPeep({
            image: img,
            rect: [x1, y1, w, h],
          }),
        );
      }
    };

    const initCrowd = () => {
      // Start with a reasonable amount of people
      const initialCount = Math.min(allPeeps.length, 12);
      for (let i = 0; i < initialCount; i++) {
        const peep = addPeepToCrowd();
        if (peep && peep.walk) {
          peep.walk.progress(Math.random());
        }
      }
    };

    const addPeepToCrowd = () => {
      if (availablePeeps.length === 0) return null;
      
      const peep = removeRandomFromArray(availablePeeps);
      const walk = getRandomFromArray(walks)({
        peep,
        props: resetPeep({ peep, stage }),
      }).eventCallback("onComplete", () => {
        removePeepFromCrowd(peep);
        addPeepToCrowd();
      });

      peep.walk = walk;
      crowd.push(peep);
      crowd.sort((a, b) => a.anchorY - b.anchorY);
      return peep;
    };

    const removePeepFromCrowd = (peep: Peep) => {
      removeItemFromArray(crowd, peep);
      availablePeeps.push(peep);
    };

    const render = () => {
      if (!canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(devicePixelRatio, devicePixelRatio);
      crowd.forEach((peep) => {
        peep.render(ctx);
      });
      ctx.restore();
    };

    const resize = () => {
      if (!canvas) return;
      stage.width = canvas.clientWidth;
      stage.height = canvas.clientHeight;
      canvas.width = stage.width * devicePixelRatio;
      canvas.height = stage.height * devicePixelRatio;

      crowd.forEach((peep) => {
        if (peep.walk) peep.walk.kill();
      });

      crowd.length = 0;
      availablePeeps.length = 0;
      availablePeeps.push(...allPeeps);
      initCrowd();
    };

    const init = () => {
      createPeeps();
      resize();
      gsap.ticker.add(render);
    };

    img.onload = init;
    img.src = config.src;

    const handleResize = () => resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      gsap.ticker.remove(render);
      crowd.forEach((peep) => {
        if (peep.walk) peep.walk.kill();
      });
    };
  }, [src, rows, cols]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full pointer-events-none" />;
};

import { motion } from "framer-motion";

const Skiper39 = () => {
  return (
    <section className="relative w-full overflow-hidden bg-white py-32 lg:py-48">
      {/* Background Crowd Animation */}
      <div className="absolute inset-x-0 bottom-0 top-0 z-0 h-full w-full opacity-[0.25] pointer-events-none">
        <CrowdCanvas src="/Gemini_Generated_Image_c81vlc81vlc81vlc.png" rows={15} cols={10} />
      </div>

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
        <div className="flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/5 px-4 py-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/60">
                Scale Securely
              </span>
            </div>

            <h2 className="font-['DM_Sans'] text-5xl font-black leading-[0.9] tracking-tighter text-black sm:text-7xl lg:text-[120px]">
              Enterprise Ready
            </h2>
            
            <motion.p 
              className="mx-auto mt-12 max-w-[580px] text-xl font-medium leading-relaxed text-[#4A443F] md:text-2xl"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 1 }}
            >
              Designed for the modern workforce. Seamlessly manage thousands of employees with military-grade security and unmatched performance.
            </motion.p>

            <motion.div 
              className="mt-16 flex flex-col items-center gap-6 sm:flex-row sm:justify-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <button className="h-16 rounded-full bg-black px-10 text-sm font-black uppercase tracking-widest text-white transition-transform hover:scale-105 active:scale-95 shadow-xl shadow-black/10">
                Review Infrastructure
              </button>
              <button className="h-16 rounded-full border border-black/10 bg-transparent px-10 text-sm font-black uppercase tracking-widest text-black transition-all hover:bg-black/5 active:scale-95">
                Contact Sales
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Aesthetic Accents */}
      <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-black/10 to-transparent" />
      <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-black/10 to-transparent" />
    </section>
  );
};

export { CrowdCanvas, Skiper39 };
