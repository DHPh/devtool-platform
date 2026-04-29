/**
 * JSON Schema Validator Component
 * Interactive component for validating JSON against schemas
 */

"use client";

import { useState } from "react";
import { copyToClipboard } from "@/hooks/use-clipboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, AlertTriangle, Wand2, Copy } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CodeEditor } from "@/components/layout";
import {
  validateJsonSchema,
  generateSchemaFromData,
  JSON_SCHEMA_DRAFT_2020_12,
  type JsonSchema,
  type SchemaValidationResult,
} from "@/lib/utils/json/json-schema";

interface JsonSchemaValidatorProps {
  data: unknown;
  className?: string;
}

export function JsonSchemaValidator({
  data,
  className,
}: JsonSchemaValidatorProps) {
  const [schema, setSchema] = useState("");
  const [validationResult, setValidationResult] =
    useState<SchemaValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateAgainstSchema = () => {
    if (data === undefined) {
      toast.error("No JSON data to validate");
      return;
    }

    if (!schema.trim()) {
      toast.error("Please provide a JSON schema");
      return;
    }

    setIsValidating(true);

    try {
      const parsedSchema: JsonSchema = JSON.parse(schema);
      const result = validateJsonSchema(data, parsedSchema);
      setValidationResult(result);

      if (result.isValid) {
        toast.success("JSON is valid against the schema!");
      } else {
        toast.error(`Validation failed with ${result.errors.length} errors`);
      }
    } catch (error) {
      toast.error(error instanceof SyntaxError ? "Schema is not valid JSON" : "Unable to read schema");
      setValidationResult(null);
    } finally {
      setIsValidating(false);
    }
  };

  const generateSchema = () => {
    if (data === undefined) {
      toast.error("No JSON data to generate schema from");
      return;
    }

    try {
      const generatedSchema = generateSchemaFromData(data);
      setSchema(JSON.stringify(generatedSchema, null, 2));
      toast.success("Schema generated successfully!");
    } catch {
      toast.error("Failed to generate schema");
    }
  };

  const copySchema = () => {
    if (!schema) {
      toast.error("No schema to copy");
      return;
    }
    void copyToClipboard(schema, "Schema copied to clipboard");
  };

  const loadSampleSchema = () => {
    const sampleSchema = {
      $schema: JSON_SCHEMA_DRAFT_2020_12,
      type: "object",
      properties: {
        name: {
          type: "string",
          minLength: 1,
          maxLength: 100,
        },
        age: {
          type: "integer",
          minimum: 0,
          maximum: 150,
        },
        email: {
          type: "string",
          format: "email",
        },
        active: {
          type: "boolean",
        },
        tags: {
          type: "array",
          prefixItems: [{ const: "profile" }],
          items: {
            type: "string",
          },
          uniqueItems: true,
        },
      },
      required: ["name", "email"],
      additionalProperties: false,
    };

    setSchema(JSON.stringify(sampleSchema, null, 2));
    toast.success("Sample schema loaded");
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <span>Schema Validator</span>
          <Badge variant="secondary">Draft 2020-12</Badge>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Draft 2020-12 validation with local references and standard formats</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Schema Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">JSON Schema</label>
            <div className="flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateSchema}
                      aria-label="Generate schema from data"
                    >
                      <Wand2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Generate schema from data</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={copySchema} aria-label="Copy JSON Schema">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy schema</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button variant="outline" size="sm" onClick={loadSampleSchema}>
                Sample
              </Button>
            </div>
          </div>
          <CodeEditor
            value={schema}
            onChange={setSchema}
            language="json"
            aria-label="JSON Schema"
            placeholder="Enter your JSON Schema here..."
            minHeight={160}
          />
        </div>

        {/* Validate Button */}
        <div className="flex gap-2">
          <Button
            onClick={validateAgainstSchema}
            disabled={isValidating || data === undefined || !schema.trim()}
            className="flex-1"
          >
            {isValidating ? "Validating..." : "Validate"}
          </Button>
        </div>

        <Separator />

        {/* Validation Results */}
        {validationResult && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {validationResult.isValid ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-green-700">Valid</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="font-medium text-red-700">Invalid</span>
                </>
              )}
              <Badge
                variant={validationResult.isValid ? "default" : "destructive"}
              >
                {validationResult.errors.length === 0
                  ? "No errors"
                  : `${validationResult.errors.length} errors`}
              </Badge>
            </div>

            {/* Validation Errors */}
            {validationResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-red-700">
                  Validation Errors:
                </h4>
                <div className="space-y-2 max-h-48 overflow-auto">
                  {validationResult.errors.map((error, index) => (
                    <div
                      key={index}
                      className="p-3 border border-red-200 bg-red-50 rounded-md"
                    >
                      <div className="flex gap-2">
                        <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          <div className="font-medium text-red-700">
                            Path:{" "}
                            <code className="text-xs bg-red-100 px-1 py-0.5 rounded">
                              {error.path || "root"}
                            </code>
                          </div>
                          <div className="text-red-600">{error.message}</div>
                          <div className="text-xs text-red-600 font-mono break-all">
                            {error.keyword && <span>{error.keyword} · </span>}
                            schema {error.schemaPath}
                          </div>
                          {error.value !== undefined && (
                            <div className="text-sm text-red-600">
                              Value:{" "}
                              <code className="text-xs bg-red-100 px-1 py-0.5 rounded">
                                {typeof error.value === "string"
                                  ? `"${error.value}"`
                                  : JSON.stringify(error.value)}
                              </code>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {validationResult.warnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-yellow-700">
                  Warnings:
                </h4>
                <div className="space-y-1">
                  {validationResult.warnings.map((warning, index) => (
                    <div
                      key={index}
                      className="p-3 border border-yellow-200 bg-yellow-50 rounded-md"
                    >
                      <div className="flex gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span className="text-yellow-700">{warning}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Uses JSON Schema Draft 2020-12. Local <code>$ref</code>/<code>$dynamicRef</code> are supported; remote schema fetching is intentionally disabled.
        </p>
      </CardContent>
    </Card>
  );
}
