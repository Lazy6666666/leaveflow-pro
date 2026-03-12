#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function usage() {
  console.error("Usage: npm run mistral:ocr -- <input-file> [output-file]");
  process.exit(1);
}

const [, , inputPath, outputPathArg] = process.argv;
if (!inputPath) {
  usage();
}

const apiKey = process.env.MISTRAL_API_KEY;
if (!apiKey) {
  console.error("Missing MISTRAL_API_KEY");
  process.exit(1);
}

const source = path.resolve(inputPath);
const extension = path.extname(source).toLowerCase();
const mimeType = extension === ".pdf"
  ? "application/pdf"
  : extension === ".png"
    ? "image/png"
    : extension === ".jpg" || extension === ".jpeg"
      ? "image/jpeg"
      : "application/octet-stream";

const bytes = await readFile(source);
const dataUrl = `data:${mimeType};base64,${bytes.toString("base64")}`;

const response = await fetch("https://api.mistral.ai/v1/ocr", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  body: JSON.stringify({
    model: "mistral-ocr-latest",
    document: mimeType === "application/pdf"
      ? {
          type: "document_url",
          document_url: dataUrl,
        }
      : {
          type: "image_url",
          image_url: dataUrl,
        },
  }),
});

if (!response.ok) {
  console.error(await response.text());
  process.exit(1);
}

const payload = await response.json();
const markdown = (payload?.pages ?? [])
  .map((page) => page?.markdown ?? "")
  .filter(Boolean)
  .join("\n\n");

if (!markdown) {
  console.error("No markdown content returned by Mistral OCR");
  process.exit(1);
}

const outputPath = outputPathArg
  ? path.resolve(outputPathArg)
  : path.join(path.dirname(source), `${path.basename(source, path.extname(source))}.md`);

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${markdown}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      input: source,
      output: outputPath,
      pages: Array.isArray(payload?.pages) ? payload.pages.length : 0,
    },
    null,
    2,
  ),
);
