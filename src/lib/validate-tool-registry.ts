import { getCategoryIds, TOOL_TYPES } from "@/lib/tool-classification";
import type { ToolMetadata } from "@/lib/tool-registry";

const TOOL_URL_BASE = "https://devtool-platform.invalid";
const PROCESSING_MODES = new Set(["client", "server", "hybrid"]);
const SAFE_DIRECTORY = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

export function validateToolRegistry(
  tools: readonly ToolMetadata[],
  componentIds: readonly string[],
): string[] {
  const errors: string[] = [];
  const knownCategories = new Set(getCategoryIds());
  const knownTypes = new Set<string>(Object.values(TOOL_TYPES));
  const toolsById = new Map<string, ToolMetadata>();
  const ids = new Set<string>();
  const paths = new Set<string>();
  const mappedComponents = new Set(componentIds);

  for (const tool of tools) {
    if (ids.has(tool.id)) {
      errors.push(`[${tool.id}] id: duplicate tool ID`);
    } else {
      ids.add(tool.id);
      toolsById.set(tool.id, tool);
    }

    if (paths.has(tool.path)) {
      errors.push(`[${tool.id}] path: duplicate path "${tool.path}"`);
    } else {
      paths.add(tool.path);
    }

    if (!tool.path.startsWith("/tools/")) {
      errors.push(`[${tool.id}] path: must start with "/tools/"`);
    }

    if (!knownCategories.has(tool.category)) {
      errors.push(`[${tool.id}] category: unknown value "${tool.category}"`);
    }

    if (!PROCESSING_MODES.has(tool.processing)) {
      errors.push(
        `[${tool.id}] processing: unknown value "${tool.processing}"`,
      );
    }

    for (const type of [tool.type, ...(tool.types ?? [])]) {
      if (!knownTypes.has(type)) {
        errors.push(`[${tool.id}] type: unknown value "${type}"`);
      }
    }
  }

  for (const tool of tools) {
    if (tool.kind !== "studio-subtool") {
      if (!mappedComponents.has(tool.id)) {
        errors.push(`[${tool.id}] component: no route component mapping`);
      }
      if (
        tool.kind === "studio" &&
        !SAFE_DIRECTORY.test(tool.studioDirectory)
      ) {
        errors.push(
          `[${tool.id}] studioDirectory: must be a safe kebab-case directory`,
        );
      }
      continue;
    }

    const parent = toolsById.get(tool.parent);
    if (!parent) {
      errors.push(`[${tool.id}] parent: unknown tool "${tool.parent}"`);
      continue;
    }

    if (parent.kind !== "studio") {
      errors.push(
        `[${tool.id}] parent: "${tool.parent}" is not a studio container`,
      );
    }

    const childUrl = new URL(tool.path, TOOL_URL_BASE);
    const parentUrl = new URL(parent.path, TOOL_URL_BASE);
    if (childUrl.pathname !== parentUrl.pathname) {
      errors.push(
        `[${tool.id}] path: must point to parent studio path "${parentUrl.pathname}"`,
      );
    }

    const pathTab = childUrl.searchParams.get("tab");
    if (!pathTab) {
      errors.push(`[${tool.id}] path: studio sub-tool requires a "tab" query`);
    } else if (pathTab !== tool.tab) {
      errors.push(
        `[${tool.id}] tab: metadata "${tool.tab}" does not match path tab "${pathTab}"`,
      );
    }
  }

  for (const componentId of mappedComponents) {
    const tool = toolsById.get(componentId);
    if (!tool) {
      errors.push(`[${componentId}] component: mapping has no registry entry`);
    } else if (tool.kind === "studio-subtool") {
      errors.push(
        `[${componentId}] component: sub-tools cannot have standalone mappings`,
      );
    }
  }

  return errors;
}

export function validateToolIoDescriptions(
  tools: readonly ToolMetadata[],
): string[] {
  const errors: string[] = [];
  for (const tool of tools) {
    if (tool.kind === "studio") continue;
    if (!tool.inputDescription?.trim()) {
      errors.push(`[${tool.id}] inputDescription: missing`);
    }
    if (!tool.outputDescription?.trim()) {
      errors.push(`[${tool.id}] outputDescription: missing`);
    }
    if (!tool.example?.input?.trim()) {
      errors.push(`[${tool.id}] example.input: missing`);
    }
    if (!tool.example?.output?.trim()) {
      errors.push(`[${tool.id}] example.output: missing`);
    }
  }
  return errors;
}

export function assertValidToolRegistry(
  tools: readonly ToolMetadata[],
  componentIds: readonly string[],
): void {
  const errors = validateToolRegistry(tools, componentIds);

  if (errors.length > 0) {
    throw new Error(
      `Tool registry validation failed:\n- ${errors.join("\n- ")}`,
    );
  }
}
