import type { ProcessorResult } from "./devops-config-core";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

function parseJson(input: string): ProcessorResult<JsonValue> {
  try {
    return { ok: true, value: JSON.parse(input) as JsonValue };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Invalid JSON.",
    };
  }
}

function validTypeName(name: string): string {
  const cleaned = name.replace(/[^A-Za-z0-9_$]/g, " ").replace(/(?:^|\s+)(\w)/g, (_, char: string) => char.toUpperCase());
  return /^[A-Za-z_$]/.test(cleaned) ? cleaned : `Generated${cleaned || "Type"}`;
}

function propertyName(key: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
}

function inferType(value: JsonValue, indent: number): string {
  if (value === null) return "null";
  if (Array.isArray(value)) {
    if (!value.length) return "unknown[]";
    const types = [...new Set(value.map((item) => inferType(item, indent)))];
    const union = types.length === 1 ? types[0] : `(${types.join(" | ")})`;
    return `${union}[]`;
  }
  if (typeof value === "object") {
    const padding = "  ".repeat(indent);
    const childPadding = "  ".repeat(indent + 1);
    const fields = Object.entries(value).map(
      ([key, child]) => `${childPadding}${propertyName(key)}: ${inferType(child, indent + 1)};`,
    );
    return fields.length ? `{\n${fields.join("\n")}\n${padding}}` : "Record<string, never>";
  }
  return typeof value;
}

export function jsonToTypeScript(input: string, rootName = "Root"): ProcessorResult<string> {
  const parsed = parseJson(input);
  if (!parsed.ok) return parsed;
  const name = validTypeName(rootName);
  return {
    ok: true,
    value: `export type ${name} = ${inferType(parsed.value, 0)};`,
  };
}

function escapePathSegment(segment: string): string {
  return segment.replace(/\\/g, "\\\\").replace(/\./g, "\\.");
}

function flattenValue(value: JsonValue, path: string, output: Record<string, JsonValue>): void {
  if (Array.isArray(value)) {
    if (!value.length) output[path || "$value"] = [];
    value.forEach((item, index) => flattenValue(item, `${path}[${index}]`, output));
    return;
  }
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value);
    if (!entries.length) output[path || "$value"] = {};
    entries.forEach(([key, child]) =>
      flattenValue(child, path ? `${path}.${escapePathSegment(key)}` : escapePathSegment(key), output),
    );
    return;
  }
  output[path || "$value"] = value;
}

export function flattenJson(input: string): ProcessorResult<string> {
  const parsed = parseJson(input);
  if (!parsed.ok) return parsed;
  const output: Record<string, JsonValue> = {};
  flattenValue(parsed.value, "", output);
  return { ok: true, value: JSON.stringify(output, null, 2) };
}

function tokenizePath(path: string): Array<string | number> | null {
  const tokens: Array<string | number> = [];
  let current = "";
  for (let index = 0; index < path.length; index += 1) {
    const char = path[index];
    if (char === "\\") {
      index += 1;
      if (index >= path.length) return null;
      current += path[index];
    } else if (char === ".") {
      if (current) {
        tokens.push(current);
        current = "";
      } else if (path[index - 1] !== "]") {
        return null;
      }
    } else if (char === "[") {
      if (current) {
        tokens.push(current);
        current = "";
      }
      const close = path.indexOf("]", index);
      const rawIndex = path.slice(index + 1, close);
      if (close < 0 || !/^\d+$/.test(rawIndex)) return null;
      tokens.push(Number(rawIndex));
      index = close;
    } else {
      current += char;
    }
  }
  if (current) tokens.push(current);
  return tokens.length ? tokens : null;
}

export function unflattenJson(input: string): ProcessorResult<string> {
  const parsed = parseJson(input);
  if (!parsed.ok) return parsed;
  if (!parsed.value || Array.isArray(parsed.value) || typeof parsed.value !== "object") {
    return { ok: false, error: "Flattened input must be a JSON object." };
  }
  if ("$value" in parsed.value && Object.keys(parsed.value).length === 1) {
    return { ok: true, value: JSON.stringify(parsed.value.$value, null, 2) };
  }

  const entries = Object.entries(parsed.value);
  const firstTokens = entries.length ? tokenizePath(entries[0][0]) : null;
  const root: Record<string, JsonValue> | JsonValue[] =
    typeof firstTokens?.[0] === "number" ? [] : {};
  for (const [path, value] of entries) {
    const tokens = tokenizePath(path);
    if (!tokens) return { ok: false, error: `Invalid flattened path: ${path}` };
    let cursor: Record<string, JsonValue> | JsonValue[] = root;
    for (let index = 0; index < tokens.length; index += 1) {
      const token = tokens[index];
      const last = index === tokens.length - 1;
      const nextIsArray = typeof tokens[index + 1] === "number";
      if (last) {
        (cursor as unknown as Record<string | number, JsonValue>)[token] = value;
        continue;
      }
      const record = cursor as unknown as Record<string | number, JsonValue>;
      const existing = record[token];
      if (existing === undefined) {
        record[token] = nextIsArray ? [] : {};
      } else if (existing === null || typeof existing !== "object" || Array.isArray(existing) !== nextIsArray) {
        return { ok: false, error: `Conflicting flattened path: ${path}` };
      }
      cursor = record[token] as Record<string, JsonValue> | JsonValue[];
    }
  }
  return { ok: true, value: JSON.stringify(root, null, 2) };
}
