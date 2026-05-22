import { XMLParser, XMLValidator } from "fast-xml-parser";

export type SvgValidationResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

const SAFE_ELEMENTS = new Set([
  "circle",
  "clipPath",
  "defs",
  "desc",
  "ellipse",
  "g",
  "line",
  "linearGradient",
  "marker",
  "mask",
  "path",
  "pattern",
  "polygon",
  "polyline",
  "radialGradient",
  "rect",
  "stop",
  "svg",
  "symbol",
  "text",
  "title",
  "tspan",
]);

const SAFE_ATTRIBUTES = new Set([
  "class",
  "clip-path",
  "clip-rule",
  "color",
  "cx",
  "cy",
  "d",
  "display",
  "dominant-baseline",
  "dx",
  "dy",
  "fill",
  "fill-opacity",
  "fill-rule",
  "focusable",
  "font-family",
  "font-size",
  "font-weight",
  "gradientTransform",
  "gradientUnits",
  "height",
  "id",
  "isolation",
  "lengthAdjust",
  "letter-spacing",
  "marker-end",
  "marker-mid",
  "marker-start",
  "mask",
  "mix-blend-mode",
  "offset",
  "opacity",
  "overflow",
  "paint-order",
  "patternContentUnits",
  "patternTransform",
  "patternUnits",
  "points",
  "preserveAspectRatio",
  "r",
  "role",
  "rx",
  "ry",
  "shape-rendering",
  "spreadMethod",
  "stop-color",
  "stop-opacity",
  "stroke",
  "stroke-dasharray",
  "stroke-dashoffset",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-opacity",
  "stroke-width",
  "text-anchor",
  "text-decoration",
  "textLength",
  "transform",
  "vector-effect",
  "version",
  "viewBox",
  "visibility",
  "width",
  "word-spacing",
  "x",
  "x1",
  "x2",
  "y",
  "y1",
  "y2",
]);

const LOCAL_REFERENCE_PATTERN = /^url\(\s*#[A-Za-z_][\w:.-]*\s*\)$/;
const ACTIVE_VALUE_PATTERN =
  /(?:javascript|vbscript|data|https?|file|blob)\s*:|(?:^|[\s"'(])\/\//i;
const SAFE_DATA_OR_ARIA_ATTR = /^(?:aria|data)-[a-z0-9-]+$/i;
const parser = new XMLParser({
  ignoreAttributes: false,
  preserveOrder: true,
  processEntities: false,
});

function reject(error: string): SvgValidationResult {
  return { ok: false, error };
}

function validateAttributes(attributes: unknown): string | null {
  if (!attributes || typeof attributes !== "object") return null;

  for (const [rawName, rawValue] of Object.entries(attributes)) {
    const name = rawName.replace(/^@_/, "");
    const value = String(rawValue);
    if (name === "xmlns") {
      if (value !== "http://www.w3.org/2000/svg") {
        return "SVG namespaces other than the standard SVG namespace are not allowed.";
      }
      continue;
    }
    if (name === "xmlns:xlink") {
      if (value !== "http://www.w3.org/1999/xlink") {
        return "SVG namespaces other than the standard XLink namespace are not allowed.";
      }
      continue;
    }
    if (name === "xml:space") {
      if (value !== "preserve" && value !== "default") {
        return `SVG attribute "${name}" has an invalid value.`;
      }
      continue;
    }
    const isAllowedName =
      !name.includes(":") &&
      !/^on/i.test(name) &&
      (SAFE_ATTRIBUTES.has(name) || SAFE_DATA_OR_ARIA_ATTR.test(name));
    if (!isAllowedName) {
      return `SVG attribute "${name}" is not allowed.`;
    }
    if (
      /url\s*\(/i.test(value) &&
      !LOCAL_REFERENCE_PATTERN.test(value.trim())
    ) {
      return `SVG attribute "${name}" may only reference an element in the same document.`;
    }
    if (ACTIVE_VALUE_PATTERN.test(value)) {
      return `SVG attribute "${name}" contains an external or active URL.`;
    }
  }
  return null;
}

function validateNodes(nodes: unknown): string | null {
  if (!Array.isArray(nodes)) return "SVG markup could not be parsed.";

  for (const node of nodes) {
    if (!node || typeof node !== "object") continue;
    const record = node as Record<string, unknown>;
    const attributeError = validateAttributes(record[":@"]);
    if (attributeError) return attributeError;

    for (const [name, children] of Object.entries(record)) {
      if (name === ":@" || name === "#text" || name === "#comment") continue;
      if (!SAFE_ELEMENTS.has(name)) {
        return `SVG element <${name}> is not allowed.`;
      }
      const childError = validateNodes(children);
      if (childError) return childError;
    }
  }
  return null;
}

export function validateSafeSvg(input: string): SvgValidationResult {
  const raw = input.trim();
  if (/<!DOCTYPE|<!ENTITY|<\?xml-stylesheet/i.test(raw)) {
    return reject("SVG document types, entities, and stylesheets are not allowed.");
  }
  const normalized = raw
    .replace(/^<\?xml\s+[^?]*\?>\s*/i, "")
    .replace(/^(?:<!--[\s\S]*?-->\s*)*/, "")
    .replace(/(?:\s*<!--[\s\S]*?-->)*$/, "")
    .trim();
  if (!/^<svg(?:\s|>)/.test(normalized) || !/<\/svg>\s*$/.test(normalized)) {
    return reject("Input must be a complete SVG document.");
  }

  const validation = XMLValidator.validate(normalized);
  if (validation !== true) return reject("SVG markup is not well-formed XML.");

  let nodes: unknown;
  try {
    nodes = parser.parse(normalized);
  } catch {
    return reject("SVG markup could not be parsed.");
  }
  if (
    !Array.isArray(nodes) ||
    nodes.length !== 1 ||
    !nodes[0] ||
    typeof nodes[0] !== "object" ||
    !("svg" in nodes[0])
  ) {
    return reject("Input must contain exactly one SVG root element.");
  }

  const error = validateNodes(nodes);
  return error ? reject(error) : { ok: true, value: normalized };
}
