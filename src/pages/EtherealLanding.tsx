import { Player, type PlayerRef } from '@remotion/player';
import { LandingVideo, TOTAL_FRAMES, FPS, WIDTH, HEIGHT } from '@/remotion/LandingVideo';
import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ArrowUpRight, Shield, Zap, Globe, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';

const CUBIC_BEZIER: [number, number, number, number] = [0.32, 0.72, 0, 1];
const TRANSITION = { duration: 0.8, ease: CUBIC_BEZIER };

const GlassCard = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
    whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
    viewport={{ once: true }}
    transition={{ ...TRANSITION, delay }}
    className={`group relative p-px rounded-[2rem] bg-white/5 border border-white/10 overflow-hidden ${className}`}
  >
    <div className="relative h-full w-full bg-[#0A0A0A] rounded-[calc(2rem-1px)] p-8 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.05)_0%,transparent_50%)] pointer-events-none" />
      {children}
    </div>
  </motion.div>
);

const CTAButton = ({ children, variant = "primary", className = "" }: { children: React.ReactNode; variant?: "primary" | "secondary"; className?: string }) => {
  const isPrimary = variant === "primary";
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`group relative flex items-center gap-4 rounded-full px-8 py-4 transition-all ${
        isPrimary ? "bg-white text-black" : "bg-white/5 text-white border border-white/10 backdrop-blur-md"
      } ${className}`}
    >
      <span className="text-sm font-bold uppercase tracking-[0.2em]">{children}</span>
      <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 ${isPrimary ? "bg-black/5" : "bg-white/10"}`}>
        <ArrowUpRight className="w-4 h-4" />
      </div>
    </motion.button>
  );
};

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return (
    <nav className="fixed top-0 inset-x-0 z-50 flex justify-center pt-8 pointer-events-none">
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={TRANSITION}
        className={`pointer-events-auto flex items-center gap-8 px-8 py-4 rounded-full border border-white/10 backdrop-blur-2xl transition-all duration-500 ${isScrolled ? "bg-black/40 py-3" : "bg-transparent"}`}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-black rounded-sm" />
          </div>
          <span className="text-white font-black tracking-tighter text-xl">BALANCE</span>
        </div>
        <div className="hidden md:flex items-center gap-8 px-8 border-x border-white/10">
          {["Features", "Enterprise", "Pricing"].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="text-[10px] uppercase tracking-[0.3em] text-white/50 hover:text-white transition-colors">{item}</a>
          ))}
        </div>
        <Link to="/auth" className="text-[10px] uppercase tracking-[0.3em] text-white font-bold">Sign In</Link>
      </motion.div>
    </nav>
  );
};

export const EtherealLanding = () => {
  const playerRef = useRef<PlayerRef>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll → frame: the sticky section is 300vh tall, driving all TOTAL_FRAMES
  useEffect(() => {
    const onScroll = () => {
      if (!scrollRef.current || !playerRef.current) return;
      const { top, height } = scrollRef.current.getBoundingClientRect();
      const scrollable = height - window.innerHeight;
      if (scrollable <= 0) return;
      const progress = Math.max(0, Math.min(1, -top / scrollable));
      playerRef.current.seekTo(Math.floor(progress * (TOTAL_FRAMES - 1)));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="bg-[#050505] text-white font-sans selection:bg-white selection:text-black overflow-x-hidden">
      <Helmet>
        <title>BALANCE | Autonomous Workforce Infrastructure</title>
      </Helmet>

      {/* Global grain overlay — fixed, pointer-events-none, never on scrolling container */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      <Navbar />

      <main className="relative z-10">
        {/* ─── Scrollytelling Hero ─────────────────────────────────────────── */}
        {/* 300vh scroll container — sticky child pins the Player to viewport */}
        <div ref={scrollRef} style={{ height: '300vh' }} className="relative">
          <div className="sticky top-0 min-h-[100dvh] overflow-hidden">
            {/* Remotion Player — full bleed, scroll-driven, no controls */}
            <Player
              ref={playerRef}
              component={LandingVideo}
              durationInFrames={TOTAL_FRAMES}
              fps={FPS}
              compositionWidth={WIDTH}
              compositionHeight={HEIGHT}
              style={{ width: '100%', height: '100dvh', display: 'block' }}
              controls={false}
              loop={false}
              autoPlay={false}
              clickToPlay={false}
              showVolumeControls={false}
              allowFullscreen={false}
            />

            {/* Scroll hint — fades out after 2.5s */}
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ delay: 2.5, duration: 1 }}
              className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3 pointer-events-none"
            >
              <span className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold">Scroll to explore</span>
              <div className="w-px h-12 bg-gradient-to-b from-white/20 to-transparent" />
            </motion.div>
          </div>
        </div>

        {/* ─── Features Bento Grid ─────────────────────────────────────────── */}
        <section id="features" className="py-40 px-6 max-w-[1400px] mx-auto">
          <div className="grid grid-cols-12 gap-6">
            <GlassCard className="col-span-12 lg:col-span-8 h-[600px]">
              <div className="flex flex-col h-full justify-between">
                <div className="space-y-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Cpu className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-4xl font-bold tracking-tight">Neural Attendance Protocols</h3>
                  <p className="max-w-md text-white/40 leading-relaxed">
                    Zero-trust verification powered by spatial computing. Confirm presence without invading privacy,
                    using encrypted biometric hashing that never leaves the edge.
                  </p>
                </div>
                <div className="relative mt-12 flex-1 rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                </div>
              </div>
            </GlassCard>

            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              <GlassCard className="flex-1" delay={0.1}>
                <Shield className="w-8 h-8 text-purple-400 mb-6" />
                <h4 className="text-xl font-bold mb-4">Quantum Compliance</h4>
                <p className="text-sm text-white/40 leading-relaxed">Real-time synchronization with global labor laws across 140+ jurisdictions.</p>
              </GlassCard>
              <GlassCard className="flex-1" delay={0.2}>
                <Zap className="w-8 h-8 text-amber-400 mb-6" />
                <h4 className="text-xl font-bold mb-4">Hyper-Velocity Payroll</h4>
                <p className="text-sm text-white/40 leading-relaxed">Settlements in T+0. Move from monthly cycles to continuous liquidity for your team.</p>
              </GlassCard>
            </div>

            <GlassCard className="col-span-12 lg:col-span-4 h-[400px]" delay={0.3}>
              <Globe className="w-8 h-8 text-blue-400 mb-6" />
              <h4 className="text-2xl font-bold mb-4">Sovereign Identity</h4>
              <p className="text-white/40 leading-relaxed">Employees own their professional history. Portable, verified credentials.</p>
            </GlassCard>

            <GlassCard className="col-span-12 lg:col-span-8 h-[400px]" delay={0.4}>
              <div className="flex items-center justify-between">
                <div className="max-w-xs">
                  <h4 className="text-2xl font-bold mb-4">Predictive Sentiment</h4>
                  <p className="text-white/40 leading-relaxed">LLM-driven analysis of communication patterns to detect burnout 3 months before it happens.</p>
                </div>
                <div className="w-64 h-32 rounded-xl bg-white/5 border border-white/10" />
              </div>
            </GlassCard>
          </div>
        </section>

        {/* ─── CTA ─────────────────────────────────────────────────────────── */}
        <section className="py-64 flex flex-col items-center text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={TRANSITION}
            className="max-w-3xl"
          >
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-12">
              Ready to <span className="text-white/20">ascend?</span>
            </h2>
            <p className="text-white/40 text-lg mb-12">Join the elite teams building the next era of organizational excellence.</p>
            <CTAButton className="mx-auto">Get Started</CTAButton>
          </motion.div>
        </section>
      </main>

      <footer className="py-20 px-6 border-t border-white/10">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
              <div className="w-3 h-3 bg-black rounded-sm" />
            </div>
            <span className="text-white font-black tracking-tighter">BALANCE</span>
          </div>
          <div className="flex gap-12 text-[10px] uppercase tracking-[0.2em] text-white/30">
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
            <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/20">© 2026 Balance Infrastructure Group</p>
        </div>
      </footer>
    </div>
  );
};

export default EtherealLanding;
