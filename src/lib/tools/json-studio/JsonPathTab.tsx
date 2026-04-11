/**
 * JSON Path Query Tab Component
 * Handles JSONPath queries and data exploration
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Map, Code } from "lucide-react";
import { JsonPathExplorer } from "./components/JsonPathExplorer";
import { JsonStatsDisplay } from "./components/JsonStatsDisplay";
import { validateJson, type JsonStats } from "@/lib/processors/json";

interface JsonPathTabProps {
  input: string;
}

export function JsonPathTab({ input }: JsonPathTabProps) {
  const [parsedData, setParsedData] = useState<unknown>(null);
  const [stats, setStats] = useState<JsonStats | null>(null);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (!input.trim()) {
      setParsedData(null);
      setStats(null);
      setIsValid(false);
      return;
    }

    const validation = validateJson(input);
    setIsValid(validation.isValid);

    if (validation.isValid) {
      try {
        const parsed = JSON.parse(input);
        setParsedData(parsed);

        // Calculate basic stats
        const size = JSON.stringify(parsed).length;
        const lines = JSON.stringify(parsed, null, 2).split("\n").length;
        setStats({
          size,
          lines,
          objects: 0,
          arrays: 0,
          strings: 0,
          numbers: 0,
          booleans: 0,
          nulls: 0,
          depth: 0,
        });
      } catch {
        setParsedData(null);
        setStats(null);
      }
    } else {
      setParsedData(null);
      setStats(null);
    }
  }, [input]);

  if (!input.trim()) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No JSON Data</h3>
              <p className="text-muted-foreground">
                Please provide valid JSON in the formatter tab to explore paths.
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
                Please fix the JSON syntax in the formatter tab before exploring
                paths.
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
