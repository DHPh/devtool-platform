import { validateSafeSvg } from "@/lib/security/svg-security";
import type { ProcessorResult } from "./result";

export type JavaScriptLanguage = "javascript" | "typescript";

export async function formatJavaScript(
  input: string,
  language: JavaScriptLanguage = "javascript",
  options: { indentSize?: number; singleQuote?: boolean; semicolons?: boolean } = {},
): Promise<ProcessorResult<string>> {
  if (!input.trim()) return { ok: false, error: "Enter JavaScript or TypeScript source." };
  const indentSize = options.indentSize ?? 2;
  if (!Number.isInteger(indentSize) || indentSize < 1 || indentSize > 8) {
    return { ok: false, error: "Indent size must be from 1 to 8." };
  }
  try {
    const [prettier, estreePlugin, languagePlugin] = await Promise.all([
      import("prettier/standalone"),
      import("prettier/plugins/estree"),
      language === "typescript"
        ? import("prettier/plugins/typescript")
        : import("prettier/plugins/babel"),
    ]);
    const value = await prettier.format(input, {
      parser: language === "typescript" ? "typescript" : "babel",
      plugins: [languagePlugin, estreePlugin],
      tabWidth: indentSize,
      singleQuote: options.singleQuote ?? false,
      semi: options.semicolons ?? true,
    });
    return { ok: true, value };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Source could not be parsed." };
  }
}

function utf8ToBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function base64ToUtf8(value: string): string {
  const binary = atob(value);
  return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

export function svgToDataUri(svg: string, encoding: "percent" | "base64" = "percent"): ProcessorResult<string> {
  const validated = validateSafeSvg(svg);
  if (!validated.ok) return validated;
  const value = encoding === "base64"
    ? `data:image/svg+xml;base64,${utf8ToBase64(validated.value)}`
    : `data:image/svg+xml,${encodeURIComponent(validated.value)}`;
  return { ok: true, value };
}

export function dataUriToSvg(uri: string): ProcessorResult<string> {
  const normalized = uri.trim();
  const match = /^data:image\/svg\+xml(;charset=[^;,]+)?(;base64)?,([\s\S]*)$/i.exec(normalized);
  if (!match) return { ok: false, error: "Enter an SVG data URI." };
  try {
    const decoded = match[2] ? base64ToUtf8(match[3]) : decodeURIComponent(match[3]);
    return validateSafeSvg(decoded);
  } catch {
    return { ok: false, error: "The SVG data URI is malformed." };
  }
}

export type CssUnit = "px" | "rem" | "em" | "%" | "vw" | "vh";

export interface CssUnitContext {
  rootFontPx: number;
  elementFontPx: number;
  parentPx: number;
  viewportWidthPx: number;
  viewportHeightPx: number;
}

const DEFAULT_CONTEXT: CssUnitContext = {
  rootFontPx: 16,
  elementFontPx: 16,
  parentPx: 1200,
  viewportWidthPx: 1440,
  viewportHeightPx: 900,
};

function toPixels(value: number, unit: CssUnit, context: CssUnitContext): number {
  if (unit === "px") return value;
  if (unit === "rem") return value * context.rootFontPx;
  if (unit === "em") return value * context.elementFontPx;
  if (unit === "%") return value * context.parentPx / 100;
  if (unit === "vw") return value * context.viewportWidthPx / 100;
  return value * context.viewportHeightPx / 100;
}

export function convertCssUnit(
  value: number,
  unit: CssUnit,
  context: Partial<CssUnitContext> = {},
): ProcessorResult<Record<CssUnit, number>> {
  if (!Number.isFinite(value)) return { ok: false, error: "Enter a finite numeric value." };
  const resolved = { ...DEFAULT_CONTEXT, ...context };
  if (Object.values(resolved).some((item) => !Number.isFinite(item) || item <= 0)) {
    return { ok: false, error: "All CSS conversion context values must be positive." };
  }
  const px = toPixels(value, unit, resolved);
  return { ok: true, value: {
    px,
    rem: px / resolved.rootFontPx,
    em: px / resolved.elementFontPx,
    "%": px / resolved.parentPx * 100,
    vw: px / resolved.viewportWidthPx * 100,
    vh: px / resolved.viewportHeightPx * 100,
  } };
}

export interface ClampResult { css: string; slope: number; intercept: number }

export function createCssClamp(minPx: number, maxPx: number, minViewportPx: number, maxViewportPx: number): ProcessorResult<ClampResult> {
  if (![minPx, maxPx, minViewportPx, maxViewportPx].every(Number.isFinite)) return { ok: false, error: "All clamp values must be finite numbers." };
  if (minPx < 0 || maxPx <= minPx) return { ok: false, error: "Maximum size must be greater than minimum size." };
  if (minViewportPx <= 0 || maxViewportPx <= minViewportPx) return { ok: false, error: "Maximum viewport must be greater than minimum viewport." };
  const slope = (maxPx - minPx) / (maxViewportPx - minViewportPx) * 100;
  const intercept = minPx - slope * minViewportPx / 100;
  return { ok: true, value: { slope, intercept, css: `clamp(${minPx}px, ${Number(intercept.toFixed(4))}px + ${Number(slope.toFixed(4))}vw, ${maxPx}px)` } };
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export interface OpenGraphInput { title: string; description: string; url: string; image: string; siteName?: string; type?: string }

export function generateOpenGraphTags(input: OpenGraphInput): ProcessorResult<string> {
  if (!input.title.trim() || !input.description.trim()) return { ok: false, error: "Title and description are required." };
  for (const [name, value] of [["URL", input.url], ["Image URL", input.image]] as const) {
    try { const url = new URL(value); if (!/^https?:$/.test(url.protocol)) throw new Error(); }
    catch { return { ok: false, error: `${name} must be an absolute HTTP or HTTPS URL.` }; }
  }
  const tags: Array<[string, string]> = [
    ["og:title", input.title], ["og:description", input.description], ["og:type", input.type || "website"],
    ["og:url", input.url], ["og:image", input.image], ["twitter:card", "summary_large_image"],
    ["twitter:title", input.title], ["twitter:description", input.description], ["twitter:image", input.image],
  ];
  if (input.siteName?.trim()) tags.splice(5, 0, ["og:site_name", input.siteName]);
  return { ok: true, value: tags.map(([property, content]) => `<meta ${property.startsWith("twitter:") ? "name" : "property"}="${property}" content="${escapeAttribute(content)}">`).join("\n") };
}

export interface WebManifestInput { name: string; shortName: string; startUrl: string; display: "standalone" | "fullscreen" | "minimal-ui" | "browser"; themeColor: string; backgroundColor: string; description?: string }

export function generateWebManifest(input: WebManifestInput): ProcessorResult<string> {
  if (!input.name.trim() || !input.shortName.trim()) return { ok: false, error: "Name and short name are required." };
  if (input.shortName.length > 12) return { ok: false, error: "Short name should be 12 characters or fewer." };
  if (!input.startUrl.startsWith("/") && !/^https?:\/\//.test(input.startUrl)) return { ok: false, error: "Start URL must be root-relative or absolute." };
  if (![input.themeColor, input.backgroundColor].every((color) => /^#[0-9a-f]{6}$/i.test(color))) return { ok: false, error: "Theme and background colors must use six-digit hex notation." };
  return { ok: true, value: JSON.stringify({ name: input.name, short_name: input.shortName, description: input.description || undefined, start_url: input.startUrl, display: input.display, theme_color: input.themeColor, background_color: input.backgroundColor }, null, 2) };
}
