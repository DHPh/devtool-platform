import { XMLParser } from "fast-xml-parser";
import XMLBuilder from "fast-xml-builder";
import { SyntaxValidator } from "fast-xml-validator";
import { parse as parseToml, stringify as stringifyToml } from "smol-toml";
import { LineCounter, parseDocument, stringify as stringifyYaml } from "yaml";
import { parseCSV, serializeCSV } from "./csv";

export interface SerializationError {
  message: string;
  line?: number;
  column?: number;
}

export type SerializationResult =
  { ok: true; output: string } | { ok: false; error: SerializationError };

export type ValidationResult =
  { valid: true } | { valid: false; error: SerializationError };

function errorResult(error: unknown): SerializationResult {
  return { ok: false, error: normalizeError(error) };
}

function normalizeError(error: unknown): SerializationError {
  if (error instanceof Error) return { message: error.message };
  return { message: String(error) };
}

function validateIndent(indent: number): void {
  if (!Number.isInteger(indent) || indent < 1 || indent > 8) {
    throw new Error("Indent must be an integer from 1 through 8");
  }
}

function parseYamlDocument(input: string) {
  if (!input.trim()) throw new Error("YAML input is empty");
  const lineCounter = new LineCounter();
  const document = parseDocument(input, {
    lineCounter,
    prettyErrors: true,
    strict: true,
    uniqueKeys: true,
  });
  const issue = document.errors[0];
  if (issue) {
    const position = issue.linePos?.[0];
    throw Object.assign(new Error(issue.message), {
      line: position?.line,
      column: position?.col,
    });
  }
  // Resolve aliases with an explicit expansion ceiling.
  document.toJS({ maxAliasCount: 100 });
  return document;
}

function yamlError(error: unknown): SerializationError {
  const normalized = normalizeError(error);
  if (error && typeof error === "object") {
    const located = error as { line?: number; column?: number };
    normalized.line = located.line;
    normalized.column = located.column;
  }
  return normalized;
}

export function formatYaml(input: string, indent = 2): SerializationResult {
  try {
    validateIndent(indent);
    const document = parseYamlDocument(input);
    return { ok: true, output: document.toString({ indent, lineWidth: 0 }) };
  } catch (error) {
    return { ok: false, error: yamlError(error) };
  }
}

export function validateYaml(input: string): ValidationResult {
  try {
    parseYamlDocument(input);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: yamlError(error) };
  }
}

const XML_PARSE_OPTIONS = {
  preserveOrder: true,
  ignoreAttributes: false,
  commentPropName: "#comment",
  cdataPropName: "#cdata",
  trimValues: false,
  parseTagValue: false,
  parseAttributeValue: false,
  processEntities: false,
} as const;

export function validateXml(input: string): ValidationResult {
  if (!input.trim()) {
    return { valid: false, error: { message: "XML input is empty" } };
  }
  try {
    SyntaxValidator.validate(input, {
      docType: { maxEntityCount: 100, maxEntitySize: 10_000 },
      invalidCharSequence: { comment: true, tagValue: true, attrLt: true },
    });
    return { valid: true };
  } catch (error) {
    const located = error as { message?: string; line?: number; col?: number };
    return {
      valid: false,
      error: {
        message: located.message ?? String(error),
        line: located.line,
        column: located.col,
      },
    };
  }
}

export function formatXml(input: string, indent = 2): SerializationResult {
  try {
    validateIndent(indent);
    const validation = validateXml(input);
    if (!validation.valid) return { ok: false, error: validation.error };
    const parsed = new XMLParser(XML_PARSE_OPTIONS).parse(input);
    const builder = new XMLBuilder({
      ...XML_PARSE_OPTIONS,
      format: true,
      indentBy: " ".repeat(indent),
      suppressEmptyNode: false,
    });
    return { ok: true, output: builder.build(parsed) };
  } catch (error) {
    return errorResult(error);
  }
}

export function formatToml(input: string): SerializationResult {
  try {
    if (!input.trim()) throw new Error("TOML input is empty");
    return { ok: true, output: stringifyToml(parseToml(input)) };
  } catch (error) {
    return errorResult(error);
  }
}

export function convertJsonYaml(
  input: string,
  direction: "json-to-yaml" | "yaml-to-json",
): SerializationResult {
  try {
    if (!input.trim()) throw new Error("Input is empty");
    if (direction === "json-to-yaml") {
      return {
        ok: true,
        output: stringifyYaml(JSON.parse(input), { indent: 2, lineWidth: 0 }),
      };
    }
    const document = parseYamlDocument(input);
    return {
      ok: true,
      output: JSON.stringify(document.toJS({ maxAliasCount: 100 }), null, 2),
    };
  } catch (error) {
    return {
      ok: false,
      error:
        direction === "yaml-to-json" ? yamlError(error) : normalizeError(error),
    };
  }
}

export function convertCsvJson(
  input: string,
  direction: "csv-to-json" | "json-to-csv",
): SerializationResult {
  try {
    if (!input.trim()) throw new Error("Input is empty");
    if (direction === "csv-to-json") {
      const parsed = parseCSV(input, { strict: true, convertValues: true });
      return { ok: true, output: JSON.stringify(parsed.data, null, 2) };
    }

    const value: unknown = JSON.parse(input);
    if (
      !Array.isArray(value) ||
      value.some((row) => !row || typeof row !== "object" || Array.isArray(row))
    ) {
      throw new Error("JSON input must be an array of objects");
    }
    const rows = value as Record<string, unknown>[];
    const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
    if (headers.length === 0)
      throw new Error("JSON rows must contain at least one property");
    return {
      ok: true,
      output: serializeCSV(rows, headers, { safeSpreadsheet: true }),
    };
  } catch (error) {
    return errorResult(error);
  }
}

export type IntegerBase = 2 | 8 | 10 | 16;

export interface BaseConversion {
  binary: string;
  octal: string;
  decimal: string;
  hexadecimal: string;
}

export type BaseConversionResult =
  | { ok: true; value: BaseConversion }
  | { ok: false; error: SerializationError };

export function convertIntegerBase(
  input: string,
  sourceBase: IntegerBase,
): BaseConversionResult {
  try {
    const trimmed = input.trim();
    if (!trimmed) throw new Error("Number input is empty");
    const sign = trimmed.startsWith("-") ? BigInt(-1) : BigInt(1);
    const unsigned = /^[+-]/.test(trimmed) ? trimmed.slice(1) : trimmed;
    const patterns: Record<IntegerBase, RegExp> = {
      2: /^[01]+$/,
      8: /^[0-7]+$/,
      10: /^\d+$/,
      16: /^[\da-f]+$/i,
    };
    if (!patterns[sourceBase].test(unsigned)) {
      throw new Error(
        `Input contains digits that are invalid for base ${sourceBase}`,
      );
    }
    const prefixes: Record<IntegerBase, string> = {
      2: "0b",
      8: "0o",
      10: "",
      16: "0x",
    };
    const value = sign * BigInt(`${prefixes[sourceBase]}${unsigned}`);
    return {
      ok: true,
      value: {
        binary: value.toString(2),
        octal: value.toString(8),
        decimal: value.toString(10),
        hexadecimal: value.toString(16).toUpperCase(),
      },
    };
  } catch (error) {
    return { ok: false, error: normalizeError(error) };
  }
}
