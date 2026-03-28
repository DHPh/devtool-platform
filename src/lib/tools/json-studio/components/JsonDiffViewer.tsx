/**
 * JSON Diff Viewer Component
 * Interactive component for comparing two JSON objects
 */

"use client";

import { useState } from "react";
import { writeClipboardText } from "@/hooks/use-clipboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  GitCompare,
  Copy,
  Download,
  Plus,
  Minus,
  Edit,
  Move,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ResponsiveTextArea } from "@/components/layout";
import {
  compareJsonObjects,
  applyJsonPatch,
  generateDiffSummary,
  type JsonDiffResult,
  type DiffEntry,
} from "@/lib/utils/json";

interface JsonDiffViewerProps {
  data: unknown;
  className?: string;
}

export function JsonDiffViewer({ data, className }: JsonDiffViewerProps) {
  const [compareData, setCompareData] = useState("");
  const [diffResult, setDiffResult] = useState<JsonDiffResult | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [patchStatus, setPatchStatus] = useState<"verified" | "failed" | null>(null);

  const performComparison = () => {
    if (data === undefined) {
      toast.error("No original JSON data to compare");
      return;
    }

    if (!compareData.trim()) {
      toast.error("Please provide JSON data to compare with");
      return;
    }

    setIsComparing(true);

    try {
      const parsedCompareData = JSON.parse(compareData);
      const result = compareJsonObjects(data, parsedCompareData);
      setDiffResult(result);
      const applied = applyJsonPatch(data, result.patches);
      setPatchStatus(compareJsonObjects(applied, parsedCompareData).differences.length === 0 ? "verified" : "failed");

      const summary = generateDiffSummary(result);
      toast.success(summary);
    } catch (error) {
      toast.error(error instanceof SyntaxError ? "Comparison data is not valid JSON" : "Unable to generate an applicable JSON Patch");
      setDiffResult(null);
      setPatchStatus(null);
    } finally {
      setIsComparing(false);
    }
  };

  const copyDiff = () => {
    if (!diffResult) {
      toast.error("No diff to copy");
      return;
    }

    const diffText = diffResult.differences
      .map(
        (diff) =>
          `${diff.type.toUpperCase()}: ${diff.path}\n  ${
            diff.type === "modified"
              ? `${JSON.stringify(diff.oldValue)} → ${JSON.stringify(
                  diff.newValue
                )}`
              : `${JSON.stringify(diff.type === "removed" ? diff.oldValue : diff.newValue)}`
          }`
      )
      .join("\n\n");

    void writeClipboardText(diffText);
    toast.success("Diff copied to clipboard");
  };

  const copyPatches = () => {
    if (!diffResult) {
      toast.error("No patches to copy");
      return;
    }

    void writeClipboardText(JSON.stringify(diffResult.patches, null, 2));
    toast.success("JSON patches copied to clipboard");
  };

  const downloadDiff = () => {
    if (!diffResult) {
      toast.error("No diff to download");
      return;
    }

    const diffContent = {
      summary: diffResult.summary,
      differences: diffResult.differences,
      patches: diffResult.patches,
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(diffContent, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "json-diff.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getDiffIcon = (type: DiffEntry["type"]) => {
    switch (type) {
      case "added":
        return <Plus className="h-4 w-4 text-green-500" />;
      case "removed":
        return <Minus className="h-4 w-4 text-red-500" />;
      case "modified":
        return <Edit className="h-4 w-4 text-blue-500" />;
      case "moved":
        return <Move className="h-4 w-4 text-purple-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getDiffBadgeVariant = (type: DiffEntry["type"]) => {
    switch (type) {
      case "added":
        return "default" as const;
      case "removed":
        return "destructive" as const;
      case "modified":
        return "secondary" as const;
      case "moved":
        return "outline" as const;
      default:
        return "default" as const;
    }
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

  const loadSampleData = () => {
    const sampleData = {
      name: "John Smith",
      age: 31,
      email: "john.smith@example.com",
      active: false,
      tags: ["developer", "typescript", "react"],
      address: {
        street: "456 Oak Ave",
        city: "San Francisco",
        zip: "94102",
      },
    };

    setCompareData(JSON.stringify(sampleData, null, 2));
    toast.success("Sample data loaded");
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <GitCompare className="h-5 w-5" />
          <span>JSON Diff Viewer</span>
          <Badge variant="secondary">RFC 6902</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Compare Data Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">JSON to Compare With</label>
            <Button variant="outline" size="sm" onClick={loadSampleData}>
              Sample
            </Button>
          </div>
          <ResponsiveTextArea
            value={compareData}
            onChange={setCompareData}
            placeholder="Enter JSON data to compare with the original..."
            className="font-mono text-sm min-h-32"
          />
        </div>

        {/* Compare Button */}
        <div className="flex gap-2">
          <Button
            onClick={performComparison}
            disabled={isComparing || data === undefined || !compareData.trim()}
            className="flex-1"
          >
            {isComparing ? "Comparing..." : "Compare"}
          </Button>
          {diffResult && (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={copyDiff} aria-label="Copy diff">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy diff</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={copyPatches} aria-label="Copy JSON patches">
                      <FileText className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy JSON patches</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={downloadDiff} aria-label="Download diff">
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download diff</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </div>

        <Separator />

        {/* Diff Results */}
        {diffResult && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">Summary:</span>
              <Badge variant="default">
                {diffResult.summary.totalChanges} total changes
              </Badge>
              {diffResult.summary.added > 0 && (
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-700"
                >
                  +{diffResult.summary.added} added
                </Badge>
              )}
              {diffResult.summary.removed > 0 && (
                <Badge variant="destructive">
                  -{diffResult.summary.removed} removed
                </Badge>
              )}
              {diffResult.summary.modified > 0 && (
                <Badge variant="secondary">
                  ~{diffResult.summary.modified} modified
                </Badge>
              )}
              {diffResult.summary.moved > 0 && (
                <Badge variant="outline">
                  ↔{diffResult.summary.moved} moved
                </Badge>
              )}
              {patchStatus === "verified" && (
                <Badge variant="outline">Applicable patch verified</Badge>
              )}
              {patchStatus === "failed" && (
                <Badge variant="destructive">Patch verification failed</Badge>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">RFC 6902 patch:</h4>
              <pre className="text-xs bg-muted p-3 rounded max-h-64 overflow-auto" data-testid="json-patch-output">
                {JSON.stringify(diffResult.patches, null, 2)}
              </pre>
            </div>

            {/* Differences */}
            {diffResult.differences.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <GitCompare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No differences found - JSON objects are identical</p>
              </div>
            ) : (
              <div className="space-y-2">
                <h4 className="font-medium">
                  Changes ({diffResult.differences.length}):
                </h4>
                <div className="space-y-2 max-h-96 overflow-auto">
                  {diffResult.differences.map((diff, index) => (
                    <div
                      key={index}
                      className="p-3 border rounded-md space-y-2 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getDiffIcon(diff.type)}
                          <Badge variant={getDiffBadgeVariant(diff.type)}>
                            {diff.type}
                          </Badge>
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {diff.path || "root"}
                          </code>
                        </div>
                      </div>

                      <div className="text-sm space-y-1">
                        {diff.type === "modified" && (
                          <>
                            <div className="text-red-600">
                              <span className="font-medium">- Old:</span>{" "}
                              <code className="text-xs bg-red-50 px-1 py-0.5 rounded">
                                {renderValue(diff.oldValue)}
                              </code>
                            </div>
                            <div className="text-green-600">
                              <span className="font-medium">+ New:</span>{" "}
                              <code className="text-xs bg-green-50 px-1 py-0.5 rounded">
                                {renderValue(diff.newValue)}
                              </code>
                            </div>
                          </>
                        )}
                        {diff.type === "added" && (
                          <div className="text-green-600">
                            <span className="font-medium">+ Added:</span>{" "}
                            <code className="text-xs bg-green-50 px-1 py-0.5 rounded">
                              {renderValue(diff.newValue)}
                            </code>
                          </div>
                        )}
                        {diff.type === "removed" && (
                          <div className="text-red-600">
                            <span className="font-medium">- Removed:</span>{" "}
                            <code className="text-xs bg-red-50 px-1 py-0.5 rounded">
                              {renderValue(diff.oldValue)}
                            </code>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
