import { describe, expect, it } from "vitest";
import { TOOL_REGISTRY } from "@/lib/registry";
import { isExecutableTool } from "@/lib/tool-registry";
import { validateToolIoDescriptions } from "@/lib/validate-tool-registry";
import { convertChmod } from "@/lib/processors/devops-config-core";
import { convertTextToAllCases } from "@/lib/processors/text";
import {
  countText,
  encodeHtmlEntities,
  formatCss,
  formatHtml,
  markdownToHtml,
} from "@/lib/processors/tool-core";
import { encodeBase64 } from "@/lib/processors/base64";
import { encodeUrlComponent } from "@/lib/processors/url";
import { formatGraphql, formatSql } from "@/lib/processors/data-workflow-core";
import { formatJavaScript } from "@/lib/processors/web-code-core";
import { formatJson, validateJson } from "@/lib/processors/json";

type ExampleCase = {
  id: string;
  run: (input: string) => unknown | Promise<unknown>;
};

/**
 * Client tools with a deterministic text output whose example is asserted
 * strictly against the real processor. Server/hybrid and visual/object tools
 * keep an illustrative example and are covered by the presence gate instead.
 */
const strictCases: ExampleCase[] = [
  { id: "json-formatter", run: (input) => formatJson(input).result },
  { id: "html-formatter", run: async (input) => (await formatHtml(input)).trim() },
  { id: "css-formatter", run: async (input) => (await formatCss(input)).trim() },
  { id: "markdown-preview", run: (input) => markdownToHtml(input) },
  {
    id: "case-converter",
    run: (input) =>
      convertTextToAllCases(input).find(({ name }) => name === "camelCase")
        ?.result,
  },
  { id: "base64-encoder", run: (input) => encodeBase64(input) },
  { id: "url-encoder", run: (input) => encodeUrlComponent(input) },
  { id: "html-entities", run: (input) => encodeHtmlEntities(input) },
  {
    id: "word-counter",
    run: (input) => {
      const stats = countText(input);
      return `Words: ${stats.words} · Lines: ${stats.lines} · Paragraphs: ${stats.paragraphs}`;
    },
  },
  {
    id: "json-validator",
    run: (input) => (validateJson(input).isValid ? "Valid JSON" : "Invalid JSON"),
  },
  {
    id: "sql-formatter",
    run: (input) => {
      const result = formatSql(input);
      return result.ok ? result.value.trim() : "error";
    },
  },
  {
    id: "graphql-formatter",
    run: async (input) => {
      const result = await formatGraphql(input);
      return result.ok ? result.value.trim() : "error";
    },
  },
  {
    id: "javascript-formatter",
    run: async (input) => {
      const result = await formatJavaScript(input, "typescript", {
        singleQuote: true,
      });
      return result.ok ? result.value.trim() : "error";
    },
  },
  {
    id: "chmod-calculator",
    run: (input) => {
      const result = convertChmod(input);
      return result.ok ? (result.value.symbolic ?? result.value.octal) : "error";
    },
  },
];

const toolsById = new Map(TOOL_REGISTRY.map((tool) => [tool.id, tool]));

describe("tool input/output contract", () => {
  it("requires input/output descriptions and an example for every executable tool", () => {
    expect(validateToolIoDescriptions(TOOL_REGISTRY)).toEqual([]);
  });

  it("covers only registered executable tools", () => {
    const executableIds = TOOL_REGISTRY.filter(isExecutableTool).map(
      (tool) => tool.id,
    );
    for (const { id } of strictCases) {
      expect(executableIds).toContain(id);
    }
  });

  it.each(strictCases)(
    "$id example produces the declared output",
    async ({ id, run }) => {
      const tool = toolsById.get(id);
      expect(tool?.example?.input).toBeTruthy();
      const actual = String(await run(tool!.example!.input)).trim();
      expect(actual).toEqual((tool!.example!.output ?? "").trim());
    },
  );
});
