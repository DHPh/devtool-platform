import { TOOL_REGISTRY } from "@/lib/registry";

export const OUTPUT_POLICY_VALUES = [
  "single-text",
  "multiple-text",
  "dataset",
  "visual-with-text",
  "file/binary",
  "status-only",
] as const;

export type OutputPolicy = (typeof OUTPUT_POLICY_VALUES)[number];

const DATASET_TOOLS = new Set([
  "csv-viewer",
  "json-table-viewer",
  "data-explorer",
  "fake-data-generator",
  "json-flatten",
  "data-to-sql",
]);
const VISUAL_WITH_TEXT_TOOLS = new Set([
  "qr-generator",
  "color-converter",
  "color-picker",
  "palette-generator",
  "gradient-creator",
  "contrast-checker",
  "color-blindness-simulator",
  "accessibility-palette",
  "gradient-color-picker",
  "open-graph-generator",
  "svg-optimizer",
  "svg-data-uri-converter",
]);
const FILE_TOOLS = new Set([
  "icon-pack-generator",
  "image-resizer",
  "pdf-tools",
  "file-converter",
  "archive-manager",
]);
const STATUS_ONLY_TOOLS = new Set([
  "password-analysis",
  "json-validator",
  "yaml-validator",
  "xml-validator",
  "dockerfile-linter",
  "docker-compose-validator",
  "kubernetes-manifest-validator",
  "openapi-validator",
  "jwt-signature-verifier",
  "cors-analyzer",
  "robots-inspector",
  "sitemap-validator",
  "security-header-analyzer",
]);
const SINGLE_TEXT_TOOLS = new Set([
  "json-formatter",
  "html-formatter",
  "css-formatter",
  "markdown-preview",
  "case-converter",
  "lorem-ipsum",
  "base64-encoder",
  "url-encoder",
  "html-entities",
  "regex-replace",
  "yaml-formatter",
  "xml-formatter",
  "toml-formatter",
  "sql-formatter",
  "graphql-formatter",
  "javascript-formatter",
  "javascript-minifier",
  "web-manifest-generator",
]);

function policyFor(id: string): OutputPolicy {
  if (DATASET_TOOLS.has(id)) return "dataset";
  if (VISUAL_WITH_TEXT_TOOLS.has(id)) return "visual-with-text";
  if (FILE_TOOLS.has(id)) return "file/binary";
  if (STATUS_ONLY_TOOLS.has(id)) return "status-only";
  if (SINGLE_TEXT_TOOLS.has(id)) return "single-text";
  return "multiple-text";
}

/** Audited semantic output contract for every executable registry entry. */
export const OUTPUT_POLICY_BY_TOOL_ID: Readonly<Record<string, OutputPolicy>> =
  Object.freeze(
    Object.fromEntries(
      TOOL_REGISTRY.filter((tool) => tool.kind !== "studio").map((tool) => [
        tool.id,
        policyFor(tool.id),
      ]),
    ),
  );
