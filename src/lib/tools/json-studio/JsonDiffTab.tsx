/**
 * JSON Diff Viewer Tab Component
 * Handles JSON comparison and diff visualization
 */

"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GitCompare, Code } from "lucide-react";
import { JsonDiffViewer, JsonStatsDisplay } from "./components";
import { validateJson, type JsonStats } from "@/lib/utils/json";

interface JsonDiffTabProps {
  input: string;
}

export function JsonDiffTab({ input }: JsonDiffTabProps) {
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
              <GitCompare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No JSON Data</h3>
              <p className="text-muted-foreground">
                Please provide valid JSON in the formatter tab to compare with
                other JSON.
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
                Please fix the JSON syntax in the formatter tab before comparing
                with other JSON.
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
            <GitCompare className="h-5 w-5" />
            <span>JSON Diff Viewer</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Compare your JSON data with another JSON object to see differences.
            The tool shows additions, removals, and modifications, then generates
            and verifies an applicable RFC 6902 JSON Patch.
          </p>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Diff Viewer */}
        <div className="lg:col-span-2">
          <JsonDiffViewer data={parsedData} />
        </div>

        {/* Stats and Info Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {stats && <JsonStatsDisplay stats={stats} />}

          {/* Diff Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Diff Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                  <span>Added - New properties or values</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
                  <span>Removed - Deleted properties or values</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
                  <span>Modified - Changed values</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-100 border border-purple-200 rounded"></div>
                  <span>Moved - Shown when supplied by patch operations</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* JSON Patch Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">JSON Patch Format</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-2">
                JSON Patch operations follow RFC 6902 with RFC 6901 pointers:
              </p>
              <div className="text-xs space-y-1">
                <div>
                  <code className="bg-muted px-1 py-0.5 rounded">add</code> -
                  Add new value
                </div>
                <div>
                  <code className="bg-muted px-1 py-0.5 rounded">remove</code> -
                  Remove value
                </div>
                <div>
                  <code className="bg-muted px-1 py-0.5 rounded">replace</code>{" "}
                  - Change value
                </div>
                <div>
                  <code className="bg-muted px-1 py-0.5 rounded">move</code> -
                  Move value
                </div>
                <div>
                  <code className="bg-muted px-1 py-0.5 rounded">copy</code> -
                  Copy value
                </div>
                <div>
                  <code className="bg-muted px-1 py-0.5 rounded">test</code> -
                  Test value
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Diff Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Comparison Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Use the sample data for quick testing</li>
                <li>• Copy individual diffs or entire patch sets</li>
                <li>• Download complete diff reports</li>
                <li>• Arrays are compared by index</li>
                <li>• Deep nested changes are detected</li>
                <li>• Generated patches are applied once to verify the result</li>
              </ul>
            </CardContent>
          </Card>

          {/* Sample Diff */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Sample JSON Patch</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                {`[
  {
    "op": "replace",
    "path": "/name",
    "value": "John Doe"
  },
  {
    "op": "add",
    "path": "/email",
    "value": "john@example.com"
  }
]`}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
