# Tool Classification System

## Overview

This document describes the enhanced tool classification system that allows for flexible categorization and easy addition of new tools with proper metadata.

## Classification Structure

### 1. Categories

Tools are organized into 10 main categories:

| Category                | ID                  | Description                                         | Icon |
| ----------------------- | ------------------- | --------------------------------------------------- | ---- |
| **Text Processing**     | `text-processing`   | Text manipulation, formatting, and analysis         | 📝   |
| **Data Conversion**     | `data-conversion`   | Convert between different data formats              | 🔄   |
| **Generators**          | `generators`        | Generate random data, IDs, passwords, etc.          | 🎲   |
| **Validators**          | `validators`        | Validate data formats, syntax, and structure        | ✅   |
| **Security Tools**      | `security-tools`    | Hash generators, password tools, security utilities | 🔒   |
| **Web Development**     | `web-development`   | Tools for web developers and frontend dev           | 🌐   |
| **API & Testing**       | `api-testing`       | API testing, debugging, and development             | 🧪   |
| **Utilities**           | `utilities`         | General purpose utilities and helper tools          | 🛠️   |
| **Data Analysis**       | `data-analysis`     | Data visualization and analysis tools               | 📊   |
| **Encoding & Decoding** | `encoding-decoding` | Encode and decode various data formats              | 🔐   |

### 2. Types

Each tool has a primary type and optional secondary types:

| Type         | Purpose                            | Examples                           |
| ------------ | ---------------------------------- | ---------------------------------- |
| `generator`  | Generate new data or content       | UUID Generator, Password Generator |
| `validator`  | Validate data format and syntax    | JSON Validator, Email Validator    |
| `converter`  | Convert between different formats  | Color Converter, Case Converter    |
| `formatter`  | Format and beautify code/data      | JSON Formatter, HTML Formatter     |
| `encoder`    | Encode data into different formats | Base64 Encoder, URL Encoder        |
| `decoder`    | Decode data from encoded formats   | Base64 Decoder, URL Decoder        |
| `parser`     | Parse and analyze data structure   | JSON Parser, CSV Parser            |
| `analyzer`   | Analyze and examine data           | Text Diff, Data Explorer           |
| `calculator` | Perform calculations               | Hash Calculator, Color Calculator  |
| `random`     | Generate random values             | Random Password, Random UUID       |
| `security`   | Security-related functionality     | Hash Generator, JWT Tools          |
| `utility`    | General utility functions          | QR Generator, Word Counter         |
| `viewer`     | View and display data              | CSV Viewer, JSON Viewer            |
| `editor`     | Edit and modify content            | Markdown Editor, Code Editor       |

### 3. Complexity Levels

- **Simple** (●○○): Basic tools with straightforward functionality
- **Intermediate** (●●○): Tools with moderate complexity and options
- **Advanced** (●●●): Complex tools requiring expertise

### 4. Tags

Organized into groups for better consistency:

```typescript
const TAG_GROUPS = {
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
};
```

## Adding New Tools

### Method 1: Using Tool Builder

```typescript
import { createTool, TOOL_TYPES, TOOL_CATEGORIES } from "@/lib/tool-builder";

const newTool = createTool({
  id: "my-awesome-tool",
  name: "My Awesome Tool",
  description: "Does something really cool",
  category: TOOL_CATEGORIES.GENERATORS.id,
  type: TOOL_TYPES.GENERATOR,
  types: [TOOL_TYPES.RANDOM], // Additional types
  tags: ["awesome", "cool", "generator"],
  icon: "🎯",
  featured: true,
  complexity: "simple",
});
```

### Method 2: Using Quick Builders

```typescript
import { ToolBuilders } from "@/lib/tool-builder";

// Create a generator tool
const generator = ToolBuilders.generator({
  id: "data-generator",
  name: "Data Generator",
  description: "Generate test data",
  category: "generators",
  tags: ["data", "test", "mock"],
});

// Create a validator tool
const validator = ToolBuilders.validator({
  id: "schema-validator",
  name: "Schema Validator",
  description: "Validate JSON schemas",
  category: "validators",
  tags: ["schema", "json", "validate"],
});
```

### Method 3: Using Templates

```typescript
import { ToolTemplates } from "@/lib/tool-builder";

// Text processor
const formatter = ToolTemplates.textProcessor(
  "yaml-formatter",
  "YAML Formatter",
  "Format and beautify YAML files",
  ["yaml", "format"]
);

// Security tool
const secTool = ToolTemplates.securityTool(
  "hash-validator",
  "Hash Validator",
  "Validate hash integrity",
  ["hash", "integrity", "verify"]
);
```

### Method 4: Using Registry Manager

```typescript
import { ToolRegistryManager } from "@/lib/tool-builder";

// Add single tool
ToolRegistryManager.addTool({
  id: "new-tool",
  name: "New Tool",
  description: "Brand new functionality",
  category: "utilities",
  type: "utility",
  tags: ["new", "utility"],
});

// Add multiple tools
ToolRegistryManager.addTools([tool1, tool2, tool3]);

// Update existing tool
ToolRegistryManager.updateTool("existing-id", {
  featured: true,
  complexity: "advanced",
});
```

## Best Practices

### 1. Naming Conventions

- **IDs**: Use kebab-case (`my-tool-name`)
- **Names**: Use Title Case (`My Tool Name`)
- **Descriptions**: Start with a verb (`Generate`, `Convert`, `Validate`)

### 2. Category Selection

Choose the most specific category that fits:

- If it generates something → `generators`
- If it validates input → `validators`
- If it converts formats → `data-conversion`
- If it processes text → `text-processing`

### 3. Type Selection

- **Primary type**: The main function (what the tool does)
- **Secondary types**: Additional capabilities (how it does it)

Example:

```typescript
{
  type: "validator",        // Primary: validates data
  types: ["parser"],        // Secondary: parses input first
}
```

### 4. Tagging Strategy

- Include format names (`json`, `yaml`, `csv`)
- Include action verbs (`format`, `validate`, `convert`)
- Include domain terms (`security`, `web`, `api`)
- Keep tags lowercase and consistent

### 5. Complexity Guidelines

- **Simple**: Single input/output, basic options
- **Intermediate**: Multiple options, moderate configuration
- **Advanced**: Complex configuration, requires expertise

## File Structure

```
src/lib/
├── tool-classification.ts    # Categories, types, and tag definitions
├── tool-registry-new.ts      # Enhanced tool registry with metadata
├── tool-builder.ts           # Utilities for creating new tools
└── tools/
    ├── generators/
    ├── validators/
    ├── converters/
    └── ...
```

## Usage Examples

### Adding a New Category

```typescript
// In tool-classification.ts
export const TOOL_CATEGORIES = {
  // ... existing categories
  AI_TOOLS: {
    id: "ai-tools",
    name: "AI Tools",
    description: "Artificial intelligence and machine learning tools",
    icon: "🤖",
  },
} as const;
```

### Adding a New Type

```typescript
// In tool-classification.ts
export const TOOL_TYPES = {
  // ... existing types
  TRANSLATOR: "translator",
  OPTIMIZER: "optimizer",
} as const;
```

### Filtering Tools

```typescript
import { ToolRegistryManager } from "@/lib/tool-builder";

// Get all generators
const generators = ToolRegistryManager.getTools({ type: "generator" });

// Get featured security tools
const featuredSecurity = ToolRegistryManager.getTools({
  category: "security-tools",
  featured: true,
});

// Get simple converters
const simpleConverters = ToolRegistryManager.getTools({
  type: "converter",
  complexity: "simple",
});
```

## Migration from Old System

To migrate existing tools:

1. **Update interface**: Add `type`, `types`, `complexity`, `featured` fields
2. **Map categories**: Update category strings to new IDs
3. **Assign types**: Determine primary and secondary types
4. **Set complexity**: Evaluate tool complexity level
5. **Mark featured**: Select tools for featured status

## Component Integration

The classification system integrates with:

- `ToolClassificationView`: Browse tools by category/type
- `InteractiveTools`: Enhanced filtering and search
- `ToolGrid`: Display classification metadata
- Search functionality: Search by type and category

This system makes it easy to:

- Add new tools with consistent metadata
- Filter and browse tools by multiple criteria
- Maintain organized and discoverable tool collections
- Scale the platform with new categories and types
