import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

type FloatingChatButtonProps = {
  visible: boolean;
  onClick: () => void;
};

export function FloatingChatButton({ visible, onClick }: FloatingChatButtonProps) {
  if (!visible) {
    return null;
  }

  return (
    <Button
      type="button"
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
      size="icon"
      aria-label="Open AI assistant"
      title="Open AI assistant"
    >
      <Bot className="h-6 w-6" />
    </Button>
  );
}

