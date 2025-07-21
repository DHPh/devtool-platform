/**
 * JSON Path and Query Utilities
 * Provides JSONPath evaluation and querying capabilities
 */

export interface JsonPathResult {
  path: string;
  value: unknown;
  type: string;
}

export interface QueryResult {
  results: JsonPathResult[];
  count: number;
  executionTime: number;
}

/**
 * Parse JSON and extract all paths with values
 */
export function extractAllPaths(obj: unknown, prefix = "$"): JsonPathResult[] {
  const results: JsonPathResult[] = [];

  function traverse(value: unknown, path: string): void {
    const type = getValueType(value);
    results.push({ path, value, type });

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        traverse(item, `${path}[${index}]`);
      });
    } else if (value !== null && typeof value === "object") {
      Object.entries(value as Record<string, unknown>).forEach(([key, val]) => {
        traverse(val, `${path}.${key}`);
      });
    }
  }

  traverse(obj, prefix);
  return results;
}

/**
 * Get value by JSON path
 */
export function getValueByPath(obj: unknown, path: string): unknown {
  try {
    // Remove leading $ if present
    const cleanPath = path.startsWith("$") ? path.slice(1) : path;

    if (!cleanPath) return obj;

    // Split path and handle array indices and object properties
    const segments = cleanPath.split(/[.\[\]]/).filter(Boolean);

    let current = obj;
    for (const segment of segments) {
      if (current === null || current === undefined) {
        return undefined;
      }

      // Handle array index
      if (!isNaN(Number(segment))) {
        if (Array.isArray(current)) {
          current = current[Number(segment)];
        } else {
          return undefined;
        }
      } else {
        // Handle object property
        if (typeof current === "object" && current !== null) {
          current = (current as Record<string, unknown>)[segment];
        } else {
          return undefined;
        }
      }
    }

    return current;
  } catch {
    return undefined;
  }
}

/**
 * Simple JSONPath query implementation
 */
export function queryJsonPath(obj: unknown, expression: string): QueryResult {
  const startTime = performance.now();
  const results: JsonPathResult[] = [];

  try {
    // Handle basic JSONPath expressions
    if (expression === "$" || expression === "") {
      results.push({
        path: "$",
        value: obj,
        type: getValueType(obj),
      });
    } else if (expression.startsWith("$.")) {
      // Simple property access
      const value = getValueByPath(obj, expression);
      if (value !== undefined) {
        results.push({
          path: expression,
          value,
          type: getValueType(value),
        });
      }
    } else if (expression.includes("*")) {
      // Wildcard queries
      handleWildcardQuery(obj, expression, results);
    } else if (expression.includes("[?")) {
      // Filter queries (basic implementation)
      handleFilterQuery(obj, expression, results);
    } else {
      // Try direct path access
      const value = getValueByPath(obj, expression);
      if (value !== undefined) {
        results.push({
          path: expression,
          value,
          type: getValueType(value),
        });
      }
    }
  } catch (error) {
    // If query fails, return empty results
    console.warn("JSONPath query error:", error);
  }

  const executionTime = performance.now() - startTime;

  return {
    results,
    count: results.length,
    executionTime,
  };
}

/**
 * Handle wildcard queries like $.store.book[*].title
 */
function handleWildcardQuery(
  obj: unknown,
  expression: string,
  results: JsonPathResult[]
): void {
  const allPaths = extractAllPaths(obj);
  const pattern = expression
    .replace(/\./g, "\\.")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/\*/g, "[^.\\[\\]]*");

  const regex = new RegExp(`^${pattern}$`);

  allPaths.forEach((pathResult) => {
    if (regex.test(pathResult.path)) {
      results.push(pathResult);
    }
  });
}

/**
 * Handle basic filter queries like $[?(@.price < 10)]
 */
function handleFilterQuery(
  obj: unknown,
  expression: string,
  results: JsonPathResult[]
): void {
  // Basic filter implementation - would need more sophisticated parsing for full JSONPath
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      // Simple property existence check
      if (
        expression.includes("@.") &&
        typeof item === "object" &&
        item !== null
      ) {
        const propMatch = expression.match(/@\.(\w+)/);
        if (propMatch) {
          const propName = propMatch[1];
          if (propName in (item as Record<string, unknown>)) {
            results.push({
              path: `$[${index}]`,
              value: item,
              type: getValueType(item),
            });
          }
        }
      }
    });
  }
}

/**
 * Get the type of a value for display
 */
function getValueType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  return typeof value;
}

/**
 * Generate sample JSONPath expressions for given JSON
 */
export function generateSamplePaths(obj: unknown): string[] {
  const paths = extractAllPaths(obj);
  const samples: string[] = ["$"]; // Root

  // Add some representative paths
  const uniquePaths = new Set<string>();

  paths.forEach(({ path, type }) => {
    // Add path if it's interesting
    if ((path !== "$" && !path.includes("[0]")) || uniquePaths.size < 10) {
      uniquePaths.add(path);
    }

    // Add wildcard versions for arrays
    if (path.includes("[") && type !== "array") {
      const wildcardPath = path.replace(/\[\d+\]/g, "[*]");
      uniquePaths.add(wildcardPath);
    }
  });

  samples.push(...Array.from(uniquePaths).slice(0, 15));

  return samples;
}

/**
 * Validate JSONPath expression
 */
export function validateJsonPath(expression: string): {
  isValid: boolean;
  error?: string;
} {
  if (!expression.trim()) {
    return { isValid: false, error: "Empty expression" };
  }

  // Basic JSONPath validation
  if (!expression.startsWith("$")) {
    return { isValid: false, error: "JSONPath must start with $" };
  }

  // Check for balanced brackets
  const openBrackets = (expression.match(/\[/g) || []).length;
  const closeBrackets = (expression.match(/\]/g) || []).length;

  if (openBrackets !== closeBrackets) {
    return { isValid: false, error: "Unbalanced brackets" };
  }

  // Check for basic syntax issues
  if (expression.includes("..")) {
    if (!expression.match(/\.\.\w/)) {
      return { isValid: false, error: "Invalid recursive descent syntax" };
    }
  }

  return { isValid: true };
}
