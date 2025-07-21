/**
 * JSON Formatter Utilities
 * Provides comprehensive JSON formatting, validation, and manipulation functions
 */

export interface JsonFormatOptions {
  indentSize?: number;
  sortKeys?: boolean;
  removeComments?: boolean;
  trailingCommas?: boolean;
}

export interface JsonValidationResult {
  isValid: boolean;
  error?: string;
  lineNumber?: number;
  columnNumber?: number;
  suggestion?: string;
}

export interface JsonStats {
  size: number;
  lines: number;
  objects: number;
  arrays: number;
  strings: number;
  numbers: number;
  booleans: number;
  nulls: number;
  depth: number;
}

/**
 * Format JSON with various options
 */
export function formatJson(
  input: string,
  options: JsonFormatOptions = {}
): { result: string; stats: JsonStats } {
  const { indentSize = 2, sortKeys = false, removeComments = false } = options;

  try {
    // Remove comments if requested
    const processedInput = removeComments ? removeJsonComments(input) : input;

    const parsed = JSON.parse(processedInput);
    const formatted = sortKeys
      ? JSON.stringify(sortObjectKeys(parsed), null, indentSize)
      : JSON.stringify(parsed, null, indentSize);

    const stats = calculateJsonStats(parsed);

    return {
      result: formatted,
      stats,
    };
  } catch (error) {
    throw new Error(
      `JSON parsing error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Minify JSON
 */
export function minifyJson(input: string): {
  result: string;
  stats: JsonStats;
} {
  try {
    const parsed = JSON.parse(input);
    const minified = JSON.stringify(parsed);
    const stats = calculateJsonStats(parsed);

    return {
      result: minified,
      stats,
    };
  } catch (error) {
    throw new Error(
      `JSON parsing error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Validate JSON with detailed error information
 */
export function validateJson(input: string): JsonValidationResult {
  if (!input.trim()) {
    return {
      isValid: false,
      error: "Empty input",
      suggestion: "Please provide JSON content to validate",
    };
  }

  try {
    JSON.parse(input);
    return { isValid: true };
  } catch (error) {
    if (error instanceof SyntaxError) {
      const match = error.message.match(/at position (\d+)/);
      const position = match ? parseInt(match[1], 10) : 0;
      const { line, column } = getLineColumnFromPosition(input, position);

      return {
        isValid: false,
        error: error.message,
        lineNumber: line,
        columnNumber: column,
        suggestion: getSuggestionForError(error.message),
      };
    }

    return {
      isValid: false,
      error:
        error instanceof Error ? error.message : "Unknown validation error",
    };
  }
}

/**
 * Sort object keys recursively
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sortObjectKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }

  if (obj !== null && typeof obj === "object") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sorted: any = {};
    Object.keys(obj)
      .sort()
      .forEach((key) => {
        sorted[key] = sortObjectKeys(obj[key]);
      });
    return sorted;
  }

  return obj;
}

/**
 * Remove JSON comments (single line and block comments)
 */
function removeJsonComments(input: string): string {
  return input
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove block comments
    .replace(/\/\/.*$/gm, ""); // Remove single line comments
}

/**
 * Calculate comprehensive JSON statistics
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calculateJsonStats(obj: any): JsonStats {
  const stats: JsonStats = {
    size: JSON.stringify(obj).length,
    lines: JSON.stringify(obj, null, 2).split("\n").length,
    objects: 0,
    arrays: 0,
    strings: 0,
    numbers: 0,
    booleans: 0,
    nulls: 0,
    depth: 0,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function traverse(value: any, depth: number = 0): void {
    stats.depth = Math.max(stats.depth, depth);

    if (value === null) {
      stats.nulls++;
    } else if (typeof value === "string") {
      stats.strings++;
    } else if (typeof value === "number") {
      stats.numbers++;
    } else if (typeof value === "boolean") {
      stats.booleans++;
    } else if (Array.isArray(value)) {
      stats.arrays++;
      value.forEach((item) => traverse(item, depth + 1));
    } else if (typeof value === "object") {
      stats.objects++;
      Object.values(value).forEach((item) => traverse(item, depth + 1));
    }
  }

  traverse(obj);
  return stats;
}

/**
 * Get line and column from character position
 */
function getLineColumnFromPosition(
  text: string,
  position: number
): { line: number; column: number } {
  const lines = text.substring(0, position).split("\n");
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}

/**
 * Get suggestion for common JSON errors
 */
function getSuggestionForError(errorMessage: string): string {
  if (errorMessage.includes("Unexpected token")) {
    if (errorMessage.includes("'")) {
      return "Use double quotes for strings instead of single quotes";
    }
    if (errorMessage.includes("undefined")) {
      return "Remove undefined values or replace with null";
    }
    if (errorMessage.includes(",")) {
      return "Remove trailing comma or add missing value";
    }
  }

  if (errorMessage.includes("Unexpected end of JSON input")) {
    return "Check for missing closing brackets or braces";
  }

  if (errorMessage.includes("Expected property name")) {
    return "Ensure property names are enclosed in double quotes";
  }

  return "Check JSON syntax and formatting";
}

/**
 * Compare two JSON objects
 */
export function compareJson(
  json1: string,
  json2: string
): {
  areEqual: boolean;
  differences: string[];
} {
  try {
    const obj1 = JSON.parse(json1);
    const obj2 = JSON.parse(json2);

    const differences: string[] = [];
    const areEqual = deepCompare(obj1, obj2, "", differences);

    return { areEqual, differences };
  } catch (error) {
    return {
      areEqual: false,
      differences: [
        `Parsing error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      ],
    };
  }
}

/**
 * Deep compare two objects and collect differences
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepCompare(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj1: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj2: any,
  path: string,
  differences: string[]
): boolean {
  if (obj1 === obj2) return true;

  if (obj1 === null || obj2 === null) {
    differences.push(`${path}: ${obj1} !== ${obj2}`);
    return false;
  }

  if (typeof obj1 !== typeof obj2) {
    differences.push(
      `${path}: type mismatch (${typeof obj1} vs ${typeof obj2})`
    );
    return false;
  }

  if (Array.isArray(obj1) !== Array.isArray(obj2)) {
    differences.push(`${path}: array mismatch`);
    return false;
  }

  if (Array.isArray(obj1)) {
    if (obj1.length !== obj2.length) {
      differences.push(
        `${path}: array length mismatch (${obj1.length} vs ${obj2.length})`
      );
      return false;
    }

    let isEqual = true;
    for (let i = 0; i < obj1.length; i++) {
      if (!deepCompare(obj1[i], obj2[i], `${path}[${i}]`, differences)) {
        isEqual = false;
      }
    }
    return isEqual;
  }

  if (typeof obj1 === "object") {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    const allKeys = new Set([...keys1, ...keys2]);
    let isEqual = true;

    for (const key of allKeys) {
      const newPath = path ? `${path}.${key}` : key;

      if (!(key in obj1)) {
        differences.push(`${newPath}: missing in first object`);
        isEqual = false;
      } else if (!(key in obj2)) {
        differences.push(`${newPath}: missing in second object`);
        isEqual = false;
      } else if (!deepCompare(obj1[key], obj2[key], newPath, differences)) {
        isEqual = false;
      }
    }

    return isEqual;
  }

  differences.push(`${path}: ${obj1} !== ${obj2}`);
  return false;
}
