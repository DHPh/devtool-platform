/** RFC 6901 JSON Pointer, RFC 6902 JSON Patch, and applicable diff utilities. */

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

export type JsonPatch =
  | { op: "add"; path: string; value: unknown }
  | { op: "remove"; path: string }
  | { op: "replace"; path: string; value: unknown }
  | { op: "move"; path: string; from: string }
  | { op: "copy"; path: string; from: string }
  | { op: "test"; path: string; value: unknown };

export type JsonPatchErrorCode =
  | "INVALID_OPERATION"
  | "INVALID_POINTER"
  | "PATH_NOT_FOUND"
  | "INVALID_ARRAY_INDEX"
  | "MISSING_MEMBER"
  | "TEST_FAILED"
  | "MOVE_INTO_DESCENDANT";

export class JsonPatchError extends Error {
  readonly name = "JsonPatchError";

  constructor(
    message: string,
    readonly code: JsonPatchErrorCode,
    readonly operationIndex: number,
    readonly operation: unknown,
    readonly path?: string,
  ) {
    super(`Operation ${operationIndex}: ${message}`);
  }
}

export interface JsonPatchApplicationResult {
  success: boolean;
  value?: unknown;
  error?: JsonPatchError;
  appliedOperations: number;
}

const hasOwn = (object: object, key: string) => Object.prototype.hasOwnProperty.call(object, key);

function cloneJson<T>(value: T): T {
  return structuredClone(value);
}

export function encodeJsonPointerSegment(segment: string): string {
  return segment.replace(/~/g, "~0").replace(/\//g, "~1");
}

export function parseJsonPointer(pointer: string): string[] {
  if (pointer === "") return [];
  if (!pointer.startsWith("/")) throw new Error("JSON Pointer must be empty or begin with '/'");
  return pointer.slice(1).split("/").map(segment => {
    if (/~(?:[^01]|$)/.test(segment)) throw new Error(`Invalid JSON Pointer escape in segment '${segment}'`);
    return segment.replace(/~1/g, "/").replace(/~0/g, "~");
  });
}

function pointer(segments: string[]): string {
  return segments.length === 0 ? "" : `/${segments.map(encodeJsonPointerSegment).join("/")}`;
}

function deepEqual(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (typeof left !== typeof right || left === null || right === null) return false;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right)
      && left.length === right.length
      && left.every((value, index) => deepEqual(value, right[index]));
  }
  if (typeof left === "object") {
    const leftRecord = left as Record<string, unknown>;
    const rightRecord = right as Record<string, unknown>;
    const keys = Object.keys(leftRecord);
    return keys.length === Object.keys(rightRecord).length
      && keys.every(key => hasOwn(rightRecord, key) && deepEqual(leftRecord[key], rightRecord[key]));
  }
  return false;
}

function fail(code: JsonPatchErrorCode, message: string, operation: unknown, index: number, path?: string): never {
  throw new JsonPatchError(message, code, index, operation, path);
}

function segmentsFor(operation: unknown, field: "path" | "from", index: number): string[] {
  if (!operation || typeof operation !== "object" || typeof (operation as Record<string, unknown>)[field] !== "string") {
    fail("MISSING_MEMBER", `operation requires a string '${field}' member`, operation, index);
  }
  const value = (operation as Record<string, string>)[field];
  try {
    return parseJsonPointer(value);
  } catch (error) {
    fail("INVALID_POINTER", error instanceof Error ? error.message : "Invalid JSON Pointer", operation, index, value);
  }
}

function arrayIndex(segment: string, length: number, allowEnd: boolean, operation: unknown, operationIndex: number, path: string): number {
  if (!/^(0|[1-9]\d*)$/.test(segment)) {
    fail("INVALID_ARRAY_INDEX", `array index '${segment}' must be an unsigned base-10 integer without leading zeros`, operation, operationIndex, path);
  }
  const index = Number(segment);
  if (!Number.isSafeInteger(index) || index > length || (!allowEnd && index === length)) {
    fail("INVALID_ARRAY_INDEX", `array index '${segment}' is outside the allowed range`, operation, operationIndex, path);
  }
  return index;
}

function locate(document: unknown, segments: string[], operation: unknown, operationIndex: number, fullPath: string): unknown {
  let current = document;
  for (const segment of segments) {
    if (Array.isArray(current)) {
      if (segment === "-") fail("INVALID_ARRAY_INDEX", "'-' is only valid as the final segment of an add operation", operation, operationIndex, fullPath);
      current = current[arrayIndex(segment, current.length, false, operation, operationIndex, fullPath)];
    } else if (current !== null && typeof current === "object") {
      if (!hasOwn(current, segment)) fail("PATH_NOT_FOUND", `path member '${segment}' does not exist`, operation, operationIndex, fullPath);
      current = (current as Record<string, unknown>)[segment];
    } else {
      fail("PATH_NOT_FOUND", `cannot traverse through a non-container at '${segment}'`, operation, operationIndex, fullPath);
    }
  }
  return current;
}

function parentOf(document: unknown, segments: string[], operation: unknown, operationIndex: number, fullPath: string): { parent: unknown; key: string } {
  if (segments.length === 0) fail("PATH_NOT_FOUND", "the document root has no parent", operation, operationIndex, fullPath);
  return {
    parent: locate(document, segments.slice(0, -1), operation, operationIndex, fullPath),
    key: segments[segments.length - 1],
  };
}

function read(document: unknown, segments: string[], operation: unknown, operationIndex: number, fullPath: string): unknown {
  return locate(document, segments, operation, operationIndex, fullPath);
}

function add(document: unknown, segments: string[], value: unknown, operation: unknown, operationIndex: number): unknown {
  if (segments.length === 0) return cloneJson(value);
  const fullPath = pointer(segments);
  const { parent, key } = parentOf(document, segments, operation, operationIndex, fullPath);
  const copied = cloneJson(value);
  if (Array.isArray(parent)) {
    const index = key === "-" ? parent.length : arrayIndex(key, parent.length, true, operation, operationIndex, fullPath);
    parent.splice(index, 0, copied);
  } else if (parent !== null && typeof parent === "object") {
    Object.defineProperty(parent, key, { value: copied, writable: true, enumerable: true, configurable: true });
  } else {
    fail("PATH_NOT_FOUND", "add target parent is not an object or array", operation, operationIndex, fullPath);
  }
  return document;
}

function remove(document: unknown, segments: string[], operation: unknown, operationIndex: number): unknown {
  if (segments.length === 0) return undefined;
  const fullPath = pointer(segments);
  const { parent, key } = parentOf(document, segments, operation, operationIndex, fullPath);
  if (Array.isArray(parent)) {
    if (key === "-") fail("INVALID_ARRAY_INDEX", "'-' is not valid for remove", operation, operationIndex, fullPath);
    parent.splice(arrayIndex(key, parent.length, false, operation, operationIndex, fullPath), 1);
  } else if (parent !== null && typeof parent === "object") {
    if (!hasOwn(parent, key)) fail("PATH_NOT_FOUND", `remove target '${key}' does not exist`, operation, operationIndex, fullPath);
    delete (parent as Record<string, unknown>)[key];
  } else {
    fail("PATH_NOT_FOUND", "remove target parent is not an object or array", operation, operationIndex, fullPath);
  }
  return document;
}

function replace(document: unknown, segments: string[], value: unknown, operation: unknown, operationIndex: number): unknown {
  if (segments.length === 0) return cloneJson(value);
  const fullPath = pointer(segments);
  const { parent, key } = parentOf(document, segments, operation, operationIndex, fullPath);
  const copied = cloneJson(value);
  if (Array.isArray(parent)) {
    if (key === "-") fail("INVALID_ARRAY_INDEX", "'-' is not valid for replace", operation, operationIndex, fullPath);
    parent[arrayIndex(key, parent.length, false, operation, operationIndex, fullPath)] = copied;
  } else if (parent !== null && typeof parent === "object") {
    if (!hasOwn(parent, key)) fail("PATH_NOT_FOUND", `replace target '${key}' does not exist`, operation, operationIndex, fullPath);
    Object.defineProperty(parent, key, { value: copied, writable: true, enumerable: true, configurable: true });
  } else {
    fail("PATH_NOT_FOUND", "replace target parent is not an object or array", operation, operationIndex, fullPath);
  }
  return document;
}

function isProperPrefix(from: string[], path: string[]): boolean {
  return from.length < path.length && from.every((segment, index) => path[index] === segment);
}

function applySingle(document: unknown, operation: unknown, index: number): unknown {
  if (!operation || typeof operation !== "object" || typeof (operation as Record<string, unknown>).op !== "string") {
    fail("INVALID_OPERATION", "patch operation must be an object with an 'op' member", operation, index);
  }
  const candidate = operation as Record<string, unknown>;
  if (!["add", "remove", "replace", "move", "copy", "test"].includes(candidate.op as string)) {
    fail("INVALID_OPERATION", `unsupported operation '${candidate.op}'`, operation, index, typeof candidate.path === "string" ? candidate.path : undefined);
  }
  const path = segmentsFor(operation, "path", index);
  switch (candidate.op) {
    case "add":
      if (!("value" in candidate)) fail("MISSING_MEMBER", "add requires a 'value' member", operation, index, candidate.path as string);
      return add(document, path, candidate.value, operation, index);
    case "remove": return remove(document, path, operation, index);
    case "replace":
      if (!("value" in candidate)) fail("MISSING_MEMBER", "replace requires a 'value' member", operation, index, candidate.path as string);
      return replace(document, path, candidate.value, operation, index);
    case "copy": {
      const from = segmentsFor(operation, "from", index);
      return add(document, path, read(document, from, operation, index, candidate.from as string), operation, index);
    }
    case "move": {
      const from = segmentsFor(operation, "from", index);
      if (isProperPrefix(from, path)) fail("MOVE_INTO_DESCENDANT", "move destination cannot be a descendant of its source", operation, index, candidate.path as string);
      const moved = cloneJson(read(document, from, operation, index, candidate.from as string));
      if (deepEqual(from, path)) return document;
      const withoutSource = remove(document, from, operation, index);
      return add(withoutSource, path, moved, operation, index);
    }
    case "test":
      if (!("value" in candidate)) fail("MISSING_MEMBER", "test requires a 'value' member", operation, index, candidate.path as string);
      if (!deepEqual(read(document, path, operation, index, candidate.path as string), candidate.value)) {
        fail("TEST_FAILED", "test operation value does not match the target", operation, index, candidate.path as string);
      }
      return document;
    default: fail("INVALID_OPERATION", `unsupported operation '${candidate.op}'`, operation, index, candidate.path as string | undefined);
  }
}

/** Apply operations atomically from the caller's perspective and stop on the first failure. */
export function applyJsonPatch(document: unknown, patches: readonly JsonPatch[]): unknown {
  let result = cloneJson(document);
  for (let index = 0; index < patches.length; index += 1) result = applySingle(result, patches[index], index);
  return result;
}

export function tryApplyJsonPatch(document: unknown, patches: readonly JsonPatch[]): JsonPatchApplicationResult {
  try {
    return { success: true, value: applyJsonPatch(document, patches), appliedOperations: patches.length };
  } catch (error) {
    if (error instanceof JsonPatchError) return { success: false, error, appliedOperations: error.operationIndex };
    throw error;
  }
}

/** Compare JSON values and generate an RFC 6902 patch that transforms left into right. */
export function compareJsonObjects(left: unknown, right: unknown): JsonDiffResult {
  const differences: DiffEntry[] = [];
  const patches: JsonPatch[] = [];
  compareRecursive(left, right, [], differences, patches);
  const summary: DiffSummary = {
    totalChanges: differences.length,
    added: differences.filter(entry => entry.type === "added").length,
    removed: differences.filter(entry => entry.type === "removed").length,
    modified: differences.filter(entry => entry.type === "modified").length,
    moved: differences.filter(entry => entry.type === "moved").length,
    unchanged: 0,
  };
  return { differences, summary, patches };
}

function compareRecursive(left: unknown, right: unknown, segments: string[], differences: DiffEntry[], patches: JsonPatch[]): void {
  if (deepEqual(left, right)) return;
  if (Array.isArray(left) && Array.isArray(right)) {
    const shared = Math.min(left.length, right.length);
    for (let index = 0; index < shared; index += 1) compareRecursive(left[index], right[index], [...segments, String(index)], differences, patches);
    for (let index = left.length - 1; index >= right.length; index -= 1) {
      const path = pointer([...segments, String(index)]);
      differences.push({ path, type: "removed", oldValue: left[index] });
      patches.push({ op: "remove", path });
    }
    for (let index = shared; index < right.length; index += 1) {
      const path = pointer([...segments, String(index)]);
      differences.push({ path, type: "added", newValue: right[index] });
      patches.push({ op: "add", path: pointer([...segments, "-"]), value: cloneJson(right[index]) });
    }
    return;
  }
  if (isRecord(left) && isRecord(right)) {
    for (const key of Object.keys(left)) {
      if (!hasOwn(right, key)) {
        const path = pointer([...segments, key]);
        differences.push({ path, type: "removed", oldValue: left[key] });
        patches.push({ op: "remove", path });
      }
    }
    for (const key of Object.keys(right)) {
      const child = [...segments, key];
      if (!hasOwn(left, key)) {
        const path = pointer(child);
        differences.push({ path, type: "added", newValue: right[key] });
        patches.push({ op: "add", path, value: cloneJson(right[key]) });
      } else {
        compareRecursive(left[key], right[key], child, differences, patches);
      }
    }
    return;
  }
  const path = pointer(segments);
  differences.push({ path, type: "modified", oldValue: left, newValue: right });
  patches.push({ op: "replace", path, value: cloneJson(right) });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function generateDiffSummary(result: JsonDiffResult): string {
  const { summary } = result;
  if (summary.totalChanges === 0) return "No differences found";
  const parts = [
    summary.added > 0 ? `${summary.added} added` : "",
    summary.removed > 0 ? `${summary.removed} removed` : "",
    summary.modified > 0 ? `${summary.modified} modified` : "",
    summary.moved > 0 ? `${summary.moved} moved` : "",
  ].filter(Boolean);
  return `${summary.totalChanges} total changes: ${parts.join(", ")}`;
}
