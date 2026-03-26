import { Bot, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ChatHeaderProps = {
  panelTitleId: string;
  isEmbedded: boolean;
  canClear: boolean;
  onClear: () => void;
  onClose: () => void;
};

export function ChatHeader({ panelTitleId, isEmbedded, canClear, onClear, onClose }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b bg-primary px-4 py-3 text-primary-foreground">
      <div className="flex items-center gap-2">
        <Bot className="h-5 w-5" />
        <span id={panelTitleId} className="text-sm font-semibold">
          BALANCE AI Copilot
        </span>
      </div>
      <div className="flex items-center gap-1">
        {canClear && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-primary-foreground hover:bg-primary/80"
            onClick={onClear}
            aria-label="Clear chat"
            title="Clear chat"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
        {!isEmbedded ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-primary-foreground hover:bg-primary/80"
            onClick={onClose}
            aria-label="Close AI assistant"
            title="Close AI assistant"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

