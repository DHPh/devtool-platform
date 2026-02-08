/** JSON Schema Draft 2020-12 validation and inference utilities. */

import Ajv2020, { type AnySchema, type ErrorObject } from "ajv/dist/2020";
import addFormats from "ajv-formats";

export const JSON_SCHEMA_DRAFT_2020_12 = "https://json-schema.org/draft/2020-12/schema";

export interface SchemaValidationResult {
  isValid: boolean;
  errors: SchemaError[];
  warnings: string[];
}

export interface SchemaError {
  path: string;
  message: string;
  schemaPath: string;
  value: unknown;
  keyword?: string;
  params?: Record<string, unknown>;
}

/**
 * A JSON Schema can be a boolean or an object. Known 2020-12 keywords are
 * listed for editor assistance and arbitrary vocabulary keywords are allowed.
 */
export type JsonSchema = boolean | JsonSchemaObject;

export interface JsonSchemaObject {
  [keyword: string]: unknown;
  $schema?: string;
  $id?: string;
  $anchor?: string;
  $dynamicAnchor?: string;
  $ref?: string;
  $dynamicRef?: string;
  $defs?: Record<string, JsonSchema>;
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  patternProperties?: Record<string, JsonSchema>;
  additionalProperties?: boolean | JsonSchema;
  unevaluatedProperties?: boolean | JsonSchema;
  propertyNames?: JsonSchema;
  required?: string[];
  dependentRequired?: Record<string, string[]>;
  dependentSchemas?: Record<string, JsonSchema>;
  prefixItems?: JsonSchema[];
  items?: JsonSchema;
  contains?: JsonSchema;
  minContains?: number;
  maxContains?: number;
  unevaluatedItems?: boolean | JsonSchema;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  enum?: unknown[];
  const?: unknown;
  allOf?: JsonSchema[];
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  not?: JsonSchema;
  if?: JsonSchema;
  then?: JsonSchema;
  else?: JsonSchema;
  title?: string;
  description?: string;
  default?: unknown;
  examples?: unknown[];
}

const MAX_SCHEMA_NODES = 10_000;
const MAX_SCHEMA_DEPTH = 128;
const MAX_DATA_NODES = 100_000;
const MAX_DATA_DEPTH = 512;

function createValidator() {
  const ajv = new Ajv2020({
    allErrors: true,
    strict: false,
    validateFormats: true,
    unicodeRegExp: true,
    allowUnionTypes: true,
  });
  addFormats(ajv);
  return ajv;
}

function assertSafeSchemaStructure(schema: JsonSchema): void {
  assertSafeStructure(schema, "Schema", MAX_SCHEMA_NODES, MAX_SCHEMA_DEPTH);
}

function assertSafeDataStructure(data: unknown): void {
  assertSafeStructure(data, "Data", MAX_DATA_NODES, MAX_DATA_DEPTH);
}

function assertSafeStructure(value: unknown, label: string, maxNodes: number, maxDepth: number): void {
  const pending: Array<{ value: unknown; depth: number }> = [{ value, depth: 0 }];
  const seen = new WeakSet<object>();
  let nodes = 0;

  while (pending.length > 0) {
    const current = pending.pop()!;
    if (current.depth > maxDepth) {
      throw new Error(`${label} exceeds the supported nesting depth of ${maxDepth}`);
    }
    if (!current.value || typeof current.value !== "object") continue;
    if (seen.has(current.value)) throw new Error(`${label} must be JSON and cannot contain JavaScript object cycles`);
    seen.add(current.value);
    nodes += 1;
    if (nodes > maxNodes) throw new Error(`${label} exceeds the supported size of ${maxNodes} object and array nodes`);
    for (const value of Object.values(current.value)) pending.push({ value, depth: current.depth + 1 });
  }
}

function pointerSegments(pointer: string): string[] {
  if (!pointer) return [];
  return pointer.slice(1).split("/").map(segment => segment.replace(/~1/g, "/").replace(/~0/g, "~"));
}

function displayPath(pointer: string, error?: ErrorObject): string {
  const segments = pointerSegments(pointer);
  const property = error?.keyword === "required"
    ? String(error.params.missingProperty)
    : error?.keyword === "additionalProperties" || error?.keyword === "unevaluatedProperties"
      ? String(error.params.additionalProperty ?? error.params.unevaluatedProperty)
      : null;
  if (property) segments.push(property);
  return segments.reduce((path, segment) => /^\d+$/.test(segment)
    ? `${path}[${segment}]`
    : `${path}.${segment}`, "$"
  );
}

function valueAtPointer(data: unknown, pointer: string): unknown {
  return pointerSegments(pointer).reduce<unknown>((current, segment) => {
    if (current === null || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[segment];
  }, data);
}

function mapAjvError(error: ErrorObject, data: unknown): SchemaError {
  return {
    path: displayPath(error.instancePath, error),
    message: error.message ?? `Failed ${error.keyword} validation`,
    schemaPath: error.schemaPath,
    value: valueAtPointer(data, error.instancePath),
    keyword: error.keyword,
    params: error.params,
  };
}

/** Validate JSON-compatible data using the JSON Schema Draft 2020-12 dialect. */
export function validateJsonSchema(data: unknown, schema: JsonSchema): SchemaValidationResult {
  try {
    assertSafeSchemaStructure(schema);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The schema could not be inspected";
    return {
      isValid: false,
      errors: [{ path: "$", message: `Invalid Draft 2020-12 schema: ${message}`, schemaPath: "$", value: schema, keyword: "schema" }],
      warnings: [],
    };
  }

  try {
    assertSafeDataStructure(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The data could not be inspected";
    return {
      isValid: false,
      errors: [{ path: "$", message, schemaPath: "$", value: undefined, keyword: "data" }],
      warnings: [],
    };
  }

  try {
    const validate = createValidator().compile(schema as AnySchema);
    const isValid = validate(data) === true;
    return {
      isValid,
      errors: (validate.errors ?? []).map(error => mapAjvError(error, data)),
      warnings: [],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "The schema could not be compiled";
    return {
      isValid: false,
      errors: [{ path: "$", message: `Invalid Draft 2020-12 schema: ${message}`, schemaPath: "$", value: schema, keyword: "schema" }],
      warnings: [],
    };
  }
}

/** Generate a conservative Draft 2020-12 schema from one JSON value. */
export function generateSchemaFromData(data: unknown): JsonSchemaObject {
  const schema = inferSchema(data);
  return { $schema: JSON_SCHEMA_DRAFT_2020_12, ...schema };
}

function inferSchema(data: unknown): JsonSchemaObject {
  if (data === null) return { type: "null" };
  if (Array.isArray(data)) {
    if (data.length === 0) return { type: "array" };
    const candidates = data.map(inferSchema);
    const serialized = new Map(candidates.map(candidate => [JSON.stringify(candidate), candidate]));
    const schemas = [...serialized.values()];
    return { type: "array", items: schemas.length === 1 ? schemas[0] : { anyOf: schemas } };
  }
  if (typeof data === "object") {
    const entries = Object.entries(data as Record<string, unknown>);
    return {
      type: "object",
      properties: Object.fromEntries(entries.map(([key, value]) => [key, inferSchema(value)])),
      required: entries.map(([key]) => key),
      additionalProperties: false,
    };
  }
  if (typeof data === "string") {
    const schema: JsonSchemaObject = { type: "string" };
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data)) schema.format = "email";
    else if (/^https?:\/\//.test(data)) schema.format = "uri";
    else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(data)) schema.format = "date-time";
    else if (/^\d{4}-\d{2}-\d{2}$/.test(data)) schema.format = "date";
    else if (/^[\da-f]{8}-[\da-f]{4}-[1-8][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(data)) schema.format = "uuid";
    return schema;
  }
  if (typeof data === "number") return { type: Number.isInteger(data) ? "integer" : "number" };
  if (typeof data === "boolean") return { type: "boolean" };
  return {};
}
