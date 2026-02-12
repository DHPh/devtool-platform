import postcss, { type ChildNode } from "postcss";
import * as prettier from "prettier/standalone";
import * as babelPlugin from "prettier/plugins/babel";
import * as estreePlugin from "prettier/plugins/estree";
import * as htmlPlugin from "prettier/plugins/html";
import * as postcssPlugin from "prettier/plugins/postcss";

export type FormatterLanguage = "html" | "css";

export interface SourceFormatOptions {
  indentSize?: number;
  useTabs?: boolean;
}

export class FormatterSyntaxError extends Error {
  readonly name = "FormatterSyntaxError";

  constructor(
    readonly language: FormatterLanguage,
    message: string,
    readonly line?: number,
    readonly column?: number,
  ) {
    super(`${language.toUpperCase()} syntax error${line ? ` at ${line}:${column ?? 1}` : ""}: ${message}`);
  }
}

function options(input: SourceFormatOptions) {
  const indentSize = input.indentSize ?? 2;
  if (!Number.isInteger(indentSize) || indentSize < 1 || indentSize > 8) {
    throw new RangeError("Indent size must be a whole number from 1 to 8.");
  }
  return { tabWidth: indentSize, useTabs: input.useTabs ?? false };
}

function syntaxError(language: FormatterLanguage, error: unknown): FormatterSyntaxError {
  const candidate = error as {
    message?: string;
    reason?: string;
    line?: number;
    column?: number;
    loc?: { start?: { line?: number; column?: number } };
  };
  const line = candidate.line ?? candidate.loc?.start?.line;
  const column = candidate.column ?? candidate.loc?.start?.column;
  const detail = candidate.reason ?? candidate.message ?? "The parser rejected this source.";
  return new FormatterSyntaxError(language, detail.replace(/\s*\(\d+:\d+\)\s*$/, ""), line, column);
}

export async function formatHtmlSource(input: string, formatOptions: SourceFormatOptions = {}): Promise<string> {
  if (!input.trim()) return "";
  const indentation = options(formatOptions);
  try {
    return await prettier.format(input, {
      parser: "html",
      plugins: [htmlPlugin, babelPlugin, estreePlugin, postcssPlugin],
      ...indentation,
    });
  } catch (error) {
    throw syntaxError("html", error);
  }
}

export async function formatCssSource(input: string, formatOptions: SourceFormatOptions = {}): Promise<string> {
  if (!input.trim()) return "";
  const indentation = options(formatOptions);
  try {
    return await prettier.format(input, {
      parser: "css",
      plugins: [postcssPlugin],
      ...indentation,
    });
  } catch (error) {
    throw syntaxError("css", error);
  }
}

/**
 * Syntax-aware conservative CSS minification. Only parser whitespace metadata
 * is compacted, so comments, selectors, declaration values, strings, custom
 * properties, at-rules, and nested rules remain semantically intact.
 */
export function minifyCssSource(input: string): string {
  if (!input.trim()) return "";
  try {
    const root = postcss.parse(input, { from: undefined });
    root.raws.after = "";
    root.walk(node => compactNodeWhitespace(node));
    return root.toString();
  } catch (error) {
    throw syntaxError("css", error);
  }
}

function compactNodeWhitespace(node: ChildNode): void {
  switch (node.type) {
    case "rule":
      node.raws.before = "";
      node.raws.between = "";
      node.raws.after = "";
      break;
    case "decl":
      node.raws.before = "";
      node.raws.between = ":";
      if (node.important) node.raws.important = "!important";
      break;
    case "atrule":
      node.raws.before = "";
      node.raws.afterName = node.params ? " " : "";
      node.raws.between = "";
      node.raws.after = "";
      break;
    case "comment":
      node.raws.before = "";
      break;
  }
}
