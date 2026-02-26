import { isValidElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Inter: () => ({ className: "inter" }),
}));

import { metadata as layoutMetadata } from "@/app/layout";
import HomePage, { metadata as homeMetadata } from "@/app/page";
import ToolsPage, { metadata as toolsMetadata } from "@/app/tools/page";
import { siteConfig } from "@/config/site";
import {
  EXECUTABLE_TOOL_COUNT,
  REGISTRY_ENTRY_COUNT,
  TOOL_COUNT,
  TOOL_REGISTRY,
} from "@/lib/tool-registry";
import manifest from "../public/manifest.json";

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

describe("product claims", () => {
  it("uses executable operations rather than studio containers for public totals", () => {
    expect(REGISTRY_ENTRY_COUNT).toBe(TOOL_REGISTRY.length);
    expect(EXECUTABLE_TOOL_COUNT).toBe(
      TOOL_REGISTRY.filter((tool) => tool.kind !== "studio").length,
    );
    expect(REGISTRY_ENTRY_COUNT - EXECUTABLE_TOOL_COUNT).toBe(
      TOOL_REGISTRY.filter((tool) => tool.kind === "studio").length,
    );
    expect(TOOL_COUNT).toBe(EXECUTABLE_TOOL_COUNT);
    const homeCopy = collectText(HomePage()).replace(/\s+/g, " ");
    expect(homeCopy).toContain(`${TOOL_COUNT} Free Developer Tools`);
  });

  it("keeps hard-coded legacy counts out of active product metadata", () => {
    const activeClaims = JSON.stringify({
      homeMetadata,
      layoutMetadata,
      toolsMetadata,
      siteConfig,
      manifest,
    });

    expect(activeClaims).not.toContain("100+");
    expect(activeClaims).toContain(String(TOOL_COUNT));
  });

  it("discloses remote processing for network tools", () => {
    const visibleCopy = `${collectText(HomePage())} ${collectText(ToolsPage())}`
      .replace(/\s+/g, " ")
      .toLowerCase();

    expect(visibleCopy).toContain("most tools");
    expect(visibleCopy).toContain("network tools");
    expect(visibleCopy).toContain("external services");
  });
});
