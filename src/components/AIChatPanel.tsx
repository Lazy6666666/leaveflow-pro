import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Loader2, Send, Trash2, X } from "lucide-react";
import { useAction } from "convex/react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/lib/convexApi";
import { useAuth } from "@/contexts/AuthContext";

type Msg = { role: "user" | "assistant"; content: string };
type QuickAction = { label: string; message: string };
type AssistantBlock =
  | { type: "markdown"; content: string }
  | { type: "table"; headers: string[]; rows: string[][] };

function parseTableRow(line: string) {
  const normalized = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return normalized.split("|").map((cell) => cell.trim());
}

function isTableSeparator(line: string) {
  const normalized = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return normalized.length > 0 && normalized.split("|").every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}

function parseAssistantBlocks(content: string): AssistantBlock[] {
  const lines = content.split("\n");
  const blocks: AssistantBlock[] = [];
  let cursor = 0;

  const pushMarkdown = (markdownLines: string[]) => {
    const markdown = markdownLines.join("\n").trim();
    if (markdown) {
      blocks.push({ type: "markdown", content: markdown });
    }
  };

  while (cursor < lines.length) {
    if (
      cursor + 1 < lines.length &&
      lines[cursor].includes("|") &&
      isTableSeparator(lines[cursor + 1])
    ) {
      const headers = parseTableRow(lines[cursor]);
      const rows: string[][] = [];
      cursor += 2;

      while (cursor < lines.length && lines[cursor].trim() && lines[cursor].includes("|")) {
        rows.push(parseTableRow(lines[cursor]));
        cursor += 1;
      }

      blocks.push({ type: "table", headers, rows });
      continue;
    }

    const markdownLines: string[] = [];
    while (
      cursor < lines.length &&
      !(
        cursor + 1 < lines.length &&
        lines[cursor].includes("|") &&
        isTableSeparator(lines[cursor + 1])
      )
    ) {
      markdownLines.push(lines[cursor]);
      cursor += 1;
    }
    pushMarkdown(markdownLines);
  }

  return blocks.length > 0 ? blocks : [{ type: "markdown", content }];
}

function AssistantMessage({ content }: { content: string }) {
  const blocks = useMemo(() => parseAssistantBlocks(content), [content]);

  return (
    <div className="space-y-3">
      {blocks.map((block, index) => {
        if (block.type === "table") {
          return (
            <div key={`table-${index}`} className="overflow-x-auto rounded-md border bg-background/80">
              <table className="min-w-full text-left text-xs sm:text-sm">
                <thead className="bg-background">
                  <tr>
                    {block.headers.map((header) => (
                      <th key={header} className="border-b px-3 py-2 font-medium text-foreground">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={`row-${rowIndex}`} className="border-b last:border-b-0">
                      {block.headers.map((header, cellIndex) => (
                        <td key={`${header}-${rowIndex}-${cellIndex}`} className="px-3 py-2 align-top text-muted-foreground">
                          {row[cellIndex] ?? "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        return (
          <div key={`markdown-${index}`} className="prose prose-sm max-w-none dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <ReactMarkdown>{block.content}</ReactMarkdown>
          </div>
        );
      })}
    </div>
  );
}

const AIChatPanel = () => {
  const { hasRole } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelTitleId = "leave-assistant-title";
  const inputId = "leave-assistant-input";
  const chat = useAction(api.assistant.chat);
  const isHrAdmin = hasRole("hr_admin");
  const isManager = hasRole("manager");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const quickActions = useMemo<QuickAction[]>(() => {
    const sharedActions: QuickAction[] = [
      { label: "Policy FAQ", message: "Answer a policy question about leave or remote work." },
      { label: "Check balance", message: "What is my leave balance?" },
      { label: "Bridge days", message: "Suggest smart leave days around upcoming holidays." },
    ];

    if (isHrAdmin) {
      return [
        ...sharedActions,
        { label: "Payroll report", message: "Generate a payroll report for this pay period." },
        { label: "Coverage conflicts", message: "Check for coverage conflicts for the next two weeks." },
        { label: "Audit biometrics", message: "Summarize any biometric attendance audit issues I should review." },
        { label: "Burnout check", message: "Who is at risk of burnout right now?" },
      ];
    }

    if (isManager) {
      return [
        ...sharedActions,
        { label: "Team calendar", message: "Show team leave for the next 30 days." },
        { label: "Coverage conflicts", message: "Check for coverage conflicts for my team next week." },
        { label: "Burnout check", message: "Is anyone on my team at risk of burnout?" },
        { label: "Pending approvals", message: "Show pending approvals." },
      ];
    }

    return [
      ...sharedActions,
      { label: "Burnout check", message: "Am I showing any burnout risk right now?" },
      { label: "Recent requests", message: "Show my leave history." },
      { label: "Upcoming holidays", message: "When are the upcoming holidays?" },
    ];
  }, [isHrAdmin, isManager]);

  const assistantIntro = isHrAdmin
    ? "Ask for payroll, policy, staffing, or burnout insights."
    : isManager
      ? "Ask for policy help, team coverage, approvals, or burnout insights."
      : "Ask about policy, balances, holidays, burnout risk, or leave history.";

  const placeholder = isHrAdmin
    ? "Ask about payroll, policy, staffing, or attendance insights..."
    : isManager
      ? "Ask about policy, coverage conflicts, approvals, or burnout..."
      : "Ask about policy, balances, holidays, or burnout...";

  const send = async (directText?: string) => {
    const text = (directText ?? input).trim();
    if (!text || isLoading) {
      return;
    }

    setInput("");
    const nextMessages: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setIsLoading(true);

    try {
      const response = await chat({ messages: nextMessages });
      setMessages((prev) => [...prev, { role: "assistant", content: response.message }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I could not reach the assistant service right now. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!open && (
        <Button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
          size="icon"
          aria-label="Open AI assistant"
          title="Open AI assistant"
        >
          <Bot className="h-6 w-6" />
        </Button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[560px] max-h-[calc(100vh-4rem)] w-[400px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border bg-card shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between border-b bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span id={panelTitleId} className="text-sm font-semibold">
                BALANCE AI Copilot
              </span>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-primary-foreground hover:bg-primary/80"
                  onClick={() => setMessages([])}
                  aria-label="Clear chat"
                  title="Clear chat"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary-foreground hover:bg-primary/80"
                onClick={() => setOpen(false)}
                aria-label="Close AI assistant"
                title="Close AI assistant"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea
            className="flex-1 p-4"
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
            aria-labelledby={panelTitleId}
          >
            {messages.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <Bot className="mx-auto mb-3 h-10 w-10 opacity-40" />
                <p className="font-medium">Hi! I am your BALANCE AI Copilot.</p>
                <p className="mt-1">{assistantIntro}</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {quickActions.map((action) => (
                    <Button
                      key={action.label}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs"
                      onClick={() => {
                        void send(action.message);
                      }}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div ref={scrollRef} className="space-y-4">
              {messages.map((msg, index) => (
                <div key={`${msg.role}-${index}`} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[88%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    }`}
                  >
                    {msg.role === "assistant" ? <AssistantMessage content={msg.content} /> : msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-lg bg-muted px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t bg-card p-3">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void send();
              }}
              className="flex gap-2"
            >
              <label htmlFor={inputId} className="sr-only">
                Ask the AI assistant a question
              </label>
              <Input
                id={inputId}
                name="leaveAssistantQuery"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                autoComplete="off"
                placeholder={placeholder}
              />
              <Button type="submit" size="icon" disabled={isLoading} aria-label="Send message" title="Send message">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatPanel;
