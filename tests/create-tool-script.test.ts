import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const script = resolve(process.cwd(), "scripts/create-tool.mjs");
let fixtureRoot = "";

function write(path: string, content: string) {
  const absolute = resolve(fixtureRoot, path);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, content, "utf8");
}

function registry(entries = "") {
  return `import { TOOL_CATEGORIES, TOOL_TYPES } from "@/lib/tool-classification";
import type { ToolMetadata } from "./types";
export const TOOLS = [
${entries}] satisfies ToolMetadata[];
`;
}

function run(...args: string[]) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: fixtureRoot,
    encoding: "utf8",
  });
}

beforeEach(() => {
  fixtureRoot = mkdtempSync(resolve(tmpdir(), "devtool-scaffold-"));
  for (const file of [
    "text-tools.ts",
    "data-tools.ts",
    "generators-tools.ts",
    "security-tools.ts",
    "file-tools.ts",
  ]) {
    write(`src/lib/registry/${file}`, registry());
  }
  write(
    "src/lib/registry/network-tools.ts",
    registry(`  {
    id: "network-studio",
    kind: "standalone",
    path: "/tools/network-studio",
  },
`),
  );
  write("src/lib/registry/web-tools.ts", registry());
  write(
    "src/lib/registry/index.ts",
    `const TOOL_ORDER = [
  "network-studio",
] as const;
`,
  );
  write(
    "src/lib/tool-component-ids.ts",
    `export const TOOL_COMPONENT_IDS = [
  "network-studio",
] as const;
`,
  );
  write(
    "src/lib/tool-components.ts",
    `export const TOOL_COMPONENT_LOADERS = {
  "network-studio": () => import("@/lib/tools/network-studio"),
} satisfies Record<ToolComponentId, ToolComponentLoader>;
`,
  );
});

afterEach(() => {
  const resolved = resolve(fixtureRoot);
  if (resolved.startsWith(resolve(tmpdir())) && existsSync(resolved)) {
    rmSync(resolved, { recursive: true, force: true });
  }
});

describe("create-tool command", () => {
  it("fully wires a standalone scaffold", () => {
    const result = run(
      "sample-tool",
      "--name",
      "Sample Tool",
      "--description",
      "Process sample input",
      "--domain",
      "web",
      "--category",
      "utilities",
      "--type",
      "converter",
    );

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('Scaffolded standalone "sample-tool"');
    expect(readFileSync(resolve(fixtureRoot, "src/lib/tools/sample-tool.tsx"), "utf8"))
      .toContain("export default function SampleTool");
    expect(readFileSync(resolve(fixtureRoot, "src/lib/processors/sample-tool.ts"), "utf8"))
      .toContain("export function processSampleTool");
    expect(readFileSync(resolve(fixtureRoot, "tests/sample-tool.test.ts"), "utf8"))
      .toContain('describe("sample-tool processor"');
    expect(readFileSync(resolve(fixtureRoot, "src/lib/registry/web-tools.ts"), "utf8"))
      .toContain('id: "sample-tool"');
    expect(readFileSync(resolve(fixtureRoot, "src/lib/tool-component-ids.ts"), "utf8"))
      .toContain('"sample-tool"');
    expect(readFileSync(resolve(fixtureRoot, "src/lib/tool-components.ts"), "utf8"))
      .toContain('import("@/lib/tools/sample-tool")');

    const second = run("sample-tool");
    expect(second.status).toBe(1);
    expect(second.stderr).toContain("Tool ID already exists");
  });

  it("creates a studio tab scaffold and reports its layout follow-up", () => {
    const result = run(
      "request-timeline",
      "--kind",
      "studio-subtool",
      "--parent",
      "network-studio",
      "--domain",
      "network",
      "--tab",
      "timeline",
      "--processing",
      "server",
    );

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain(
      "Export and render RequestTimelineTab in the network-studio studio layout",
    );
    expect(
      existsSync(
        resolve(
          fixtureRoot,
          "src/lib/tools/network-studio/tabs/RequestTimelineTab.tsx",
        ),
      ),
    ).toBe(true);
    const registrySource = readFileSync(
      resolve(fixtureRoot, "src/lib/registry/network-tools.ts"),
      "utf8",
    );
    expect(registrySource).toContain('kind: "studio-subtool"');
    expect(registrySource).toContain(
      'path: "/tools/network-studio?tab=timeline"',
    );
    expect(readFileSync(resolve(fixtureRoot, "src/lib/tool-component-ids.ts"), "utf8"))
      .not.toContain("request-timeline");
  });

  it("rejects unsafe IDs, unknown options, and existing files without writes", () => {
    expect(run("Invalid_ID").stderr).toContain("safe kebab-case identifier");
    expect(run("2fa-tool").stderr).toContain("safe kebab-case identifier");
    expect(run("valid-id", "--unknown", "value").stderr).toContain(
      "Unknown option",
    );
    write("src/lib/tools/existing-tool.tsx", "user content");
    const existing = run("existing-tool");
    expect(existing.status).toBe(1);
    expect(existing.stderr).toContain("Refusing to overwrite existing file");
    expect(readFileSync(resolve(fixtureRoot, "src/lib/tools/existing-tool.tsx"), "utf8"))
      .toBe("user content");
  });
});
