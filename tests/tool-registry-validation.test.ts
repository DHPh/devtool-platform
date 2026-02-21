import { describe, expect, it } from "vitest";

import { TOOL_COMPONENT_IDS } from "@/lib/tool-component-ids";
import { TOOL_COMPONENT_LOADERS } from "@/lib/tool-components";
import { TOOL_REGISTRY as DOMAIN_TOOL_REGISTRY } from "@/lib/registry";
import {
  TOOL_REGISTRY,
  type StandaloneToolMetadata,
  type StudioMetadata,
  type StudioSubToolMetadata,
  type ToolMetadata,
} from "@/lib/tool-registry";
import {
  assertValidToolRegistry,
  validateToolRegistry,
} from "@/lib/validate-tool-registry";
import { getStudioTabMetadata } from "@/lib/tool-registry";
import { STUDIO_MANIFESTS } from "@/lib/studio-manifests";

function tool(
  overrides: Partial<StandaloneToolMetadata> = {},
): StandaloneToolMetadata {
  return {
    id: "example-tool",
    kind: "standalone",
    processing: "client",
    name: "Example Tool",
    description: "Example",
    category: "utilities",
    type: "utility",
    tags: ["example"],
    path: "/tools/example-tool",
    ...overrides,
  };
}

function studio(overrides: Partial<StudioMetadata> = {}): StudioMetadata {
  return {
    id: "example-studio",
    kind: "studio",
    processing: "client",
    name: "Example Studio",
    description: "Example",
    category: "utilities",
    type: "utility",
    tags: ["example"],
    path: "/tools/example-studio",
    studioDirectory: "example-studio",
    ...overrides,
  };
}

function subTool(
  overrides: Partial<StudioSubToolMetadata> = {},
): StudioSubToolMetadata {
  return {
    id: "example-sub-tool",
    kind: "studio-subtool",
    processing: "client",
    name: "Example Sub-tool",
    description: "Example",
    category: "utilities",
    type: "utility",
    tags: ["example"],
    path: "/tools/example-studio?tab=example",
    parent: "example-studio",
    tab: "example",
    ...overrides,
  };
}

describe("tool registry validation", () => {
  it("preserves the public registry export", () => {
    expect(TOOL_REGISTRY).toBe(DOMAIN_TOOL_REGISTRY);
  });

  it("accepts the production registry and component map", () => {
    expect(() =>
      assertValidToolRegistry(TOOL_REGISTRY, TOOL_COMPONENT_IDS),
    ).not.toThrow();
  });

  it("provides one typed loader for every standalone component ID", () => {
    expect(Object.keys(TOOL_COMPONENT_LOADERS)).toEqual(
      expect.arrayContaining([...TOOL_COMPONENT_IDS]),
    );
    expect(Object.keys(TOOL_COMPONENT_LOADERS)).toHaveLength(
      TOOL_COMPONENT_IDS.length,
    );
  });

  it("uses the discriminated contract for every production tool", () => {
    for (const entry of TOOL_REGISTRY) {
      expect(["client", "server", "hybrid"]).toContain(entry.processing);
      if (entry.kind !== "studio-subtool") {
        expect(entry.parent).toBeUndefined();
        expect(entry.tab).toBeUndefined();
      } else {
        expect(entry.parent).toBeTruthy();
        expect(entry.tab).toBeTruthy();
        expect(
          new URL(entry.path, "https://example.test").searchParams.get("tab"),
        ).toBe(entry.tab);
      }
    }
  });

  it("derives studio tab presentation metadata from the registry", () => {
    const tab = getStudioTabMetadata("network-studio", "dns-lookup");

    expect(tab.id).toBe("dns-lookup");
    expect(tab.label).toBe("DNS Lookup");
    expect(tab.processing).toBe("server");
  });

  it("defines one complete typed manifest for every studio container", () => {
    const studioIds = TOOL_REGISTRY.filter((tool) => tool.kind === "studio")
      .map((tool) => tool.id)
      .sort();

    expect(STUDIO_MANIFESTS.map((manifest) => manifest.id).sort()).toEqual(
      studioIds,
    );
    for (const manifest of STUDIO_MANIFESTS) {
      expect(manifest.tabs.length).toBeGreaterThan(0);
      expect(manifest.defaultTab).toBe(manifest.tabs[0].id);
      expect(
        manifest.tabs.every(
          (tab) =>
            tab.metadata.parent === manifest.id &&
            typeof tab.loadComponent === "function",
        ),
      ).toBe(true);
    }
  });

  it("loads every component declared by a studio manifest", async () => {
    const modules = await Promise.all(
      STUDIO_MANIFESTS.flatMap((manifest) =>
        manifest.tabs.map((tab) => tab.loadComponent()),
      ),
    );

    for (const loaded of modules) {
      expect(["function", "object"]).toContain(typeof loaded.default);
    }
  }, 15_000);

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
    const parent = studio();
    const missingParent = subTool({
      id: "orphan",
      parent: "missing-studio",
      path: "/tools/missing-studio?tab=orphan",
      tab: "orphan",
    });
    const wrongPath = subTool({
      id: "wrong-path",
      parent: "example-studio",
      path: "/tools/other-studio?tab=wrong-path",
      tab: "wrong-path",
    });
    const missingTab = subTool({
      id: "missing-tab",
      parent: "example-studio",
      path: "/tools/example-studio",
      tab: "missing-tab",
    });
    const mismatchedTab = subTool({
      id: "mismatched-tab",
      parent: "example-studio",
      path: "/tools/example-studio?tab=path-tab",
      tab: "metadata-tab",
    });
    const errors = validateToolRegistry(
      [parent, missingParent, wrongPath, missingTab, mismatchedTab],
      ["example-studio"],
    );

    expect(errors).toContain('[orphan] parent: unknown tool "missing-studio"');
    expect(errors).toContain(
      '[wrong-path] path: must point to parent studio path "/tools/example-studio"',
    );
    expect(errors).toContain(
      '[missing-tab] path: studio sub-tool requires a "tab" query',
    );
    expect(errors).toContain(
      '[mismatched-tab] tab: metadata "metadata-tab" does not match path tab "path-tab"',
    );
  });

  it("reports missing and unknown component mappings", () => {
    const errors = validateToolRegistry([tool()], ["unknown-component"]);

    expect(errors).toContain(
      "[example-tool] component: no route component mapping",
    );
    expect(errors).toContain(
      "[unknown-component] component: mapping has no registry entry",
    );
  });
});
