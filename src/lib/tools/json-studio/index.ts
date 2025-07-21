/**
 * JSON Studio - Complete JSON processing toolkit
 * Export all components and utilities
 */

// Main component
export { JsonStudioWithSuspense as JsonStudio } from "./JsonStudioWrapper";
export { JsonStudioWithSuspense as default } from "./JsonStudioWrapper";

// Individual tab components
export { JsonFormatterTab } from "./JsonFormatterTab";
export { JsonPathTab } from "./JsonPathTab";
export { JsonSchemaTab } from "./JsonSchemaTab";
export { JsonDiffTab } from "./JsonDiffTab";

// Reusable components
export {
  JsonStatsDisplay,
  JsonPathExplorer,
  JsonSchemaValidator,
  JsonDiffViewer,
} from "./components";

// Utilities
export {
  formatJson,
  minifyJson,
  extractAllPaths,
  validateJsonSchema,
  compareJson,
  validateJson,
  type JsonStats,
  type JsonPathResult,
  type SchemaValidationResult,
  type JsonDiffResult,
} from "@/lib/utils/json";
