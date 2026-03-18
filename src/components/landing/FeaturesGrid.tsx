import React, { useRef, useMemo, forwardRef } from "react";
import { motion } from "framer-motion";
import MagicRings from "@/components/MagicRings";
import {
  Cpu,
  HeartPulse,
  ShieldPlus,
  ArrowRight,
  Fingerprint,
  Zap,
} from "lucide-react";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/ui/AnimatedBeam";

export const FeaturesGrid = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cpuRef = useRef<HTMLDivElement>(null);
  const heartRef = useRef<HTMLDivElement>(null);
  const shieldRef = useRef<HTMLDivElement>(null);
  const zapRef = useRef<HTMLDivElement>(null);

  const items = useMemo(() => [
    {
      title: "AI Workforce Copilot",
      description: "Intelligent summaries of attendance, leave, and workload patterns for daily action.",
      header: <ImageHeader src="https://images.unsplash.com/photo-1485083269755-a7b559a4fe5e?q=80&w=800&auto=format&fit=crop" ref={cpuRef} />,
      icon: <Cpu className="h-5 w-5 text-teal-600" aria-hidden="true" />,
      className: "md:col-span-2",
      ringColor: "#2dd4bf",
    },
    {
      title: "Burnout Prevention",
      description: "Predictive analytics to identify team fatigue before it impacts performance.",
      header: <ImageHeader src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800&auto=format&fit=crop" ref={heartRef} />,
      icon: <HeartPulse className="h-5 w-5 text-cyan-600" aria-hidden="true" />,
      className: "md:col-span-1",
      ringColor: "#22d3ee",
    },
    {
      title: "Smart Interventions",
      description: "Automated recommendations for workload balancing and schedule optimization.",
      header: <ImageHeader src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop" ref={shieldRef} />,
      icon: <Zap className="h-5 w-5 text-blue-600" aria-hidden="true" />,
      className: "md:col-span-1",
      ringColor: "#3b82f6",
    },
    {
      title: "Compliance Guardrails",
      description:
        "Ensuring every leave and attendance record meets your internal and local labor laws.",
      header: <ImageHeader src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=800&auto=format&fit=crop" ref={zapRef} />,
      icon: <Fingerprint className="h-5 w-5 text-teal-600" aria-hidden="true" />,
      className: "md:col-span-2",
      ringColor: "#2dd4bf",
    },
  ], []);

  return (
    <section id="features" className="bg-[#FDFDFB] px-6 lg:px-10 py-24 lg:py-40 text-[#171411] relative overflow-hidden" aria-labelledby="features-heading">
      <div className="absolute inset-0 bg-[#FDFDFB]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,184,166,0.05),transparent_70%)]" />

      <div className="mx-auto max-w-[1600px] relative z-10" ref={containerRef}>
        <AnimatedBeam 
          containerRef={containerRef} 
          fromRef={cpuRef} 
          toRef={heartRef} 
          curvature={50}
          gradientStartColor="#2dd4bf"
          gradientStopColor="#22d3ee"
          duration={4}
        />
        <AnimatedBeam 
          containerRef={containerRef} 
          fromRef={heartRef} 
          toRef={shieldRef} 
          curvature={-50}
          gradientStartColor="#22d3ee"
          gradientStopColor="#3b82f6"
          duration={5}
        />
        <AnimatedBeam 
          containerRef={containerRef} 
          fromRef={shieldRef} 
          toRef={zapRef} 
          curvature={50}
          gradientStartColor="#3b82f6"
          gradientStopColor="#2dd4bf"
          duration={6}
        />

        <motion.div
          className="max-w-5xl mb-24"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/5 border border-teal-500/10 mb-8 w-fit">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-700">Intelligent Capabilities</span>
          </div>

          <h2 id="features-heading" className="font-['DM_Sans'] text-4xl sm:text-6xl lg:text-[84px] font-black leading-[0.95] tracking-tighter text-[#171411]">
            Everything you need for workforce excellence
          </h2>
          <p className="mt-8 text-lg md:text-xl font-medium text-[#4A443F] max-w-[640px] leading-relaxed">
            AI-powered intelligence meets intuitive design. Protect your team's wellbeing while driving peak performance.
          </p>
        </motion.div>

        <BentoGrid className="max-w-[1600px] mx-auto gap-8 md:auto-rows-[24rem]">
          {items.map((item, i) => (
            <BentoGridItem
              key={i}
              title={item.title}
              description={item.description}
              header={item.header}
              icon={item.icon}
              className={cn(
                "bg-[#171411] border-[#171411]/5 shadow-2xl hover:border-teal-500/50 transition-all duration-500 relative overflow-hidden group/bento text-white", 
                item.className
              )}
            >
              <div className="absolute inset-0 opacity-20 transition-opacity group-hover/bento:opacity-40">
                <MagicRings
                  color={item.ringColor}
                  ringCount={5}
                  speed={0.6}
                  attenuation={12}
                  baseRadius={0.45}
                  radiusStep={0.12}
                  opacity={0.4}
                  followMouse={true}
                  mouseInfluence={0.15}
                />
              </div>
              {/* Force white text for items inside the item */}
              <style dangerouslySetInnerHTML={{ __html: `
                .group\\/bento:nth-child(${i+1}) .text-neutral-600 { color: #FFFFFF !important; }
                .group\\/bento:nth-child(${i+1}) .text-neutral-100 { color: #FFFFFF !important; }
                .group\\/bento:nth-child(${i+1}) div:nth-child(2) > div:nth-child(2) { color: #FFFFFF !important; }
              `}} />
            </BentoGridItem>
          ))}
        </BentoGrid>

        <motion.div
          className="mt-32"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <div className="text-center mb-12">
            <p className="text-[10px] font-black uppercase tracking-[0.34em] text-white/60">Built for the modern stack</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              "Real-time Alerts",
              "Auto Time Tracking",
              "Advanced Analytics",
              "Team Management",
              "Goal Tracking",
              "Instant Sync",
            ].map((item) => (
              <motion.div
                key={item}
                className="px-6 py-3.5 rounded-full border border-[#171411]/10 bg-[#171411]/[0.02] hover:bg-[#171411]/[0.05] hover:border-teal-500/30 transition-all duration-300 cursor-default"
                whileHover={{ scale: 1.05, y: -4 }}
              >
                <span className="text-sm font-bold text-[#4A443F] tracking-tight">{item}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="mt-24 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <motion.button
            className="inline-flex items-center gap-3 px-10 py-5 rounded-full bg-[#171411] text-white text-sm font-black uppercase tracking-widest hover:shadow-2xl hover:shadow-[#171411]/20 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FDFDFB]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            Explore All Features
            <ArrowRight className="w-5 h-5 text-teal-400" strokeWidth={3} />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

const ImageHeader = forwardRef<HTMLDivElement, { src: string }>((props, ref) => (
  <div ref={ref} className="relative h-44 w-full z-10 overflow-hidden rounded-2xl border border-[#171411]/5 bg-[#171411]/5">
    <img src={props.src} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80 backdrop-grayscale-0 group-hover:scale-110 transition-all duration-700" />
    <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent opacity-60" />
  </div>
));
