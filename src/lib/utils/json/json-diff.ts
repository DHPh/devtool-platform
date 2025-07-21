/**
 * JSON Diff Utilities
 * Provides comprehensive JSON comparison and diff visualization
 */

export interface JsonDiffResult {
  differences: DiffEntry[];
  summary: DiffSummary;
  patches: JsonPatch[];
}

export interface DiffEntry {
  path: string;
  type: "added" | "removed" | "modified" | "moved";
  oldValue?: unknown;
  newValue?: unknown;
  context?: string;
}

export interface DiffSummary {
  totalChanges: number;
  added: number;
  removed: number;
  modified: number;
  moved: number;
  unchanged: number;
}

export interface JsonPatch {
  op: "add" | "remove" | "replace" | "move" | "copy" | "test";
  path: string;
  from?: string;
  value?: unknown;
}

/**
 * Compare two JSON objects and generate diff
 */
export function compareJsonObjects(
  obj1: unknown,
  obj2: unknown
): JsonDiffResult {
  const differences: DiffEntry[] = [];
  const patches: JsonPatch[] = [];

  // Normalize inputs
  const normalized1 = normalizeForComparison(obj1);
  const normalized2 = normalizeForComparison(obj2);

  // Perform deep comparison
  compareRecursive(normalized1, normalized2, "", differences, patches);

  // Calculate summary
  const summary: DiffSummary = {
    totalChanges: differences.length,
    added: differences.filter((d) => d.type === "added").length,
    removed: differences.filter((d) => d.type === "removed").length,
    modified: differences.filter((d) => d.type === "modified").length,
    moved: differences.filter((d) => d.type === "moved").length,
    unchanged: 0, // Will be calculated separately if needed
  };

  return {
    differences,
    summary,
    patches,
  };
}

/**
 * Recursive comparison function
 */
function compareRecursive(
  obj1: unknown,
  obj2: unknown,
  path: string,
  differences: DiffEntry[],
  patches: JsonPatch[]
): void {
  // Handle null values
  if (obj1 === null && obj2 === null) return;
  if (obj1 === null) {
    differences.push({
      path,
      type: "added",
      newValue: obj2,
    });
    patches.push({
      op: "add",
      path: convertToJsonPointer(path),
      value: obj2,
    });
    return;
  }
  if (obj2 === null) {
    differences.push({
      path,
      type: "removed",
      oldValue: obj1,
    });
    patches.push({
      op: "remove",
      path: convertToJsonPointer(path),
    });
    return;
  }

  // Handle primitive values
  if (!isObject(obj1) || !isObject(obj2)) {
    if (obj1 !== obj2) {
      differences.push({
        path,
        type: "modified",
        oldValue: obj1,
        newValue: obj2,
      });
      patches.push({
        op: "replace",
        path: convertToJsonPointer(path),
        value: obj2,
      });
    }
    return;
  }

  // Handle arrays
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    compareArrays(obj1, obj2, path, differences, patches);
    return;
  }

  // Handle mixed array/object
  if (Array.isArray(obj1) !== Array.isArray(obj2)) {
    differences.push({
      path,
      type: "modified",
      oldValue: obj1,
      newValue: obj2,
    });
    patches.push({
      op: "replace",
      path: convertToJsonPointer(path),
      value: obj2,
    });
    return;
  }

  // Handle objects
  compareObjects(
    obj1 as Record<string, unknown>,
    obj2 as Record<string, unknown>,
    path,
    differences,
    patches
  );
}

/**
 * Compare two arrays
 */
function compareArrays(
  arr1: unknown[],
  arr2: unknown[],
  path: string,
  differences: DiffEntry[],
  patches: JsonPatch[]
): void {
  const maxLength = Math.max(arr1.length, arr2.length);

  // Simple index-based comparison (could be enhanced with LCS algorithm)
  for (let i = 0; i < maxLength; i++) {
    const itemPath = path ? `${path}[${i}]` : `[${i}]`;

    if (i >= arr1.length) {
      // Item added
      differences.push({
        path: itemPath,
        type: "added",
        newValue: arr2[i],
      });
      patches.push({
        op: "add",
        path: convertToJsonPointer(itemPath),
        value: arr2[i],
      });
    } else if (i >= arr2.length) {
      // Item removed
      differences.push({
        path: itemPath,
        type: "removed",
        oldValue: arr1[i],
      });
      patches.push({
        op: "remove",
        path: convertToJsonPointer(itemPath),
      });
    } else {
      // Compare items
      compareRecursive(arr1[i], arr2[i], itemPath, differences, patches);
    }
  }
}

/**
 * Compare two objects
 */
function compareObjects(
  obj1: Record<string, unknown>,
  obj2: Record<string, unknown>,
  path: string,
  differences: DiffEntry[],
  patches: JsonPatch[]
): void {
  const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

  for (const key of allKeys) {
    const keyPath = path ? `${path}.${key}` : key;

    if (!(key in obj1)) {
      // Property added
      differences.push({
        path: keyPath,
        type: "added",
        newValue: obj2[key],
      });
      patches.push({
        op: "add",
        path: convertToJsonPointer(keyPath),
        value: obj2[key],
      });
    } else if (!(key in obj2)) {
      // Property removed
      differences.push({
        path: keyPath,
        type: "removed",
        oldValue: obj1[key],
      });
      patches.push({
        op: "remove",
        path: convertToJsonPointer(keyPath),
      });
    } else {
      // Compare values
      compareRecursive(obj1[key], obj2[key], keyPath, differences, patches);
    }
  }
}

/**
 * Convert path to JSON Pointer format
 */
function convertToJsonPointer(path: string): string {
  if (!path) return "";

  return (
    "/" +
    path
      .replace(/\./g, "/")
      .replace(/\[(\d+)\]/g, "/$1")
      .replace(/\[([^\]]+)\]/g, "/$1")
  );
}

/**
 * Check if value is an object
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

/**
 * Normalize values for comparison
 */
function normalizeForComparison(value: unknown): unknown {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

/**
 * Apply JSON patch to an object
 */
export function applyJsonPatch(obj: unknown, patches: JsonPatch[]): unknown {
  let result = JSON.parse(JSON.stringify(obj)); // Deep clone

  for (const patch of patches) {
    try {
      result = applySinglePatch(result, patch);
    } catch (error) {
      console.warn("Failed to apply patch:", patch, error);
    }
  }

  return result;
}

/**
 * Apply a single patch operation
 */
function applySinglePatch(obj: unknown, patch: JsonPatch): unknown {
  const path = parseJsonPointer(patch.path);

  switch (patch.op) {
    case "add":
      return addValue(obj, path, patch.value);
    case "remove":
      return removeValue(obj, path);
    case "replace":
      return replaceValue(obj, path, patch.value);
    default:
      console.warn("Unsupported patch operation:", patch.op);
      return obj;
  }
}

/**
 * Parse JSON Pointer path
 */
function parseJsonPointer(pointer: string): string[] {
  if (!pointer || pointer === "/") return [];

  return pointer
    .slice(1) // Remove leading /
    .split("/")
    .map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"));
}

/**
 * Add value at path
 */
function addValue(obj: unknown, path: string[], value: unknown): unknown {
  if (path.length === 0) return value;

  const result = JSON.parse(JSON.stringify(obj));
  let current = result;

  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i];

    if (Array.isArray(current)) {
      const index = parseInt(segment, 10);
      current = current[index];
    } else if (current && typeof current === "object") {
      current = (current as Record<string, unknown>)[segment];
    } else {
      throw new Error(`Cannot traverse path at segment: ${segment}`);
    }
  }

  const lastSegment = path[path.length - 1];

  if (Array.isArray(current)) {
    const index = parseInt(lastSegment, 10);
    current.splice(index, 0, value);
  } else if (current && typeof current === "object") {
    (current as Record<string, unknown>)[lastSegment] = value;
  } else {
    throw new Error(`Cannot add value at path: ${path.join("/")}`);
  }

  return result;
}

/**
 * Remove value at path
 */
function removeValue(obj: unknown, path: string[]): unknown {
  if (path.length === 0) return undefined;

  const result = JSON.parse(JSON.stringify(obj));
  let current = result;

  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i];

    if (Array.isArray(current)) {
      const index = parseInt(segment, 10);
      current = current[index];
    } else if (current && typeof current === "object") {
      current = (current as Record<string, unknown>)[segment];
    } else {
      throw new Error(`Cannot traverse path at segment: ${segment}`);
    }
  }

  const lastSegment = path[path.length - 1];

  if (Array.isArray(current)) {
    const index = parseInt(lastSegment, 10);
    current.splice(index, 1);
  } else if (current && typeof current === "object") {
    delete (current as Record<string, unknown>)[lastSegment];
  } else {
    throw new Error(`Cannot remove value at path: ${path.join("/")}`);
  }

  return result;
}

/**
 * Replace value at path
 */
function replaceValue(obj: unknown, path: string[], value: unknown): unknown {
  if (path.length === 0) return value;

  const result = JSON.parse(JSON.stringify(obj));
  let current = result;

  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i];

    if (Array.isArray(current)) {
      const index = parseInt(segment, 10);
      current = current[index];
    } else if (current && typeof current === "object") {
      current = (current as Record<string, unknown>)[segment];
    } else {
      throw new Error(`Cannot traverse path at segment: ${segment}`);
    }
  }

  const lastSegment = path[path.length - 1];

  if (Array.isArray(current)) {
    const index = parseInt(lastSegment, 10);
    current[index] = value;
  } else if (current && typeof current === "object") {
    (current as Record<string, unknown>)[lastSegment] = value;
  } else {
    throw new Error(`Cannot replace value at path: ${path.join("/")}`);
  }

  return result;
}

/**
 * Generate readable diff summary
 */
export function generateDiffSummary(result: JsonDiffResult): string {
  const { summary } = result;

  if (summary.totalChanges === 0) {
    return "No differences found";
  }

  const parts: string[] = [];

  if (summary.added > 0) {
    parts.push(`${summary.added} added`);
  }

  if (summary.removed > 0) {
    parts.push(`${summary.removed} removed`);
  }

  if (summary.modified > 0) {
    parts.push(`${summary.modified} modified`);
  }

  if (summary.moved > 0) {
    parts.push(`${summary.moved} moved`);
  }

  return `${summary.totalChanges} total changes: ${parts.join(", ")}`;
}
