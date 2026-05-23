import {
  Activity,
  Binary,
  CheckCircle2,
  Code2,
  Dices,
  FileText,
  FolderOpen,
  FlaskConical,
  PieChart,
  RefreshCw,
  Shield,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { TOOL_CATEGORIES } from "@/lib/tool-classification";
import {
  TOOL_REGISTRY,
  type StandaloneToolMetadata,
  type StudioMetadata,
  type StudioSubToolMetadata,
  type ToolMetadata,
} from "@/lib/tool-registry";

const STUDIO_SHORT_CODES: Record<string, string> = {
  "security-identity-studio": "SEC",
  "network-studio": "NET",
  "color-studio": "CLR",
  "json-studio": "JSN",
  "data-api-studio": "API",
  "encoding-serialization-studio": "ENC",
  "devops-configuration-studio": "OPS",
  "file-processing-studio": "FILE",
  "web-development-studio": "WEB",
  "website-diagnostics-studio": "DIAG",
  "password-studio": "PWD",
  "regex-studio": "REG",
};

const STUDIO_SHORT_NAMES: Record<string, string> = {
  "security-identity-studio": "Security",
  "network-studio": "Network",
  "color-studio": "Color",
  "json-studio": "JSON",
  "data-api-studio": "Data/API",
  "encoding-serialization-studio": "Encoding",
  "devops-configuration-studio": "DevOps",
  "file-processing-studio": "Files",
  "web-development-studio": "Web Dev",
  "website-diagnostics-studio": "Site Diag",
  "password-studio": "Password",
  "regex-studio": "Regex",
};

const TOOL_MONOGRAMS: Record<string, string> = {
  // Studios
  ...STUDIO_SHORT_CODES,

  // Security & Identity
  "jwt-inspector": "JWT",
  "jwt-generator": "SIGN",
  "jwt-signature-verifier": "VRFY",
  "hash-hmac-generator": "HMAC",
  "symmetric-encryption": "AES",
  "keypair-signature-tool": "KEY",
  "sri-generator": "SRI",
  "totp-tool": "TOTP",
  "certificate-decoder": "X509",

  // Network & Diagnostics
  "dns-lookup": "DNS",
  "dns-propagation-checker": "PROP",
  "email-dns-analyzer": "SPF",
  "ip-info": "IP",
  "http-client": "HTTP",
  "port-scanner": "PORT",
  "ping-tool": "PING",
  "websocket-tester": "WS",
  "speed-test": "BW",
  "mac-lookup": "MAC",
  "curl-parser": "CURL",
  "url-parser": "URL",
  "cors-analyzer": "CORS",
  "redirect-tracer": "301",
  "security-header-analyzer": "HDR",
  "opengraph-inspector": "OG",
  "robots-inspector": "BOT",
  "sitemap-validator": "XML",

  // Color
  "contrast-checker": "WCAG",
  "color-converter": "HEX",
  "palette-generator": "PAL",
  "gradient-generator": "GRAD",
  "color-blindness": "CVD",
  "color-interpolation": "MIX",
  "contrast-suggestions": "FIX",
  "css-color-4": "LCH",

  // JSON & Data
  "json-formatter": "JSON",
  "json-formatter-studio": "JSON",
  "json-validator": "JSON",
  "json-path-query": "PATH",
  "json-schema-validator": "SCHM",
  "json-diff-compare": "DIFF",
  "json-to-typescript": "TS",
  "json-flatten-unflatten": "FLAT",
  "sql-formatter": "SQL",
  "sql-query-builder": "SQL",
  "data-sql-generator": "SQL",
  "openapi-validator": "OAPI",
  "graphql-formatter": "GQL",
  "fake-data-generator": "MOCK",
  "csv-viewer": "CSV",
  "json-table-viewer": "TBL",
  "data-explorer": "DATA",

  // Encoding & Serialization
  "yaml-formatter": "YAML",
  "yaml-validator": "YAML",
  "xml-formatter": "XML",
  "xml-validator": "XML",
  "toml-formatter": "TOML",
  "json-yaml-converter": "YML",
  "csv-json-converter": "CSV",
  "number-base-converter": "BASE",

  // DevOps & Web
  "cron-expression": "CRON",
  "dockerfile-validator": "DCKR",
  "docker-compose-validator": "COMP",
  "nginx-config-formatter": "NGX",
  "env-file-parser": "ENV",
  "semver-checker": "SMVR",
  "svg-optimizer": "SVG",
  "svg-data-uri": "URI",
  "css-clamp-calculator": "CSS",
  "css-unit-converter": "REM",
  "javascript-formatter": "JS",
  "javascript-minifier": "MIN",
  "opengraph-generator": "OG",
  "web-manifest-generator": "PWA",

  // Password & Regex
  "password-generator": "PASS",
  "passphrase-generator": "PHRS",
  "password-analyzer": "STR",
  "regex-tester": "REG",
  "regex-replace": "RPL",
  "regex-library": "LIB",

  // File processing
  "pdf-tools": "PDF",
  "image-resizer": "IMG",
  "metadata-viewer": "EXIF",
  "archive-tools": "ZIP",
  "file-organizer": "FILE",

  // Standalone
  "base64-encoder": "B64",
  "url-encoder": "URL",
  "html-entities": "ENT",
  "html-formatter": "HTML",
  "css-formatter": "CSS",
  "markdown-preview": "MD",
  "diff-checker": "DIFF",
  "case-converter": "CASE",
  "word-counter": "WORD",
  "uuid-generator": "UUID",
  "timestamp-converter": "TIME",
  "email-validator": "MAIL",
  "qr-generator": "QR",
  "lorem-ipsum": "TEXT",
  "name-generator": "NAME",
  "number-generator": "NUM",
  "random-wheel": "RAND",
  "icon-pack-generator": "ICON",
};

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  [TOOL_CATEGORIES.TEXT_PROCESSING.id]: FileText,
  [TOOL_CATEGORIES.DATA_CONVERSION.id]: RefreshCw,
  [TOOL_CATEGORIES.GENERATORS.id]: Dices,
  [TOOL_CATEGORIES.VALIDATORS.id]: CheckCircle2,
  [TOOL_CATEGORIES.SECURITY_TOOLS.id]: Shield,
  [TOOL_CATEGORIES.WEB_DEVELOPMENT.id]: Code2,
  [TOOL_CATEGORIES.API_TESTING.id]: FlaskConical,
  [TOOL_CATEGORIES.UTILITIES.id]: Wrench,
  [TOOL_CATEGORIES.DATA_ANALYSIS.id]: PieChart,
  [TOOL_CATEGORIES.ENCODING_DECODING.id]: Binary,
  [TOOL_CATEGORIES.FILE_PROCESSING.id]: FolderOpen,
};

export function getStudioShortCode(studioId: string): string {
  return STUDIO_SHORT_CODES[studioId] ?? "STD";
}

export function getStudioShortName(studioId: string): string {
  return STUDIO_SHORT_NAMES[studioId] ?? studioId.replace(/-studio$/, "");
}

export function getToolMonogram(tool: ToolMetadata): string {
  if (TOOL_MONOGRAMS[tool.id]) {
    return TOOL_MONOGRAMS[tool.id];
  }
  if (tool.tab && TOOL_MONOGRAMS[tool.tab]) {
    return TOOL_MONOGRAMS[tool.tab];
  }
  const primaryTag = tool.tags[0]?.replace(/[^a-zA-Z0-9]/g, "");
  if (primaryTag && primaryTag.length >= 2 && primaryTag.length <= 4) {
    return primaryTag.toUpperCase();
  }
  const initials = tool.name
    .split(/[\s/&_-]+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  return (initials.slice(0, 4) || "TOOL").padEnd(2, "X");
}

export function getCategoryIcon(categoryId: string): LucideIcon {
  return CATEGORY_ICONS[categoryId] ?? Activity;
}

export interface StudioWithSubTools {
  studio: StudioMetadata;
  shortCode: string;
  shortName: string;
  subTools: StudioSubToolMetadata[];
}

export function getAllStudiosWithSubTools(): StudioWithSubTools[] {
  const studios = TOOL_REGISTRY.filter(
    (tool): tool is StudioMetadata => tool.kind === "studio",
  );
  return studios.map((studio) => ({
    studio,
    shortCode: getStudioShortCode(studio.id),
    shortName: getStudioShortName(studio.id),
    subTools: TOOL_REGISTRY.filter(
      (tool): tool is StudioSubToolMetadata =>
        tool.kind === "studio-subtool" && tool.parent === studio.id,
    ),
  }));
}

export function getStandaloneTools(): StandaloneToolMetadata[] {
  return TOOL_REGISTRY.filter(
    (tool): tool is StandaloneToolMetadata => tool.kind === "standalone",
  );
}
