/** RFC 9535-oriented JSONPath parsing, evaluation, and exploration helpers. */

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

type Selector =
  | { type: "name"; name: string }
  | { type: "index"; index: number }
  | { type: "wildcard" }
  | { type: "slice"; start?: number; end?: number; step?: number }
  | { type: "filter"; expression: string };

interface Segment {
  descendant: boolean;
  selectors: Selector[];
}

interface Node {
  value: unknown;
  path: string;
}

const INTEGER = /^-?(?:0|[1-9]\d*)$/;
const SHORTHAND_NAME = /^[A-Za-z_][A-Za-z0-9_]*/;

function getValueType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  return typeof value;
}

/** RFC normalized paths use single-quoted member names. */
function normalizedMember(name: string): string {
  const escaped = name.replace(/[\\'\b\f\n\r\t\u0000-\u001f]/g, (character) => {
    const escapes: Record<string, string> = {
      "\\": "\\\\",
      "'": "\\'",
      "\b": "\\b",
      "\f": "\\f",
      "\n": "\\n",
      "\r": "\\r",
      "\t": "\\t",
    };
    return escapes[character] ??
      `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`;
  });
  return `['${escaped}']`;
}

function parseQuotedName(source: string): string {
  if (source.length < 2 || !["'", '"'].includes(source[0])) {
    throw new Error("Expected a quoted member name");
  }
  const quote = source[0];
  if (source[source.length - 1] !== quote) {
    throw new Error("Unterminated quoted member name");
  }
  let result = "";
  for (let index = 1; index < source.length - 1; index++) {
    const character = source[index];
    if (character !== "\\") {
      result += character;
      continue;
    }
    const escape = source[++index];
    if (escape === undefined) throw new Error("Invalid trailing escape");
    const simple: Record<string, string> = {
      b: "\b",
      f: "\f",
      n: "\n",
      r: "\r",
      t: "\t",
      "/": "/",
      "\\": "\\",
      "'": "'",
      '"': '"',
    };
    if (escape === "u") {
      const hex = source.slice(index + 1, index + 5);
      if (!/^[\da-f]{4}$/i.test(hex)) throw new Error("Invalid Unicode escape");
      result += String.fromCharCode(Number.parseInt(hex, 16));
      index += 4;
    } else if (escape in simple) {
      result += simple[escape];
    } else {
      throw new Error(`Invalid escape \\${escape}`);
    }
  }
  return result;
}

function splitTopLevel(source: string): string[] {
  const parts: string[] = [];
  let start = 0;
  let quote = "";
  let escaped = false;
  let bracketDepth = 0;
  let parenDepth = 0;
  for (let index = 0; index < source.length; index++) {
    const character = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = "";
      continue;
    }
    if (character === "'" || character === '"') quote = character;
    else if (character === "[") bracketDepth++;
    else if (character === "]") bracketDepth--;
    else if (character === "(") parenDepth++;
    else if (character === ")") parenDepth--;
    else if (character === "," && bracketDepth === 0 && parenDepth === 0) {
      parts.push(source.slice(start, index).trim());
      start = index + 1;
    }
  }
  if (quote || bracketDepth !== 0 || parenDepth !== 0) {
    throw new Error("Unbalanced selector expression");
  }
  parts.push(source.slice(start).trim());
  return parts;
}

function parseSelector(source: string): Selector {
  if (!source) throw new Error("Empty selector");
  if (source === "*") return { type: "wildcard" };
  if (source.startsWith("?")) {
    const expression = source.slice(1).trim();
    if (!expression) throw new Error("Empty filter expression");
    // Parse once during validation; evaluation parses with a concrete current node.
    evaluateFilter(expression, undefined, undefined, true);
    return { type: "filter", expression };
  }
  if (source[0] === "'" || source[0] === '"') {
    return { type: "name", name: parseQuotedName(source) };
  }
  if (source.includes(":")) {
    const fields = source.split(":");
    if (fields.length < 2 || fields.length > 3) throw new Error("Invalid array slice");
    const parsed = fields.map((field) => {
      const value = field.trim();
      if (!value) return undefined;
      if (!INTEGER.test(value)) throw new Error("Slice bounds must be integers");
      return Number(value);
    });
    return { type: "slice", start: parsed[0], end: parsed[1], step: parsed[2] };
  }
  if (INTEGER.test(source)) return { type: "index", index: Number(source) };
  throw new Error(`Unsupported selector: ${source}`);
}

function readBracket(expression: string, start: number): { content: string; end: number } {
  let depth = 1;
  let quote = "";
  let escaped = false;
  for (let index = start + 1; index < expression.length; index++) {
    const character = expression[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = "";
      continue;
    }
    if (character === "'" || character === '"') quote = character;
    else if (character === "[") depth++;
    else if (character === "]" && --depth === 0) {
      return { content: expression.slice(start + 1, index), end: index + 1 };
    }
  }
  throw new Error("Unterminated bracket segment");
}

function parseJsonPath(expression: string): Segment[] {
  if (!expression) throw new Error("Empty expression");
  if (expression[0] !== "$") throw new Error("JSONPath must start with $");
  const segments: Segment[] = [];
  let index = 1;
  while (index < expression.length) {
    let descendant = false;
    if (expression[index] === ".") {
      descendant = expression[index + 1] === ".";
      index += descendant ? 2 : 1;
      if (index >= expression.length) throw new Error("Incomplete child segment");
      if (expression[index] === "*") {
        segments.push({ descendant, selectors: [{ type: "wildcard" }] });
        index++;
        continue;
      }
      if (expression[index] !== "[") {
        const match = SHORTHAND_NAME.exec(expression.slice(index));
        if (!match) throw new Error("Invalid shorthand member name");
        segments.push({ descendant, selectors: [{ type: "name", name: match[0] }] });
        index += match[0].length;
        continue;
      }
    }
    if (expression[index] !== "[") {
      throw new Error(`Unexpected token at position ${index}`);
    }
    const bracket = readBracket(expression, index);
    const selectors = splitTopLevel(bracket.content).map(parseSelector);
    segments.push({ descendant, selectors });
    index = bracket.end;
  }
  return segments;
}

function childNodes(node: Node): Node[] {
  if (Array.isArray(node.value)) {
    return node.value.map((value, index) => ({ value, path: `${node.path}[${index}]` }));
  }
  if (node.value !== null && typeof node.value === "object") {
    return Object.entries(node.value as Record<string, unknown>).map(([name, value]) => ({
      value,
      path: `${node.path}${normalizedMember(name)}`,
    }));
  }
  return [];
}

function descendantBases(node: Node, ancestors = new Set<object>()): Node[] {
  const result = [node];
  if (node.value === null || typeof node.value !== "object") return result;
  if (ancestors.has(node.value)) return result;
  const nextAncestors = new Set(ancestors).add(node.value);
  for (const child of childNodes(node)) result.push(...descendantBases(child, nextAncestors));
  return result;
}

function sliceIndices(length: number, selector: Extract<Selector, { type: "slice" }>): number[] {
  const step = selector.step ?? 1;
  if (step === 0) return [];
  const indices: number[] = [];
  if (step > 0) {
    let start = selector.start ?? 0;
    let end = selector.end ?? length;
    if (start < 0) start += length;
    if (end < 0) end += length;
    start = Math.min(length, Math.max(0, start));
    end = Math.min(length, Math.max(0, end));
    for (let index = start; index < end; index += step) indices.push(index);
  } else {
    let start = selector.start ?? length - 1;
    let end = selector.end;
    if (start < 0) start += length;
    start = Math.min(length - 1, Math.max(-1, start));
    if (end === undefined) end = -1;
    else {
      if (end < 0) end += length;
      end = Math.min(length - 1, Math.max(-1, end));
    }
    for (let index = start; index > end; index += step) indices.push(index);
  }
  return indices;
}

function applySelector(node: Node, selector: Selector, root: unknown): Node[] {
  if (selector.type === "wildcard") return childNodes(node);
  if (selector.type === "name") {
    if (node.value === null || typeof node.value !== "object" || Array.isArray(node.value)) return [];
    if (!Object.prototype.hasOwnProperty.call(node.value, selector.name)) return [];
    return [{
      value: (node.value as Record<string, unknown>)[selector.name],
      path: `${node.path}${normalizedMember(selector.name)}`,
    }];
  }
  if (selector.type === "index") {
    if (!Array.isArray(node.value)) return [];
    const index = selector.index < 0 ? node.value.length + selector.index : selector.index;
    return index >= 0 && index < node.value.length
      ? [{ value: node.value[index], path: `${node.path}[${index}]` }]
      : [];
  }
  if (selector.type === "slice") {
    if (!Array.isArray(node.value)) return [];
    const array = node.value;
    return sliceIndices(array.length, selector).map((index) => ({
      value: array[index],
      path: `${node.path}[${index}]`,
    }));
  }
  return childNodes(node).filter((child) =>
    Boolean(evaluateFilter(selector.expression, child.value, root))
  );
}

interface FilterOperand {
  value: unknown;
  exists: boolean;
  query: boolean;
}

function evaluateFilter(
  source: string,
  current: unknown,
  root: unknown,
  syntaxOnly = false
): boolean {
  let index = 0;
  const skip = () => {
    while (/\s/.test(source[index] ?? "")) index++;
  };
  const consume = (token: string) => {
    skip();
    if (!source.startsWith(token, index)) return false;
    index += token.length;
    return true;
  };
  const parseString = (): string => {
    skip();
    const quote = source[index];
    let end = index + 1;
    let escaped = false;
    for (; end < source.length; end++) {
      const character = source[end];
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) break;
    }
    if (end >= source.length) throw new Error("Unterminated filter string");
    const result = parseQuotedName(source.slice(index, end + 1));
    index = end + 1;
    return result;
  };
  const resolveQuery = (): FilterOperand => {
    skip();
    let value = source[index++] === "@" ? current : root;
    let exists = true;
    while (index < source.length) {
      skip();
      let name: string | number;
      if (source[index] === ".") {
        index++;
        const match = SHORTHAND_NAME.exec(source.slice(index));
        if (!match) throw new Error("Invalid filter query member");
        name = match[0];
        index += match[0].length;
      } else if (source[index] === "[") {
        const bracket = readBracket(source, index);
        const content = bracket.content.trim();
        name = content[0] === "'" || content[0] === '"'
          ? parseQuotedName(content)
          : INTEGER.test(content)
            ? Number(content)
            : (() => { throw new Error("Filters support only singular child queries"); })();
        index = bracket.end;
      } else break;
      if (typeof name === "number") {
        if (!Array.isArray(value)) exists = false;
        else {
          const actual = name < 0 ? value.length + name : name;
          exists = actual >= 0 && actual < value.length;
          value = exists ? value[actual] : undefined;
        }
      } else if (value !== null && typeof value === "object" && Object.prototype.hasOwnProperty.call(value, name)) {
        value = (value as Record<string, unknown>)[name];
      } else {
        exists = false;
        value = undefined;
      }
    }
    return { value, exists, query: true };
  };
  const parseOperand = (): FilterOperand => {
    skip();
    const character = source[index];
    if (character === "@" || character === "$") return resolveQuery();
    if (character === "'" || character === '"') {
      return { value: parseString(), exists: true, query: false };
    }
    const rest = source.slice(index);
    const number = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(rest)?.[0];
    if (number) {
      index += number.length;
      return { value: Number(number), exists: true, query: false };
    }
    for (const [literal, value] of [["true", true], ["false", false], ["null", null]] as const) {
      if (source.startsWith(literal, index)) {
        index += literal.length;
        return { value, exists: true, query: false };
      }
    }
    throw new Error(`Invalid filter operand at position ${index}`);
  };
  const compare = (left: FilterOperand, operator: string, right: FilterOperand): boolean => {
    if (!left.exists && !right.exists) return operator === "==";
    if (!left.exists || !right.exists) return operator === "!=";
    if (operator === "==") return left.value === right.value;
    if (operator === "!=") return left.value !== right.value;
    if (
      (typeof left.value !== "number" || typeof right.value !== "number") &&
      (typeof left.value !== "string" || typeof right.value !== "string")
    ) return false;
    if (operator === "<") return left.value < right.value;
    if (operator === "<=") return left.value <= right.value;
    if (operator === ">") return left.value > right.value;
    return left.value >= right.value;
  };
  const parseTest = (): boolean => {
    const left = parseOperand();
    skip();
    const operator = ["==", "!=", "<=", ">=", "<", ">"].find((candidate) =>
      source.startsWith(candidate, index)
    );
    if (!operator) {
      if (!left.query) throw new Error("A filter test must be a query or comparison");
      return left.exists;
    }
    index += operator.length;
    return compare(left, operator, parseOperand());
  };
  const parsePrimary = (): boolean => {
    skip();
    if (consume("!")) return !parsePrimary();
    if (consume("(")) {
      const value = parseOr();
      if (!consume(")")) throw new Error("Unclosed filter parenthesis");
      return value;
    }
    return parseTest();
  };
  const parseAnd = (): boolean => {
    let value = parsePrimary();
    while (consume("&&")) {
      const right = parsePrimary();
      value = value && right;
    }
    return value;
  };
  const parseOr = (): boolean => {
    let value = parseAnd();
    while (consume("||")) {
      const right = parseAnd();
      value = value || right;
    }
    return value;
  };
  const result = parseOr();
  skip();
  if (index !== source.length) throw new Error(`Unexpected filter token at position ${index}`);
  return syntaxOnly ? true : result;
}

export function queryJsonPath(obj: unknown, expression: string): QueryResult {
  const started = typeof performance !== "undefined" ? performance.now() : Date.now();
  const segments = parseJsonPath(expression.trim());
  let nodes: Node[] = [{ value: obj, path: "$" }];
  for (const segment of segments) {
    const next: Node[] = [];
    for (const node of nodes) {
      const bases = segment.descendant ? descendantBases(node) : [node];
      for (const base of bases) {
        for (const selector of segment.selectors) {
          next.push(...applySelector(base, selector, obj));
        }
      }
    }
    nodes = next;
  }
  const ended = typeof performance !== "undefined" ? performance.now() : Date.now();
  const results = nodes.map(({ path, value }) => ({ path, value, type: getValueType(value) }));
  return { results, count: results.length, executionTime: ended - started };
}

export function getValueByPath(obj: unknown, path: string): unknown {
  try {
    const expression = path.startsWith("$") ? path : `$.${path}`;
    return queryJsonPath(obj, expression).results[0]?.value;
  } catch {
    return undefined;
  }
}

export function extractAllPaths(obj: unknown, prefix = "$"): JsonPathResult[] {
  const root: Node = { value: obj, path: prefix };
  return descendantBases(root).map(({ path, value }) => ({
    path,
    value,
    type: getValueType(value),
  }));
}

export function generateSamplePaths(obj: unknown): string[] {
  const samples = new Set(["$"]);
  for (const result of extractAllPaths(obj)) {
    if (result.path !== "$") samples.add(result.path);
    if (samples.size >= 12) break;
  }
  if (Array.isArray(obj)) {
    samples.add("$[*]");
    samples.add("$[0:3]");
  } else if (obj !== null && typeof obj === "object") {
    samples.add("$.*");
    samples.add("$..*");
  }
  return [...samples].slice(0, 15);
}

export function validateJsonPath(expression: string): { isValid: boolean; error?: string } {
  try {
    parseJsonPath(expression.trim());
    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: error instanceof Error ? error.message : "Invalid JSONPath" };
  }
}
