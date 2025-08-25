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
  parent?: string; // Optional parent tool id for sub-tools in suites
}

export interface Tool {
  metadata: ToolMetadata;
  component: React.ComponentType;
}

// Tool registry with enhanced classification
export const TOOL_REGISTRY: ToolMetadata[] = [
  // Text & Format
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
    featured: false,
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
    description:
      "Convert text between different cases (camelCase, snake_case, etc.)",
    category: TOOL_CATEGORIES.TEXT_PROCESSING.id,
    type: TOOL_TYPES.CONVERTER,
    tags: ["case", "converter", "camel", "snake", "kebab"],
    path: "/tools/case-converter",
    icon: "🔠",
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

  // Encoding & Decoding
  {
    id: "base64-encoder",
    name: "Base64 Encoder/Decoder",
    description: "Encode and decode Base64 strings",
    category: TOOL_CATEGORIES.ENCODING_DECODING.id,
    type: TOOL_TYPES.ENCODER,
    types: [TOOL_TYPES.DECODER],
    tags: ["base64", "encode", "decode"],
    path: "/tools/base64-encoder",
    icon: "🔤",
    featured: false,
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
    icon: "🔗",
    featured: false,
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
    id: "password-studio",
    name: "Password Studio",
    description:
      "Comprehensive password generation, analysis, and security toolkit",
    category: TOOL_CATEGORIES.GENERATORS.id,
    type: TOOL_TYPES.GENERATOR,
    types: [TOOL_TYPES.RANDOM, TOOL_TYPES.SECURITY, TOOL_TYPES.ANALYZER],
    tags: ["password", "generator", "security", "analysis", "passphrase"],
    path: "/tools/password-studio",
    icon: "🔐",
    featured: true,
    complexity: "intermediate",
  },
  // Sub-tools for Password Studio
  {
    id: "password-generator",
    name: "Password Generator",
    description: "Generate secure passwords with customizable options",
    category: TOOL_CATEGORIES.GENERATORS.id,
    type: TOOL_TYPES.GENERATOR,
    tags: ["password", "generator", "security"],
    path: "/tools/password-studio?tab=generator",
    icon: "�",
    featured: false,
    complexity: "simple",
    parent: "password-studio",
  },
  {
    id: "passphrase-generator",
    name: "Passphrase Generator",
    description: "Generate secure passphrases using random words",
    category: TOOL_CATEGORIES.GENERATORS.id,
    type: TOOL_TYPES.GENERATOR,
    tags: ["passphrase", "generator", "security", "words"],
    path: "/tools/password-studio?tab=passphrase",
    icon: "�",
    featured: false,
    complexity: "simple",
    parent: "password-studio",
  },
  {
    id: "password-analysis",
    name: "Password Analysis",
    description: "Analyze password strength, entropy, and check for breaches",
    category: TOOL_CATEGORIES.GENERATORS.id,
    type: TOOL_TYPES.ANALYZER,
    tags: ["password", "analysis", "security", "entropy", "breach"],
    path: "/tools/password-studio?tab=analysis",
    icon: "�️",
    featured: false,
    complexity: "intermediate",
    parent: "password-studio",
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
    id: "color-studio",
    name: "Color Studio",
    description:
      "Complete color toolkit with advanced features for designers and developers",
    category: TOOL_CATEGORIES.WEB_DEVELOPMENT.id,
    type: TOOL_TYPES.GENERATOR,
    types: [TOOL_TYPES.CONVERTER, TOOL_TYPES.GENERATOR, TOOL_TYPES.ANALYZER],
    tags: [
      "color",
      "hex",
      "rgb",
      "hsl",
      "hsv",
      "cmyk",
      "palette",
      "gradient",
      "contrast",
      "accessibility",
      "wcag",
      "colorblind",
      "studio",
    ],
    path: "/tools/color-studio",
    icon: "🎨",
    featured: true,
    complexity: "advanced",
  },
  {
    id: "color-converter",
    name: "Color Converter",
    description:
      "Convert colors between different formats (HEX, RGB, HSL, HSV, CMYK)",
    category: TOOL_CATEGORIES.DATA_CONVERSION.id,
    type: TOOL_TYPES.CONVERTER,
    tags: ["color", "hex", "rgb", "hsl", "hsv", "cmyk", "converter"],
    path: "/tools/color-studio?tab=converter",
    icon: "🔄",
    parent: "color-studio",
    complexity: "simple",
  },
  {
    id: "color-picker",
    name: "Color Picker",
    description: "Interactive color picker with sliders and presets",
    category: TOOL_CATEGORIES.WEB_DEVELOPMENT.id,
    type: TOOL_TYPES.GENERATOR,
    tags: ["color", "picker", "interactive", "hsl", "rgb", "hsv"],
    path: "/tools/color-studio?tab=picker",
    icon: "🎯",
    parent: "color-studio",
    complexity: "simple",
  },
  {
    id: "palette-generator",
    name: "Palette Generator",
    description: "Generate color palettes using color theory principles",
    category: TOOL_CATEGORIES.WEB_DEVELOPMENT.id,
    type: TOOL_TYPES.GENERATOR,
    tags: [
      "color",
      "palette",
      "harmony",
      "monochromatic",
      "complementary",
      "triadic",
    ],
    path: "/tools/color-studio?tab=palette",
    icon: "🎨",
    parent: "color-studio",
    complexity: "intermediate",
  },
  {
    id: "gradient-creator",
    name: "Gradient Creator",
    description: "Create CSS gradients with visual controls and code export",
    category: TOOL_CATEGORIES.WEB_DEVELOPMENT.id,
    type: TOOL_TYPES.GENERATOR,
    tags: ["gradient", "css", "linear", "radial", "conic", "design"],
    path: "/tools/color-studio?tab=gradient",
    icon: "🌈",
    parent: "color-studio",
    complexity: "intermediate",
  },
  {
    id: "icon-pack-generator",
    name: "Icon Pack Generator",
    description:
      "Generate professional icon packs for Android and iOS from high-quality images",
    category: TOOL_CATEGORIES.WEB_DEVELOPMENT.id,
    type: TOOL_TYPES.GENERATOR,
    tags: ["icon", "android", "ios", "mobile", "app", "pack", "generator"],
    path: "/tools/icon-pack-generator",
    icon: "📱",
    featured: true,
    complexity: "intermediate",
  },
  {
    id: "contrast-checker",
    name: "Contrast Checker",
    description:
      "Check color contrast ratios for WCAG accessibility compliance",
    category: TOOL_CATEGORIES.VALIDATORS.id,
    type: TOOL_TYPES.ANALYZER,
    tags: ["contrast", "accessibility", "wcag", "aa", "aaa", "compliance"],
    path: "/tools/color-studio?tab=contrast",
    icon: "⚖️",
    parent: "color-studio",
    complexity: "intermediate",
  },
  {
    id: "color-blindness-simulator",
    name: "Color Blindness Simulator",
    description:
      "Simulate how colors appear to users with different types of color blindness",
    category: TOOL_CATEGORIES.VALIDATORS.id,
    type: TOOL_TYPES.ANALYZER,
    tags: [
      "colorblind",
      "accessibility",
      "simulation",
      "protanopia",
      "deuteranopia",
      "tritanopia",
    ],
    path: "/tools/color-studio?tab=colorblind",
    icon: "👁️",
    parent: "color-studio",
    complexity: "intermediate",
  },
  {
    id: "accessibility-palette",
    name: "Accessibility Palette",
    description:
      "Generate color palettes that are accessible to users with color blindness",
    category: TOOL_CATEGORIES.VALIDATORS.id,
    type: TOOL_TYPES.ANALYZER,
    tags: [
      "colorblind",
      "accessibility",
      "simulation",
      "protanopia",
      "deuteranopia",
      "tritanopia",
    ],
    path: "/tools/color-studio?tab=accessibility-palette",
    icon: "♿",
    parent: "color-studio",
    complexity: "intermediate",
  },

  // Validators
  {
    id: "regex-studio",
    name: "Regex Studio",
    description:
      "Comprehensive regex toolkit for testing, replacing, and exploring patterns",
    category: TOOL_CATEGORIES.VALIDATORS.id,
    type: TOOL_TYPES.VALIDATOR,
    types: [TOOL_TYPES.ANALYZER, TOOL_TYPES.FORMATTER],
    tags: ["regex", "regexp", "test", "validation", "replace", "patterns"],
    path: "/tools/regex-studio",
    icon: "🔍",
    featured: true,
    complexity: "advanced",
  },
  // Sub-tools for Regex Studio Suite
  {
    id: "regex-tester",
    name: "Regex Tester (Studio)",
    description:
      "Test regular expressions with real-time matching and highlighting",
    category: TOOL_CATEGORIES.VALIDATORS.id,
    type: TOOL_TYPES.VALIDATOR,
    tags: ["regex", "test", "validation", "matches"],
    path: "/tools/regex-studio?tab=tester",
    icon: "🧪",
    featured: false,
    complexity: "intermediate",
    parent: "regex-studio",
  },
  {
    id: "regex-replace",
    name: "Regex Replace",
    description: "Find & replace text using regex patterns with preview",
    category: TOOL_CATEGORIES.VALIDATORS.id,
    type: TOOL_TYPES.ANALYZER,
    tags: ["regex", "replace", "find", "text", "substitute"],
    path: "/tools/regex-studio?tab=replace",
    icon: "✂️",
    featured: false,
    complexity: "intermediate",
    parent: "regex-studio",
  },
  {
    id: "regex-library",
    name: "Regex Pattern Library",
    description: "Browse and use common regex patterns for various use cases",
    category: TOOL_CATEGORIES.VALIDATORS.id,
    type: TOOL_TYPES.ANALYZER,
    tags: ["regex", "patterns", "library", "examples", "common"],
    path: "/tools/regex-studio?tab=library",
    icon: "📚",
    featured: true,
    complexity: "simple",
    parent: "regex-studio",
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
    id: "json-studio",
    name: "JSON Studio",
    description:
      "Complete JSON processing toolkit with formatting, validation, path querying, schema validation, and diff comparison",
    category: TOOL_CATEGORIES.TEXT_PROCESSING.id,
    type: TOOL_TYPES.FORMATTER,
    types: [TOOL_TYPES.VALIDATOR, TOOL_TYPES.ANALYZER, TOOL_TYPES.CONVERTER],
    tags: [
      "json",
      "studio",
      "formatter",
      "validator",
      "path",
      "schema",
      "diff",
    ],
    path: "/tools/json-studio",
    icon: "✨",
    featured: true,
    complexity: "advanced",
  },
  // Sub-tools for JSON Studio Suite
  {
    id: "json-formatter-studio",
    name: "JSON Formatter (Studio)",
    description: "Format, prettify, and minify JSON with advanced options",
    category: TOOL_CATEGORIES.TEXT_PROCESSING.id,
    type: TOOL_TYPES.FORMATTER,
    tags: ["json", "formatter", "prettify", "minify"],
    path: "/tools/json-studio?tab=formatter",
    icon: "📄",
    featured: false,
    complexity: "simple",
    parent: "json-studio",
  },
  {
    id: "json-path-query",
    name: "JSONPath Query",
    description: "Query and explore JSON data using JSONPath expressions",
    category: TOOL_CATEGORIES.DATA_ANALYSIS.id,
    type: TOOL_TYPES.ANALYZER,
    tags: ["json", "path", "query", "jsonpath", "explorer"],
    path: "/tools/json-studio?tab=path",
    icon: "🔍",
    featured: false,
    complexity: "intermediate",
    parent: "json-studio",
  },
  {
    id: "json-schema-validator",
    name: "JSON Schema Validator",
    description: "Validate JSON against schemas and generate schemas from data",
    category: TOOL_CATEGORIES.VALIDATORS.id,
    type: TOOL_TYPES.VALIDATOR,
    tags: ["json", "schema", "validator", "generation"],
    path: "/tools/json-studio?tab=schema",
    icon: "🛡️",
    featured: false,
    complexity: "advanced",
    parent: "json-studio",
  },
  {
    id: "json-diff-compare",
    name: "JSON Diff Compare",
    description:
      "Compare two JSON objects and visualize differences with patch generation",
    category: TOOL_CATEGORIES.DATA_ANALYSIS.id,
    type: TOOL_TYPES.ANALYZER,
    tags: ["json", "diff", "compare", "patch", "changes"],
    path: "/tools/json-studio?tab=diff",
    icon: "🔄",
    featured: false,
    complexity: "intermediate",
    parent: "json-studio",
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
    description:
      "Convert JSON data to interactive table with filtering and sorting",
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
    description:
      "Advanced data analysis with statistics, filtering, and visualization",
    category: TOOL_CATEGORIES.DATA_ANALYSIS.id,
    type: TOOL_TYPES.ANALYZER,
    types: [TOOL_TYPES.VIEWER],
    tags: ["data", "analysis", "statistics", "explorer"],
    path: "/tools/data-explorer",
    icon: "🔍",
    complexity: "advanced",
  },
  {
    id: "random-wheel",
    name: "Random Wheel",
    description: "Spin a wheel to randomly select from your list of options",
    category: TOOL_CATEGORIES.UTILITIES.id,
    type: TOOL_TYPES.RANDOM,
    types: [TOOL_TYPES.UTILITY],
    tags: ["random", "wheel", "picker", "decision", "spinner"],
    path: "/tools/random-wheel",
    icon: "🎯",
    complexity: "simple",
  },

  // Network Studio
  {
    id: "network-studio",
    name: "Network Studio",
    description:
      "Comprehensive network testing and analysis toolkit with 10 professional tools",
    category: TOOL_CATEGORIES.API_TESTING.id,
    type: TOOL_TYPES.UTILITY,
    types: [TOOL_TYPES.ANALYZER, TOOL_TYPES.VALIDATOR],
    tags: ["network", "testing", "analysis", "suite", "professional"],
    path: "/tools/network-studio",
    icon: "🌐",
    featured: true,
    complexity: "advanced",
  },

  // Network Studio Sub-tools (accessible via URL parameters)
  {
    id: "api-tester",
    name: "API Tester",
    description:
      "REST API testing tool with request builder and cURL import/export",
    category: TOOL_CATEGORIES.API_TESTING.id,
    type: TOOL_TYPES.UTILITY,
    types: [TOOL_TYPES.VALIDATOR],
    tags: ["api", "rest", "testing", "curl", "requests"],
    path: "/tools/network-studio?tab=api-tester",
    icon: "🌍",
    complexity: "intermediate",
    parent: "network-studio",
  },

  {
    id: "http-client",
    name: "HTTP Client",
    description: "HTTP request builder with headers and response analysis",
    category: TOOL_CATEGORIES.API_TESTING.id,
    type: TOOL_TYPES.UTILITY,
    tags: ["http", "client", "requests", "headers"],
    path: "/tools/network-studio?tab=http-client",
    icon: "📡",
    complexity: "intermediate",
    parent: "network-studio",
  },

  {
    id: "websocket-tester",
    name: "WebSocket Tester",
    description: "Test WebSocket connections with real-time messaging",
    category: TOOL_CATEGORIES.API_TESTING.id,
    type: TOOL_TYPES.UTILITY,
    types: [TOOL_TYPES.VALIDATOR],
    tags: ["websocket", "realtime", "testing", "connections"],
    path: "/tools/network-studio?tab=websocket",
    icon: "📻",
    complexity: "intermediate",
    parent: "network-studio",
  },

  {
    id: "dns-lookup",
    name: "DNS Lookup",
    description: "DNS record lookup with WHOIS information and validation",
    category: TOOL_CATEGORIES.UTILITIES.id,
    type: TOOL_TYPES.ANALYZER,
    types: [TOOL_TYPES.VALIDATOR],
    tags: ["dns", "lookup", "whois", "domain", "records"],
    path: "/tools/network-studio?tab=dns-lookup",
    icon: "🔍",
    complexity: "intermediate",
    parent: "network-studio",
  },

  {
    id: "ip-info",
    name: "IP Information",
    description:
      "Get detailed IP address information including geolocation and ISP",
    category: TOOL_CATEGORIES.UTILITIES.id,
    type: TOOL_TYPES.ANALYZER,
    tags: ["ip", "geolocation", "isp", "information"],
    path: "/tools/network-studio?tab=ip-info",
    icon: "📍",
    complexity: "simple",
    parent: "network-studio",
  },

  {
    id: "port-scanner",
    name: "Port Scanner",
    description:
      "Network port scanner with predefined profiles and custom ranges",
    category: TOOL_CATEGORIES.SECURITY_TOOLS.id,
    type: TOOL_TYPES.ANALYZER,
    types: [TOOL_TYPES.SECURITY],
    tags: ["port", "scanner", "security", "network", "profiles"],
    path: "/tools/network-studio?tab=port-scanner",
    icon: "🛡️",
    complexity: "advanced",
    parent: "network-studio",
  },

  {
    id: "network-monitor",
    name: "Network Monitor",
    description:
      "Monitor network performance with ping tests and speed analysis",
    category: TOOL_CATEGORIES.UTILITIES.id,
    type: TOOL_TYPES.ANALYZER,
    tags: ["network", "monitor", "ping", "speed", "performance"],
    path: "/tools/network-studio?tab=network-monitor",
    icon: "📊",
    complexity: "intermediate",
    parent: "network-studio",
  },

  {
    id: "url-tester",
    name: "URL Tester",
    description: "Test URL accessibility and analyze response headers",
    category: TOOL_CATEGORIES.UTILITIES.id,
    type: TOOL_TYPES.VALIDATOR,
    types: [TOOL_TYPES.ANALYZER],
    tags: ["url", "testing", "headers", "accessibility", "response"],
    path: "/tools/network-studio?tab=url-tester",
    icon: "🔗",
    complexity: "simple",
    parent: "network-studio",
  },

  {
    id: "on-air-checker",
    name: "On Air Checker",
    description: "Check if websites and services are online and accessible",
    category: TOOL_CATEGORIES.UTILITIES.id,
    type: TOOL_TYPES.VALIDATOR,
    tags: ["online", "checker", "availability", "status", "services"],
    path: "/tools/network-studio?tab=on-air-checker",
    icon: "✅",
    complexity: "simple",
    parent: "network-studio",
  },

  {
    id: "file-link-checker",
    name: "File Link Checker",
    description:
      "Check file links and get file information without downloading",
    category: TOOL_CATEGORIES.UTILITIES.id,
    type: TOOL_TYPES.VALIDATOR,
    types: [TOOL_TYPES.ANALYZER],
    tags: ["file", "link", "checker", "download", "headers"],
    path: "/tools/network-studio?tab=file-link-check",
    icon: "📎",
    complexity: "simple",
    parent: "network-studio",
  },

  // File Processing Studio Suite
  {
    id: "file-processing-studio",
    name: "File Processing Studio",
    description:
      "Complete file processing toolkit with 8 specialized tools for image editing, document management, and file organization",
    category: TOOL_CATEGORIES.FILE_PROCESSING.id,
    type: TOOL_TYPES.UTILITY,
    types: [TOOL_TYPES.CONVERTER, TOOL_TYPES.ANALYZER, TOOL_TYPES.EDITOR],
    tags: [
      "file processing",
      "image resizer",
      "pdf tools",
      "file converter",
      "archive manager",
      "file hasher",
      "metadata viewer",
      "duplicate finder",
      "file organizer",
      "batch processing",
      "file management",
    ],
    path: "/tools/file-processing-studio",
    icon: "📁",
    featured: true,
    complexity: "advanced",
  },
  // Sub-tools for File Processing Studio Suite
  {
    id: "image-resizer",
    name: "Image Resizer",
    description: "Resize images with quality control and format conversion",
    category: TOOL_CATEGORIES.FILE_PROCESSING.id,
    type: TOOL_TYPES.CONVERTER,
    types: [TOOL_TYPES.EDITOR],
    tags: ["image", "resize", "quality", "format", "conversion", "batch"],
    path: "/tools/file-processing-studio?tab=image-resizer",
    icon: "🖼️",
    featured: false,
    complexity: "simple",
    parent: "file-processing-studio",
  },
  {
    id: "pdf-tools",
    name: "PDF Tools",
    description: "PDF merge, split, rotate, and conversion tools",
    category: TOOL_CATEGORIES.FILE_PROCESSING.id,
    type: TOOL_TYPES.UTILITY,
    types: [TOOL_TYPES.CONVERTER, TOOL_TYPES.EDITOR],
    tags: ["pdf", "merge", "split", "rotate", "convert", "documents"],
    path: "/tools/file-processing-studio?tab=pdf-tools",
    icon: "📄",
    featured: false,
    complexity: "intermediate",
    parent: "file-processing-studio",
  },
  {
    id: "file-converter",
    name: "File Converter",
    description:
      "Convert between different file formats (images, documents, audio, video)",
    category: TOOL_CATEGORIES.FILE_PROCESSING.id,
    type: TOOL_TYPES.CONVERTER,
    tags: ["convert", "format", "images", "documents", "audio", "video"],
    path: "/tools/file-processing-studio?tab=file-converter",
    icon: "🔄",
    featured: false,
    complexity: "intermediate",
    parent: "file-processing-studio",
  },
  {
    id: "archive-manager",
    name: "Archive Manager",
    description:
      "Extract and create ZIP, RAR, 7Z, TAR, and other archive formats",
    category: TOOL_CATEGORIES.FILE_PROCESSING.id,
    type: TOOL_TYPES.UTILITY,
    types: [TOOL_TYPES.CONVERTER],
    tags: ["archive", "zip", "rar", "7z", "tar", "extract", "create"],
    path: "/tools/file-processing-studio?tab=archive-manager",
    icon: "📦",
    featured: false,
    complexity: "intermediate",
    parent: "file-processing-studio",
  },
  {
    id: "file-hasher",
    name: "File Hasher",
    description:
      "Generate and verify file checksums using MD5, SHA-1, SHA-256, and SHA-512",
    category: TOOL_CATEGORIES.FILE_PROCESSING.id,
    type: TOOL_TYPES.SECURITY,
    types: [TOOL_TYPES.VALIDATOR, TOOL_TYPES.ANALYZER],
    tags: ["hash", "checksum", "md5", "sha1", "sha256", "sha512", "verify"],
    path: "/tools/file-processing-studio?tab=file-hasher",
    icon: "🔐",
    featured: false,
    complexity: "simple",
    parent: "file-processing-studio",
  },
  {
    id: "metadata-viewer",
    name: "Metadata Viewer",
    description:
      "Extract and view file metadata including EXIF, document properties, and media information",
    category: TOOL_CATEGORIES.FILE_PROCESSING.id,
    type: TOOL_TYPES.VIEWER,
    types: [TOOL_TYPES.ANALYZER],
    tags: ["metadata", "exif", "properties", "images", "documents", "media"],
    path: "/tools/file-processing-studio?tab=metadata-viewer",
    icon: "📊",
    featured: false,
    complexity: "simple",
    parent: "file-processing-studio",
  },
  {
    id: "duplicate-finder",
    name: "Duplicate Finder",
    description: "Find and remove duplicate files by comparing file hashes",
    category: TOOL_CATEGORIES.FILE_PROCESSING.id,
    type: TOOL_TYPES.ANALYZER,
    types: [TOOL_TYPES.UTILITY],
    tags: ["duplicate", "find", "remove", "hash", "cleanup", "storage"],
    path: "/tools/file-processing-studio?tab=duplicate-finder",
    icon: "🔍",
    featured: false,
    complexity: "intermediate",
    parent: "file-processing-studio",
  },
  {
    id: "file-organizer",
    name: "File Organizer",
    description:
      "Organize files by type, date, size, or custom rules with preview and batch operations",
    category: TOOL_CATEGORIES.FILE_PROCESSING.id,
    type: TOOL_TYPES.UTILITY,
    types: [TOOL_TYPES.ANALYZER],
    tags: ["organize", "sort", "type", "date", "size", "rules", "batch"],
    path: "/tools/file-processing-studio?tab=file-organizer",
    icon: "📂",
    featured: false,
    complexity: "simple",
    parent: "file-processing-studio",
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
  return TOOL_REGISTRY.filter(
    (tool) => tool.type === type || (tool.types && tool.types.includes(type))
  );
}

export function getToolsByComplexity(
  complexity: "simple" | "intermediate" | "advanced"
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
        tool.types.some((type) => type.toLowerCase().includes(searchTerm)))
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
  const totalTools = TOOL_REGISTRY.length;
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

// Legacy support for old category names
export const LEGACY_TOOL_CATEGORIES = [
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

export type LegacyToolCategory = (typeof LEGACY_TOOL_CATEGORIES)[number];
