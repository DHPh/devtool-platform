import type { ToolType } from "./tool-classification";
import { TOOL_COUNT, TOOL_REGISTRY } from "./registry";
import type { Tool, ToolMetadata } from "./registry";

export { TOOL_COUNT, TOOL_REGISTRY };
export type { Tool, ToolMetadata };

// Helper functions
export function getToolById(id: string): ToolMetadata | undefined {
  return TOOL_REGISTRY.find((tool) => tool.id === id);
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
  const searchTerm = query.toLowerCase();
  return TOOL_REGISTRY.filter(
    (tool) =>
      tool.name.toLowerCase().includes(searchTerm) ||
      tool.description.toLowerCase().includes(searchTerm) ||
      tool.tags.some((tag) => tag.toLowerCase().includes(searchTerm)) ||
      tool.type.toLowerCase().includes(searchTerm) ||
      (tool.types &&
        tool.types.some((type) => type.toLowerCase().includes(searchTerm))),
  );
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
    featuredTools,
    categoryCounts,
    typeCounts,
  };
}
