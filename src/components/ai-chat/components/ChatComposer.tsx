import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ChatComposerProps = {
  inputId: string;
  input: string;
  placeholder: string;
  isSubmitDisabled: boolean;
  onInputChange: (next: string) => void;
  onSubmit: () => void;
};

export function ChatComposer({
  inputId,
  input,
  placeholder,
  isSubmitDisabled,
  onInputChange,
  onSubmit,
}: ChatComposerProps) {
  return (
    <div className="border-t bg-card p-3">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
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
          onChange={(event) => onInputChange(event.target.value)}
          autoComplete="off"
          placeholder={placeholder}
        />
        <Button type="submit" size="icon" disabled={isSubmitDisabled} aria-label="Send message" title="Send message">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

