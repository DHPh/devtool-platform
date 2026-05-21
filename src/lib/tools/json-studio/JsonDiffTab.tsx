/**
 * JSON Diff Viewer Tab Component
 * Handles JSON comparison and diff visualization
 */

"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GitCompare, Code } from "lucide-react";
import { JsonDiffViewer } from "./components/JsonDiffViewer";
import { JsonStatsDisplay } from "./components/JsonStatsDisplay";
import { calculateJsonStats, stripJsonComments, validateJson, type JsonStats } from "@/lib/processors/json";

interface JsonDiffTabProps {
  input: string;
}

function parseJsonDiffTabInput(input: string): {
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

export function JsonDiffTab({ input }: JsonDiffTabProps) {
  const current = useMemo(() => parseJsonDiffTabInput(input), [input]);
  const [prevInput, setPrevInput] = useState(input);
  const [lastValid, setLastValid] = useState<{
    parsedData: unknown;
    stats: JsonStats;
  } | null>(() => {
    const initial = parseJsonDiffTabInput(input);
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
            <GitCompare className="h-5 w-5 shrink-0" />
            <span>
              No JSON data yet. Enter valid JSON in the editor above to compare against your target JSON.
            </span>
          </CardContent>
        </Card>
      )}
      {current.status === "invalid" && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-4 flex items-center gap-3 text-sm text-destructive">
            <Code className="h-5 w-5 shrink-0" />
            <span>
              Invalid JSON in the editor above — fix syntax to update comparison. Your comparison JSON below is preserved.
            </span>
          </CardContent>
        </Card>
      )}

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
