# DevTool Platform - Core Library

Thư mục này chứa các core utilities và system files cho DevTool Platform, bao gồm tool registry, classification system, và tool builder utilities.

## Files Overview

### 📝 Core Registry Files

- **`tool-registry.ts`** - Main tool registry (single source of truth)
- **`tool-classification.ts`** - Tool classification system (categories, types, tags)
- **`tool-builder.ts`** - Utilities để tạo tools mới dễ dàng

### 🗂️ Archive

- **`../archive/`** - Chứa các registry files cũ đã được consolidated

## Tool Creation Flow

### 🆕 Tạo Tool Mới (Recommended - Sử dụng Tool Builder)

#### 1. Sử dụng Templates (Dễ nhất)

```typescript
import { ToolTemplates, ToolRegistryManager } from "@/lib/tool-builder";

// Text processor tool
const textTool = ToolTemplates.textProcessor(
  "sql-formatter",
  "SQL Formatter",
  "Format and beautify SQL queries",
  ["sql", "database"]
);

// Data generator tool
const generatorTool = ToolTemplates.dataGenerator(
  "fake-data-generator",
  "Fake Data Generator",
  "Generate realistic fake data for testing",
  ["fake", "mock", "test-data"]
);

// Thêm vào registry
ToolRegistryManager.addTools([textTool, generatorTool]);
```

#### 2. Sử dụng Type-specific Builders

```typescript
import { ToolBuilders } from "@/lib/tool-builder";

// Generator tool
const newGenerator = ToolBuilders.generator({
  id: "uuid-v7-generator",
  name: "UUID v7 Generator",
  description: "Generate UUID version 7 with timestamp",
  category: "GENERATORS", // auto-map to TOOL_CATEGORIES.GENERATORS.id
  tags: ["uuid", "v7", "timestamp"],
  complexity: "simple",
  featured: true,
});

// Validator tool
const newValidator = ToolBuilders.validator({
  id: "phone-validator",
  name: "Phone Number Validator",
  description: "Validate international phone numbers",
  category: "VALIDATORS",
  tags: ["phone", "international", "validate"],
  complexity: "intermediate",
});
```

#### 3. Sử dụng createTool (Full control)

```typescript
import { createTool } from "@/lib/tool-builder";
import { TOOL_CATEGORIES, TOOL_TYPES } from "@/lib/tool-classification";

const customTool = createTool({
  id: "advanced-json-transformer",
  name: "Advanced JSON Transformer",
  description: "Transform JSON with custom rules and validation",
  category: TOOL_CATEGORIES.DATA_CONVERSION.id,
  type: TOOL_TYPES.TRANSFORMER,
  types: [TOOL_TYPES.VALIDATOR, TOOL_TYPES.CONVERTER],
  tags: ["json", "transform", "advanced", "rules"],
  icon: "🔄",
  complexity: "advanced",
  featured: true,
});
```

### 🔧 Quản lý Registry Runtime

```typescript
import { ToolRegistryManager } from "@/lib/tool-builder";

// Thêm tools
ToolRegistryManager.addTool(newTool);
ToolRegistryManager.addTools([tool1, tool2, tool3]);

// Cập nhật tool
ToolRegistryManager.updateTool("json-formatter", {
  featured: true,
  complexity: "intermediate",
});

// Xóa tool
ToolRegistryManager.removeTool("old-tool-id");

// Lấy tools với filter
const generators = ToolRegistryManager.getTools({
  type: TOOL_TYPES.GENERATOR,
  complexity: "simple",
});

const featuredTools = ToolRegistryManager.getTools({
  featured: true,
});

// Reset về trạng thái ban đầu
ToolRegistryManager.resetRegistry();
```

### 📜 Traditional Registry (Tool cũ)

#### Static Registry Modification

```typescript
// Trong tool-registry.ts, thêm trực tiếp vào TOOL_REGISTRY array
export const TOOL_REGISTRY: ToolMetadata[] = [
  {
    id: "new-manual-tool",
    name: "New Manual Tool",
    description: "Manually created tool",
    category: TOOL_CATEGORIES.TEXT_PROCESSING.id,
    type: TOOL_TYPES.FORMATTER,
    types: [TOOL_TYPES.VALIDATOR],
    tags: ["manual", "custom"],
    path: "/tools/new-manual-tool",
    icon: "⚙️",
    featured: false,
    complexity: "simple",
  },
  // ...existing tools
];
```

#### Sử dụng Helper Functions

```typescript
import {
  TOOL_REGISTRY,
  getToolById,
  getToolsByCategory,
  getToolsByType,
  getFeaturedTools,
  searchTools,
} from "@/lib/tool-registry";

// Lấy tool theo ID
const tool = getToolById("json-formatter");

// Lấy tools theo category
const textTools = getToolsByCategory(TOOL_CATEGORIES.TEXT_PROCESSING.id);

// Lấy tools theo type
const generators = getToolsByType(TOOL_TYPES.GENERATOR);

// Lấy featured tools
const featured = getFeaturedTools();

// Search tools
const results = searchTools("json formatter");
```

## So Sánh Approaches

| Aspect             | Tool Builder (Mới)                | Traditional Registry (Cũ)    |
| ------------------ | --------------------------------- | ---------------------------- |
| **Ease of Use**    | ⭐⭐⭐⭐⭐ Templates + Builders   | ⭐⭐ Manual object creation  |
| **Type Safety**    | ⭐⭐⭐⭐⭐ Builder interfaces     | ⭐⭐⭐ Raw ToolMetadata      |
| **Auto-mapping**   | ⭐⭐⭐⭐⭐ Category/path auto-gen | ⭐ Manual setup              |
| **Validation**     | ⭐⭐⭐⭐⭐ Built-in validation    | ⭐⭐ Manual validation       |
| **Runtime Mgmt**   | ⭐⭐⭐⭐⭐ Add/remove/update      | ⭐ Static only               |
| **Testing**        | ⭐⭐⭐⭐⭐ Templates + reset      | ⭐⭐ Modify source           |
| **Learning Curve** | ⭐⭐⭐⭐ Templates guide you      | ⭐⭐ Need to know all fields |

## Component Integration

### Homepage & Tools Pages

```typescript
// Components tự động sử dụng registry
import { TOOL_REGISTRY, getFeaturedTools } from "@/lib/tool-registry";

const featuredTools = getFeaturedTools();
const allTools = TOOL_REGISTRY;
```

### Search & Navigation

```typescript
import { searchTools, getToolsByCategory } from "@/lib/tool-registry";

// Search functionality
const searchResults = searchTools(query);

// Category navigation
const categoryTools = getToolsByCategory(categoryId);
```

### Tool Classification View

```typescript
import {
  getToolsByType,
  getToolsByComplexity,
  getToolStatistics,
} from "@/lib/tool-registry";

// Advanced filtering
const simpleTools = getToolsByComplexity("simple");
const converters = getToolsByType(TOOL_TYPES.CONVERTER);
const stats = getToolStatistics();
```

## Best Practices

### ✅ Recommended

- Sử dụng **ToolTemplates** cho tools phổ biến
- Sử dụng **ToolBuilders** cho type-specific tools
- Sử dụng **ToolRegistryManager** cho runtime management
- Test tools với `addExampleTools()` function

### ⚠️ Legacy Support

- Traditional registry vẫn được support
- Có thể mix cả hai approaches
- All components work với cả hai cách

### 🚫 Avoid

- Modify TOOL_REGISTRY trực tiếp trong runtime
- Hardcode category IDs thay vì dùng TOOL_CATEGORIES
- Bỏ qua type safety của builders

## Quick Start Examples

### Thêm 4 Example Tools

```typescript
import { addExampleTools } from "@/lib/tool-builder";

// Thêm SQL Formatter, Fake Data Generator, JWT Decoder, Credit Card Validator
const newTools = addExampleTools();
console.log(`Added ${newTools.length} example tools`);
```

### Tạo Custom Tool Template

```typescript
// Tạo template cho API tools
export const apiTool = (
  id: string,
  name: string,
  description: string,
  tags: string[]
) =>
  createTool({
    id,
    name,
    description,
    category: TOOL_CATEGORIES.NETWORK_WEB.id,
    type: TOOL_TYPES.UTILITY,
    types: [TOOL_TYPES.ANALYZER],
    tags: ["api", "network", ...tags],
    complexity: "intermediate",
  });

// Sử dụng
const restTester = apiTool(
  "rest-api-tester",
  "REST API Tester",
  "Test REST APIs with custom headers and payloads",
  ["rest", "http", "testing"]
);
```

---

**💡 Tip**: Bắt đầu với ToolTemplates, sau đó chuyển sang ToolBuilders khi cần customization nhiều hơn!
