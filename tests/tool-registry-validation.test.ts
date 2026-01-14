import { describe, expect, it } from "vitest";

import { TOOL_COMPONENTS } from "@/lib/tool-components";
import { TOOL_REGISTRY as DOMAIN_TOOL_REGISTRY } from "@/lib/registry";
import { TOOL_REGISTRY, type ToolMetadata } from "@/lib/tool-registry";
import {
  assertValidToolRegistry,
  validateToolRegistry,
} from "@/lib/validate-tool-registry";

function tool(overrides: Partial<ToolMetadata> = {}): ToolMetadata {
  return {
    id: "example-tool",
    name: "Example Tool",
    description: "Example",
    category: "utilities",
    type: "utility",
    tags: ["example"],
    path: "/tools/example-tool",
    ...overrides,
  };
}

describe("tool registry validation", () => {
  it("preserves the public registry export", () => {
    expect(TOOL_REGISTRY).toBe(DOMAIN_TOOL_REGISTRY);
  });

  it("accepts the production registry and component map", () => {
    expect(() =>
      assertValidToolRegistry(TOOL_REGISTRY, Object.keys(TOOL_COMPONENTS)),
    ).not.toThrow();
  });

  it("reports duplicate IDs and paths with the affected tool", () => {
    const errors = validateToolRegistry(
      [tool(), tool({ name: "Duplicate" })],
      ["example-tool"],
    );

    expect(errors).toContain("[example-tool] id: duplicate tool ID");
    expect(errors).toContain(
      '[example-tool] path: duplicate path "/tools/example-tool"',
    );
  });

  it("reports unknown categories and types", () => {
    const errors = validateToolRegistry(
      [tool({ category: "unknown", type: "unknown" as ToolMetadata["type"] })],
      ["example-tool"],
    );

    expect(errors).toContain(
      '[example-tool] category: unknown value "unknown"',
    );
    expect(errors).toContain('[example-tool] type: unknown value "unknown"');
  });

  it("reports missing parents and invalid studio paths", () => {
    const parent = tool({
      id: "example-studio",
      path: "/tools/example-studio",
    });
    const missingParent = tool({
      id: "orphan",
      parent: "missing-studio",
      path: "/tools/missing-studio?tab=orphan",
    });
    const wrongPath = tool({
      id: "wrong-path",
      parent: "example-studio",
      path: "/tools/other-studio?tab=wrong-path",
    });
    const missingTab = tool({
      id: "missing-tab",
      parent: "example-studio",
      path: "/tools/example-studio",
    });
    const errors = validateToolRegistry(
      [parent, missingParent, wrongPath, missingTab],
      ["example-studio"],
    );

    expect(errors).toContain('[orphan] parent: unknown tool "missing-studio"');
    expect(errors).toContain(
      '[wrong-path] path: must point to parent studio path "/tools/example-studio"',
    );
    expect(errors).toContain(
      '[missing-tab] path: studio sub-tool requires a "tab" query',
    );
  });

  it("reports missing and unknown component mappings", () => {
    const errors = validateToolRegistry([tool()], ["unknown-component"]);

    expect(errors).toContain(
      "[example-tool] component: no standalone component mapping",
    );
    expect(errors).toContain(
      "[unknown-component] component: mapping has no registry entry",
    );
  });
});
