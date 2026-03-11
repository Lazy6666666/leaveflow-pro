import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, Trash2, X } from "lucide-react";
import { useAction } from "convex/react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/lib/convexApi";
import { useAuth } from "@/contexts/AuthContext";

type Msg = { role: "user" | "assistant"; content: string };

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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const quickActions = [
    { label: "Check balance", message: "What is my leave balance?" },
    { label: "Upcoming holidays", message: "When are the upcoming holidays?" },
    { label: "Recent requests", message: "Show my leave history" },
    { label: "Smart suggestions", message: "Suggest smart leave days" },
    ...(hasRole("manager") || hasRole("hr_admin")
      ? [
          { label: "Pending approvals", message: "Show pending approvals" },
          { label: "Team calendar", message: "Show team leave" },
        ]
      : []),
  ];

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
          aria-label="Open leave assistant"
          title="Open leave assistant"
        >
          <Bot className="h-6 w-6" />
        </Button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[520px] max-h-[calc(100vh-4rem)] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border bg-card shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between border-b bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span id={panelTitleId} className="text-sm font-semibold">
                Leave Assistant
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
                aria-label="Close leave assistant"
                title="Close leave assistant"
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
                <p className="font-medium">Hi! I can answer leave questions from BALANCE.</p>
                <p className="mt-1">Try one of these:</p>
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
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
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
                Ask the leave assistant a question
              </label>
              <Input
                id={inputId}
                name="leaveAssistantQuery"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                autoComplete="off"
                placeholder="Ask about balances, holidays, or leave history..."
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
