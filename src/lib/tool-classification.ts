// Tool type classifications for better categorization
export const TOOL_TYPES = {
  GENERATOR: "generator",
  VALIDATOR: "validator",
  CONVERTER: "converter",
  FORMATTER: "formatter",
  ENCODER: "encoder",
  DECODER: "decoder",
  PARSER: "parser",
  ANALYZER: "analyzer",
  CALCULATOR: "calculator",
  RANDOM: "random",
  SECURITY: "security",
  UTILITY: "utility",
  VIEWER: "viewer",
  EDITOR: "editor",
} as const;

export type ToolType = (typeof TOOL_TYPES)[keyof typeof TOOL_TYPES];

// Enhanced categories with better organization
export const TOOL_CATEGORIES = {
  TEXT_PROCESSING: {
    id: "text-processing",
    name: "Text Processing",
    description: "Tools for text manipulation, formatting, and analysis",
    icon: "📝",
  },
  DATA_CONVERSION: {
    id: "data-conversion",
    name: "Data Conversion",
    description: "Convert between different data formats and encodings",
    icon: "🔄",
  },
  GENERATORS: {
    id: "generators",
    name: "Generators",
    description: "Generate random data, IDs, passwords, and more",
    icon: "🎲",
  },
  VALIDATORS: {
    id: "validators",
    name: "Validators",
    description: "Validate data formats, syntax, and structure",
    icon: "✅",
  },
  SECURITY_TOOLS: {
    id: "security-tools",
    name: "Security Tools",
    description: "Hash generators, password tools, and security utilities",
    icon: "🔒",
  },
  WEB_DEVELOPMENT: {
    id: "web-development",
    name: "Web Development",
    description: "Tools for web developers and frontend development",
    icon: "🌐",
  },
  API_TESTING: {
    id: "api-testing",
    name: "API & Testing",
    description: "Tools for API testing, debugging, and development",
    icon: "🧪",
  },
  UTILITIES: {
    id: "utilities",
    name: "Utilities",
    description: "General purpose utilities and helper tools",
    icon: "🛠️",
  },
  DATA_ANALYSIS: {
    id: "data-analysis",
    name: "Data Analysis",
    description: "Tools for data visualization and analysis",
    icon: "📊",
  },
  ENCODING_DECODING: {
    id: "encoding-decoding",
    name: "Encoding & Decoding",
    description: "Encode and decode various data formats",
    icon: "🔐",
  },
} as const;

export type ToolCategoryId = keyof typeof TOOL_CATEGORIES;
export type ToolCategoryInfo = (typeof TOOL_CATEGORIES)[ToolCategoryId];

// Helper functions to get category information
export function getCategoryInfo(categoryId: string): ToolCategoryInfo | null {
  const category = Object.values(TOOL_CATEGORIES).find(
    (cat) => cat.id === categoryId
  );
  return category || null;
}

export function getAllCategories(): ToolCategoryInfo[] {
  return Object.values(TOOL_CATEGORIES);
}

export function getCategoryIds(): string[] {
  return Object.values(TOOL_CATEGORIES).map((cat) => cat.id);
}

// Tag groups for easier organization
export const TAG_GROUPS = {
  FORMATS: [
    "json",
    "xml",
    "yaml",
    "csv",
    "html",
    "css",
    "javascript",
    "markdown",
  ],
  ENCODING: ["base64", "url", "html-entities", "unicode", "ascii"],
  SECURITY: ["hash", "password", "encryption", "jwt", "ssl"],
  GENERATORS: ["uuid", "random", "password", "data", "mock"],
  TEXT: ["case", "word-count", "diff", "regex", "search"],
  WEB: ["cors", "http", "api", "websocket", "url"],
  DATA: ["statistics", "analysis", "visualization", "export"],
  DEVELOPMENT: ["debug", "format", "validate", "test", "mock"],
} as const;

export type TagGroup = keyof typeof TAG_GROUPS;
export type TagName = (typeof TAG_GROUPS)[TagGroup][number];

// Helper to get all tags from a group
export function getTagsByGroup(group: TagGroup): readonly string[] {
  return TAG_GROUPS[group];
}

// Helper to find which group a tag belongs to
export function getTagGroup(tag: string): TagGroup | null {
  for (const [group, tags] of Object.entries(TAG_GROUPS)) {
    if ((tags as readonly string[]).includes(tag)) {
      return group as TagGroup;
    }
  }
  return null;
}
