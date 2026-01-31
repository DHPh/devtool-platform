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
): string {
  const tokens = input.replace(/>\s+</g, "><").split(/(<\/?[^>]*>)/).filter(Boolean);
  const output: string[] = [];
  let level = 0;

  for (const token of tokens) {
    if (!token.startsWith("<")) {
      if (token.trim()) output.push(token.trim());
      continue;
    }

    const closing = token.startsWith("</");
    const voidElement = /^<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr|!doctype)/i.test(token);
    if (closing) level = Math.max(0, level - 1);
    output.push(`\n${indent.repeat(level)}${token}`);
    if (!closing && !voidElement && !token.endsWith("/>")) level += 1;
  }

  return output.join("").trim().replace(/\n\s*\n/g, "\n");
}

export function formatCss(input: string, indent = "  "): string {
  let level = 0;
  return input
    .replace(/\s*{\s*/g, " {\n")
    .replace(/;\s*/g, ";\n")
    .replace(/\s*}\s*/g, "\n}\n")
    .replace(/,\s*/g, ",\n")
    .replace(/\n\s*\n/g, "\n")
    .trim()
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.includes("}")) level = Math.max(0, level - 1);
      const result = `${indent.repeat(level)}${trimmed}`;
      if (trimmed.includes("{")) level += 1;
      return result;
    })
    .join("\n");
}

export function minifyCss(input: string): string {
  return input
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s*{\s*/g, "{")
    .replace(/;\s*/g, ";")
    .replace(/\s*}\s*/g, "}")
    .replace(/,\s*/g, ",")
    .replace(/:\s*/g, ":")
    .replace(/\s+/g, " ")
    .trim();
}

export function markdownToHtml(markdown: string): string {
  return markdown
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\n/g, "<br>");
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
  const value = email.trim();
  const valid = /^(?!\.)(?!.*\.\.)[A-Z0-9._%+-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z]{2,})+$/i.test(value) && value.length <= 254;
  return { email: value, isValid: valid };
}

export function generateUuidV4(randomBytes: Uint8Array): string {
  if (randomBytes.length !== 16) throw new Error("UUID v4 requires exactly 16 random bytes");
  const bytes = Uint8Array.from(randomBytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function generateLorem(wordCount: number): string {
  if (!Number.isInteger(wordCount) || wordCount < 1) throw new Error("Word count must be a positive integer");
  const words = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua".split(" ");
  return Array.from({ length: wordCount }, (_, index) => words[index % words.length]).join(" ");
}

export function buildQrCodeUrl(text: string, size = 256, errorLevel = "M"): string {
  if (!text) throw new Error("QR content is required");
  if (!Number.isInteger(size) || size < 64 || size > 1024) throw new Error("QR size must be between 64 and 1024");
  const query = new URLSearchParams({ size: `${size}x${size}`, data: text, ecc: errorLevel });
  return `https://api.qrserver.com/v1/create-qr-code/?${query.toString()}`;
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
