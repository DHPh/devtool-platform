/**
 * JSON Path Query Tab Component
 * Handles JSONPath queries and data exploration
 */

"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Map, Code } from "lucide-react";
import { JsonPathExplorer } from "./components/JsonPathExplorer";
import { JsonStatsDisplay } from "./components/JsonStatsDisplay";
import {
  calculateJsonStats,
  stripJsonComments,
  validateJson,
  type JsonStats,
} from "@/lib/processors/json";

interface JsonPathTabProps {
  input: string;
}

function parseJsonPathTabInput(input: string): {
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

export function JsonPathTab({ input }: JsonPathTabProps) {
  const current = useMemo(() => parseJsonPathTabInput(input), [input]);
  const [prevInput, setPrevInput] = useState(input);
  const [lastValid, setLastValid] = useState<{
    parsedData: unknown;
    stats: JsonStats;
  } | null>(() => {
    const initial = parseJsonPathTabInput(input);
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
            <Search className="h-5 w-5 shrink-0" />
            <span>
              No JSON data yet. Enter valid JSON in the editor above to evaluate JSONPath queries.
            </span>
          </CardContent>
        </Card>
      )}
      {current.status === "invalid" && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-4 flex items-center gap-3 text-sm text-destructive">
            <Code className="h-5 w-5 shrink-0" />
            <span>
              Invalid JSON in the editor above — fix syntax to update query results. Your expression below is preserved.
            </span>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Map className="h-5 w-5" />
            <span>JSONPath Explorer</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Explore JSON with RFC 9535 child, wildcard, descendant, union,
            index, and slice selectors. Filters support existence tests,
            literals, singular child queries, comparisons, !, &amp;&amp;, ||, and
            parentheses; JSONPath functions are not supported.
          </p>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Path Explorer */}
        <div className="lg:col-span-2">
          <JsonPathExplorer data={parsedData} />
        </div>

        {/* Stats Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {stats && <JsonStatsDisplay stats={stats} />}

          {/* Quick Reference */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                JSONPath Quick Reference
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-xs space-y-1">
                <div>
                  <code className="bg-muted px-1 py-0.5 rounded">$</code>
                  <span className="ml-2 text-muted-foreground">
                    Root object
                  </span>
                </div>
                <div>
                  <code className="bg-muted px-1 py-0.5 rounded">
                    $.property
                  </code>
                  <span className="ml-2 text-muted-foreground">
                    Object property
                  </span>
                </div>
                <div>
                  <code className="bg-muted px-1 py-0.5 rounded">$[0]</code>
                  <span className="ml-2 text-muted-foreground">
                    Array index
                  </span>
                </div>
                <div>
                  <code className="bg-muted px-1 py-0.5 rounded">$[*]</code>
                  <span className="ml-2 text-muted-foreground">
                    All array items
                  </span>
                </div>
                <div>
                  <code className="bg-muted px-1 py-0.5 rounded">
                    $[&apos;a&apos;,&apos;b&apos;]
                  </code>
                  <span className="ml-2 text-muted-foreground">
                    Selector union
                  </span>
                </div>
                <div>
                  <code className="bg-muted px-1 py-0.5 rounded">
                    $[-1], $[::2]
                  </code>
                  <span className="ml-2 text-muted-foreground">
                    Negative index and slice
                  </span>
                </div>
                <div>
                  <code className="bg-muted px-1 py-0.5 rounded">$..*</code>
                  <span className="ml-2 text-muted-foreground">
                    Recursive descent
                  </span>
                </div>
                <div>
                  <code className="bg-muted px-1 py-0.5 rounded">
                    $[?(@.prop)]
                  </code>
                  <span className="ml-2 text-muted-foreground">
                    Basic filter expression
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Use the sample paths to get started</li>
                <li>• Copy paths or values with the copy buttons</li>
                <li>• Wildcards (*) match any property/index</li>
                <li>• Result paths use normalized bracket notation</li>
                <li>• Filter functions are not currently supported</li>
                <li>• Results show value types and execution time</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
