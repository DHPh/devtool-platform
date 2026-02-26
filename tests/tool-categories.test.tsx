import { isValidElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";

import ToolsPage from "@/app/tools/page";
import { getAllCategories } from "@/lib/tool-classification";
import { getToolsByCategory, searchTools } from "@/lib/tool-registry";

const EXPECTED_CATEGORY_COUNTS: Record<string, number> = {
  "text-processing": 9,
  "data-conversion": 5,
  generators: 7,
  validators: 12,
  "security-tools": 1,
  "web-development": 6,
  "api-testing": 4,
  utilities: 7,
  "data-analysis": 5,
  "encoding-decoding": 7,
  "file-processing": 9,
};

function collectText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(collectText).join(" ");
  }

  if (!isValidElement<{ children?: ReactNode }>(node)) {
    return "";
  }

  return collectText(node.props.children);
}

describe("canonical tool categories", () => {
  it("filters every populated category by its machine-readable ID", () => {
    const categoryCounts = Object.fromEntries(
      getAllCategories().map((category) => [
        category.id,
        getToolsByCategory(category.id).length,
      ])
    );

    expect(categoryCounts).toEqual(EXPECTED_CATEGORY_COUNTS);
  });

  it("renders every populated category using its display name", () => {
    const pageText = collectText(ToolsPage()).replace(/\s+/g, " ");

    for (const category of getAllCategories()) {
      const tools = getToolsByCategory(category.id);

      if (tools.length > 0) {
        expect(pageText).toContain(`${category.name} Tools`);
      }
    }
  });

  it("searches names, descriptions, and tags case-insensitively", () => {
    expect(searchTools("JSON FORMATTER").map((tool) => tool.id))
      .toContain("json-formatter");
    expect(searchTools("DNS").map((tool) => tool.id))
      .toContain("dns-lookup");
    expect(searchTools("uuid").map((tool) => tool.id))
      .toContain("uuid-generator");
    expect(searchTools("definitely-not-a-tool")).toEqual([]);
  });
});
