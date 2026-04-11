/**
 * JSON Schema Validation Tab Component
 * Handles JSON Schema validation and generation
 */

"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, FileCheck, Code } from "lucide-react";
import { JsonSchemaValidator } from "./components/JsonSchemaValidator";
import { JsonStatsDisplay } from "./components/JsonStatsDisplay";
import { validateJson, type JsonStats } from "@/lib/processors/json";

interface JsonSchemaTabProps {
  input: string;
}

export function JsonSchemaTab({ input }: JsonSchemaTabProps) {
  const { parsedData, stats, isValid } = useMemo<{
    parsedData: unknown;
    stats: JsonStats | null;
    isValid: boolean;
  }>(() => {
    if (!input.trim()) {
      return { parsedData: null, stats: null, isValid: false };
    }

    const validation = validateJson(input);
    if (!validation.isValid) return { parsedData: null, stats: null, isValid: false };
    try {
      const parsed = JSON.parse(input);
      const size = JSON.stringify(parsed).length;
      const lines = JSON.stringify(parsed, null, 2).split("\n").length;
      return {
        parsedData: parsed,
        isValid: true,
        stats: {
          size,
          lines,
          objects: 0,
          arrays: 0,
          strings: 0,
          numbers: 0,
          booleans: 0,
          nulls: 0,
          depth: 0,
        },
      };
    } catch {
      return { parsedData: null, stats: null, isValid: false };
    }
  }, [input]);

  if (!input.trim()) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No JSON Data</h3>
              <p className="text-muted-foreground">
                Please provide valid JSON in the formatter tab to validate
                against a schema.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Code className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-medium mb-2 text-red-700">
                Invalid JSON
              </h3>
              <p className="text-muted-foreground">
                Please fix the JSON syntax in the formatter tab before
                validating against a schema.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
