import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ServerCrash,
  Activity,
  ShieldAlert,
  Bot,
  TerminalSquare,
  Network,
  Cpu,
  Zap,
  LockKeyhole,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Redesigned AgentWorkspaceHub: "The Digital Concierge"
 * Aesthetic: Warm command center, tactile nodes, organic depth.
 */
const AgentWorkspaceHub = () => {
  const { trackOnce } = useAnalytics();
  const [activeNode, setActiveNode] = useState<string | null>("core_routing");

  React.useEffect(() => {
    trackOnce("agent_workspace_viewed", "page_view", { role: "hr_admin" });
  }, [trackOnce]);

  const agentNodes = [
    { id: "core_routing", name: "Core Routing Engine", status: "Optimal", load: "24%", icon: Cpu, type: "primary" },
    { id: "trust_validator", name: "Trust Validation Protocol", status: "Active", load: "89%", icon: ShieldAlert, type: "security" },
    { id: "compliance_sync", name: "Global Compliance Sync", status: "Deploying", load: "41%", icon: Network, type: "background" },
  ];

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground px-6 py-12 md:px-12 md:py-20 selection:bg-primary/20 selection:text-primary font-sans overflow-x-hidden animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-concierge">

      {/* Editorial Header */}
      <motion.header
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="mb-20 max-w-[1400px] mx-auto"
      >
        <div className="flex items-center gap-3 mb-6">
           <div className="h-1 w-12 terracotta-gradient rounded-full" />
           <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
             Autonomous Orchestration
           </span>
        </div>

        <h1 className="text-6xl md:text-8xl font-display font-bold tracking-tighter leading-[0.85] text-foreground mb-8">
          Neural <br />
          <span className="text-primary italic font-medium">Control.</span>
        </h1>

        <p className="text-xl font-normal text-muted-foreground max-w-2xl leading-relaxed">
          Monitor and direct the deterministic neural architecture parsing global workforce telemetry.
          The Digital Concierge parses 4,203 active data points in real-time.
        </p>
      </motion.header>

      {/* Layered Workspace Grid: No lines, just depth */}
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-10">

        {/* Main Terminal: Deep Layering */}
        <motion.section
          className="md:col-span-8 bg-card p-10 md:p-16 rounded-3xl shadow-float relative overflow-hidden group border-0"
        >
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(175,100,45,0.03),transparent_70%)] pointer-events-none group-hover:scale-110 transition-transform duration-1000" />

          <div className="flex justify-between items-start mb-16 relative z-10">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground block mb-2">Internal Diagnostics</span>
              <h2 className="font-display text-3xl font-bold text-foreground">Active Intelligence</h2>
            </div>
            <div className="h-12 w-12 flex items-center justify-center bg-muted/50 rounded-2xl text-primary">
               <TerminalSquare className="w-6 h-6" />
            </div>
          </div>

          <div className="space-y-6 font-mono text-xs text-muted-foreground relative z-10">
            <div className="flex gap-5 p-4 rounded-xl hover:bg-muted/30 transition-all">
              <span className="text-primary font-bold">[14:02:44]</span>
              <span className="text-foreground font-bold">INFER:</span>
              <span>Parsing 4,203 active leave policies against regulatory baseline...</span>
            </div>
            <div className="flex gap-5 p-4 rounded-xl bg-emerald-500/5 text-emerald-700 transition-all">
              <span className="text-primary font-bold">[14:02:45]</span>
              <span className="font-bold">OK:</span>
              <span>Trust Validation complete for batch req_8842x</span>
            </div>
            <div className="flex gap-5 p-4 rounded-xl bg-amber-500/5 text-amber-700 transition-all">
              <span className="text-primary font-bold">[14:02:47]</span>
              <span className="font-bold">WARN:</span>
              <span>Anomaly detected in attendance cluster EU-West. Queueing review.</span>
            </div>
            <div className="flex gap-5 p-4 rounded-xl opacity-40 transition-all">
              <span className="text-primary font-bold">[14:02:48]</span>
              <span className="text-foreground font-bold">SYNC:</span>
              <span>Awaiting pipeline... <span className="animate-pulse">_</span></span>
            </div>
          </div>
        </motion.section>

        {/* Side Panel: Auxiliary Monitors */}
        <div className="md:col-span-4 space-y-10">
           {/* Global Topology */}
           <motion.section
             className="bg-muted/40 p-10 rounded-3xl flex flex-col justify-between hover:bg-muted/60 transition-all duration-500 border-0"
           >
             <div className="flex justify-between items-center mb-10">
               <h3 className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Network Status</h3>
               <Activity className="text-emerald-500 w-5 h-5" />
             </div>
             <div>
               <div className="flex items-end gap-2 mb-3">
                 <span className="font-display text-6xl font-bold leading-none text-foreground">99.9</span>
                 <span className="text-xs font-bold text-primary uppercase tracking-widest mb-1">%</span>
               </div>
               <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Environment Integrated</p>
             </div>
           </motion.section>

           {/* Predictive Anomaly */}
           <motion.section
             className="bg-card p-10 rounded-3xl shadow-float flex flex-col justify-between border-0"
           >
             <div className="flex justify-between items-center mb-10">
               <h3 className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">Neural Health</h3>
               <Zap className="text-primary w-5 h-5" />
             </div>
             <div>
               <div className="w-full h-2 bg-muted rounded-full mb-6 overflow-hidden">
                 <motion.div
                   initial={{ width: 0 }}
                   animate={{ width: "14%" }}
                   className="h-full terracotta-gradient rounded-full"
                 />
               </div>
               <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">14% Delta in Q3 Forecasting</p>
             </div>
           </motion.section>
        </div>

        {/* Node Controllers: The "Concierge" Interactive Layer */}
        <motion.section
          className="md:col-span-12 bg-white p-12 md:p-20 rounded-[40px] shadow-float border-0 mt-10 relative overflow-hidden"
        >
          {/* Mascot Integration Moment (Placeholder Decoration) */}
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-primary/5 rounded-full blur-[80px]" />
          <div className="absolute top-10 right-10 opacity-10">
             <Bot size={120} className="text-primary" />
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 relative z-10">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">System Command</span>
              <h2 className="font-display text-4xl font-bold text-foreground">Orchestration Nodes</h2>
            </div>
            <Button className="mt-8 md:mt-0 rounded-2xl terracotta-gradient text-white h-16 px-10 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 border-0">
              <span className="text-xs uppercase font-bold tracking-[0.2em]">Deploy Capacity</span>
              <ArrowRight className="w-5 h-5 ml-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {agentNodes.map((node) => (
              <div
                key={node.id}
                onClick={() => setActiveNode(node.id)}
                className={cn(
                  "cursor-pointer p-8 transition-all duration-500 rounded-3xl flex flex-col gap-10 group",
                  activeNode === node.id
                    ? "bg-muted shadow-inner"
                    : "bg-muted/30 hover:bg-muted/50"
                )}
              >
                <div className="flex justify-between items-start">
                  <div className={cn(
                    "p-5 rounded-2xl transition-all duration-500",
                    activeNode === node.id ? "terracotta-gradient text-white shadow-lg" : "bg-white text-primary"
                  )}>
                    <node.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">{node.load} Load</span>
                </div>
                <div>
                  <h4 className="font-display text-xl font-bold mb-3 text-foreground">{node.name}</h4>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      activeNode === node.id ? "bg-primary animate-pulse" : "bg-muted-foreground/30"
                    )} />
                    <span className="text-[10px] uppercase font-bold tracking-widest text-primary">{node.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

      </div>
    </div>
  );
};


export default AgentWorkspaceHub;
