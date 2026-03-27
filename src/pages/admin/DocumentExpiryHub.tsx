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
} from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import { getErrorMessage } from "@/lib/errors";
import { toast } from "sonner";

// ─────────────────────────────────────────────
// DESIGN SYSTEM CONSTANTS
// Vibe: Ethereal Glass (SaaS / AI / Tech)
// Layout: Editorial Split (data table left, AI panel right) → Bento stack on mobile
// Motion: Fluid Dynamics — custom cubic-bezier(0.32, 0.72, 0, 1)
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
  { id: "1", type: "Trade License", entity: "Leaveflow LLC", expiry: "2026-04-10", status: "critical", daysLeft: 14, category: "corporate" },
  { id: "2", type: "Employee Visa", entity: "Sarah Jenkins", expiry: "2026-05-20", status: "warning", daysLeft: 54, category: "employee" },
  { id: "3", type: "Labor Contract", entity: "Michael Chang", expiry: "2026-04-15", status: "critical", daysLeft: 19, category: "employee" },
  { id: "4", type: "Health Insurance Policy", entity: "Global Coverage", expiry: "2026-08-01", status: "good", daysLeft: 127, category: "corporate" },
  { id: "5", type: "Commercial Lease", entity: "HQ Berlin", expiry: "2026-11-30", status: "good", daysLeft: 248, category: "corporate" },
  { id: "6", type: "Work Permit", entity: "Anais Lebrun", expiry: "2026-04-28", status: "critical", daysLeft: 32, category: "employee" },
  { id: "7", type: "Indemnity Insurance", entity: "Leaveflow Ltd.", expiry: "2026-06-15", status: "warning", daysLeft: 80, category: "corporate" },
];

const AGENT_RESPONSES: Record<string, string> = {
  default: "Scanning the compliance ledger... I've identified your query. Could you be more specific about which entity or document class you'd like me to analyze?",
  critical: "⚠ Critical findings detected: **Trade License** (Leaveflow LLC) expires in 14 days and **Work Permit** (Anaïs Lebrun) expires in 32 days. I recommend initiating renewal workflows for both documents immediately. Shall I draft the renewal notifications?",
  visa: "I found **1 visa** at warning status: **Sarah Jenkins** (Expiry: 2026-05-20, 54 days remaining). Corporate policy recommends initiating renewal 90 days prior. This document is past the optimal renewal window. Action required.",
  summary: "**Compliance Summary:**\n• 🔴 Critical (<30 days): 1 record\n• 🟡 Warning (<90 days): 3 records\n• 🟢 Compliant (>90 days): 3 records\n\nOverall compliance score: **57%** — below the 80% organizational threshold. Immediate action required on corporate and employee documents.",
  employee: "Scanning employee document pool... Found **3 employee documents** tracked:\n1. Sarah Jenkins — Visa (54 days)\n2. Michael Chang — Labor Contract (19 days ⚠)\n3. Anaïs Lebrun — Work Permit (32 days ⚠)\n\nTwo documents require urgent attention.",
  renewal: "Understood. I can generate renewal workflows for all critical documents. This will:\n1. Send automated alerts to the respective document owners\n2. Log renewal initiation in the Audit Trail\n3. Set reminder escalations at 7-day intervals\n\nShall I proceed with all **3 critical/warning** documents?",
  notify: "Notification drafts prepared. Recipients:\n• Legal Counsel (trade license)\n• HR Manager (Michael Chang, Anaïs Lebrun)\n• Finance Lead (insurance renewal)\n\nMessages will be dispatched via internal comms. Confirm to send.",
};

function getAgentResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("critical") || lower.includes("urgent") || lower.includes("expire soon")) return AGENT_RESPONSES.critical;
  if (lower.includes("visa") || lower.includes("jenkins")) return AGENT_RESPONSES.visa;
  if (lower.includes("summary") || lower.includes("overview") || lower.includes("status")) return AGENT_RESPONSES.summary;
  if (lower.includes("employee") || lower.includes("worker") || lower.includes("staff")) return AGENT_RESPONSES.employee;
  if (lower.includes("renew") || lower.includes("workflow") || lower.includes("initiate")) return AGENT_RESPONSES.renewal;
  if (lower.includes("notify") || lower.includes("send") || lower.includes("alert")) return AGENT_RESPONSES.notify;
  return AGENT_RESPONSES.default;
}

const EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];

const STATUS_CONFIG = {
  critical: { label: "Critical", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", dot: "bg-red-400 animate-pulse" },
  warning:  { label: "Warning",  color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", dot: "bg-yellow-400" },
  good:     { label: "Compliant", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", dot: "bg-emerald-400" },
};

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────

function StatusBadge({ status }: { status: Doc["status"] }) {
  const c = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 ${c.bg} border ${c.border} ${c.color} text-[10px] uppercase font-bold tracking-widest font-['JetBrains_Mono'] rounded-none`}>
      <span className={`w-1.5 h-1.5 rounded-none ${c.dot}`} />
      {c.label}
    </span>
  );
}

function AgentMessageBubble({ msg, isNew }: { msg: ChatMessage; isNew?: boolean }) {
  const isAgent = msg.role === "agent";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5, ease: EASE }}
      className={`flex ${isAgent ? "justify-start" : "justify-end"}`}
    >
      {isAgent && (
        <div className="w-7 h-7 rounded-none bg-[#e879f9]/10 border border-[#e879f9]/20 flex items-center justify-center mr-3 shrink-0 mt-1">
          <Bot className="w-3.5 h-3.5 text-[#e879f9]" />
        </div>
      )}
      <div
        className={`relative max-w-[82%] rounded-none px-4 py-3 text-sm leading-relaxed ${
          isAgent
            ? "bg-[#0d0d10] border border-white/10 text-white/80"
            : "bg-white text-black font-medium"
        }`}
      >
        {isNew && isAgent && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="absolute left-0 top-0 h-full w-[2px] bg-[#e879f9] origin-top"
          />
        )}
        {msg.content.split("\n").map((line, i) => {
          // Render bold markdown
          const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
            part.startsWith("**") && part.endsWith("**")
              ? <strong key={j} className={isAgent ? "text-white font-semibold" : "text-black"}>{part.slice(2, -2)}</strong>
              : part
          );
          return <p key={i} className={i > 0 ? "mt-1.5" : ""}>{parts}</p>;
        })}
        <span className={`block mt-2 text-[10px] font-['JetBrains_Mono'] ${isAgent ? "text-white/20" : "text-black/40"}`}>
          {msg.timestamp}
        </span>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

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
      content: "Compliance Intelligence online. I have full visibility into your document expiry ledger. Ask me to summarize critical items, identify employee risks, or trigger renewal workflows.",
      timestamp: "13:44",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [newestMsgId, setNewestMsgId] = useState<string | null>("init");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    trackOnce("document_expiry_viewed", "page_view", { role: "hr_admin" });
  }, [trackOnce]);

  useEffect(() => {
    let active = true;

    void convex.query(api.documentExpiry.listDocumentExpiryRecords, {})
      .then((records) => {
        if (!active || !records.length) {
          return;
        }

        setDocuments(records.map((record) => ({
          category: record.category,
          daysLeft: record.daysRemaining,
          entity: record.ownerName,
          expiry: record.expiryDate,
          id: record.id,
          status: record.status,
          type: record.name,
        })));
      })
      .catch((error) => {
        if (active) {
          toast.error(getErrorMessage(error, "Failed to load document expiry records"));
        }
      });

    return () => {
      active = false;
    };
  }, []);

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

  const criticalCount = documents.filter((d) => d.status === "critical").length;
  const warningCount  = documents.filter((d) => d.status === "warning").length;
  const goodCount     = documents.filter((d) => d.status === "good").length;

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    await new Promise((res) => setTimeout(res, 1200 + Math.random() * 800));

    const agentMsg: ChatMessage = {
      id: `a-${Date.now()}`,
      role: "agent",
      content: getAgentResponse(trimmed),
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    };

    setIsTyping(false);
    setMessages((prev) => [...prev, agentMsg]);
    setNewestMsgId(agentMsg.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#050505] text-white font-['Outfit'] overflow-x-hidden">

      {/* ── HEADER ─────────────────────────────────── */}
      <motion.header
        initial={{ y: -20, opacity: 0, filter: "blur(8px)" }}
        animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: EASE }}
        className="sticky top-0 z-30 bg-[#050505]/90 backdrop-blur-xl border-b border-white/5 px-6 md:px-10 py-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="inline-flex items-center gap-2.5 px-3 py-1 bg-white/5 border border-white/10 rounded-none">
            <span className="w-1.5 h-1.5 bg-yellow-400 rounded-none" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 font-['JetBrains_Mono']">Compliance Ledger</span>
          </div>
          <h1 className="text-lg font-black tracking-tight hidden md:block">Document Expiry</h1>
        </div>
        <button
          onClick={() => setAgentOpen((v) => !v)}
          className={`group flex items-center gap-2.5 px-4 py-2 border text-xs font-bold uppercase tracking-widest transition-all duration-500 rounded-none ${
            agentOpen
              ? "bg-[#e879f9]/10 border-[#e879f9]/30 text-[#e879f9]"
              : "bg-white/5 border-white/10 text-white/60 hover:border-white/30"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{agentOpen ? "Hide" : "Show"} AI Agent</span>
        </button>
      </motion.header>

      {/* ── METRICS ROW ────────────────────────────── */}
      <div className="px-6 md:px-10 pt-8 pb-6 max-w-[1600px] mx-auto grid grid-cols-3 gap-4">
        {[
          { label: "Critical", value: criticalCount, icon: AlertTriangle, color: "text-red-400", border: "border-red-400/20", bg: "bg-red-400/5", filter: "critical" as const },
          { label: "Warning",  value: warningCount,  icon: FileWarning,   color: "text-yellow-400", border: "border-yellow-400/20", bg: "bg-yellow-400/5", filter: "warning" as const },
          { label: "Compliant",value: goodCount,     icon: FolderOpen,    color: "text-emerald-400", border: "border-emerald-400/20", bg: "bg-emerald-400/5", filter: "good" as const },
        ].map((m, i) => (
          <motion.button
            key={m.label}
            onClick={() => setFilterStatus((prev) => (prev === m.filter ? "all" : m.filter))}
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.08 * i, ease: EASE }}
            className={`relative text-left p-5 border ${m.border} ${m.bg} rounded-none outline-none transition-all duration-300 group ${filterStatus === m.filter ? "ring-1 ring-white/20" : ""}`}
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40 font-['JetBrains_Mono']">{m.label}</span>
              <m.icon className={`w-4 h-4 ${m.color} opacity-60 group-hover:opacity-100 transition-opacity`} />
            </div>
            <div className={`text-5xl font-black tracking-tighter leading-none ${m.color}`}>{m.value}</div>
            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-40 transition-opacity">
              <Filter className="w-3 h-3 text-white" />
            </div>
          </motion.button>
        ))}
      </div>

      {/* ── SPLIT PANE BODY ────────────────────────── */}
      <div className={`px-6 md:px-10 pb-12 max-w-[1600px] mx-auto transition-all duration-700 ${agentOpen ? "grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6" : "grid grid-cols-1"}`}>

        {/* ── LEFT: DATA TABLE ─────────────────────── */}
        <motion.section
          layout
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
          className="p-[1px] bg-[#0a0a0c] border border-white/5 rounded-none overflow-hidden"
        >
          <div className="bg-[#131316] border border-white/10 rounded-none flex flex-col">

            {/* Table toolbar */}
            <div className="p-4 md:p-5 border-b border-white/10 flex items-center justify-between flex-wrap gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black border border-white/10 text-white text-sm pl-9 pr-4 py-2 rounded-none focus:outline-none focus:border-white/30 transition-colors font-['JetBrains_Mono'] placeholder:text-white/20"
                />
              </div>
              <div className="flex items-center gap-2">
                {filterStatus !== "all" && (
                  <button
                    onClick={() => setFilterStatus("all")}
                    className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-widest border border-white/15 text-white/50 hover:text-white hover:border-white/40 transition-all rounded-none"
                  >
                    <X className="w-3 h-3" /> Clear Filter
                  </button>
                )}
                <button className="flex items-center gap-2 px-4 py-2 bg-white text-black border border-transparent text-[10px] font-bold uppercase tracking-widest hover:bg-white/90 active:scale-95 transition-all rounded-none">
                  <Download className="w-3.5 h-3.5" /> Export
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-black/40 border-b border-white/10 font-['JetBrains_Mono'] text-white/30 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="px-5 py-3.5 font-normal">Document</th>
                    <th className="px-5 py-3.5 font-normal">Entity</th>
                    <th className="px-5 py-3.5 font-normal">Category</th>
                    <th className="px-5 py-3.5 font-normal">Expiry</th>
                    <th className="px-5 py-3.5 font-normal">Status</th>
                    <th className="px-5 py-3.5 font-normal text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence mode="popLayout">
                    {filteredDocs.map((doc, idx) => (
                      <motion.tr
                        key={doc.id}
                        layout
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        transition={{ duration: 0.35, delay: 0.04 * idx, ease: EASE }}
                        className="hover:bg-white/[0.025] transition-colors group cursor-pointer"
                      >
                        <td className="px-5 py-4">
                          <span className="font-['Outfit'] font-semibold text-white/90">{doc.type}</span>
                        </td>
                        <td className="px-5 py-4 text-white/55 font-['JetBrains_Mono'] text-xs">{doc.entity}</td>
                        <td className="px-5 py-4">
                          <span className="text-[10px] uppercase tracking-widest font-['JetBrains_Mono'] text-white/30">
                            {doc.category}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-white/80 text-sm">{doc.expiry}</span>
                            <span className="text-[10px] font-['JetBrains_Mono'] text-white/30">{doc.daysLeft}d left</span>
                          </div>
                        </td>
                        <td className="px-5 py-4"><StatusBadge status={doc.status} /></td>
                        <td className="px-5 py-4 text-right">
                          <button className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-all rounded-none">
                            Review <ChevronRight className="w-3 h-3" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>

              {filteredDocs.length === 0 && (
                <div className="p-12 text-center text-white/20 font-['JetBrains_Mono'] text-xs tracking-widest uppercase">
                  [ No records match current query ]
                </div>
              )}
            </div>

            {/* Table footer */}
            <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between text-[10px] font-['JetBrains_Mono'] text-white/25 uppercase tracking-widest">
              <span>{filteredDocs.length} of {MOCK_DOCUMENTS.length} records</span>
              <span>Updated · Just now</span>
            </div>
          </div>
        </motion.section>

        {/* ── RIGHT: AI AGENT PANEL ─────────────────── */}
        <AnimatePresence>
          {agentOpen && (
            <motion.aside
              key="agent-panel"
              initial={{ opacity: 0, x: 40, filter: "blur(8px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: 40, filter: "blur(8px)" }}
              transition={{ duration: 0.55, ease: EASE }}
              className="p-[1px] bg-gradient-to-b from-[#e879f9]/10 to-transparent border border-[#e879f9]/15 rounded-none flex flex-col xl:sticky xl:top-20"
              style={{ height: "calc(100vh - 220px)" }}
            >
              <div className="relative bg-[#0a0208] border border-[#e879f9]/10 rounded-none flex flex-col h-full overflow-hidden">

                {/* Agent Header */}
                <div className="px-5 py-4 border-b border-[#e879f9]/10 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#e879f9]/10 border border-[#e879f9]/20 rounded-none flex items-center justify-center">
                      <Bot className="w-4 h-4 text-[#e879f9]" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Compliance Agent</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-none animate-pulse" />
                        <span className="text-[10px] font-['JetBrains_Mono'] text-white/30 uppercase tracking-widest">Online · RBAC: hr_admin</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setMessages([{
                        id: "init-reset",
                        role: "agent",
                        content: "Session reset. Compliance Intelligence re-initialized. How can I assist?",
                        timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
                      }]);
                      setNewestMsgId("init-reset");
                    }}
                    className="p-1.5 text-white/25 hover:text-white/70 transition-colors rounded-none"
                    title="Reset chat"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Suggested prompts */}
                <div className="px-4 pt-3 pb-2 flex gap-2 flex-wrap shrink-0 border-b border-white/5">
                  {["Give me a summary", "Show critical items", "Draft renewal workflow", "Check employee visas"].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => {
                        setInput(prompt);
                        inputRef.current?.focus();
                      }}
                      className="text-[10px] font-['JetBrains_Mono'] uppercase tracking-wider px-2.5 py-1 bg-white/5 border border-white/10 text-white/40 hover:text-white/80 hover:border-white/30 transition-all rounded-none"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
                  {messages.map((msg) => (
                    <AgentMessageBubble key={msg.id} msg={msg} isNew={msg.id === newestMsgId} />
                  ))}

                  {/* Typing indicator */}
                  <AnimatePresence>
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3, ease: EASE }}
                        className="flex items-center gap-3"
                      >
                        <div className="w-7 h-7 rounded-none bg-[#e879f9]/10 border border-[#e879f9]/20 flex items-center justify-center shrink-0">
                          <Bot className="w-3.5 h-3.5 text-[#e879f9]" />
                        </div>
                        <div className="flex items-center gap-1.5 px-4 py-3 bg-[#0d0d10] border border-white/10 rounded-none">
                          {[0, 150, 300].map((delay) => (
                            <motion.span
                              key={delay}
                              className="w-1.5 h-1.5 bg-[#e879f9]/60 rounded-none"
                              animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                              transition={{ duration: 0.9, repeat: Infinity, delay: delay / 1000, ease: "easeInOut" }}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="shrink-0 px-4 pb-4 pt-2 border-t border-white/5">
                  <div className="p-[1px] bg-gradient-to-r from-[#e879f9]/20 via-white/5 to-transparent rounded-none">
                    <div className="bg-[#0d0d10] border border-transparent rounded-none flex items-end gap-3 px-4 py-3">
                      <button
                        aria-label="Attach file"
                        className="text-white/20 hover:text-white/60 transition-colors shrink-0 mb-0.5"
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>
                      <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask the compliance agent..."
                        rows={1}
                        className="flex-1 bg-transparent text-sm text-white/80 placeholder:text-white/20 resize-none focus:outline-none font-['Outfit'] leading-relaxed max-h-[80px] overflow-y-auto"
                      />
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => void sendMessage()}
                        disabled={!input.trim() || isTyping}
                        className="w-8 h-8 rounded-none bg-[#e879f9] flex items-center justify-center shrink-0 transition-opacity disabled:opacity-30 hover:bg-[#e879f9]/80 active:scale-95"
                      >
                        <Send className="w-3.5 h-3.5 text-black" />
                      </motion.button>
                    </div>
                  </div>
                  <p className="text-[10px] font-['JetBrains_Mono'] text-white/15 text-center mt-2 uppercase tracking-widest">
                    RBAC-guarded · HR Admin scope
                  </p>
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
