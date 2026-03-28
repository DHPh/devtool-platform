import { describe, expect, it } from "vitest";

import { getToolGlossary } from "@/lib/tool-glossary";
import { TOOL_REGISTRY } from "@/lib/tool-registry";

const SPECIALIST_TOOL_IDS = [
  "base64-encoder",
  "uuid-generator",
  "timestamp-converter",
  "diff-checker",
  "qr-generator",
  "email-validator",
  "csv-viewer",
  "json-table-viewer",
  "data-explorer",
  "icon-pack-generator",
  "password-studio",
  "color-converter",
  "color-studio",
  "regex-studio",
  "json-studio",
  "network-studio",
  "website-diagnostics-studio",
  "file-processing-studio",
  "encoding-serialization-studio",
  "devops-configuration-studio",
  "data-api-studio",
  "security-identity-studio",
  "web-development-studio",
] as const;

describe("tool glossary catalog", () => {
  it("covers every audited specialist tool with unique, useful definitions", () => {
    const registryIds = new Set(TOOL_REGISTRY.map((tool) => tool.id));

    for (const id of SPECIALIST_TOOL_IDS) {
      expect(registryIds.has(id), `${id} must exist in the registry`).toBe(true);
      const terms = getToolGlossary(id);
      expect(terms.length, `${id} needs multiple definitions`).toBeGreaterThanOrEqual(3);
      expect(new Set(terms.map((entry) => entry.term)).size).toBe(terms.length);
      for (const entry of terms) {
        expect(entry.term.trim()).not.toBe("");
        expect(entry.definition.length).toBeGreaterThan(30);
      }
    }
  });
});
