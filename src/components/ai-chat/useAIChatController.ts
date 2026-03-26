import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/lib/convexApi";
import { useAuth } from "@/contexts/AuthContext";
import { bucketMessageLength } from "@/lib/analytics";
import { useAnalytics } from "@/hooks/useAnalytics";
import { chatWithPuter } from "@/lib/puterChat";
import type { Msg, QuickAction, AssistantSource, AssistantSourceReason, PromptRequest } from "@/components/ai-chat/types";

type UseAIChatControllerParams = {
  initialPrompt?: string | null;
  initialPromptRequest?: PromptRequest | null;
  mode: "floating" | "embedded";
};

export function useAIChatController({ initialPrompt, initialPromptRequest, mode }: UseAIChatControllerParams) {
  const { hasRole } = useAuth();
  const { track } = useAnalytics();

  const isEmbedded = mode === "embedded";
  const [open, setOpen] = useState(isEmbedded);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const panelId = useId();
  const panelTitleId = `${panelId}-title`;
  const inputId = `${panelId}-input`;

  const chat = useAction(api.assistant.chat);
  const runTool = useAction(api.assistant.runTool);

  const isHrAdmin = hasRole("hr_admin");
  const isManager = hasRole("manager");

  const lastTrackedAssistantRef = useRef<string | null>(null);
  const lastAutoPromptRef = useRef<string | null>(null);

  const providerRoles = useMemo(
    () => [
      ...(isManager ? ["manager"] : []),
      ...(isHrAdmin ? ["hr_admin"] : []),
    ],
    [isHrAdmin, isManager],
  );

  useEffect(() => {
    if (isEmbedded) {
      setOpen(true);
    }
  }, [isEmbedded]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "assistant") {
      return;
    }

    const key = `${messages.length}:${lastMessage.source ?? "system"}:${lastMessage.content}`;
    if (lastTrackedAssistantRef.current === key) {
      return;
    }

    lastTrackedAssistantRef.current = key;
    void track(
      "ai_response_rendered",
      {
        source: lastMessage.source ?? "system",
        intent: lastMessage.sourceReason ?? null,
        mode,
        message_count_in_session: messages.length,
      },
      { surface: isEmbedded ? "ai_workspace" : "app" },
    );
  }, [isEmbedded, messages, mode, track]);

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

  const send = useCallback(async (directText?: string) => {
    const text = (directText ?? input).trim();
    if (!text || isLoading) {
      return;
    }

    setInput("");
    const nextMessages: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setIsLoading(true);
    void track(
      "ai_prompt_sent",
      {
        mode,
        prompt_source: directText ? "quick_action" : "manual",
        message_length_bucket: bucketMessageLength(text.length),
      },
      { surface: isEmbedded ? "ai_workspace" : "app" },
    );

    try {
      const puterResponse = await chatWithPuter({
        messages: nextMessages,
        roles: providerRoles,
        runTool: async ({ name, argumentsText, latestUserMessage }) => {
          const response = await runTool({ name, argumentsText, latestUserMessage });
          if (!response.ok) {
            throw new Error(`RATE_LIMITED:${response.message}`);
          }
          return response.content;
        },
      });

      if (puterResponse.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: puterResponse.message,
            source: puterResponse.source as AssistantSource | undefined,
            sourceReason: puterResponse.sourceReason as AssistantSourceReason | undefined,
          },
        ]);
        return;
      } else if ("reason" in puterResponse && puterResponse.reason === "rate_limited") {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              puterResponse.message ??
              "Too many assistant requests in a short period. Please try again shortly.",
            source: "system",
            sourceReason: "rate_limited",
          },
        ]);
        return;
      }

      const response = await chat({ messages: nextMessages });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.message,
          source: (response.source as AssistantSource | undefined) ?? "system",
          sourceReason: response.sourceReason as AssistantSourceReason | undefined,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I could not reach the assistant service right now. Please try again.",
          source: "system",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [chat, input, isEmbedded, isLoading, messages, mode, providerRoles, runTool, track]);

  useEffect(() => {
    const prompt = initialPromptRequest?.prompt ?? initialPrompt;
    const requestKey = initialPromptRequest?.id ?? initialPrompt;

    if (!open || !prompt || !requestKey) {
      return;
    }
    if (lastAutoPromptRef.current === requestKey) {
      return;
    }
    lastAutoPromptRef.current = requestKey;
    void send(prompt);
  }, [initialPrompt, initialPromptRequest, open, send]);

  useEffect(() => {
    if (!initialPrompt && !initialPromptRequest) {
      lastAutoPromptRef.current = null;
    }
  }, [initialPrompt, initialPromptRequest]);

  const isSubmitDisabled = isLoading || input.trim().length === 0;

  const clearChat = () => setMessages([]);
  const closePanel = () => setOpen(false);

  const openFromFloatingButton = () => {
    setOpen(true);
    void track(
      "ai_panel_opened",
      {
        mode,
        entry_point: "floating_button",
      },
      { surface: "app" },
    );
  };

  const onQuickActionClick = (action: QuickAction) => {
    void track(
      "ai_quick_action_clicked",
      {
        label: action.label,
        mode,
      },
      { surface: isEmbedded ? "ai_workspace" : "app" },
    );
    void send(action.message);
  };

  return {
    isEmbedded,
    open,
    messages,
    input,
    isLoading,
    scrollRef,
    panelTitleId,
    inputId,
    assistantIntro,
    placeholder,
    quickActions,
    isSubmitDisabled,
    setInput,
    send,
    clearChat,
    closePanel,
    openFromFloatingButton,
    onQuickActionClick,
  };
}
