/**
 * JSON Schema Validation Tab Component
 * Handles JSON Schema validation and generation
 */

"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, FileCheck, Code } from "lucide-react";
import { JsonSchemaValidator } from "./components/JsonSchemaValidator";
import { JsonStatsDisplay } from "./components/JsonStatsDisplay";
import { calculateJsonStats, stripJsonComments, validateJson, type JsonStats } from "@/lib/processors/json";

interface JsonSchemaTabProps {
  input: string;
}

function parseJsonSchemaTabInput(input: string): {
  status: "empty" | "valid" | "invalid";
  parsedData: unknown;
  stats: JsonStats | null;
} {
  if (!input.trim()) {
    return { status: "empty", parsedData: undefined, stats: null };
  }
  const validation = validateJson(input, { allowComments: true });
  if (!validation.isValid) {
    return { status: "invalid", parsedData: undefined, stats: null };
  }
  try {
    const parsed = JSON.parse(stripJsonComments(input));
    return {
      status: "valid",
      parsedData: parsed,
      stats: calculateJsonStats(parsed),
    };
  } catch {
    return { status: "invalid", parsedData: undefined, stats: null };
  }
}

export function JsonSchemaTab({ input }: JsonSchemaTabProps) {
  const current = useMemo(() => parseJsonSchemaTabInput(input), [input]);
  const [prevInput, setPrevInput] = useState(input);
  const [lastValid, setLastValid] = useState<{
    parsedData: unknown;
    stats: JsonStats;
  } | null>(() => {
    const initial = parseJsonSchemaTabInput(input);
    return initial.status === "valid" && initial.stats
      ? { parsedData: initial.parsedData, stats: initial.stats }
      : null;
  });

  if (input !== prevInput) {
    setPrevInput(input);
    if (current.status === "valid" && current.stats) {
      setLastValid({ parsedData: current.parsedData, stats: current.stats });
    }
  }

  const parsedData =
    current.status === "valid"
      ? current.parsedData
      : current.status === "invalid"
        ? lastValid?.parsedData
        : undefined;
  const stats =
    current.status === "valid"
      ? current.stats
      : current.status === "invalid"
        ? lastValid?.stats ?? null
        : null;

  return (
    <div className="space-y-6">
      {current.status === "empty" && (
        <Card className="border-dashed">
          <CardContent className="py-4 flex items-center gap-3 text-sm text-muted-foreground">
            <Shield className="h-5 w-5 shrink-0" />
            <span>
              No JSON data yet. Enter valid JSON in the editor above to validate against your schema.
            </span>
          </CardContent>
        </Card>
      )}
      {current.status === "invalid" && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-4 flex items-center gap-3 text-sm text-destructive">
            <Code className="h-5 w-5 shrink-0" />
            <span>
              Invalid JSON in the editor above — fix syntax to update validation. Your schema below is preserved.
            </span>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            <span>JSON Schema Validator</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Validate with JSON Schema Draft 2020-12, including prefix items,
            unevaluated values, dependencies, contains bounds, and local references.
            Generated schemas provide a conservative starting point.
          </p>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schema Validator */}
        <div className="lg:col-span-2">
          <JsonSchemaValidator data={parsedData} />
        </div>

        {/* Stats and Info Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {stats && <JsonStatsDisplay stats={stats} />}

          {/* Schema Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">JSON Schema Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs space-y-2">
                <div>
                  <h4 className="font-medium text-sm mb-1">Draft:</h4>
                  <div className="mb-3">
                    <code className="bg-muted px-1 py-0.5 rounded">2020-12</code>
                  </div>
                  <h4 className="font-medium text-sm mb-1">Common Types:</h4>
                  <div className="space-y-1">
                    <div>
                      <code className="bg-muted px-1 py-0.5 rounded">
                        string
                      </code>
                    </div>
                    <div>
                      <code className="bg-muted px-1 py-0.5 rounded">
                        number
                      </code>
                    </div>
                    <div>
                      <code className="bg-muted px-1 py-0.5 rounded">
                        integer
                      </code>
                    </div>
                    <div>
                      <code className="bg-muted px-1 py-0.5 rounded">
                        boolean
                      </code>
                    </div>
                    <div>
                      <code className="bg-muted px-1 py-0.5 rounded">
                        array
                      </code>
                    </div>
                    <div>
                      <code className="bg-muted px-1 py-0.5 rounded">
                        object
                      </code>
                    </div>
                    <div>
                      <code className="bg-muted px-1 py-0.5 rounded">null</code>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-1">String Formats:</h4>
                  <div className="space-y-1">
                    <div>
                      <code className="bg-muted px-1 py-0.5 rounded">
                        email
                      </code>
                    </div>
                    <div>
                      <code className="bg-muted px-1 py-0.5 rounded">uri</code>
                    </div>
                    <div>
                      <code className="bg-muted px-1 py-0.5 rounded">
                        date-time
                      </code>
                    </div>
                    <div>
                      <code className="bg-muted px-1 py-0.5 rounded">uuid</code>
                    </div>
                    <div>
                      <code className="bg-muted px-1 py-0.5 rounded">ipv4</code>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validation Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Validation Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>
                  • Use the Generate button to create a schema from your data
                </li>
                <li>• Add validation rules like minLength, maximum, pattern</li>
                <li>• Use required array for mandatory properties</li>
                <li>• Set additionalProperties: false to be strict</li>
                <li>• Use $defs with local $ref for reusable schemas</li>
                <li>• Use prefixItems for tuples and items for the remainder</li>
                <li>• Remote schema fetching is intentionally disabled</li>
              </ul>
            </CardContent>
          </Card>

          {/* Sample Schema */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Sample Schema Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                {`{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1
    },
    "age": {
      "type": "integer",
      "minimum": 0
    }
  },
  "required": ["name"]
}`}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
