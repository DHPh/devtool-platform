import { isValidElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";

import ToolsPage from "@/app/tools/page";
import { getToolById } from "@/lib/tool-registry";

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
});
