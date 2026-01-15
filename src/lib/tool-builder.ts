import {
  ProcessingMode,
  StandaloneToolMetadata,
  ToolMetadata,
  TOOL_REGISTRY,
} from "./tool-registry";
import { ToolType, TOOL_TYPES, TOOL_CATEGORIES } from "./tool-classification";

/**
 * Tool Builder - Utility for easily creating new tools with proper classification
 *
 * Usage example:
 * ```ts
 * const newTool = createTool({
 *   id: "my-new-tool",
 *   name: "My New Tool",
 *   description: "Does something awesome",
 *   category: "generators", // Will auto-map to proper category
 *   type: "generator",      // Primary type
 *   types: ["random"],      // Additional types
 *   tags: ["awesome", "new"],
 *   icon: "🎯"
 * });
 * ```
 */

interface ToolBuilderConfig {
  id: string;
  name: string;
  description: string;
  category: keyof typeof TOOL_CATEGORIES | string; // Allow both enum keys and string IDs
  type: ToolType;
  types?: ToolType[];
  tags: string[];
  icon?: string;
  featured?: boolean;
  complexity?: "simple" | "intermediate" | "advanced";
  processing?: ProcessingMode;
}

export function createTool(config: ToolBuilderConfig): StandaloneToolMetadata {
  // Auto-map category if using enum key
  let categoryId = config.category;
  if (config.category in TOOL_CATEGORIES) {
    categoryId =
      TOOL_CATEGORIES[config.category as keyof typeof TOOL_CATEGORIES].id;
  }

  return {
    id: config.id,
    kind: "standalone",
    processing: config.processing ?? "client",
    name: config.name,
    description: config.description,
    category: categoryId,
    type: config.type,
    types: config.types,
    tags: config.tags,
    path: `/tools/${config.id}`,
    icon: config.icon || "🔧",
    featured: config.featured || false,
    complexity: config.complexity || "simple",
  };
}

/**
 * Tool Registry Manager - Helper functions for managing tools
 */
export class ToolRegistryManager {
  private static tools: ToolMetadata[] = [...TOOL_REGISTRY];

  /**
   * Add a new tool to the registry
   */
  static addTool(tool: ToolMetadata | ToolBuilderConfig): void {
    const toolData = "path" in tool ? tool : createTool(tool);

    // Check if tool already exists
    if (this.tools.find((t) => t.id === toolData.id)) {
      console.warn(`Tool with ID "${toolData.id}" already exists`);
      return;
    }

    this.tools.push(toolData);
  }

  /**
   * Add multiple tools at once
   */
  static addTools(tools: (ToolMetadata | ToolBuilderConfig)[]): void {
    tools.forEach((tool) => this.addTool(tool));
  }

  /**
   * Remove a tool by ID
   */
  static removeTool(id: string): boolean {
    const index = this.tools.findIndex((t) => t.id === id);
    if (index >= 0) {
      this.tools.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Update an existing tool
   */
  static updateTool(id: string, updates: Partial<ToolMetadata>): boolean {
    const tool = this.tools.find((t) => t.id === id);
    if (tool) {
      Object.assign(tool, updates);
      return true;
    }
    return false;
  }

  /**
   * Get current registry
   */
  static getRegistry(): ToolMetadata[] {
    return [...this.tools];
  }

  /**
   * Reset registry to original state
   */
  static resetRegistry(): void {
    this.tools = [...TOOL_REGISTRY];
  }

  /**
   * Get tools by filter
   */
  static getTools(filter?: {
    category?: string;
    type?: ToolType;
    featured?: boolean;
    complexity?: "simple" | "intermediate" | "advanced";
    tags?: string[];
  }): ToolMetadata[] {
    if (!filter) return this.getRegistry();

    return this.tools.filter((tool) => {
      if (filter.category && tool.category !== filter.category) return false;
      if (
        filter.type &&
        tool.type !== filter.type &&
        !tool.types?.includes(filter.type)
      )
        return false;
      if (filter.featured !== undefined && tool.featured !== filter.featured)
        return false;
      if (filter.complexity && tool.complexity !== filter.complexity)
        return false;
      if (filter.tags && !filter.tags.some((tag) => tool.tags.includes(tag)))
        return false;
      return true;
    });
  }
}

/**
 * Quick tool creation helpers for common types
 */
export const ToolBuilders = {
  generator: (config: Omit<ToolBuilderConfig, "type">) =>
    createTool({ ...config, type: TOOL_TYPES.GENERATOR }),

  validator: (config: Omit<ToolBuilderConfig, "type">) =>
    createTool({ ...config, type: TOOL_TYPES.VALIDATOR }),

  converter: (config: Omit<ToolBuilderConfig, "type">) =>
    createTool({ ...config, type: TOOL_TYPES.CONVERTER }),

  formatter: (config: Omit<ToolBuilderConfig, "type">) =>
    createTool({ ...config, type: TOOL_TYPES.FORMATTER }),

  encoder: (config: Omit<ToolBuilderConfig, "type">) =>
    createTool({ ...config, type: TOOL_TYPES.ENCODER }),

  analyzer: (config: Omit<ToolBuilderConfig, "type">) =>
    createTool({ ...config, type: TOOL_TYPES.ANALYZER }),

  utility: (config: Omit<ToolBuilderConfig, "type">) =>
    createTool({ ...config, type: TOOL_TYPES.UTILITY }),
};

/**
 * Example usage and templates for common tool patterns
 */
export const ToolTemplates = {
  /**
   * Create a simple text processor tool
   */
  textProcessor: (
    id: string,
    name: string,
    description: string,
    tags: string[],
  ) =>
    ToolBuilders.formatter({
      id,
      name,
      description,
      category: TOOL_CATEGORIES.TEXT_PROCESSING.id,
      tags: ["text", ...tags],
      complexity: "simple",
    }),

  /**
   * Create a data generator tool
   */
  dataGenerator: (
    id: string,
    name: string,
    description: string,
    tags: string[],
  ) =>
    ToolBuilders.generator({
      id,
      name,
      description,
      category: TOOL_CATEGORIES.GENERATORS.id,
      types: [TOOL_TYPES.RANDOM],
      tags: ["generator", "random", ...tags],
      complexity: "simple",
    }),

  /**
   * Create a security tool
   */
  securityTool: (
    id: string,
    name: string,
    description: string,
    tags: string[],
  ) =>
    createTool({
      id,
      name,
      description,
      category: TOOL_CATEGORIES.SECURITY_TOOLS.id,
      type: TOOL_TYPES.SECURITY,
      tags: ["security", ...tags],
      complexity: "intermediate",
    }),

  /**
   * Create a validator tool
   */
  validator: (id: string, name: string, description: string, tags: string[]) =>
    ToolBuilders.validator({
      id,
      name,
      description,
      category: TOOL_CATEGORIES.VALIDATORS.id,
      tags: ["validate", "check", ...tags],
      complexity: "simple",
    }),
};

// Example of how to add new tools
export function addExampleTools() {
  const newTools = [
    ToolTemplates.textProcessor(
      "sql-formatter",
      "SQL Formatter",
      "Format and beautify SQL queries",
      ["sql", "database"],
    ),

    ToolTemplates.dataGenerator(
      "fake-data-generator",
      "Fake Data Generator",
      "Generate realistic fake data for testing",
      ["fake", "mock", "test-data"],
    ),

    ToolTemplates.securityTool(
      "jwt-decoder",
      "JWT Decoder",
      "Decode and verify JSON Web Tokens",
      ["jwt", "token", "decode"],
    ),

    ToolTemplates.validator(
      "credit-card-validator",
      "Credit Card Validator",
      "Validate credit card numbers using Luhn algorithm",
      ["credit-card", "payment", "luhn"],
    ),
  ];

  ToolRegistryManager.addTools(newTools);
  return newTools;
}
