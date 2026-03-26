import { buildAssistantSystemPrompt, buildAssistantTools, MAX_ASSISTANT_TOOL_ROUNDS } from "@/lib/assistantConfig";
import { isPuterEnabled, loadPuterClient } from "@/lib/puter";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type PuterToolCall = {
  id?: string;
  function?: {
    name?: string;
    arguments?: string;
  } | null;
};

type PuterChatLoopMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | Array<{ text?: string; type?: string }> | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: PuterToolCall[];
};

type RunTool = (args: {
  argumentsText?: string;
  latestUserMessage: string;
  name: string;
}) => Promise<string>;

export type PuterChatResult =
  | {
      ok: true;
      message: string;
      source: "puter";
      sourceReason: "puter";
    }
  | {
      ok: false;
      reason:
        | "not_enabled"
        | "load_failed"
        | "auth_failed"
        | "transport_error"
        | "parse_error"
        | "rate_limited"
        | "tool_error"
        | "tool_round_exhausted";
      message?: string;
    };

function extractContent(content: unknown): string | null {
  if (typeof content === "string") {
    const trimmed = content.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (!Array.isArray(content)) {
    return null;
  }

  const text = content
    .map((part) => {
      if (typeof part === "string") {
        return part;
      }

      if (part && typeof part === "object" && "text" in part && typeof part.text === "string") {
        return part.text;
      }

      return "";
    })
    .join("\n")
    .trim();

  return text.length > 0 ? text : null;
}

function extractAssistantMessage(payload: unknown) {
  if (payload && typeof payload === "object") {
    const puterPayload = payload as {
      choices?: Array<{ message?: PuterChatLoopMessage | null }>;
      message?: PuterChatLoopMessage | null;
    };

    if (puterPayload.message) {
      return puterPayload.message;
    }

    const choiceMessage = puterPayload.choices?.[0]?.message;
    if (choiceMessage) {
      return choiceMessage;
    }
  }

  if (typeof payload === "string") {
    return { role: "assistant", content: payload } satisfies PuterChatLoopMessage;
  }

  return null;
}

function getToolCalls(message: PuterChatLoopMessage | null) {
  return Array.isArray(message?.tool_calls) ? message.tool_calls : [];
}

function createToolCallId(index: number) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `puter-tool-${Date.now()}-${index}`;
}

export async function chatWithPuter(args: {
  messages: ChatMessage[];
  roles: string[];
  runTool: RunTool;
}): Promise<PuterChatResult> {
  if (!isPuterEnabled()) {
    return { ok: false, reason: "not_enabled" };
  }

  let puter;
  try {
    puter = await loadPuterClient();
  } catch (error) {
    console.error("Failed to load Puter", error);
    return { ok: false, reason: "load_failed" };
  }

  try {
    const signedIn = await puter.auth.isSignedIn();
    if (!signedIn) {
      await puter.auth.signIn();
    }
    await puter.auth.getUser();
  } catch (error) {
    console.error("Puter authentication failed", error);
    return { ok: false, reason: "auth_failed" };
  }

  const latestUserMessage = args.messages.filter((message) => message.role === "user").at(-1)?.content ?? "";
  const loopMessages: PuterChatLoopMessage[] = [
    {
      role: "system",
      content: buildAssistantSystemPrompt(args.roles),
    },
    ...args.messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  ];
  const tools = buildAssistantTools(args.roles);

  for (let round = 0; round < MAX_ASSISTANT_TOOL_ROUNDS; round += 1) {
    let payload: unknown;
    try {
      payload = await puter.ai.chat(loopMessages, {
        temperature: 0.2,
        tools,
      });
    } catch (error) {
      console.error("Puter chat transport failed", error);
      return { ok: false, reason: "transport_error" };
    }

    const assistantMessage = extractAssistantMessage(payload);
    if (!assistantMessage) {
      return { ok: false, reason: "parse_error" };
    }

    const toolCalls = getToolCalls(assistantMessage);
    const textReply = extractContent(assistantMessage.content);
    loopMessages.push({
      role: "assistant",
      content: textReply ?? "",
      tool_calls: toolCalls,
    });

    if (toolCalls.length === 0) {
      return textReply
        ? {
            ok: true,
            message: textReply,
            source: "puter",
            sourceReason: "puter",
          }
        : { ok: false, reason: "parse_error" };
    }

    try {
      for (let index = 0; index < toolCalls.length; index += 1) {
        const toolCall = toolCalls[index];
        const name = toolCall.function?.name;
        if (!name) {
          continue;
        }

        loopMessages.push({
          role: "tool",
          name,
          tool_call_id: toolCall.id ?? createToolCallId(index),
          content: await args.runTool({
            name,
            argumentsText: toolCall.function?.arguments,
            latestUserMessage,
          }),
        });
      }
    } catch (error) {
      console.error("Puter tool execution failed", error);
      if (error instanceof Error && error.message.startsWith("RATE_LIMITED:")) {
        return {
          ok: false,
          reason: "rate_limited",
          message: error.message.slice("RATE_LIMITED:".length),
        };
      }
      return { ok: false, reason: "tool_error" };
    }
  }

  return { ok: false, reason: "tool_round_exhausted" };
}
