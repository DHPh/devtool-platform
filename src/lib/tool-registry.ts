import type { ToolType } from "./tool-classification";
import {
  EXECUTABLE_TOOL_COUNT,
  REGISTRY_ENTRY_COUNT,
  TOOL_COUNT,
  TOOL_REGISTRY,
} from "./registry";
import type {
  ProcessingMode,
  StandaloneToolDefinition,
  StandaloneToolMetadata,
  StudioDefinition,
  StudioMetadata,
  StudioSubToolMetadata,
  Tool,
  ToolComponentLoader,
  ToolDefinition,
  ToolMetadata,
} from "./registry";

export {
  EXECUTABLE_TOOL_COUNT,
  REGISTRY_ENTRY_COUNT,
  TOOL_COUNT,
  TOOL_REGISTRY,
};
export type {
  ProcessingMode,
  StandaloneToolDefinition,
  StandaloneToolMetadata,
  StudioDefinition,
  StudioMetadata,
  StudioSubToolMetadata,
  Tool,
  ToolComponentLoader,
  ToolDefinition,
  ToolMetadata,
};

// Helper functions
export function getToolById(id: string): ToolMetadata | undefined {
  return TOOL_REGISTRY.find((tool) => tool.id === id);
}

export function isStudioTool(tool: ToolMetadata): tool is StudioMetadata {
  return tool.kind === "studio";
}

export function isExecutableTool(
  tool: ToolMetadata,
): tool is StandaloneToolMetadata | StudioSubToolMetadata {
  return tool.kind !== "studio";
}

export function getStudioSubTool(
  parent: string,
  tab: string,
): StudioSubToolMetadata | undefined {
  return TOOL_REGISTRY.find(
    (tool): tool is StudioSubToolMetadata =>
      tool.kind === "studio-subtool" &&
      tool.parent === parent &&
      tool.tab === tab,
  );
}

export function requireStudioSubTool(
  parent: string,
  tab: string,
): StudioSubToolMetadata {
  const tool = getStudioSubTool(parent, tab);
  if (!tool) {
    throw new Error(`Unknown studio tab "${parent}:${tab}"`);
  }
  return tool;
}

export function getStudioTabMetadata<const Tab extends string>(
  parent: string,
  tab: Tab,
) {
  const tool = requireStudioSubTool(parent, tab);
  return {
    ...tool,
    id: tab,
    label: tool.name,
  };
}

export function getToolsByCategory(category: string): ToolMetadata[] {
  return TOOL_REGISTRY.filter((tool) => tool.category === category);
}

export function getToolsByType(type: ToolType): ToolMetadata[] {
  return TOOL_REGISTRY.filter(
    (tool) => tool.type === type || (tool.types && tool.types.includes(type)),
  );
}

export function getToolsByComplexity(
  complexity: "simple" | "intermediate" | "advanced",
): ToolMetadata[] {
  return TOOL_REGISTRY.filter((tool) => tool.complexity === complexity);
}

export function getFeaturedTools(): ToolMetadata[] {
  return TOOL_REGISTRY.filter((tool) => tool.featured === true);
}

export function searchTools(query: string): ToolMetadata[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return TOOL_REGISTRY;
  }

  const tokens = normalized.split(/\s+/).filter(Boolean);

  const scored: { tool: ToolMetadata; score: number; index: number }[] = [];

  TOOL_REGISTRY.forEach((tool, index) => {
    const nameLower = tool.name.toLowerCase();
    const idLower = tool.id.toLowerCase();
    const descLower = tool.description.toLowerCase();
    const categoryLower = tool.category.toLowerCase();
    const tagsLower = tool.tags.map((tag) => tag.toLowerCase());
    const typesLower = [tool.type, ...(tool.types ?? [])].map((type) =>
      type.toLowerCase(),
    );

    const matchesAllTokens = tokens.every(
      (token) =>
        nameLower.includes(token) ||
        idLower.includes(token) ||
        descLower.includes(token) ||
        categoryLower.includes(token) ||
        tagsLower.some((tag) => tag.includes(token)) ||
        typesLower.some((type) => type.includes(token)),
    );

    if (!matchesAllTokens) {
      return;
    }

    let score = 0;

    if (nameLower === normalized || idLower === normalized) {
      score += 140;
    } else if (
      nameLower.startsWith(normalized) ||
      idLower.startsWith(normalized)
    ) {
      score += 90;
    } else if (nameLower.includes(normalized)) {
      score += 55;
    }

    for (const token of tokens) {
      if (nameLower.includes(token)) {
        score += 25;
        if (
          nameLower.startsWith(token) ||
          nameLower.includes(` ${token}`)
        ) {
          score += 12;
        }
      }
      if (idLower.includes(token)) {
        score += 16;
      }
      if (tagsLower.some((tag) => tag === token)) {
        score += 22;
      } else if (tagsLower.some((tag) => tag.includes(token))) {
        score += 10;
      }
      if (
        categoryLower.includes(token) ||
        typesLower.some((type) => type.includes(token))
      ) {
        score += 8;
      }
      if (descLower.includes(token)) {
        score += 4;
      }
    }

    if (tool.kind !== "studio") {
      score += 3;
    }

    scored.push({ tool, score, index });
  });

  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored.map((entry) => entry.tool);
}

export function getToolsByTags(tags: string[]): ToolMetadata[] {
  return TOOL_REGISTRY.filter((tool) =>
    tags.some((tag) => tool.tags.includes(tag)),
  );
}

// Get all unique types from registry
export function getAllToolTypes(): ToolType[] {
  const types = new Set<ToolType>();
  TOOL_REGISTRY.forEach((tool) => {
    types.add(tool.type);
    if (tool.types) {
      tool.types.forEach((type) => types.add(type));
    }
  });
  return Array.from(types);
}

// Get all unique categories from registry
export function getAllCategories(): string[] {
  const categories = new Set<string>();
  TOOL_REGISTRY.forEach((tool) => categories.add(tool.category));
  return Array.from(categories);
}

// Statistics functions
export function getToolStatistics() {
  const totalTools = TOOL_COUNT;
  const featuredTools = getFeaturedTools().length;
  const categoryCounts = getAllCategories().map((category) => ({
    category,
    count: getToolsByCategory(category).length,
  }));
  const typeCounts = getAllToolTypes().map((type) => ({
    type,
    count: getToolsByType(type).length,
  }));

  return {
    totalTools,
    registryEntries: REGISTRY_ENTRY_COUNT,
    featuredTools,
    categoryCounts,
    typeCounts,
  };
}
