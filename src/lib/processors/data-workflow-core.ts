import { parse as parseYaml } from "yaml";
import type { ProcessorResult } from "./result";

const SQL_KEYWORDS = new Set([
  "SELECT", "FROM", "WHERE", "JOIN", "LEFT", "RIGHT", "INNER", "OUTER", "FULL", "CROSS", "ON",
  "GROUP", "BY", "ORDER", "HAVING", "LIMIT", "OFFSET", "INSERT", "INTO", "VALUES", "UPDATE", "SET",
  "DELETE", "CREATE", "TABLE", "ALTER", "DROP", "AS", "AND", "OR", "NOT", "NULL", "IS", "IN", "LIKE",
  "ASC", "DESC", "DISTINCT", "UNION", "ALL", "CASE", "WHEN", "THEN", "ELSE", "END", "RETURNING",
  "TRUE", "FALSE",
]);

const SQL_NEWLINE_KEYWORDS = new Set([
  "SELECT", "FROM", "WHERE", "JOIN", "LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "FULL JOIN", "CROSS JOIN",
  "GROUP BY", "ORDER BY", "HAVING", "LIMIT", "OFFSET", "VALUES", "SET", "RETURNING", "UNION", "UNION ALL",
]);

function tokenizeSql(input: string): ProcessorResult<string[]> {
  const tokens: string[] = [];
  const pattern = /(?:--[^\n]*|\/\*[\s\S]*?\*\/|'(?:''|[^'])*'|"(?:""|[^"])*"|`(?:``|[^`])*`|\b\w+\b|<>|!=|<=|>=|::|[-+*/%=<>(){},.;])/gy;
  let cursor = 0;
  while (cursor < input.length) {
    pattern.lastIndex = cursor;
    const match = pattern.exec(input);
    if (!match) {
      if (/\s/.test(input[cursor])) { cursor += 1; continue; }
      return { ok: false, error: `Unexpected SQL character at position ${cursor + 1}.` };
    }
    tokens.push(match[0]);
    cursor = pattern.lastIndex;
  }
  return { ok: true, value: tokens };
}

export function formatSql(input: string): ProcessorResult<string> {
  if (!input.trim()) return { ok: false, error: "Enter a SQL statement." };
  const tokenized = tokenizeSql(input);
  if (!tokenized.ok) return tokenized;
  const normalized: string[] = [];
  for (let index = 0; index < tokenized.value.length; index += 1) {
    const token = tokenized.value[index];
    const upper = token.toUpperCase();
    if (SQL_KEYWORDS.has(upper) && !/^[`"']/.test(token)) {
      const next = tokenized.value[index + 1]?.toUpperCase();
      if (["GROUP", "ORDER"].includes(upper) && next === "BY") { normalized.push(`${upper} BY`); index += 1; continue; }
      if (["LEFT", "RIGHT", "INNER", "FULL", "CROSS"].includes(upper) && next === "JOIN") { normalized.push(`${upper} JOIN`); index += 1; continue; }
      if (upper === "UNION" && next === "ALL") { normalized.push("UNION ALL"); index += 1; continue; }
      normalized.push(upper);
    } else normalized.push(token);
  }
  const lines: string[] = [];
  let line = "";
  let depth = 0;
  const flush = () => { if (line.trim()) lines.push(`${"  ".repeat(Math.max(0, depth))}${line.trim()}`); line = ""; };
  normalized.forEach((token) => {
    // A line comment consumes the rest of its source line. Preserve that
    // boundary so following SQL cannot accidentally become part of the comment.
    if (token.startsWith("--")) { line += `${line && !/\s$/.test(line) ? " " : ""}${token}`; flush(); return; }
    if (SQL_NEWLINE_KEYWORDS.has(token)) { flush(); line = `${token} `; return; }
    if (token === "AND" || token === "OR") { flush(); line = `${token} `; return; }
    if (token === "(") { line = `${line.trimEnd()} (`; depth += 1; return; }
    if (token === ")") { depth = Math.max(0, depth - 1); line = `${line.trimEnd()})`; return; }
    if (token === ",") { line = `${line.trimEnd()}, `; return; }
    if (token === ";") { line = `${line.trimEnd()};`; flush(); return; }
    if (token === "." || token === "::") { line = `${line.trimEnd()}${token}`; return; }
    line += `${line && !/[\s.(]$/.test(line) ? " " : ""}${token}`;
  });
  flush();
  return { ok: true, value: `${lines.join("\n")}\n` };
}

export interface SqlCondition { column: string; operator: "=" | "!=" | ">" | ">=" | "<" | "<=" | "LIKE" | "IS NULL" | "IS NOT NULL"; value?: string }
export interface SqlQueryInput { table: string; columns: string[]; conditions?: SqlCondition[]; orderBy?: string; descending?: boolean; limit?: number }

function safeSqlIdentifier(identifier: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_$]*(?:\.[A-Za-z_][A-Za-z0-9_$]*)*$/.test(identifier);
}

function sqlLiteral(value: string): string {
  if (/^-?(?:\d+\.?\d*|\.\d+)$/.test(value.trim())) return value.trim();
  if (/^(?:true|false|null)$/i.test(value.trim())) return value.trim().toUpperCase();
  return `'${value.replace(/'/g, "''")}'`;
}

export function buildSelectQuery(input: SqlQueryInput): ProcessorResult<string> {
  const table = input.table.trim();
  const columns = input.columns.map((column) => column.trim()).filter(Boolean);
  if (!safeSqlIdentifier(table)) return { ok: false, error: "Enter a valid table name." };
  if (!columns.length || columns.some((column) => column !== "*" && !safeSqlIdentifier(column))) return { ok: false, error: "Enter valid comma-separated columns." };
  const conditions = input.conditions ?? [];
  if (conditions.some(({ column }) => !safeSqlIdentifier(column))) return { ok: false, error: "Condition columns must be valid identifiers." };
  if (input.orderBy && !safeSqlIdentifier(input.orderBy)) return { ok: false, error: "Order-by column must be a valid identifier." };
  if (input.limit !== undefined && (!Number.isInteger(input.limit) || input.limit < 1 || input.limit > 1_000_000)) return { ok: false, error: "Limit must be an integer from 1 to 1000000." };
  let query = `SELECT ${columns.join(", ")}\nFROM ${table}`;
  if (conditions.length) query += `\nWHERE ${conditions.map(({ column, operator, value }) => `${column} ${operator}${operator.includes("NULL") ? "" : ` ${sqlLiteral(value ?? "")}`}`).join("\n  AND ")}`;
  if (input.orderBy) query += `\nORDER BY ${input.orderBy}${input.descending ? " DESC" : " ASC"}`;
  if (input.limit) query += `\nLIMIT ${input.limit}`;
  return { ok: true, value: `${query};` };
}

export type SqlDialect = "postgresql" | "mysql" | "sqlite";

function quoteIdentifier(identifier: string, dialect: SqlDialect): string {
  const quote = dialect === "mysql" ? "`" : '"';
  return `${quote}${identifier.replace(new RegExp(quote, "g"), quote + quote)}${quote}`;
}

function serializeSqlValue(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  const text = typeof value === "object" ? JSON.stringify(value) : String(value);
  return `'${text.replace(/'/g, "''")}'`;
}

export function dataToSql(input: string, tableInput: string, dialect: SqlDialect = "postgresql"): ProcessorResult<string> {
  const table = tableInput.trim();
  if (!safeSqlIdentifier(table) || table.includes(".")) return { ok: false, error: "Enter a valid unqualified table name." };
  let parsed: unknown;
  try { parsed = JSON.parse(input); } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Invalid JSON." }; }
  const rows = Array.isArray(parsed) ? parsed : [parsed];
  if (!rows.length || rows.some((row) => typeof row !== "object" || row === null || Array.isArray(row))) return { ok: false, error: "Input must be a JSON object or a non-empty array of objects." };
  const records = rows as Array<Record<string, unknown>>;
  const columns = [...new Set(records.flatMap((row) => Object.keys(row)))];
  if (!columns.length) return { ok: false, error: "Rows must contain at least one field." };
  const columnSql = columns.map((column) => quoteIdentifier(column, dialect)).join(", ");
  const values = records.map((row) => `(${columns.map((column) => serializeSqlValue(row[column])).join(", ")})`).join(",\n  ");
  return { ok: true, value: `INSERT INTO ${quoteIdentifier(table, dialect)} (${columnSql})\nVALUES\n  ${values};` };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const HTTP_METHODS = ["get", "put", "post", "delete", "options", "head", "patch", "trace"];
export interface OpenApiValidationResult { version: string; title: string; paths: number; operations: number; issues: string[] }

export function validateOpenApi(input: string): ProcessorResult<OpenApiValidationResult> {
  if (!input.trim()) return { ok: false, error: "Enter an OpenAPI document." };
  let document: unknown;
  try { document = input.trimStart().startsWith("{") ? JSON.parse(input) : parseYaml(input); }
  catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Document could not be parsed." }; }
  if (!isRecord(document)) return { ok: false, error: "OpenAPI document must be an object." };
  const version = typeof document.openapi === "string" ? document.openapi : "";
  if (!/^3\.\d+\.\d+(?:-.+)?$/.test(version)) return { ok: false, error: "A supported OpenAPI 3.x version is required." };
  const info = isRecord(document.info) ? document.info : {};
  const title = typeof info.title === "string" ? info.title : "";
  const paths = isRecord(document.paths) ? document.paths : {};
  const issues: string[] = [];
  if (!title) issues.push("info.title is required.");
  if (typeof info.version !== "string" || !info.version) issues.push("info.version is required.");
  let operations = 0;
  for (const [path, pathItem] of Object.entries(paths)) {
    if (!path.startsWith("/")) issues.push(`Path ${path} must start with a slash.`);
    if (!isRecord(pathItem)) { issues.push(`Path ${path} must be an object.`); continue; }
    for (const method of HTTP_METHODS) {
      if (!(method in pathItem)) continue;
      operations += 1;
      const operation = pathItem[method];
      if (!isRecord(operation)) issues.push(`${method.toUpperCase()} ${path} must be an object.`);
      else if (!isRecord(operation.responses) || !Object.keys(operation.responses).length) issues.push(`${method.toUpperCase()} ${path} must define responses.`);
    }
  }
  return { ok: true, value: { version, title, paths: Object.keys(paths).length, operations, issues } };
}

export async function formatGraphql(input: string): Promise<ProcessorResult<string>> {
  if (!input.trim()) return { ok: false, error: "Enter a GraphQL document." };
  try {
    const [prettier, graphqlPlugin] = await Promise.all([
      import("prettier/standalone"),
      import("prettier/plugins/graphql"),
    ]);
    return { ok: true, value: await prettier.format(input, { parser: "graphql", plugins: [graphqlPlugin] }) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "GraphQL could not be parsed." };
  }
}

export interface FakeDataOptions { count?: number; seed?: number }

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => { state = (state * 1664525 + 1013904223) >>> 0; return state / 0x100000000; };
}

export function generateFakeData(options: FakeDataOptions = {}): ProcessorResult<string> {
  const count = options.count ?? 10;
  const seed = options.seed ?? 42;
  if (!Number.isInteger(count) || count < 1 || count > 1000) return { ok: false, error: "Count must be an integer from 1 to 1000." };
  if (!Number.isInteger(seed)) return { ok: false, error: "Seed must be an integer." };
  const random = seededRandom(seed);
  const firstNames = ["Ada", "Grace", "Linus", "Margaret", "Ken", "Barbara", "Edsger", "Radia"];
  const lastNames = ["Lovelace", "Hopper", "Torvalds", "Hamilton", "Thompson", "Liskov", "Dijkstra", "Perlman"];
  const domains = ["example.com", "example.org", "example.net"];
  const rows = Array.from({ length: count }, (_, index) => {
    const firstName = firstNames[Math.floor(random() * firstNames.length)];
    const lastName = lastNames[Math.floor(random() * lastNames.length)];
    return {
      id: index + 1,
      name: `${firstName} ${lastName}`,
      email: `${firstName}.${lastName}.${index + 1}@${domains[Math.floor(random() * domains.length)]}`.toLowerCase(),
      active: random() >= 0.25,
      score: Math.floor(random() * 101),
    };
  });
  return { ok: true, value: JSON.stringify(rows, null, 2) };
}
