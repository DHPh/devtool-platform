"use client";

import { useMemo, useState } from "react";
import {
  CopyableResult,
  ToolErrorResult as ErrorResult,
  ToolSectionHeader as Header,
} from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  buildSelectQuery,
  dataToSql,
  flattenJson,
  formatGraphql,
  formatSql,
  generateFakeData,
  jsonToTypeScript,
  unflattenJson,
  validateOpenApi,
  type SqlCondition,
  type SqlDialect,
} from "@/lib/processors";

const SAMPLE = '{"user":{"id":1,"display-name":"Ada"},"roles":["admin","editor"]}';

function Editor({ input, onInput, output, error }: { input: string; onInput: (value: string) => void; output: string; error?: string }) {
  return <div className="grid gap-4 lg:grid-cols-2"><label className="space-y-2"><span className="text-sm font-medium">Input</span><Textarea value={input} onChange={(event) => onInput(event.target.value)} rows={18} className="font-mono" spellCheck={false} /></label><div>{error ? <div role="alert"><CopyableResult value={error} label="Error" copyLabel="Copy error" rows={5} textareaClassName="border-destructive text-destructive" /></div> : <CopyableResult value={output} label="Result" copyLabel="Copy result" rows={18} />}</div></div>;
}

export function JsonToTypeScriptTool() {
  const [input, setInput] = useState(SAMPLE);
  const [name, setName] = useState("ApiResponse");
  const result = useMemo(() => jsonToTypeScript(input, name), [input, name]);
  return <section className="space-y-5"><Header title="JSON to TypeScript" description="Infer a TypeScript type without evaluating code or uploading data." /><label className="block max-w-sm space-y-2"><span className="text-sm font-medium">Root type name</span><Input value={name} onChange={(event) => setName(event.target.value)} /></label><Editor input={input} onInput={setInput} output={result.ok ? result.value : ""} error={result.ok ? undefined : result.error} /></section>;
}

export function JsonFlattenTool() {
  const [input, setInput] = useState(SAMPLE);
  const [direction, setDirection] = useState<"flatten" | "unflatten">("flatten");
  const result = useMemo(() => direction === "flatten" ? flattenJson(input) : unflattenJson(input), [direction, input]);
  const switchDirection = () => {
    if (result.ok) setInput(result.value);
    setDirection((current) => current === "flatten" ? "unflatten" : "flatten");
  };
  return <section className="space-y-5"><Header title="JSON Flatten and Unflatten" description="Convert nested JSON to escaped dot-and-index paths and back." /><div className="flex flex-wrap items-center gap-3"><span className="text-sm font-medium">{direction === "flatten" ? "Nested → flattened" : "Flattened → nested"}</span><Button type="button" variant="outline" size="sm" onClick={switchDirection}>Reverse direction</Button></div><Editor input={input} onInput={setInput} output={result.ok ? result.value : ""} error={result.ok ? undefined : result.error} /></section>;
}

export function SqlFormatterTool() {
  const [input, setInput] = useState("select u.id,u.name from users u where u.active=true order by u.name;");
  const result = useMemo(() => formatSql(input), [input]);
  return <section className="space-y-5"><Header title="SQL Formatter" description="Format SQL locally while preserving quoted strings and identifiers." /><Editor input={input} onInput={setInput} output={result.ok ? result.value : ""} error={result.ok ? undefined : result.error} /></section>;
}

const SQL_OPERATORS: SqlCondition["operator"][] = ["=", "!=", ">", ">=", "<", "<=", "LIKE", "IS NULL", "IS NOT NULL"];

export function SqlQueryBuilderTool() {
  const [table, setTable] = useState("users");
  const [columns, setColumns] = useState("id, name, email");
  const [conditionColumn, setConditionColumn] = useState("active");
  const [operator, setOperator] = useState<SqlCondition["operator"]>("=");
  const [conditionValue, setConditionValue] = useState("true");
  const [orderBy, setOrderBy] = useState("name");
  const [limit, setLimit] = useState("25");
  const result = useMemo(() => buildSelectQuery({ table, columns: columns.split(","), conditions: conditionColumn ? [{ column: conditionColumn, operator, value: conditionValue }] : [], orderBy: orderBy || undefined, limit: limit ? Number(limit) : undefined }), [table, columns, conditionColumn, operator, conditionValue, orderBy, limit]);
  return <section className="space-y-5"><Header title="SQL Query Builder" description="Build a SELECT query with escaped literal values. Review generated SQL before execution." /><div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3"><label className="space-y-2"><span className="text-sm font-medium">Table</span><Input value={table} onChange={(event) => setTable(event.target.value)} /></label><label className="space-y-2"><span className="text-sm font-medium">Columns</span><Input value={columns} onChange={(event) => setColumns(event.target.value)} /></label><label className="space-y-2"><span className="text-sm font-medium">Condition column</span><Input value={conditionColumn} onChange={(event) => setConditionColumn(event.target.value)} /></label><label className="space-y-2"><span className="text-sm font-medium">Operator</span><Select value={operator} onValueChange={(value) => setOperator(value as SqlCondition["operator"])}><SelectTrigger aria-label="Operator"><SelectValue /></SelectTrigger><SelectContent>{SQL_OPERATORS.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></label><label className="space-y-2"><span className="text-sm font-medium">Condition value</span><Input value={conditionValue} onChange={(event) => setConditionValue(event.target.value)} disabled={operator.includes("NULL")} /></label><label className="space-y-2"><span className="text-sm font-medium">Order by</span><Input value={orderBy} onChange={(event) => setOrderBy(event.target.value)} /></label><label className="space-y-2"><span className="text-sm font-medium">Limit</span><Input type="number" min="1" max="1000000" value={limit} onChange={(event) => setLimit(event.target.value)} /></label></div>{result.ok ? <CopyableResult value={result.value} label="SELECT query (escaped literals)" copyLabel="Copy SELECT query" rows={8} /> : <ErrorResult message={result.error} />}</section>;
}

const DATA_SQL_SAMPLE = `[
  { "name": "Ada", "active": true, "score": 98 },
  { "name": "Grace", "active": true, "score": 96 }
]`;

export function DataToSqlTool() {
  const [input, setInput] = useState(DATA_SQL_SAMPLE);
  const [table, setTable] = useState("users");
  const [dialect, setDialect] = useState<SqlDialect>("postgresql");
  const result = useMemo(() => dataToSql(input, table, dialect), [input, table, dialect]);
  return <section className="space-y-5"><Header title="Data to SQL Generator" description="Generate escaped literal INSERT statements for PostgreSQL, MySQL, or SQLite. Review before execution." /><div className="grid gap-3 sm:grid-cols-2"><label className="space-y-2"><span className="text-sm font-medium">Table</span><Input value={table} onChange={(event) => setTable(event.target.value)} /></label><label className="space-y-2"><span className="text-sm font-medium">Dialect</span><Select value={dialect} onValueChange={(value) => setDialect(value as SqlDialect)}><SelectTrigger aria-label="Dialect"><SelectValue /></SelectTrigger><SelectContent>{(["postgresql", "mysql", "sqlite"] as const).map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></label></div><Editor input={input} onInput={setInput} output={result.ok ? result.value : ""} error={result.ok ? undefined : result.error} /></section>;
}

const OPENAPI_SAMPLE = `openapi: 3.1.0
info:
  title: Example API
  version: 1.0.0
paths:
  /users:
    get:
      responses:
        "200":
          description: OK`;

export function OpenApiValidatorTool() {
  const [input, setInput] = useState(OPENAPI_SAMPLE);
  const result = useMemo(() => validateOpenApi(input), [input]);
  return <section className="space-y-5"><Header title="OpenAPI Validator" description="Parse OpenAPI 3.x JSON or YAML and inspect required metadata, paths, operations, and responses." /><label className="block space-y-2"><span className="text-sm font-medium">OpenAPI document</span><Textarea value={input} onChange={(event) => setInput(event.target.value)} rows={18} className="font-mono" spellCheck={false} /></label>{result.ok ? <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><CopyableResult value={result.value.version} label="OpenAPI version" copyLabel="Copy OpenAPI version" rows={1} /><CopyableResult value={result.value.title || "Missing"} label="API title" copyLabel="Copy API title" rows={1} /><CopyableResult value={String(result.value.paths)} label="Path count" copyLabel="Copy path count" rows={1} /><CopyableResult value={String(result.value.operations)} label="Operation count" copyLabel="Copy operation count" rows={1} /></div>{result.value.issues.length ? <div className="grid gap-3 md:grid-cols-2">{result.value.issues.map((issue, index) => <CopyableResult key={`${issue}-${index}`} value={issue} label={`Issue ${index + 1}`} copyLabel={`Copy issue ${index + 1}`} rows={2} textareaClassName="border-destructive" />)}</div> : <CopyableResult value="No issues found." label="Validation result" copyLabel="Copy validation result" rows={1} />}</div> : <ErrorResult message={result.error} />}</section>;
}

export function GraphqlFormatterTool() {
  const [input, setInput] = useState("query User($id: ID!) { user(id: $id) { id name email } }");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [formatting, setFormatting] = useState(false);
  const format = async () => {
    setFormatting(true);
    const result = await formatGraphql(input);
    if (result.ok) { setOutput(result.value); setError(""); } else { setOutput(""); setError(result.error); }
    setFormatting(false);
  };
  return <section className="space-y-5"><Header title="GraphQL Formatter" description="Format and parse-check GraphQL queries, mutations, fragments, and schemas locally." /><Button type="button" onClick={() => void format()} disabled={formatting}>{formatting ? "Formatting…" : "Format GraphQL"}</Button><Editor input={input} onInput={setInput} output={output} error={error || undefined} /></section>;
}

export function FakeDataGeneratorTool() {
  const [count, setCount] = useState("10");
  const [seed, setSeed] = useState("42");
  const result = useMemo(() => generateFakeData({ count: Number(count), seed: Number(seed) }), [count, seed]);
  return <section className="space-y-5"><Header title="Fake Data Generator" description="Generate deterministic JSON records for development and tests using a repeatable seed." /><div className="grid max-w-xl gap-3 sm:grid-cols-2"><label className="space-y-2"><span className="text-sm font-medium">Record count</span><Input type="number" min="1" max="1000" value={count} onChange={(event) => setCount(event.target.value)} /></label><label className="space-y-2"><span className="text-sm font-medium">Seed</span><Input type="number" value={seed} onChange={(event) => setSeed(event.target.value)} /></label></div>{result.ok ? <CopyableResult value={result.value} label="Generated JSON" copyLabel="Copy generated JSON" rows={20} /> : <ErrorResult message={result.error} />}</section>;
}
