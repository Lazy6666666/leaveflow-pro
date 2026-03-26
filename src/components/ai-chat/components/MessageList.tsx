import type { RefObject } from "react";
import { Loader2 } from "lucide-react";
import type { Msg } from "@/components/ai-chat/types";
import { AssistantMessage } from "@/components/ai-chat/components/AssistantMessage";

type MessageListProps = {
  messages: Msg[];
  isLoading: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
};

export function MessageList({ messages, isLoading, scrollRef }: MessageListProps) {
  return (
    <div ref={scrollRef} className="space-y-4">
      {messages.map((msg, index) => (
        <div
          key={`${msg.role}-${index}`}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[88%] rounded-lg px-3 py-2 text-sm ${
              msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
            }`}
          >
            {msg.role === "assistant" ? (
              <AssistantMessage content={msg.content} source={msg.source} sourceReason={msg.sourceReason} />
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
  );
}

