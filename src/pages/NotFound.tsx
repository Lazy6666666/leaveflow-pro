import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Bot } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const EASE_CONCIERGE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-6 overflow-hidden font-sans">

      {/* Editorial Background Layers */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute top-[10%] left-[10%] h-[60%] w-[60%] bg-primary/5 blur-[120px] rounded-full opacity-50" />
        <div className="absolute bottom-[10%] right-[10%] h-[50%] w-[50%] bg-primary/3 blur-[100px] rounded-full opacity-30" />
      </div>

      <div className="relative text-left max-w-2xl w-full z-10">

        {/* Oversized background glyph */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: EASE_CONCIERGE }}
          className="pointer-events-none select-none absolute -top-24 -left-12 text-[300px] font-display font-black text-primary/[0.03] leading-none tracking-tighter"
          aria-hidden="true"
        >
          404
        </motion.div>

        <div className="space-y-10">
          {/* Logo Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_CONCIERGE }}
          >
            <Logo size="md" />
          </motion.div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: EASE_CONCIERGE }}
              className="flex items-center gap-3"
            >
              <div className="h-1 w-8 terracotta-gradient rounded-full" />
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary">
                Protocol Disruption
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: EASE_CONCIERGE }}
              className="text-6xl md:text-8xl font-display font-bold tracking-tighter leading-[0.85] text-foreground"
            >
              This page <br />
              <span className="text-primary italic font-medium">doesn't exist.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: EASE_CONCIERGE }}
              className="text-xl text-muted-foreground leading-relaxed max-w-md font-medium"
            >
              The route <span className="text-primary font-mono">{location.pathname}</span> was not found in the Balance ecosystem.
            </motion.p>
          </div>

          {/* CTA & Mascot Integration */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: EASE_CONCIERGE }}
            className="flex flex-col sm:flex-row items-center gap-10"
          >
            <Link
              to="/dashboard"
              className="group h-16 px-10 terracotta-gradient text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] flex items-center gap-4 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              <ArrowLeft size={18} />
              Return to Command Center
            </Link>

            <div className="flex items-center gap-4 text-muted-foreground/40">
               <Bot size={24} />
               <p className="text-[10px] font-bold uppercase tracking-[0.2em] max-w-[15ch]">The concierge can guide you back.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
