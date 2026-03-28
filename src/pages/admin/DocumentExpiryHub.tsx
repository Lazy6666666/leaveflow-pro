import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileWarning,
  Search,
  Filter,
  Download,
  AlertTriangle,
  FolderOpen,
  Bot,
  Send,
  ChevronRight,
  Paperclip,
  X,
  RotateCcw,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import { getErrorMessage } from "@/lib/errors";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ─────────────────────────────────────────────
// DESIGN SYSTEM: The Digital Concierge
// Aesthetic: Warm, Organic, Layered (No-Line)
// ─────────────────────────────────────────────

interface Doc {
  id: string;
  type: string;
  entity: string;
  expiry: string;
  status: "critical" | "warning" | "good";
  daysLeft: number;
  category: "corporate" | "employee";
}

interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: string;
}

const FALLBACK_DOCUMENTS: Doc[] = [
  { id: "1", type: "Trade License", entity: "Balance LLC", expiry: "2026-04-10", status: "critical", daysLeft: 14, category: "corporate" },
  { id: "2", type: "Employee Visa", entity: "Sarah Jenkins", expiry: "2026-05-20", status: "warning", daysLeft: 54, category: "employee" },
  { id: "3", type: "Labor Contract", entity: "Michael Chang", expiry: "2026-04-15", status: "critical", daysLeft: 19, category: "employee" },
  { id: "4", type: "Health Insurance Policy", entity: "Global Coverage", expiry: "2026-08-01", status: "good", daysLeft: 127, category: "corporate" },
  { id: "5", type: "Commercial Lease", entity: "HQ Berlin", expiry: "2026-11-30", status: "good", daysLeft: 248, category: "corporate" },
  { id: "6", type: "Work Permit", entity: "Anais Lebrun", expiry: "2026-04-28", status: "critical", daysLeft: 32, category: "employee" },
  { id: "7", type: "Indemnity Insurance", entity: "Balance Ltd.", expiry: "2026-06-15", status: "warning", daysLeft: 80, category: "corporate" },
];

const AGENT_RESPONSES: Record<string, string> = {
  default: "Scanning the compliance ledger... I've identified your query. Could you be more specific about which entity or document class you'd like me to analyze?",
  critical: "⚠ Critical findings detected: **Trade License** (Balance LLC) expires in 14 days and **Work Permit** (Anaïs Lebrun) expires in 32 days. I recommend initiating renewal workflows for both documents immediately.",
  summary: "**Compliance Summary:**\n• 🔴 Critical (<30 days): 1 record\n• 🟡 Warning (<90 days): 3 records\n• 🟢 Compliant (>90 days): 3 records\n\nOverall compliance score: **57%**.",
};

function getAgentResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("critical") || lower.includes("urgent")) return AGENT_RESPONSES.critical;
  if (lower.includes("summary") || lower.includes("status")) return AGENT_RESPONSES.summary;
  return AGENT_RESPONSES.default;
}

const EASE_CONCIERGE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const DocumentExpiryHub = () => {
  const { trackOnce } = useAnalytics();
  const [documents, setDocuments] = useState<Doc[]>(FALLBACK_DOCUMENTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | Doc["status"]>("all");
  const [agentOpen, setAgentOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      role: "agent",
      content: "Compliance Intelligence online. I have full visibility into your document expiry ledger. How can I assist with your renewal workflows today?",
      timestamp: "13:44",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    trackOnce("document_expiry_viewed", "page_view", { role: "hr_admin" });
  }, [trackOnce]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const filteredDocs = documents.filter((doc) => {
    const matchSearch =
      doc.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filterStatus === "all" || doc.status === filterStatus;
    return matchSearch && matchFilter;
  });

  const stats = {
    critical: documents.filter((d) => d.status === "critical").length,
    warning:  documents.filter((d) => d.status === "warning").length,
    good:     documents.filter((d) => d.status === "good").length,
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setMessages((prev) => [...prev, {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    }]);
    setInput("");
    setIsTyping(true);

    await new Promise((res) => setTimeout(res, 1000));

    setMessages((prev) => [...prev, {
      id: `a-${Date.now()}`,
      role: "agent",
      content: getAgentResponse(trimmed),
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    }]);
    setIsTyping(false);
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-16 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-concierge">

      {/* 01. Header Area */}
      <header className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
             <div className="h-1 w-12 terracotta-gradient rounded-full" />
             <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
               Compliance Orchestration
             </span>
          </div>
          <h1 className="text-6xl md:text-8xl font-display font-bold tracking-tighter text-foreground leading-[0.85]">
            Expiry <br />
            <span className="text-primary italic font-medium">Monitoring.</span>
          </h1>
          <p className="max-w-[55ch] text-lg text-muted-foreground leading-relaxed font-sans mt-6">
            Proactive tracking of corporate and employee legal documentation.
            The Digital Concierge ensures your organization remains within regulatory parameters.
          </p>
        </div>

        <button
          onClick={() => setAgentOpen((v) => !v)}
          className={cn(
            "group flex items-center gap-3 h-14 px-8 rounded-2xl font-bold uppercase tracking-widest text-[11px] transition-all duration-500 shadow-lg",
            agentOpen ? "terracotta-gradient text-white shadow-primary/20" : "bg-white text-primary shadow-float hover:bg-muted/30"
          )}
        >
          <Sparkles className="w-4 h-4" />
          {agentOpen ? "Deactivate Neural Node" : "Activate Compliance AI"}
        </button>
      </header>

      {/* 02. Metrics: Layers over borders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {[
          { label: "Critical Risk", value: stats.critical, color: "text-red-600", bg: "bg-red-500/5", filter: "critical" as const },
          { label: "Renewal Window", value: stats.warning, color: "text-amber-600", bg: "bg-amber-500/5", filter: "warning" as const },
          { label: "Safe Parameters", value: stats.good, color: "text-emerald-600", bg: "bg-emerald-500/5", filter: "good" as const },
        ].map((m) => (
          <button
            key={m.label}
            onClick={() => setFilterStatus((prev) => (prev === m.filter ? "all" : m.filter))}
            className={cn(
              "p-10 rounded-[32px] text-left transition-all duration-500 border-0 outline-none",
              filterStatus === m.filter ? "bg-card shadow-inner scale-[0.98]" : "bg-card shadow-float hover:-translate-y-1 hover:shadow-lg"
            )}
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground block mb-6">{m.label}</span>
            <div className={cn("text-7xl font-display font-bold tracking-tighter leading-none mb-4", m.color)}>
              {m.value}
            </div>
            <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase", m.bg, m.color)}>
               <span className={cn("h-1.5 w-1.5 rounded-full", m.value > 0 && "animate-pulse", m.value > 0 ? "bg-current" : "bg-muted-foreground/30")} />
               {m.value > 0 ? "Action Required" : "Stable"}
            </div>
          </button>
        ))}
      </div>

      {/* 03. Body Workspace */}
      <div className={cn(
        "transition-all duration-700 grid grid-cols-1 gap-12",
        agentOpen ? "xl:grid-cols-[1fr_420px]" : "xl:grid-cols-1"
      )}>
        {/* Left: Ledger Area */}
        <section className="bg-card rounded-[40px] shadow-float overflow-hidden border-0">
          <div className="p-10 space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/40" />
                <input
                  type="text"
                  placeholder="Query Compliance Ledger..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-14 bg-muted/40 border-0 text-foreground text-sm font-medium pl-14 pr-6 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40"
                />
              </div>
              <div className="flex gap-4">
                <Button variant="ghost" className="h-14 px-8 rounded-2xl bg-muted/50 text-foreground font-bold uppercase tracking-widest text-[11px] hover:bg-muted">
                  <Download className="w-4 h-4 mr-2" /> Export
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                    <th className="px-6 py-4">Classification</th>
                    <th className="px-6 py-4">Entity</th>
                    <th className="px-6 py-4">Days Left</th>
                    <th className="px-6 py-4 text-right">Operation</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} className="group transition-all hover:translate-x-1">
                      <td className="px-6 py-6 bg-muted/30 rounded-l-2xl">
                        <span className="font-display text-base font-bold text-foreground">{doc.type}</span>
                        <p className="text-[10px] font-bold uppercase text-primary/40 tracking-widest mt-1">{doc.category}</p>
                      </td>
                      <td className="px-6 py-6 bg-muted/30">
                        <span className="text-sm font-medium text-muted-foreground">{doc.entity}</span>
                      </td>
                      <td className="px-6 py-6 bg-muted/30">
                        <div className={cn(
                          "status-badge",
                          doc.status === 'critical' ? 'status-rejected' : doc.status === 'warning' ? 'status-pending' : 'status-approved'
                        )}>
                          {doc.daysLeft} Days
                        </div>
                      </td>
                      <td className="px-6 py-6 bg-muted/30 rounded-r-2xl text-right">
                        <button className="h-10 w-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-primary hover:terracotta-gradient hover:text-white transition-all">
                           <ArrowRight size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Right: Agent Sidebar */}
        <AnimatePresence>
          {agentOpen && (
            <motion.aside
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-[#171411] text-white rounded-[40px] flex flex-col h-[800px] shadow-2xl relative overflow-hidden"
            >
              <div className="p-10 border-b border-white/5 flex items-center gap-5">
                <div className="h-14 w-14 terracotta-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                   <Bot size={28} />
                </div>
                <div>
                   <h3 className="font-display text-xl font-bold">Neural Engine</h3>
                   <div className="flex items-center gap-2 mt-1">
                      <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Concierge Active</span>
                   </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                {messages.map((msg) => (
                  <div key={msg.id} className={cn("flex", msg.role === 'agent' ? "justify-start" : "justify-end")}>
                    <div className={cn(
                      "max-w-[85%] p-6 rounded-3xl text-sm leading-relaxed",
                      msg.role === 'agent' ? "bg-white/5 text-white/80" : "terracotta-gradient text-white font-semibold shadow-lg"
                    )}>
                      {msg.content}
                      <span className="block mt-4 text-[9px] font-bold uppercase tracking-widest opacity-30">{msg.timestamp}</span>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="p-8">
                <div className="bg-white/5 rounded-[24px] p-2 flex items-end gap-2 border border-white/5 focus-within:border-primary/40 transition-all">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                    placeholder="Provide instructions..."
                    className="flex-1 bg-transparent border-0 ring-0 focus:ring-0 text-sm p-4 resize-none h-14 scrollbar-hide text-white placeholder:text-white/20"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    className="h-14 w-14 terracotta-gradient rounded-2xl flex items-center justify-center text-white shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-20"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DocumentExpiryHub;
