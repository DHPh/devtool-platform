export interface ToolMetadata {
  id: string;
  name: string;
  description: string;
  category: string;
  functionalType: string; // New: generator, validator, converter, etc.
  contentType: string; // New: text, data, media, etc.
  tags: string[];
  path: string;
  icon?: string;
}

export interface Tool {
  metadata: ToolMetadata;
  component: React.ComponentType;
}

// Primary categories (broad classification)
export const TOOL_CATEGORIES = [
  "Text & Format",
  "Encoding & Decoding", 
  "Generators",
  "Converters",
  "Validators",
  "Utilities",
  "Development",
  "Security",
  "Data Processing",
  "Network & Web",
] as const;

// Functional types (what the tool does)
export const FUNCTIONAL_TYPES = [
  "Generator",
  "Validator", 
  "Converter",
  "Formatter",
  "Encoder/Decoder",
  "Analyzer",
  "Calculator",
  "Transformer",
  "Minifier",
  "Parser",
  "Tester",
] as const;

// Content types (what kind of data it works with)
export const CONTENT_TYPES = [
  "Text",
  "JSON", 
  "HTML/CSS",
  "JavaScript",
  "Data",
  "Images", 
  "URLs",
  "Dates/Time",
  "Numbers",
  "Security",
  "Random",
  "Files",
] as const;

export type ToolCategory = (typeof TOOL_CATEGORIES)[number];
export type FunctionalType = (typeof FUNCTIONAL_TYPES)[number];
export type ContentType = (typeof CONTENT_TYPES)[number];

// Tool registry
export const TOOL_REGISTRY: ToolMetadata[] = [
  // Text & Format
  {
    id: "json-formatter",
    name: "JSON Formatter",
    description: "Format and beautify JSON data with syntax highlighting",
    category: "Text & Format",
    functionalType: "Formatter",
    contentType: "JSON",
    tags: ["json", "formatter", "beautify", "validate"],
    path: "/tools/json-formatter",
    icon: "📄",
  },
  {
    id: "html-formatter",
    name: "HTML Formatter",
    description: "Format and beautify HTML code",
    category: "Text & Format",
    tags: ["html", "formatter", "beautify"],
    path: "/tools/html-formatter",
    icon: "🌐",
  },
  {
    id: "css-formatter",
    name: "CSS Formatter",
    description: "Format and beautify CSS code",
    category: "Text & Format",
    tags: ["css", "formatter", "beautify"],
    path: "/tools/css-formatter",
    icon: "🎨",
  },
  {
    id: "markdown-preview",
    name: "Markdown Preview",
    description: "Preview markdown with live editing",
    category: "Text & Format",
    tags: ["markdown", "preview", "editor"],
    path: "/tools/markdown-preview",
    icon: "📝",
  },

  // Encoding & Decoding
  {
    id: "base64-encoder",
    name: "Base64 Encoder/Decoder",
    description: "Encode and decode Base64 strings",
    category: "Encoding & Decoding",
    tags: ["base64", "encode", "decode"],
    path: "/tools/base64-encoder",
    icon: "🔤",
  },
  {
    id: "url-encoder",
    name: "URL Encoder/Decoder",
    description: "Encode and decode URLs",
    category: "Encoding & Decoding",
    tags: ["url", "encode", "decode"],
    path: "/tools/url-encoder",
    icon: "🔗",
  },
  {
    id: "html-entities",
    name: "HTML Entities",
    description: "Encode and decode HTML entities",
    category: "Encoding & Decoding",
    tags: ["html", "entities", "encode", "decode"],
    path: "/tools/html-entities",
    icon: "🏷️",
  },

  // Generators
  {
    id: "uuid-generator",
    name: "UUID Generator",
    description: "Generate UUID v1, v4, and other versions",
    category: "Generators",
    tags: ["uuid", "generator", "random"],
    path: "/tools/uuid-generator",
    icon: "🆔",
  },
  {
    id: "password-generator",
    name: "Password Generator",
    description: "Generate secure passwords with customizable options",
    category: "Generators",
    tags: ["password", "generator", "security"],
    path: "/tools/password-generator",
    icon: "🔐",
  },
  {
    id: "lorem-ipsum",
    name: "Lorem Ipsum Generator",
    description: "Generate placeholder text in various formats",
    category: "Generators",
    tags: ["lorem", "ipsum", "placeholder", "text"],
    path: "/tools/lorem-ipsum",
    icon: "📃",
  },

  // Converters
  {
    id: "timestamp-converter",
    name: "Timestamp Converter",
    description: "Convert between Unix timestamp and human-readable dates",
    category: "Converters",
    tags: ["timestamp", "date", "unix", "converter"],
    path: "/tools/timestamp-converter",
    icon: "⏰",
  },
  {
    id: "color-converter",
    name: "Color Converter",
    description: "Convert between HEX, RGB, HSL, and other color formats",
    category: "Converters",
    tags: ["color", "hex", "rgb", "hsl", "converter"],
    path: "/tools/color-converter",
    icon: "🎨",
  },
  {
    id: "case-converter",
    name: "Case Converter",
    description:
      "Convert text between different cases (camelCase, snake_case, etc.)",
    category: "Converters",
    tags: ["case", "converter", "camel", "snake", "kebab"],
    path: "/tools/case-converter",
    icon: "🔠",
  },

  // Validators
  {
    id: "regex-tester",
    name: "Regex Tester",
    description: "Test regular expressions with real-time matching",
    category: "Validators",
    tags: ["regex", "regexp", "test", "validation"],
    path: "/tools/regex-tester",
    icon: "🔍",
  },
  {
    id: "json-validator",
    name: "JSON Validator",
    description: "Validate JSON syntax and structure",
    category: "Validators",
    tags: ["json", "validator", "syntax"],
    path: "/tools/json-validator",
    icon: "✅",
  },
  {
    id: "email-validator",
    name: "Email Validator",
    description: "Validate email addresses",
    category: "Validators",
    tags: ["email", "validator", "validation"],
    path: "/tools/email-validator",
    icon: "📧",
  },

  // Utilities
  {
    id: "qr-generator",
    name: "QR Code Generator",
    description: "Generate QR codes for text, URLs, and more",
    category: "Utilities",
    tags: ["qr", "code", "generator"],
    path: "/tools/qr-generator",
    icon: "📱",
  },
  {
    id: "diff-checker",
    name: "Text Diff Checker",
    description: "Compare two texts and highlight differences",
    category: "Utilities",
    tags: ["diff", "compare", "text"],
    path: "/tools/diff-checker",
    icon: "🔍",
  },
  {
    id: "word-counter",
    name: "Word Counter",
    description: "Count words, characters, lines, and paragraphs",
    category: "Utilities",
    tags: ["word", "count", "character", "text"],
    path: "/tools/word-counter",
    icon: "📊",
  },

  // Data Processing
  {
    id: "csv-viewer",
    name: "CSV Viewer",
    description: "Upload and view CSV files with interactive table features",
    category: "Data Processing",
    tags: ["csv", "table", "data", "viewer"],
    path: "/tools/csv-viewer",
    icon: "📊",
  },
  {
    id: "json-table-viewer",
    name: "JSON Table Viewer",
    description:
      "Convert JSON data to interactive table with filtering and sorting",
    category: "Data Processing",
    tags: ["json", "table", "data", "viewer"],
    path: "/tools/json-table-viewer",
    icon: "🗂️",
  },
  {
    id: "data-explorer",
    name: "Data Explorer",
    description:
      "Advanced data analysis with statistics, filtering, and visualization",
    category: "Data Processing",
    tags: ["data", "analysis", "statistics", "explorer"],
    path: "/tools/data-explorer",
    icon: "🔍",
  },
];

export function getToolById(id: string): ToolMetadata | undefined {
  return TOOL_REGISTRY.find((tool) => tool.id === id);
}

export function getToolsByCategory(category: string): ToolMetadata[] {
  return TOOL_REGISTRY.filter((tool) => tool.category === category);
}

export function searchTools(query: string): ToolMetadata[] {
  const searchTerm = query.toLowerCase();
  return TOOL_REGISTRY.filter(
    (tool) =>
      tool.name.toLowerCase().includes(searchTerm) ||
      tool.description.toLowerCase().includes(searchTerm) ||
      tool.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
  );
}
