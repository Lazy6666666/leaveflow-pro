/**
 * Escape a value for safe CSV output.
 * Wraps in quotes and doubles any internal quotes.
 */
export function csvEscape(value: string | number | null | undefined): string {
  const str = String(value ?? "");
  // Always quote; escape internal double quotes
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Build a full CSV string from headers and rows.
 */
export function buildCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const headerLine = headers.map(csvEscape).join(",");
  const dataLines = rows.map((row) => row.map(csvEscape).join(","));
  return [headerLine, ...dataLines].join("\n");
}

/**
 * Download a CSV string as a file.
 */
export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
