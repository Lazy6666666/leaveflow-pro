import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { QuickAction } from "@/components/ai-chat/types";

type ChatEmptyStateProps = {
  assistantIntro: string;
  quickActions: QuickAction[];
  onQuickActionClick: (action: QuickAction) => void;
};

export function ChatEmptyState({ assistantIntro, quickActions, onQuickActionClick }: ChatEmptyStateProps) {
  return (
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
            onClick={() => onQuickActionClick(action)}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

