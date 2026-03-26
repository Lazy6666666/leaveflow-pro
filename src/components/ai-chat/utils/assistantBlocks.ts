import type { AssistantBlock } from "@/components/ai-chat/types";

function parseTableRow(line: string) {
  const normalized = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return normalized.split("|").map((cell) => cell.trim());
}

function isTableSeparator(line: string) {
  const normalized = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return normalized.length > 0 && normalized.split("|").every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}

export function parseAssistantBlocks(content: string): AssistantBlock[] {
  const lines = content.split("\n");
  const blocks: AssistantBlock[] = [];
  let cursor = 0;

  const pushMarkdown = (markdownLines: string[]) => {
    const markdown = markdownLines.join("\n").trim();
    if (markdown) {
      blocks.push({ type: "markdown", content: markdown });
    }
  };

  while (cursor < lines.length) {
    if (
      cursor + 1 < lines.length &&
      lines[cursor].includes("|") &&
      isTableSeparator(lines[cursor + 1])
    ) {
      const headers = parseTableRow(lines[cursor]);
      const rows: string[][] = [];
      cursor += 2;

      while (cursor < lines.length && lines[cursor].trim() && lines[cursor].includes("|")) {
        rows.push(parseTableRow(lines[cursor]));
        cursor += 1;
      }

      blocks.push({ type: "table", headers, rows });
      continue;
    }

    const markdownLines: string[] = [];
    while (
      cursor < lines.length &&
      !(
        cursor + 1 < lines.length &&
        lines[cursor].includes("|") &&
        isTableSeparator(lines[cursor + 1])
      )
    ) {
      markdownLines.push(lines[cursor]);
      cursor += 1;
    }
    pushMarkdown(markdownLines);
  }

  return blocks.length > 0 ? blocks : [{ type: "markdown", content }];
}

export function tryParseAnomalyCards(content: string): AssistantBlock | null {
  try {
    const match = content.match(/```json\\s*([\\s\\S]*?)```/);
    const raw = match ? match[1] : content;
    const parsed = JSON.parse(raw);
    if (parsed?.anomalies && Array.isArray(parsed.anomalies)) {
      return { type: "anomaly_cards", anomalies: parsed.anomalies };
    }
  } catch {
    /* not JSON */
  }
  return null;
}

