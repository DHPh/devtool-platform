import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

import {
  OUTPUT_POLICY_BY_TOOL_ID,
  OUTPUT_POLICY_VALUES,
} from "@/lib/output-policies";
import { TOOL_REGISTRY } from "@/lib/tool-registry";

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

describe("semantic output policies", () => {
  it("declares exactly one valid policy for every executable tool", () => {
    const executableIds = TOOL_REGISTRY.filter(
      (tool) => tool.kind !== "studio",
    )
      .map((tool) => tool.id)
      .sort();

    expect(Object.keys(OUTPUT_POLICY_BY_TOOL_ID).sort()).toEqual(executableIds);
    expect(executableIds).toHaveLength(106);
    for (const id of executableIds) {
      expect(OUTPUT_POLICY_VALUES).toContain(OUTPUT_POLICY_BY_TOOL_ID[id]);
    }
  });
});

describe("clipboard architecture", () => {
  it("keeps direct Clipboard API access inside the shared implementation", () => {
    const sourceRoot = join(process.cwd(), "src");
    const allowed = join(sourceRoot, "hooks", "use-clipboard.ts");
    const offenders = sourceFiles(sourceRoot)
      .filter((file) => file !== allowed)
      .filter((file) =>
        /navigator\s*\.\s*clipboard/.test(readFileSync(file, "utf8")),
      )
      .map((file) => relative(sourceRoot, file));

    expect(offenders).toEqual([]);
  });
});
