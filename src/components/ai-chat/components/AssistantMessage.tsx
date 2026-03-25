import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import type { AssistantSource, AssistantSourceReason } from "@/components/ai-chat/types";
import { parseAssistantBlocks } from "@/components/ai-chat/utils/assistantBlocks";
import { getFallbackReasonLabel } from "@/components/ai-chat/utils/fallbackReasonLabel";

type AssistantMessageProps = {
  content: string;
  source?: AssistantSource;
  sourceReason?: AssistantSourceReason;
};

export function AssistantMessage({ content, source, sourceReason }: AssistantMessageProps) {
  const blocks = useMemo(() => parseAssistantBlocks(content), [content]);
  const sourceLabel =
    source === "puter"
      ? "Puter AI"
      : source === "mistral"
        ? "Mistral AI"
        : source === "deterministic"
          ? "Fallback"
          : "System";

  return (
    <div className="space-y-3">
      {source ? (
        <div className="flex items-center gap-2">
          <Badge
            variant={source === "puter" || source === "mistral" ? "default" : "outline"}
            className="text-[10px] uppercase tracking-[0.16em]"
          >
            {sourceLabel}
          </Badge>
          {source === "deterministic" ? (
            <span className="text-[11px] text-muted-foreground">
              {getFallbackReasonLabel(sourceReason)}
            </span>
          ) : null}
        </div>
      ) : null}
      {blocks.map((block, index) => {
        if (block.type === "table") {
          return (
            <div key={`table-${index}`} className="overflow-x-auto rounded-md border bg-background/80">
              <table className="min-w-full text-left text-xs sm:text-sm">
                <thead className="bg-background">
                  <tr>
                    {block.headers.map((header) => (
                      <th key={header} className="border-b px-3 py-2 font-medium text-foreground">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={`row-${rowIndex}`} className="border-b last:border-b-0">
                      {block.headers.map((header, cellIndex) => (
                        <td
                          key={`${header}-${rowIndex}-${cellIndex}`}
                          className="px-3 py-2 align-top text-muted-foreground"
                        >
                          {row[cellIndex] ?? "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (block.type === "anomaly_cards") {
          return (
            <div key={`anomaly-${index}`} className="space-y-2">
              {block.anomalies.map((a, i) => (
                <div key={i} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.date}</p>
                  </div>
                  <Badge
                    variant={a.status === "late" ? "destructive" : "secondary"}
                    className="text-xs capitalize"
                  >
                    {a.hasClockOut ? a.status : "missing clock-out"}
                  </Badge>
                </div>
              ))}
            </div>
          );
        }

        return (
          <div
            key={`markdown-${index}`}
            className="prose prose-sm max-w-none dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&>p]:leading-7 [&_li]:my-1.5 [&_ol]:pl-5 [&_ul]:pl-5"
          >
            <ReactMarkdown>{block.content}</ReactMarkdown>
          </div>
        );
      })}
    </div>
  );
}

