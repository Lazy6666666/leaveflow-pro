import AIChatPanel from "@/components/AIChatPanel";

type AiPanelProps = {
  initialPrompt?: string | null;
  onClose: () => void;
  open: boolean;
};

export function AiPanel({ initialPrompt, onClose, open }: AiPanelProps) {
  if (!open) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[380px] shadow-2xl rounded-2xl overflow-hidden">
      <AIChatPanel mode="embedded" initialPrompt={initialPrompt} />
      <button
        type="button"
        className="absolute top-2 right-2 rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        onClick={onClose}
        aria-label="Close AI panel"
      >
        x
      </button>
    </div>
  );
}
