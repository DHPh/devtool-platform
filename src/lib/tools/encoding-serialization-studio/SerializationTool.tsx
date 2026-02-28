"use client";

import { useMemo, useState } from "react";
import { CopyableResult } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  convertCsvJson,
  convertIntegerBase,
  convertJsonYaml,
  formatToml,
  formatXml,
  formatYaml,
  validateXml,
  validateYaml,
  type IntegerBase,
} from "@/lib/processors/serialization-core";

export type SerializationToolId =
  | "yaml-formatter"
  | "yaml-validator"
  | "xml-formatter"
  | "xml-validator"
  | "toml-formatter"
  | "json-yaml-converter"
  | "csv-json-converter"
  | "number-base-converter";

const TITLES: Record<SerializationToolId, string> = {
  "yaml-formatter": "YAML Formatter",
  "yaml-validator": "YAML Validator",
  "xml-formatter": "XML Formatter",
  "xml-validator": "XML Validator",
  "toml-formatter": "TOML Formatter",
  "json-yaml-converter": "JSON ↔ YAML Converter",
  "csv-json-converter": "CSV ↔ JSON Converter",
  "number-base-converter": "Number Base Converter",
};

const SAMPLES: Record<SerializationToolId, string> = {
  "yaml-formatter": "name: DevTool\nfeatures:\n- format\n- validate",
  "yaml-validator": "service:\n  name: api\n  enabled: true",
  "xml-formatter":
    '<catalog><tool id="1"><name>Formatter</name></tool></catalog>',
  "xml-validator": "<root><item>value</item></root>",
  "toml-formatter": '[server]\nhost="localhost"\nports=[3000,3001]',
  "json-yaml-converter": '{"name":"DevTool","active":true}',
  "csv-json-converter": "name,active\nDevTool,true",
  "number-base-converter": "255",
};

type ConversionDirection =
  "json-to-yaml" | "yaml-to-json" | "csv-to-json" | "json-to-csv";

function sampleFor(
  tool: SerializationToolId,
  direction: ConversionDirection,
  base: IntegerBase,
): string {
  if (tool === "json-yaml-converter" && direction === "yaml-to-json") {
    return "name: DevTool\nactive: true";
  }
  if (tool === "csv-json-converter" && direction === "json-to-csv") {
    return '[{"name":"DevTool","active":true}]';
  }
  if (tool === "number-base-converter") {
    return { 2: "11111111", 8: "377", 10: "255", 16: "FF" }[base];
  }
  return SAMPLES[tool];
}

function describeError(error: {
  message: string;
  line?: number;
  column?: number;
}): string {
  const location = error.line
    ? ` (line ${error.line}${error.column ? `, column ${error.column}` : ""})`
    : "";
  return `${error.message}${location}`;
}

export function SerializationTool({ tool }: { tool: SerializationToolId }) {
  const initialDirection: ConversionDirection =
    tool === "csv-json-converter" ? "csv-to-json" : "json-to-yaml";
  const [input, setInput] = useState(() =>
    sampleFor(tool, initialDirection, 10),
  );
  const [indent, setIndent] = useState(2);
  const [direction, setDirection] =
    useState<ConversionDirection>(initialDirection);
  const [sourceBase, setSourceBase] = useState<IntegerBase>(10);

  const result = useMemo(() => {
    if (tool === "yaml-formatter") return formatYaml(input, indent);
    if (tool === "xml-formatter") return formatXml(input, indent);
    if (tool === "toml-formatter") return formatToml(input);
    if (tool === "json-yaml-converter") {
      const selected =
        direction === "yaml-to-json" ? direction : "json-to-yaml";
      return convertJsonYaml(input, selected);
    }
    if (tool === "csv-json-converter") {
      const selected = direction === "json-to-csv" ? direction : "csv-to-json";
      return convertCsvJson(input, selected);
    }
    if (tool === "number-base-converter")
      return convertIntegerBase(input, sourceBase);
    return tool === "yaml-validator" ? validateYaml(input) : validateXml(input);
  }, [direction, indent, input, sourceBase, tool]);

  let output: string;
  let successful: boolean;
  if ("ok" in result) {
    successful = result.ok;
    output = result.ok
      ? "output" in result
        ? result.output
        : Object.entries(result.value)
            .map(([base, value]) => `${base}: ${value}`)
            .join("\n")
      : describeError(result.error);
  } else {
    successful = result.valid;
    output = result.valid ? "Valid syntax" : describeError(result.error);
  }

  const isDirectional =
    tool === "json-yaml-converter" || tool === "csv-json-converter";
  const isFormatter = tool === "yaml-formatter" || tool === "xml-formatter";
  const baseResults =
    tool === "number-base-converter" &&
    "ok" in result &&
    result.ok &&
    "value" in result
      ? result.value
      : null;

  const handleDirectionChange = (nextDirection: ConversionDirection) => {
    if ("ok" in result && result.ok && "output" in result) {
      setInput(result.output);
    }
    setDirection(nextDirection);
  };

  const handleBaseChange = (nextBase: IntegerBase) => {
    if ("ok" in result && result.ok && "value" in result) {
      const key: Record<IntegerBase, keyof typeof result.value> = {
        2: "binary",
        8: "octal",
        10: "decimal",
        16: "hexadecimal",
      };
      setInput(result.value[key[nextBase]]);
    }
    setSourceBase(nextBase);
  };

  const restoreExample = () => {
    setInput(sampleFor(tool, direction, sourceBase));
  };

  return (
    <section className="space-y-4" aria-labelledby={`${tool}-title`}>
      <div>
        <h2 id={`${tool}-title`} className="text-2xl font-semibold">
          {TITLES[tool]}
        </h2>
        <p className="text-muted-foreground">
          Runs locally in your browser. Input is not uploaded.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {isFormatter && (
          <label className="space-x-2 text-sm">
            <span>Indent</span>
            <select
              className="rounded-md border bg-background px-2 py-1"
              value={indent}
              onChange={(event) => setIndent(Number(event.target.value))}
            >
              {[2, 4, 8].map((value) => (
                <option key={value} value={value}>
                  {value} spaces
                </option>
              ))}
            </select>
          </label>
        )}
        {isDirectional && (
          <label className="space-x-2 text-sm">
            <span>Direction</span>
            <select
              className="rounded-md border bg-background px-2 py-1"
              value={direction}
              onChange={(event) =>
                handleDirectionChange(event.target.value as ConversionDirection)
              }
            >
              {tool === "json-yaml-converter" ? (
                <>
                  <option value="json-to-yaml">JSON to YAML</option>
                  <option value="yaml-to-json">YAML to JSON</option>
                </>
              ) : (
                <>
                  <option value="csv-to-json">CSV to JSON</option>
                  <option value="json-to-csv">JSON to CSV</option>
                </>
              )}
            </select>
          </label>
        )}
        {tool === "number-base-converter" && (
          <label className="space-x-2 text-sm">
            <span>Input base</span>
            <select
              className="rounded-md border bg-background px-2 py-1"
              value={sourceBase}
              onChange={(event) =>
                handleBaseChange(Number(event.target.value) as IntegerBase)
              }
            >
              <option value={2}>Binary</option>
              <option value={8}>Octal</option>
              <option value={10}>Decimal</option>
              <option value={16}>Hexadecimal</option>
            </select>
          </label>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={restoreExample}
        >
          Load example
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setInput("")}
          disabled={!input}
        >
          Clear input
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Input</span>
          <textarea
            className="min-h-72 w-full rounded-md border bg-background p-3 font-mono text-sm"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            spellCheck={false}
          />
        </label>
        {baseResults ? (
          <div className="space-y-3">
            <p role="status" aria-live="polite" className="sr-only">
              Converted number values updated
            </p>
            <span className="text-sm font-medium">Results</span>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["binary", "Binary"],
                  ["octal", "Octal"],
                  ["decimal", "Decimal"],
                  ["hexadecimal", "Hexadecimal"],
                ] as const
              ).map(([key, label]) => (
                <CopyableResult
                  key={key}
                  value={baseResults[key]}
                  label={label}
                  copyLabel={`Copy ${label.toLowerCase()}`}
                  successMessage={`${label} value copied to clipboard`}
                  rows={1}
                  textareaClassName="bg-muted/30"
                />
              ))}
            </div>
          </div>
        ) : (
          <div>
            <p
              role={successful ? "status" : "alert"}
              aria-live={successful ? "polite" : "assertive"}
              className="sr-only"
            >
              {successful ? "Result updated" : output}
            </p>
            <CopyableResult
              value={output}
              label={successful ? "Result" : "Error"}
              copyLabel="Copy result"
              successMessage="Result copied to clipboard"
              rows={tool.endsWith("validator") ? 5 : 14}
              textareaClassName={
                successful
                  ? "bg-muted/30"
                  : "border-destructive text-destructive focus-visible:ring-destructive"
              }
            />
          </div>
        )}
      </div>
    </section>
  );
}
