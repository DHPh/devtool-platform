#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DOMAINS = {
  text: "text-tools.ts",
  data: "data-tools.ts",
  generators: "generators-tools.ts",
  security: "security-tools.ts",
  web: "web-tools.ts",
  network: "network-tools.ts",
  file: "file-tools.ts",
};

const CATEGORIES = {
  "text-processing": "TEXT_PROCESSING",
  "data-conversion": "DATA_CONVERSION",
  generators: "GENERATORS",
  validators: "VALIDATORS",
  "security-tools": "SECURITY_TOOLS",
  "web-development": "WEB_DEVELOPMENT",
  "api-testing": "API_TESTING",
  utilities: "UTILITIES",
  "data-analysis": "DATA_ANALYSIS",
  "encoding-decoding": "ENCODING_DECODING",
  "file-processing": "FILE_PROCESSING",
};

const TYPES = {
  generator: "GENERATOR",
  validator: "VALIDATOR",
  converter: "CONVERTER",
  formatter: "FORMATTER",
  encoder: "ENCODER",
  decoder: "DECODER",
  parser: "PARSER",
  analyzer: "ANALYZER",
  calculator: "CALCULATOR",
  random: "RANDOM",
  security: "SECURITY",
  utility: "UTILITY",
  viewer: "VIEWER",
  editor: "EDITOR",
};

const PROCESSING_MODES = new Set(["client", "server", "hybrid"]);
const WINDOWS_RESERVED_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

function usage() {
  return `Usage: npm run create-tool -- <tool-id> [options]

Options:
  --kind <standalone|studio|studio-subtool> Tool kind (default: standalone)
  --domain <${Object.keys(DOMAINS).join("|")}>  Registry domain (default: web)
  --name <display name>               Display name (default: derived from ID)
  --description <text>                Registry description
  --category <category-id>            Category (default: utilities)
  --type <tool-type>                   Primary type (default: utility)
  --processing <client|server|hybrid> Processing mode (default: client)
  --tags <tag-one,tag-two>             Comma-separated tags
  --parent <studio-id>                 Required for studio sub-tools
  --studio-directory <directory>       Studio source directory (default: tool ID)
  --tab <tab-id>                       Studio tab ID (default: tool ID)
  --dry-run                            Validate and print files without writing
  --help                               Show this help`;
}

function parseArguments(argv) {
  const options = {};
  const positional = [];
  const allowedOptions = new Set([
    "kind", "domain", "name", "description", "category", "type",
    "processing", "tags", "parent", "studio-directory", "tab", "help", "dry-run",
  ]);
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith("--")) {
      positional.push(argument);
      continue;
    }
    const [rawKey, inlineValue] = argument.slice(2).split(/=(.*)/s, 2);
    if (!allowedOptions.has(rawKey)) throw new Error(`Unknown option: --${rawKey}`);
    if (["help", "dry-run"].includes(rawKey)) {
      options[rawKey] = true;
      continue;
    }
    const value = inlineValue ?? argv[++index];
    if (!value || value.startsWith("--")) {
      throw new Error(`Option --${rawKey} requires a value`);
    }
    options[rawKey] = value;
  }
  if (positional.length > 1) throw new Error("Provide exactly one tool ID");
  return { id: positional[0], options };
}

function assertKebabCase(value, label) {
  if (
    typeof value !== "string" ||
    !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(value) ||
    WINDOWS_RESERVED_NAMES.test(value)
  ) {
    throw new Error(`${label} must be a safe kebab-case identifier`);
  }
}

function titleCase(id) {
  return id
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function pascalCase(id) {
  return titleCase(id).replaceAll(" ", "");
}

function constantCase(id) {
  return id.replaceAll("-", "_").toUpperCase();
}

function quote(value) {
  return JSON.stringify(value);
}

function readRequired(path) {
  if (!existsSync(path)) throw new Error(`Required project file is missing: ${path}`);
  return readFileSync(path, "utf8");
}

function replaceAnchor(source, anchor, insertion, path) {
  const index = source.lastIndexOf(anchor);
  if (index < 0) throw new Error(`Could not find scaffold anchor in ${path}`);
  return `${source.slice(0, index)}${insertion}${source.slice(index)}`;
}

function discoverRegistryEntries(root) {
  const entries = [];
  for (const filename of Object.values(DOMAINS)) {
    const path = resolve(root, "src/lib/registry", filename);
    const source = readRequired(path);
    for (const match of source.matchAll(/^  \{\r?\n([\s\S]*?)^  \},?$/gm)) {
      const block = match[1];
      const field = (name) => block.match(new RegExp(`^    ${name}: "([^"]+)"`, "m"))?.[1];
      const id = field("id");
      if (id) {
        entries.push({
          id,
          kind: field("kind"),
          path: field("path"),
          studioDirectory: field("studioDirectory"),
        });
      }
    }
  }
  return entries;
}

function componentTemplate(id, name, componentName, isTab) {
  const exportName = isTab ? `${componentName}Tab` : componentName;
  return `"use client";

import { useState } from "react";
import { process${componentName} } from "@/lib/processors/${id}";

export ${isTab ? "" : "default "}function ${exportName}() {
  const [input, setInput] = useState("");
  const output = process${componentName}(input);

  return (
    <section className="space-y-4" aria-labelledby="${id}-title">
      <div>
        <h2 id="${id}-title" className="text-2xl font-semibold">{${quote(name)}}</h2>
        <p className="text-muted-foreground">Replace this scaffold with the tool interface.</p>
      </div>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Input</span>
        <textarea
          className="min-h-40 w-full rounded-md border bg-background p-3"
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
      </label>
      <output className="block whitespace-pre-wrap rounded-md border p-3">{output}</output>
    </section>
  );
}
`;
}

function processorTemplate(componentName) {
  return `/** Pure processing logic for the generated tool. */
export function process${componentName}(input: string): string {
  return input;
}
`;
}

function studioComponentTemplate(componentName, manifestName) {
  return `"use client";

import { StudioTabs } from "@/components/studio-tabs";
import { ${manifestName} } from "./manifest";

export default function ${componentName}() {
  return (
    <StudioTabs
      manifest={${manifestName}}
      componentProps={{}}
      listClassName="grid h-auto w-full grid-cols-2 p-1 md:grid-cols-4"
    />
  );
}
`;
}

function studioManifestTemplate(id, directory, manifestName) {
  return `import { defineStudioManifest } from "@/lib/studio-manifest";

export const ${manifestName} = defineStudioManifest(
  ${quote(id)},
  ${quote(directory)},
  [
    // create-tool:tabs
  ],
);
`;
}
function testTemplate(id, componentName) {
  return `import { describe, expect, it } from "vitest";
import { process${componentName} } from "@/lib/processors/${id}";

describe("${id} processor", () => {
  it("provides a deterministic scaffold implementation", () => {
    expect(process${componentName}("example")).toBe("example");
  });
});
`;
}

function registryEntry(config) {
  const lines = [
    "  {",
    `    id: ${quote(config.id)},`,
    `    kind: ${quote(config.kind)},`,
    `    processing: ${quote(config.processing)},`,
    `    name: ${quote(config.name)},`,
    `    description: ${quote(config.description)},`,
    `    category: TOOL_CATEGORIES.${CATEGORIES[config.category]}.id,`,
    `    type: TOOL_TYPES.${TYPES[config.type]},`,
    `    tags: [${config.tags.map(quote).join(", ")}],`,
    `    path: ${quote(config.path)},`,
    `    icon: "🧰",`,
    `    complexity: "simple",`,
  ];
  if (config.kind === "studio-subtool") {
    lines.push(`    parent: ${quote(config.parent)},`);
    lines.push(`    tab: ${quote(config.tab)},`);
  } else if (config.kind === "studio") {
    lines.push(`    studioDirectory: ${quote(config.studioDirectory)},`);
  }
  lines.push("  },", "");
  return lines.join("\n");
}

function studioManifestEntry(config, componentName) {
  return `    { id: ${quote(config.tab)}, shortLabel: ${quote(config.name)}, icon: "Wrench", loadComponent: () => import("./tabs/${componentName}Tab").then((module) => ({ default: module.${componentName}Tab })) },\n`;
}

function buildConfig(id, options, root) {
  assertKebabCase(id, "Tool ID");
  const kind = options.kind ?? "standalone";
  if (!new Set(["standalone", "studio", "studio-subtool"]).has(kind)) {
    throw new Error("--kind must be standalone, studio, or studio-subtool");
  }
  const domain = options.domain ?? "web";
  if (!(domain in DOMAINS)) throw new Error(`Unknown registry domain: ${domain}`);
  const category = options.category ?? "utilities";
  if (!(category in CATEGORIES)) throw new Error(`Unknown category: ${category}`);
  const type = options.type ?? "utility";
  if (!(type in TYPES)) throw new Error(`Unknown tool type: ${type}`);
  const processing = options.processing ?? "client";
  if (!PROCESSING_MODES.has(processing)) throw new Error(`Unknown processing mode: ${processing}`);

  const entries = discoverRegistryEntries(root);
  if (entries.some((entry) => entry.id === id)) throw new Error(`Tool ID already exists: ${id}`);
  let parent;
  let parentDirectory;
  let studioDirectory;
  let tab;
  let path = `/tools/${id}`;
  if (kind === "studio-subtool") {
    parent = options.parent;
    assertKebabCase(parent, "Parent studio ID");
    tab = options.tab ?? id;
    assertKebabCase(tab, "Tab ID");
    const parentEntry = entries.find((entry) => entry.id === parent);
    if (
      !parentEntry ||
      parentEntry.kind !== "studio" ||
      !parentEntry.path ||
      !parentEntry.studioDirectory
    ) {
      throw new Error(`Unknown studio container: ${parent}`);
    }
    parentDirectory = parentEntry.studioDirectory;
    path = `${parentEntry.path}?tab=${encodeURIComponent(tab)}`;
  } else if (kind === "studio") {
    studioDirectory = options["studio-directory"] ?? id;
    assertKebabCase(studioDirectory, "Studio directory");
  }

  if (entries.some((entry) => entry.path === path)) {
    throw new Error(`Tool path already exists: ${path}`);
  }

  const name = options.name ?? titleCase(id);
  const description = options.description ?? `${name} developer tool`;
  const requestedTags = (options.tags ?? id)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const tags = requestedTags.length > 0 ? requestedTags : [id];
  return { id, kind, domain, category, type, processing, parent, parentDirectory, studioDirectory, tab, path, name, description, tags };
}

function buildChanges(config, root) {
  const componentName = pascalCase(config.id);
  const registryPath = resolve(root, "src/lib/registry", DOMAINS[config.domain]);
  const orderPath = resolve(root, "src/lib/registry/index.ts");
  const processorPath = resolve(root, `src/lib/processors/${config.id}.ts`);
  const testPath = resolve(root, `tests/${config.id}.test.ts`);
  const isTab = config.kind === "studio-subtool";
  const isStudio = config.kind === "studio";
  const manifestName = `${constantCase(config.id)}_MANIFEST`;
  const componentPath = isTab
    ? resolve(
        root,
        `src/lib/tools/${config.parentDirectory}/tabs/${componentName}Tab.tsx`,
      )
    : isStudio
      ? resolve(root, `src/lib/tools/${config.studioDirectory}/${componentName}.tsx`)
      : resolve(root, `src/lib/tools/${config.id}.tsx`);

  const create = new Map();
  create.set(
    componentPath,
    isStudio
      ? studioComponentTemplate(componentName, manifestName)
      : componentTemplate(config.id, config.name, componentName, isTab),
  );
  if (isStudio) {
    create.set(
      resolve(root, `src/lib/tools/${config.studioDirectory}/manifest.ts`),
      studioManifestTemplate(config.id, config.studioDirectory, manifestName),
    );
  } else {
    create.set(processorPath, processorTemplate(componentName));
    create.set(testPath, testTemplate(config.id, componentName));
  }
  for (const path of create.keys()) {
    if (existsSync(path)) throw new Error(`Refusing to overwrite existing file: ${path}`);
  }

  const update = new Map();
  const registrySource = readRequired(registryPath);
  update.set(
    registryPath,
    replaceAnchor(registrySource, "] satisfies ToolMetadata[];", registryEntry(config), registryPath),
  );
  const orderSource = readRequired(orderPath);
  update.set(
    orderPath,
    replaceAnchor(orderSource, "] as const;", `  ${quote(config.id)},\n`, orderPath),
  );

  if (!isTab) {
    const idsPath = resolve(root, "src/lib/tool-component-ids.ts");
    const loadersPath = resolve(root, "src/lib/tool-components.ts");
    update.set(
      idsPath,
      replaceAnchor(readRequired(idsPath), "] as const;", `  ${quote(config.id)},\n`, idsPath),
    );
    update.set(
      loadersPath,
      replaceAnchor(
        readRequired(loadersPath),
        "} satisfies Record<ToolComponentId, ToolComponentLoader>;",
        isStudio
          ? `  ${quote(config.id)}: () => import("@/lib/tools/${config.studioDirectory}/${componentName}"),\n`
          : `  ${quote(config.id)}: () => import("@/lib/tools/${config.id}"),\n`,
        loadersPath,
      ),
    );
    if (isStudio) {
      const manifestsPath = resolve(root, "src/lib/studio-manifests.ts");
      const manifestsSource = readRequired(manifestsPath);
      const withImport = replaceAnchor(
        manifestsSource,
        "export const STUDIO_MANIFESTS",
        `import { ${manifestName} } from "@/lib/tools/${config.studioDirectory}/manifest";\n\n`,
        manifestsPath,
      );
      update.set(
        manifestsPath,
        replaceAnchor(
          withImport,
          "] as const;",
          `  ${manifestName},\n`,
          manifestsPath,
        ),
      );
    }
  } else {
    const manifestPath = resolve(
      root,
      `src/lib/tools/${config.parentDirectory}/manifest.ts`,
    );
    update.set(
      manifestPath,
      replaceAnchor(
        readRequired(manifestPath),
        "    // create-tool:tabs",
        studioManifestEntry(config, componentName),
        manifestPath,
      ),
    );
  }
  return { create, update };
}

function writeChanges(changes) {
  for (const [path, content] of [...changes.create, ...changes.update]) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content, "utf8");
  }
}

function printSummary(config, changes, root, dryRun) {
  const files = [...changes.create.keys(), ...changes.update.keys()].map((path) =>
    relative(root, path).replaceAll("\\", "/"),
  );
  console.log(`${dryRun ? "Would scaffold" : "Scaffolded"} ${config.kind} "${config.id}".`);
  for (const file of files) console.log(`- ${file}`);
  console.log("\nNext steps:");
  console.log(
    `- Replace the placeholder interface${config.kind === "studio" ? " and add its first tab" : " and processor"}.`,
  );
  if (config.kind !== "studio") {
    console.log(`- Run: npm test -- --run tests/${config.id}.test.ts`);
  }
  console.log("- Run: npm run validate:registry && npm run typecheck");
}

export function run(argv = process.argv.slice(2), cwd = process.cwd()) {
  const { id, options } = parseArguments(argv);
  if (options.help) {
    console.log(usage());
    return;
  }
  if (!id) throw new Error(`Tool ID is required\n\n${usage()}`);
  const root = resolve(cwd);
  const config = buildConfig(id, options, root);
  const changes = buildChanges(config, root);
  if (!options["dry-run"]) writeChanges(changes);
  printSummary(config, changes, root, Boolean(options["dry-run"]));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    run();
  } catch (error) {
    console.error(`create-tool: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
