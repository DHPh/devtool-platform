import { isValidElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";

import ToolsPage from "@/app/tools/page";
import { TOOL_COMPONENT_IDS } from "@/lib/tool-component-ids";
import { TOOL_REGISTRY, getStudioSubTool, getToolById } from "@/lib/tool-registry";

function collectHrefs(node: ReactNode): string[] {
  if (Array.isArray(node)) {
    return node.flatMap(collectHrefs);
  }

  if (!isValidElement<{ children?: ReactNode; href?: string }>(node)) {
    return [];
  }

  const href = typeof node.props.href === "string" ? [node.props.href] : [];
  return href.concat(collectHrefs(node.props.children));
}

describe("tool catalog paths", () => {
  it("uses the registry path for standalone tools", () => {
    const tool = getToolById("json-formatter");
    const hrefs = collectHrefs(ToolsPage());

    expect(tool?.path).toBe("/tools/json-formatter");
    expect(hrefs).toContain(tool?.path);
  });

  it("uses the parent studio and tab path for sub-tools", () => {
    const tool = getToolById("dns-lookup");
    const hrefs = collectHrefs(ToolsPage());

    expect(tool?.path).toBe("/tools/network-studio?tab=dns-lookup");
    expect(hrefs).toContain(tool?.path);
    expect(hrefs).not.toContain("/tools/dns-lookup");
  });

  it("resolves every registered path to a standalone route or studio tab", () => {
    const standaloneIds = new Set<string>(TOOL_COMPONENT_IDS);

    for (const tool of TOOL_REGISTRY) {
      const url = new URL(tool.path, "https://example.test");
      const slug = url.pathname.replace("/tools/", "");

      expect(standaloneIds.has(slug)).toBe(true);
      if (tool.kind === "standalone") {
        expect(tool.id).toBe(slug);
        expect(url.search).toBe("");
      } else {
        expect(getStudioSubTool(tool.parent, tool.tab)).toBe(tool);
        expect(slug).toBe(tool.parent);
        expect(url.searchParams.get("tab")).toBe(tool.tab);
      }
    }
  });
});
