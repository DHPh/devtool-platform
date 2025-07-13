import { ToolType, TOOL_TYPES, TOOL_CATEGORIES } from "./tool-classification";

export interface ToolMetadata {
  id: string;
  name: string;
  description: string;
  category: string; // Category ID from TOOL_CATEGORIES
  type: ToolType; // Primary type classification
  types?: ToolType[]; // Additional types if tool serves multiple purposes
  tags: string[];
  path: string;
  icon?: string;
  featured?: boolean; // Mark as featured tool
  complexity?: "simple" | "intermediate" | "advanced"; // Complexity level
}

export interface Tool {
  metadata: ToolMetadata;
  component: React.ComponentType;
}

// Enhanced Tool registry with new classification system
export const TOOL_REGISTRY: ToolMetadata[] = [
  // Text Processing Tools
  {
    id: "json-formatter",
    name: "JSON Formatter",
    description: "Format and beautify JSON data with syntax highlighting",
    category: TOOL_CATEGORIES.TEXT_PROCESSING.id,
    type: TOOL_TYPES.FORMATTER,
    types: [TOOL_TYPES.VALIDATOR, TOOL_TYPES.PARSER],
    tags: ["json", "formatter", "beautify", "validate"],
    path: "/tools/json-formatter",
    icon: "📄",
    featured: true,
    complexity: "simple",
  },
  {
    id: "html-formatter",
    name: "HTML Formatter",
    description: "Format and beautify HTML code",
    category: TOOL_CATEGORIES.TEXT_PROCESSING.id,
    type: TOOL_TYPES.FORMATTER,
    tags: ["html", "formatter", "beautify"],
    path: "/tools/html-formatter",
    icon: "🌐",
    complexity: "simple",
  },
  {
    id: "css-formatter",
    name: "CSS Formatter",
    description: "Format and beautify CSS code",
    category: TOOL_CATEGORIES.TEXT_PROCESSING.id,
    type: TOOL_TYPES.FORMATTER,
    tags: ["css", "formatter", "beautify"],
    path: "/tools/css-formatter",
    icon: "🎨",
    complexity: "simple",
  },
  {
    id: "markdown-preview",
    name: "Markdown Preview",
    description: "Preview markdown with live editing",
    category: TOOL_CATEGORIES.TEXT_PROCESSING.id,
    type: TOOL_TYPES.VIEWER,
    types: [TOOL_TYPES.EDITOR],
    tags: ["markdown", "preview", "editor"],
    path: "/tools/markdown-preview",
    icon: "📝",
    complexity: "intermediate",
  },
  {
    id: "word-counter",
    name: "Word Counter",
    description: "Count words, characters, lines, and paragraphs",
    category: TOOL_CATEGORIES.TEXT_PROCESSING.id,
    type: TOOL_TYPES.ANALYZER,
    tags: ["word", "count", "character", "text"],
    path: "/tools/word-counter",
    icon: "📊",
    complexity: "simple",
  },
  {
    id: "case-converter",
    name: "Case Converter",
    description: "Convert text between different cases (camelCase, snake_case, etc.)",
    category: TOOL_CATEGORIES.TEXT_PROCESSING.id,
    type: TOOL_TYPES.CONVERTER,
    tags: ["case", "text", "camelcase", "snake"],
    path: "/tools/case-converter",
    icon: "🔤",
    complexity: "simple",
  },
  {
    id: "diff-checker",
    name: "Text Diff Checker",
    description: "Compare two texts and highlight differences",
    category: TOOL_CATEGORIES.TEXT_PROCESSING.id,
    type: TOOL_TYPES.ANALYZER,
    tags: ["diff", "compare", "text"],
    path: "/tools/diff-checker",
    icon: "🔍",
    complexity: "intermediate",
  },

  // Encoding & Decoding Tools
  {
    id: "base64-encoder",
    name: "Base64 Encoder/Decoder",
    description: "Encode and decode Base64 strings",
    category: TOOL_CATEGORIES.ENCODING_DECODING.id,
    type: TOOL_TYPES.ENCODER,
    types: [TOOL_TYPES.DECODER],
    tags: ["base64", "encode", "decode"],
    path: "/tools/base64-encoder",
    icon: "🔐",
    featured: true,
    complexity: "simple",
  },
  {
    id: "url-encoder",
    name: "URL Encoder/Decoder",
    description: "Encode and decode URLs",
    category: TOOL_CATEGORIES.ENCODING_DECODING.id,
    type: TOOL_TYPES.ENCODER,
    types: [TOOL_TYPES.DECODER],
    tags: ["url", "encode", "decode"],
    path: "/tools/url-encoder",
    icon: "🌐",
    featured: true,
    complexity: "simple",
  },
  {
    id: "html-entities",
    name: "HTML Entities",
    description: "Encode and decode HTML entities",
    category: TOOL_CATEGORIES.ENCODING_DECODING.id,
    type: TOOL_TYPES.ENCODER,
    types: [TOOL_TYPES.DECODER],
    tags: ["html", "entities", "encode", "decode"],
    path: "/tools/html-entities",
    icon: "🏷️",
    complexity: "simple",
  },

  // Generators
  {
    id: "uuid-generator",
    name: "UUID Generator",
    description: "Generate UUID v1, v4, and other versions",
    category: TOOL_CATEGORIES.GENERATORS.id,
    type: TOOL_TYPES.GENERATOR,
    types: [TOOL_TYPES.RANDOM],
    tags: ["uuid", "generator", "random"],
    path: "/tools/uuid-generator",
    icon: "🆔",
    featured: true,
    complexity: "simple",
  },
  {
    id: "password-generator",
    name: "Password Generator",
    description: "Generate secure passwords with customizable options",
    category: TOOL_CATEGORIES.GENERATORS.id,
    type: TOOL_TYPES.GENERATOR,
    types: [TOOL_TYPES.RANDOM, TOOL_TYPES.SECURITY],
    tags: ["password", "generator", "security"],
    path: "/tools/password-generator",
    icon: "🔑",
    featured: true,
    complexity: "simple",
  },
  {
    id: "lorem-ipsum",
    name: "Lorem Ipsum Generator",
    description: "Generate placeholder text in various formats",
    category: TOOL_CATEGORIES.GENERATORS.id,
    type: TOOL_TYPES.GENERATOR,
    types: [TOOL_TYPES.RANDOM],
    tags: ["lorem", "ipsum", "placeholder", "text"],
    path: "/tools/lorem-ipsum",
    icon: "📃",
    complexity: "simple",
  },
  {
    id: "qr-generator",
    name: "QR Code Generator",
    description: "Generate QR codes for text, URLs, and more",
    category: TOOL_CATEGORIES.GENERATORS.id,
    type: TOOL_TYPES.GENERATOR,
    tags: ["qr", "code", "generator"],
    path: "/tools/qr-generator",
    icon: "📱",
    complexity: "intermediate",
  },

  // Data Conversion
  {
    id: "timestamp-converter",
    name: "Timestamp Converter",
    description: "Convert between Unix timestamp and human-readable dates",
    category: TOOL_CATEGORIES.DATA_CONVERSION.id,
    type: TOOL_TYPES.CONVERTER,
    tags: ["timestamp", "date", "unix", "converter"],
    path: "/tools/timestamp-converter",
    icon: "⏰",
    featured: true,
    complexity: "simple",
  },
  {
    id: "color-converter",
    name: "Color Converter",
    description: "Convert between HEX, RGB, HSL, and other color formats",
    category: TOOL_CATEGORIES.DATA_CONVERSION.id,
    type: TOOL_TYPES.CONVERTER,
    tags: ["color", "hex", "rgb", "hsl"],
    path: "/tools/color-converter",
    icon: "🎨",
    featured: true,
    complexity: "simple",
  },

  // Validators
  {
    id: "regex-tester",
    name: "Regex Tester",
    description: "Test regular expressions with real-time matching",
    category: TOOL_CATEGORIES.VALIDATORS.id,
    type: TOOL_TYPES.VALIDATOR,
    types: [TOOL_TYPES.ANALYZER],
    tags: ["regex", "regexp", "test", "validate"],
    path: "/tools/regex-tester",
    icon: "🔍",
    featured: true,
    complexity: "advanced",
  },
  {
    id: "json-validator",
    name: "JSON Validator",
    description: "Validate JSON syntax and structure",
    category: TOOL_CATEGORIES.VALIDATORS.id,
    type: TOOL_TYPES.VALIDATOR,
    tags: ["json", "validator", "syntax"],
    path: "/tools/json-validator",
    icon: "✅",
    complexity: "simple",
  },
  {
    id: "email-validator",
    name: "Email Validator",
    description: "Validate email addresses",
    category: TOOL_CATEGORIES.VALIDATORS.id,
    type: TOOL_TYPES.VALIDATOR,
    tags: ["email", "validator", "validation"],
    path: "/tools/email-validator",
    icon: "📧",
    complexity: "simple",
  },

  // Data Analysis
  {
    id: "csv-viewer",
    name: "CSV Viewer",
    description: "Upload and view CSV files with interactive table features",
    category: TOOL_CATEGORIES.DATA_ANALYSIS.id,
    type: TOOL_TYPES.VIEWER,
    types: [TOOL_TYPES.ANALYZER],
    tags: ["csv", "table", "data", "viewer"],
    path: "/tools/csv-viewer",
    icon: "📊",
    complexity: "intermediate",
  },
  {
    id: "json-table-viewer",
    name: "JSON Table Viewer",
    description: "Convert JSON data to interactive table with filtering and sorting",
    category: TOOL_CATEGORIES.DATA_ANALYSIS.id,
    type: TOOL_TYPES.VIEWER,
    types: [TOOL_TYPES.CONVERTER, TOOL_TYPES.ANALYZER],
    tags: ["json", "table", "data", "viewer"],
    path: "/tools/json-table-viewer",
    icon: "🗂️",
    complexity: "intermediate",
  },
  {
    id: "data-explorer",
    name: "Data Explorer",
    description: "Advanced data analysis with statistics, filtering, and visualization",
    category: TOOL_CATEGORIES.DATA_ANALYSIS.id,
    type: TOOL_TYPES.ANALYZER,
    types: [TOOL_TYPES.VIEWER],
    tags: ["data", "analysis", "statistics", "explorer"],
    path: "/tools/data-explorer",
    icon: "🔍",
    complexity: "advanced",
  },

  // Security Tools
  {
    id: "hash-generator",
    name: "Hash Generator",
    description: "Generate MD5, SHA1, SHA256, and other hash values",
    category: TOOL_CATEGORIES.SECURITY_TOOLS.id,
    type: TOOL_TYPES.GENERATOR,
    types: [TOOL_TYPES.SECURITY],
    tags: ["hash", "md5", "sha1", "sha256", "security"],
    path: "/tools/hash-generator",
    icon: "🔒",
    complexity: "simple",
  },
];

// Helper functions
export function getToolById(id: string): ToolMetadata | undefined {
  return TOOL_REGISTRY.find((tool) => tool.id === id);
}

export function getToolsByCategory(category: string): ToolMetadata[] {
  return TOOL_REGISTRY.filter((tool) => tool.category === category);
}

export function getToolsByType(type: ToolType): ToolMetadata[] {
  return TOOL_REGISTRY.filter((tool) => 
    tool.type === type || (tool.types && tool.types.includes(type))
  );
}

export function getToolsByComplexity(complexity: "simple" | "intermediate" | "advanced"): ToolMetadata[] {
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
      (tool.types && tool.types.some(type => type.toLowerCase().includes(searchTerm)))
  );
}

export function getToolsByTags(tags: string[]): ToolMetadata[] {
  return TOOL_REGISTRY.filter((tool) =>
    tags.some((tag) => tool.tags.includes(tag))
  );
}

// Get all unique types from registry
export function getAllToolTypes(): ToolType[] {
  const types = new Set<ToolType>();
  TOOL_REGISTRY.forEach(tool => {
    types.add(tool.type);
    if (tool.types) {
      tool.types.forEach(type => types.add(type));
    }
  });
  return Array.from(types);
}

// Statistics functions
export function getToolStatistics() {
  const totalTools = TOOL_REGISTRY.length;
  const featuredTools = getFeaturedTools().length;
  const categoryCounts = Object.values(TOOL_CATEGORIES).map(category => ({
    category: category.name,
    count: getToolsByCategory(category.id).length
  }));
  const typeCounts = getAllToolTypes().map(type => ({
    type,
    count: getToolsByType(type).length
  }));
  
  return {
    totalTools,
    featuredTools,
    categoryCounts,
    typeCounts
  };
}
