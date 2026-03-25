import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatComposer } from "@/components/ai-chat/components/ChatComposer";
import { ChatEmptyState } from "@/components/ai-chat/components/ChatEmptyState";
import { ChatHeader } from "@/components/ai-chat/components/ChatHeader";
import { FloatingChatButton } from "@/components/ai-chat/components/FloatingChatButton";
import { MessageList } from "@/components/ai-chat/components/MessageList";
import { useAIChatController } from "@/components/ai-chat/useAIChatController";

type AIChatPanelProps = {
  initialPrompt?: string | null;
  mode?: "floating" | "embedded";
};

const AIChatPanel = ({ initialPrompt, mode = "floating" }: AIChatPanelProps) => {
  const {
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
  } = useAIChatController({ initialPrompt, mode });

  const panel = (
    <div
      className={`flex flex-col overflow-hidden border bg-card shadow-2xl ${
        isEmbedded
          ? "h-full min-h-[720px] rounded-[1.75rem]"
          : "fixed bottom-6 right-6 z-50 h-[560px] max-h-[calc(100vh-4rem)] w-[400px] max-w-[calc(100vw-2rem)] rounded-xl animate-fade-in"
      }`}
    >
      <ChatHeader
        panelTitleId={panelTitleId}
        isEmbedded={isEmbedded}
        canClear={messages.length > 0}
        onClear={clearChat}
        onClose={closePanel}
      />

      <ScrollArea
        className="flex-1 p-4"
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-labelledby={panelTitleId}
      >
        {messages.length === 0 && (
          <ChatEmptyState
            assistantIntro={assistantIntro}
            quickActions={quickActions}
            onQuickActionClick={onQuickActionClick}
          />
        )}

        <MessageList messages={messages} isLoading={isLoading} scrollRef={scrollRef} />
      </ScrollArea>

      <ChatComposer
        inputId={inputId}
        input={input}
        placeholder={placeholder}
        isSubmitDisabled={isSubmitDisabled}
        onInputChange={setInput}
        onSubmit={() => {
          void send();
        }}
      />
    </div>
  );

  return (
    <>
      <FloatingChatButton visible={!isEmbedded && !open} onClick={openFromFloatingButton} />
      {open ? panel : null}
    </>
  );
};

export default AIChatPanel;
