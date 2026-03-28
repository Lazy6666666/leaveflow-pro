import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles, ChevronLeft, MoreVertical, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const EASE_CONCIERGE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * Redesigned MobileAIChat: "The Digital Concierge"
 */
export default function MobileAIChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { id: 1, role: "agent", text: "Hello. I am your Digital Concierge. I have full visibility into your workforce telemetry. How may I assist you today?", time: "10:00 AM" }
  ]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg = { id: Date.now(), role: "user", text: input, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages([...messages, newMsg]);
    setInput("");

    // Mock response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: "agent",
        text: "I am processing your request through the neural orchestration layer. One moment please.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen bg-background font-sans">

      {/* ── CHAT HEADER ─────────────────────────── */}
      <header className="px-6 pt-12 pb-6 bg-background/80 backdrop-blur-xl sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate(-1)} className="h-10 w-10 bg-muted/50 rounded-xl flex items-center justify-center text-foreground active:scale-90 transition-all">
              <ChevronLeft size={20} />
           </button>
           <div>
              <h1 className="font-display text-lg font-bold tracking-tight">Digital Concierge</h1>
              <div className="flex items-center gap-1.5">
                 <span className="h-1 w-1 bg-emerald-500 rounded-full animate-pulse" />
                 <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Neural Node Active</span>
              </div>
           </div>
        </div>
        <button className="h-10 w-10 bg-muted/50 rounded-xl flex items-center justify-center text-foreground">
           <MoreVertical size={18} />
        </button>
      </header>

      {/* ── MESSAGES AREA ───────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 scrollbar-hide">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex flex-col",
              msg.role === 'user' ? "items-end" : "items-start"
            )}
          >
            <div className={cn(
              "max-w-[85%] p-5 rounded-[24px] text-sm leading-relaxed",
              msg.role === 'user'
                ? "terracotta-gradient text-white font-semibold shadow-lg shadow-primary/10"
                : "bg-card text-foreground shadow-float"
            )}>
              {msg.text}
            </div>
            <span className="mt-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 px-2">
              {msg.time}
            </span>
          </motion.div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* ── INPUT AREA ──────────────────────────── */}
      <div className="p-6 pb-10 bg-background/80 backdrop-blur-xl">
        <div className="bg-card shadow-float rounded-[28px] p-2 flex items-end gap-2 border-0">
           <div className="h-12 w-12 bg-muted/50 rounded-[20px] flex items-center justify-center text-primary shrink-0">
              <Sparkles size={20} />
           </div>
           <textarea
             value={input}
             onChange={(e) => setInput(e.target.value)}
             onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
             placeholder="Instruct your concierge..."
             className="flex-1 bg-transparent border-0 ring-0 focus:ring-0 text-sm p-3 resize-none h-12 scrollbar-hide"
           />
           <button
             onClick={handleSend}
             disabled={!input.trim()}
             className="h-12 w-12 terracotta-gradient rounded-[20px] flex items-center justify-center text-white shadow-lg active:scale-90 transition-all disabled:opacity-20"
           >
              <Send size={18} />
           </button>
        </div>

        <div className="mt-4 flex justify-center gap-6">
           <div className="flex items-center gap-2 opacity-30">
              <ShieldCheck size={12} />
              <span className="text-[8px] font-bold uppercase tracking-[0.2em]">Sovereign Encryption</span>
           </div>
        </div>
      </div>
    </div>
  );
}
