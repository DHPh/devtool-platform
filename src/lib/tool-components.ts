import type { ToolComponentId } from "@/lib/tool-component-ids";
import type { ToolComponentLoader } from "@/lib/tool-registry";

export const TOOL_COMPONENT_LOADERS = {
  "json-formatter": () =>
    import("@/lib/tools/json-formatter").then((module) => ({
      default: module.JsonFormatter,
    })),
  "base64-encoder": () => import("@/lib/tools/base64-encoder"),
  "regex-studio": () =>
    import("@/lib/tools/regex-studio").then((module) => ({
      default: module.RegexStudio,
    })),
  "uuid-generator": () => import("@/lib/tools/uuid-generator"),
  "timestamp-converter": () => import("@/lib/tools/timestamp-converter"),
  "password-studio": () =>
    import("@/lib/tools/password-studio/PasswordStudio").then((module) => ({
      default: module.PasswordStudio,
    })),
  "color-studio": () => import("@/lib/tools/color-studio/ColorStudio"),
  "case-converter": () => import("@/lib/tools/case-converter"),
  "url-encoder": () => import("@/lib/tools/url-encoder"),
  "word-counter": () => import("@/lib/tools/word-counter"),
  "qr-generator": () => import("@/lib/tools/qr-generator"),
  "json-validator": () => import("@/lib/tools/json-validator"),
  "html-entities": () => import("@/lib/tools/html-entities"),
  "lorem-ipsum": () => import("@/lib/tools/lorem-ipsum"),
  "email-validator": () => import("@/lib/tools/email-validator"),
  "html-formatter": () => import("@/lib/tools/html-formatter"),
  "diff-checker": () => import("@/lib/tools/diff-checker"),
  "css-formatter": () => import("@/lib/tools/css-formatter"),
  "markdown-preview": () => import("@/lib/tools/markdown-preview"),
  "csv-viewer": () => import("@/lib/tools/csv-viewer"),
  "json-table-viewer": () => import("@/lib/tools/json-table-viewer"),
  "data-explorer": () => import("@/lib/tools/data-explorer"),
  "random-wheel": () => import("@/lib/tools/random-wheel"),
  "json-studio": () =>
    import("@/lib/tools/json-studio").then((module) => ({
      default: module.JsonStudio,
    })),
  "network-studio": () =>
    import("@/lib/tools/network-studio").then((module) => ({
      default: module.NetworkStudio,
    })),
  "file-processing-studio": () =>
    import("@/lib/tools/file-processing/FileProcessingStudio"),
  "icon-pack-generator": () => import("@/lib/tools/icon-pack-generator"),
  "encoding-serialization-studio": () =>
    import("@/lib/tools/encoding-serialization-studio/EncodingSerializationStudio"),
} satisfies Record<ToolComponentId, ToolComponentLoader>;
