/**
 * JSON Path Explorer Component
 * Interactive component for exploring JSON paths
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { writeClipboardText } from "@/hooks/use-clipboard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Play, Copy, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  queryJsonPath,
  generateSamplePaths,
  validateJsonPath,
  type JsonPathResult,
  type QueryResult,
} from "@/lib/utils/json/json-path";

interface JsonPathExplorerProps {
  data: unknown;
  className?: string;
}

export function JsonPathExplorer({ data, className }: JsonPathExplorerProps) {
  const [query, setQuery] = useState("$");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState("");
  const [samplePaths, setSamplePaths] = useState<string[]>([]);

  const executeQuery = useCallback(
    (queryToExecute: string = query) => {
      if (data === undefined) {
        setError("No JSON data to query");
        return;
      }

      const validation = validateJsonPath(queryToExecute);
      if (!validation.isValid) {
        setError(validation.error || "Invalid JSONPath expression");
        setResult(null);
        return;
      }

      try {
        const queryResult = queryJsonPath(data, queryToExecute);
        setResult(queryResult);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Query execution failed");
        setResult(null);
      }
    },
    [data, query]
  );

  useEffect(() => {
    if (data !== undefined) {
      const samples = generateSamplePaths(data);
      setSamplePaths(samples.slice(0, 10)); // Limit to 10 samples
      executeQuery("$"); // Execute default query
    }
  }, [data, executeQuery]);

  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeQuery();
  };

  const copyPath = (path: string) => {
    void writeClipboardText(path);
    toast.success("Path copied to clipboard");
  };

  const copyValue = (value: unknown) => {
    const valueStr =
      typeof value === "string" ? value : JSON.stringify(value, null, 2);
    void writeClipboardText(valueStr);
    toast.success("Value copied to clipboard");
  };

  const handleUseSamplePath = (path: string) => {
    setQuery(path);
    executeQuery(path);
  };

  const renderValue = (value: unknown): string => {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (typeof value === "string") {
      return value.length > 100
        ? `"${value.substring(0, 100)}..."`
        : `"${value}"`;
    }
    if (typeof value === "object") {
      const str = JSON.stringify(value);
      return str.length > 200 ? `${str.substring(0, 200)}...` : str;
    }
    return String(value);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <span>JSONPath Explorer</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Lightbulb className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Use JSONPath expressions to query your JSON data</p>
                <p>Examples: $.store.book[*].title, $..price</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Query Input */}
        <form onSubmit={handleQuerySubmit} className="flex gap-2">
          <Input
            aria-label="JSONPath expression"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter JSONPath query (e.g., $.store.book[0].title)"
            className="flex-1"
          />
          <Button type="submit" size="sm" aria-label="Run JSONPath query">
            <Play className="h-4 w-4" />
          </Button>
        </form>

        {/* Error Display */}
        {error && (
          <div role="alert" className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Sample Paths */}
        {samplePaths.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Sample Paths:</h4>
            <div className="flex flex-wrap gap-1">
              {samplePaths.map((path, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs h-auto py-1 px-2"
                  onClick={() => handleUseSamplePath(path)}
                >
                  {path}
                </Button>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Query Results */}
        {result && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">
                Results ({result.count} found)
              </h4>
              <Badge variant="secondary" className="text-xs">
                {result.executionTime.toFixed(2)}ms
              </Badge>
            </div>

            <div className="h-64 w-full overflow-auto border rounded-md p-2">
              <div className="space-y-2">
                {result.results.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No results found
                  </p>
                ) : (
                  result.results.map((item: JsonPathResult, index: number) => (
                    <div
                      key={index}
                      className="p-3 border rounded-md space-y-2 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {item.type}
                          </Badge>
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {item.path}
                          </code>
                        </div>
                        <div className="flex gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-auto p-1"
                                  onClick={() => copyPath(item.path)}
                                  aria-label={`Copy result path ${item.path}`}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Copy path</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-auto p-1"
                                  onClick={() => copyValue(item.value)}
                                  aria-label={`Copy value at ${item.path}`}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Copy value</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <code className="text-xs bg-muted px-1 py-0.5 rounded break-all">
                          {renderValue(item.value)}
                        </code>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
