import { TEXT_TOOLS } from "./text-tools";
import { DATA_TOOLS } from "./data-tools";
import { GENERATOR_TOOLS } from "./generators-tools";
import { SECURITY_TOOLS } from "./security-tools";
import { WEB_TOOLS } from "./web-tools";
import { NETWORK_TOOLS } from "./network-tools";
import { FILE_TOOLS } from "./file-tools";
import { DEVELOPMENT_TOOLS } from "./development-tools";
import type { ToolMetadata } from "./types";

const DOMAIN_TOOLS: ToolMetadata[] = [
  ...TEXT_TOOLS,
  ...DATA_TOOLS,
  ...GENERATOR_TOOLS,
  ...SECURITY_TOOLS,
  ...WEB_TOOLS,
  ...NETWORK_TOOLS,
  ...FILE_TOOLS,
  ...DEVELOPMENT_TOOLS,
];

const TOOL_ORDER = [
  "json-formatter",
  "html-formatter",
  "css-formatter",
  "markdown-preview",
  "word-counter",
  "case-converter",
  "diff-checker",
  "base64-encoder",
  "url-encoder",
  "html-entities",
  "uuid-generator",
  "password-studio",
  "password-generator",
  "passphrase-generator",
  "password-analysis",
  "lorem-ipsum",
  "qr-generator",
  "timestamp-converter",
  "color-studio",
  "color-converter",
  "color-picker",
  "palette-generator",
  "gradient-creator",
  "icon-pack-generator",
  "contrast-checker",
  "color-blindness-simulator",
  "accessibility-palette",
  "gradient-color-picker",
  "regex-studio",
  "regex-tester",
  "regex-replace",
  "regex-library",
  "json-validator",
  "json-studio",
  "json-formatter-studio",
  "json-path-query",
  "json-schema-validator",
  "json-diff-compare",
  "email-validator",
  "csv-viewer",
  "json-table-viewer",
  "data-explorer",
  "random-wheel",
  "network-studio",
  "api-tester",
  "http-client",
  "websocket-tester",
  "dns-lookup",
  "ip-info",
  "port-scanner",
  "network-monitor",
  "url-tester",
  "on-air-checker",
  "file-link-checker",
  "file-processing-studio",
  "image-resizer",
  "pdf-tools",
  "file-converter",
  "archive-manager",
  "file-hasher",
  "metadata-viewer",
  "duplicate-finder",
  "file-organizer",
  "encoding-serialization-studio",
  "yaml-formatter",
  "yaml-validator",
  "xml-formatter",
  "xml-validator",
  "toml-formatter",
  "json-yaml-converter",
  "csv-json-converter",
  "number-base-converter",
  "devops-configuration-studio",
  "cron-expression-builder",
  "chmod-calculator",
  "env-file-manager",
  "semver-comparator",
  "data-api-studio",
  "json-to-typescript",
  "json-flatten-unflatten",
  "security-identity-studio",
  "jwt-inspector",
  "hash-hmac-generator",
  "web-development-studio",
  "javascript-formatter",
  "svg-data-uri-converter",
  "css-unit-converter",
  "css-clamp-calculator",
  "open-graph-generator",
  "web-manifest-generator",
] as const;

const toolsById = new Map(DOMAIN_TOOLS.map((tool) => [tool.id, tool]));
const orderedIds = new Set(TOOL_ORDER);

if (toolsById.size !== DOMAIN_TOOLS.length) {
  throw new Error("Domain registries contain duplicate tool IDs");
}

if (orderedIds.size !== TOOL_ORDER.length) {
  throw new Error("Tool order contains duplicate tool IDs");
}

if (TOOL_ORDER.length !== DOMAIN_TOOLS.length) {
  throw new Error("Tool order and domain registries contain different totals");
}

export const TOOL_REGISTRY: ToolMetadata[] = TOOL_ORDER.map((id) => {
  const tool = toolsById.get(id);
  if (!tool) throw new Error(`Tool order references unknown tool "${id}"`);
  return tool;
});

export const REGISTRY_ENTRY_COUNT = TOOL_REGISTRY.length;
export const EXECUTABLE_TOOL_COUNT = TOOL_REGISTRY.filter(
  (tool) => tool.kind !== "studio",
).length;

// Backward-compatible public count. Studio containers are navigation, not tools.
export const TOOL_COUNT = EXECUTABLE_TOOL_COUNT;
export type {
  ProcessingMode,
  StandaloneToolDefinition,
  StandaloneToolMetadata,
  StudioDefinition,
  StudioMetadata,
  StudioSubToolMetadata,
  Tool,
  ToolComponentLoader,
  ToolDefinition,
  ToolMetadata,
} from "./types";
