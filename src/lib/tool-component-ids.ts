export const TOOL_COMPONENT_IDS = [
  "json-formatter",
  "base64-encoder",
  "regex-studio",
  "uuid-generator",
  "timestamp-converter",
  "password-studio",
  "color-studio",
  "case-converter",
  "url-encoder",
  "word-counter",
  "qr-generator",
  "json-validator",
  "html-entities",
  "lorem-ipsum",
  "email-validator",
  "html-formatter",
  "diff-checker",
  "css-formatter",
  "markdown-preview",
  "csv-viewer",
  "json-table-viewer",
  "data-explorer",
  "random-wheel",
  "json-studio",
  "network-studio",
  "file-processing-studio",
  "icon-pack-generator",
  "encoding-serialization-studio",
  "devops-configuration-studio",
  "data-api-studio",
  "security-identity-studio",
  "web-development-studio",
  "website-diagnostics-studio",
] as const;

export type ToolComponentId = (typeof TOOL_COMPONENT_IDS)[number];

export function isToolComponentId(id: string): id is ToolComponentId {
  return (TOOL_COMPONENT_IDS as readonly string[]).includes(id);
}
