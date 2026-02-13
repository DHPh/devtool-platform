import { renderMarkdownToSafeHtml } from "@/lib/markdown/markdown-renderer";
import { validateEmailSyntax } from "./email";
import { formatCssSource, formatHtmlSource, minifyCssSource } from "./source-formatters";

export interface TextStatistics {
  words: number;
  characters: number;
  charactersWithoutSpaces: number;
  lines: number;
  paragraphs: number;
}

export function formatHtml(
  input: string,
  indent = "  ",
): Promise<string> {
  return formatHtmlSource(input, { indentSize: indent === "\t" ? 2 : indent.length, useTabs: indent === "\t" });
}

export function formatCss(input: string, indent = "  "): Promise<string> {
  return formatCssSource(input, { indentSize: indent === "\t" ? 2 : indent.length, useTabs: indent === "\t" });
}

export function minifyCss(input: string): string {
  return minifyCssSource(input);
}

export function markdownToHtml(markdown: string): string {
  return renderMarkdownToSafeHtml(markdown);
}

export function countText(input: string): TextStatistics {
  const trimmed = input.trim();
  return {
    words: trimmed ? trimmed.split(/\s+/).length : 0,
    characters: input.length,
    charactersWithoutSpaces: input.replace(/\s/g, "").length,
    lines: input ? input.split(/\r?\n/).length : 0,
    paragraphs: trimmed ? trimmed.split(/\n\s*\n/).filter(Boolean).length : 0,
  };
}

export function diffLines(left: string, right: string) {
  const a = left.split(/\r?\n/);
  const b = right.split(/\r?\n/);
  const length = Math.max(a.length, b.length);
  return Array.from({ length }, (_, index) => ({
    line: index + 1,
    left: a[index] ?? null,
    right: b[index] ?? null,
    equal: a[index] === b[index],
  }));
}

const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function encodeHtmlEntities(input: string): string {
  return input.replace(/[&<>"']/g, (value) => HTML_ENTITIES[value]);
}

export function decodeHtmlEntities(input: string): string {
  const named = Object.fromEntries(Object.entries(HTML_ENTITIES).map(([key, value]) => [value, key]));
  return input.replace(/&#x([\da-f]+);|&#(\d+);|&(amp|lt|gt|quot);/gi, (entity, hex, decimal) => {
    if (hex) return String.fromCodePoint(Number.parseInt(hex, 16));
    if (decimal) return String.fromCodePoint(Number.parseInt(decimal, 10));
    return named[entity.toLowerCase()] ?? entity;
  });
}

export function validateEmail(email: string) {
  return validateEmailSyntax(email);
}

export function timestampToIso(value: number, unit: "seconds" | "milliseconds" = "seconds"): string {
  const date = new Date(unit === "seconds" ? value * 1000 : value);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid timestamp");
  return date.toISOString();
}

export function dateToTimestamp(value: string | Date, unit: "seconds" | "milliseconds" = "seconds"): number {
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  if (Number.isNaN(time)) throw new Error("Invalid date");
  return unit === "seconds" ? Math.floor(time / 1000) : time;
}

export function pickWheelItem<T>(items: readonly T[], randomValue: number): T {
  if (items.length === 0) throw new Error("At least one wheel item is required");
  if (randomValue < 0 || randomValue >= 1) throw new Error("Random value must be in [0, 1)");
  return items[Math.floor(randomValue * items.length)];
}

export function calculateImageSize(width: number, height: number, targetWidth: number) {
  if ([width, height, targetWidth].some((value) => !Number.isFinite(value) || value <= 0)) {
    throw new Error("Image dimensions must be positive numbers");
  }
  return { width: Math.round(targetWidth), height: Math.round((height / width) * targetWidth) };
}

export function iconPackManifest(platform: "android" | "ios") {
  return platform === "android"
    ? [48, 72, 96, 144, 192].map((size) => ({ size, filename: `mipmap-${size}/ic_launcher.png` }))
    : [20, 29, 40, 60, 76, 83.5, 1024].map((size) => ({ size, filename: `icon-${size}.png` }));
}
