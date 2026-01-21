/**
 * Demo: Adding New Tools to DevTool Platform
 *
 * This script demonstrates how easy it is to add new tools with the enhanced classification system.
 */

import {
  createTool,
  ToolBuilders,
  ToolTemplates,
  ToolRegistryManager,
} from "../../src/lib/tool-builder";
import { TOOL_TYPES, TOOL_CATEGORIES } from "../../src/lib/tool-classification";

console.log("🚀 DevTool Platform - Adding New Tools Demo\n");

// Method 1: Using createTool function
console.log("📝 Method 1: Using createTool()");
const xmlFormatter = createTool({
  id: "xml-formatter",
  name: "XML Formatter",
  description: "Format and beautify XML documents with syntax highlighting",
  category: TOOL_CATEGORIES.TEXT_PROCESSING.id,
  type: TOOL_TYPES.FORMATTER,
  types: [TOOL_TYPES.VALIDATOR, TOOL_TYPES.PARSER],
  tags: ["xml", "formatter", "beautify", "validate"],
  icon: "📋",
  featured: false,
  complexity: "simple",
});
console.log("✅ Created:", xmlFormatter.name);

// Method 2: Using ToolBuilders for common types
console.log("\n🎲 Method 2: Using ToolBuilders");
const randomQuoteGenerator = ToolBuilders.generator({
  id: "random-quote-generator",
  name: "Random Quote Generator",
  description: "Generate inspiring random quotes for motivation",
  category: TOOL_CATEGORIES.GENERATORS.id,
  types: [TOOL_TYPES.RANDOM],
  tags: ["quotes", "random", "inspiration", "motivation"],
  icon: "💭",
  complexity: "simple",
});
console.log("✅ Created:", randomQuoteGenerator.name);

const phoneValidator = ToolBuilders.validator({
  id: "phone-validator",
  name: "Phone Number Validator",
  description: "Validate phone numbers in various international formats",
  category: TOOL_CATEGORIES.VALIDATORS.id,
  tags: ["phone", "validation", "international", "format"],
  icon: "📞",
  complexity: "intermediate",
});
console.log("✅ Created:", phoneValidator.name);

// Method 3: Using Templates for common patterns
console.log("\n🛠️ Method 3: Using ToolTemplates");
const markdownFormatter = ToolTemplates.textProcessor(
  "markdown-formatter",
  "Markdown Formatter",
  "Format and organize markdown documents",
  ["markdown", "format", "organize"]
);
console.log("✅ Created:", markdownFormatter.name);

const apiKeyGenerator = ToolTemplates.dataGenerator(
  "api-key-generator",
  "API Key Generator",
  "Generate secure API keys with customizable length and format",
  ["api", "key", "secure"]
);
console.log("✅ Created:", apiKeyGenerator.name);

const sslChecker = ToolTemplates.securityTool(
  "ssl-checker",
  "SSL Certificate Checker",
  "Check SSL certificate validity and expiration",
  ["ssl", "certificate", "https", "security"]
);
console.log("✅ Created:", sslChecker.name);

// Method 4: Batch adding with ToolRegistryManager
console.log("\n📦 Method 4: Batch adding with ToolRegistryManager");
const newTools = [
  // Web Development Tools
  createTool({
    id: "css-minifier",
    name: "CSS Minifier",
    description: "Minify CSS code to reduce file size",
    category: TOOL_CATEGORIES.WEB_DEVELOPMENT.id,
    type: TOOL_TYPES.UTILITY,
    tags: ["css", "minify", "optimize", "compress"],
    icon: "🗜️",
    complexity: "simple",
  }),

  // API Testing Tools
  createTool({
    id: "webhook-tester",
    name: "Webhook Tester",
    description: "Test and debug webhook endpoints",
    category: TOOL_CATEGORIES.API_TESTING.id,
    type: TOOL_TYPES.UTILITY,
    types: [TOOL_TYPES.ANALYZER],
    tags: ["webhook", "test", "debug", "endpoint"],
    icon: "🔗",
    complexity: "intermediate",
  }),

  // Data Analysis Tools
  createTool({
    id: "log-analyzer",
    name: "Log File Analyzer",
    description: "Analyze and parse log files for insights",
    category: TOOL_CATEGORIES.DATA_ANALYSIS.id,
    type: TOOL_TYPES.ANALYZER,
    types: [TOOL_TYPES.PARSER],
    tags: ["logs", "analysis", "parse", "insights"],
    icon: "📈",
    complexity: "advanced",
  }),

  // Security Tools
  createTool({
    id: "password-strength-checker",
    name: "Password Strength Checker",
    description: "Analyze password strength and security",
    category: TOOL_CATEGORIES.SECURITY_TOOLS.id,
    type: TOOL_TYPES.ANALYZER,
    types: [TOOL_TYPES.VALIDATOR, TOOL_TYPES.SECURITY],
    tags: ["password", "strength", "security", "analyze"],
    icon: "🛡️",
    featured: true,
    complexity: "simple",
  }),

  // More Generators
  createTool({
    id: "color-palette-generator",
    name: "Color Palette Generator",
    description: "Generate beautiful color palettes for design",
    category: TOOL_CATEGORIES.GENERATORS.id,
    type: TOOL_TYPES.GENERATOR,
    types: [TOOL_TYPES.RANDOM],
    tags: ["color", "palette", "design", "random"],
    icon: "🎨",
    featured: true,
    complexity: "simple",
  }),
];

// Add all new tools to registry
ToolRegistryManager.addTools(newTools);
console.log(`✅ Added ${newTools.length} tools to registry`);

// Show current registry stats
const stats = ToolRegistryManager.getTools();
console.log(`\n📊 Registry Statistics:`);
console.log(`• Total tools: ${stats.length}`);
console.log(`• Featured tools: ${stats.filter((t) => t.featured).length}`);

// Show tools by category
const categories = [...new Set(stats.map((t) => t.category))];
console.log(`• Categories: ${categories.length}`);
categories.forEach((cat) => {
  const count = stats.filter((t) => t.category === cat).length;
  console.log(`  - ${cat}: ${count} tools`);
});

// Show tools by type
const types = [...new Set(stats.flatMap((t) => [t.type, ...(t.types || [])]))];
console.log(`• Types: ${types.length}`);
types.forEach((type) => {
  const count = stats.filter(
    (t) => t.type === type || t.types?.includes(type)
  ).length;
  console.log(`  - ${type}: ${count} tools`);
});

console.log("\n🎉 Demo completed! New tools added successfully.");
console.log("\n💡 To add your own tools:");
console.log("1. Choose the appropriate category and type");
console.log(
  "2. Use one of the helper methods (createTool, ToolBuilders, ToolTemplates)"
);
console.log("3. Add to registry with ToolRegistryManager.addTool()");
console.log(
  "4. Tools will automatically appear in the UI with proper classification"
);

// Example of filtering tools
console.log("\n🔍 Example: Finding all generator tools");
const generators = ToolRegistryManager.getTools({ type: TOOL_TYPES.GENERATOR });
console.log(`Found ${generators.length} generator tools:`);
generators.forEach((tool) => {
  console.log(`• ${tool.name} (${tool.category})`);
});
