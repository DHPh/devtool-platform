"use client";

import { useState } from "react";
import { copyToClipboard } from "@/hooks/use-clipboard";
import { GitCompare, Copy, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  ToolHeader,
  QuickActions,
  ResultCard,
  ResponsiveTextArea,
} from "@/components/layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  calculateTextDiff,
  type DiffEntry,
  type DiffSplitRow,
} from "@/lib/processors/ui-primitives";

export const metadata = {
  id: "diff-checker",
  name: "Text Diff Checker",
  description: "Compare two texts and highlight differences",
  category: "Utilities",
  tags: ["diff", "compare", "text"],
  path: "/tools/diff-checker",
  icon: "🔍",
};

export default function DiffChecker() {
  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");
  const [diffResult, setDiffResult] = useState<DiffEntry[]>([]);
  const [splitRows, setSplitRows] = useState<DiffSplitRow[]>([]);
  const [diffType, setDiffType] = useState<"unified" | "split">("unified");
  const [diffLevel, setDiffLevel] = useState<"line" | "word" | "char">("line");
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [stats, setStats] = useState({
    additions: 0,
    deletions: 0,
    changes: 0,
  });

  const calculateDiff = () => {
    if (!text1 || !text2) {
      toast.error("Please enter both texts to compare");
      return;
    }

    const result = calculateTextDiff(text1, text2, {
      level: diffLevel,
      ignoreWhitespace,
      ignoreCase,
    });
    setDiffResult(result.lines);
    setSplitRows(result.splitRows);
    setStats(result.stats);
    toast.success("Diff calculated successfully!");
  };

  const copyResults = () => {
    if (diffResult.length === 0) {
      toast.error("No diff results to copy");
      return;
    }

    const diffText = diffResult
      .map((line) => {
        const prefix =
          line.type === "added" ? "+" : line.type === "removed" ? "-" : " ";
        return `${prefix} ${line.text}`;
      })
      .join("\n");

    void copyToClipboard(diffText, "Diff copied to clipboard!");
  };

  const downloadResults = () => {
    if (diffResult.length === 0) {
      toast.error("No diff results to download");
      return;
    }

    const diffText = diffResult
      .map((line) => {
        const prefix =
          line.type === "added" ? "+" : line.type === "removed" ? "-" : " ";
        return `${prefix} ${line.text}`;
      })
      .join("\n");

    const blob = new Blob([diffText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "diff-result.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Diff downloaded!");
  };

  const clearAll = () => {
    setText1("");
    setText2("");
    setDiffResult([]);
    setSplitRows([]);
    setStats({ additions: 0, deletions: 0, changes: 0 });
    toast.success("All data cleared!");
  };

  const loadSampleTexts = () => {
    setText1(`Hello World!
This is a sample text.
Line 3
Line 4
Common line
Another line`);
    setText2(`Hello Universe!
This is a sample text.
New Line 3
Line 4 modified
Common line
New line added`);
    toast.success("Sample texts loaded!");
  };

  const swapTexts = () => {
    const temp = text1;
    setText1(text2);
    setText2(temp);
    toast.success("Texts swapped!");
  };

  return (
    <div className="space-y-6">
      <ToolHeader
        title="Text Diff Checker"
        description="Compare two texts and highlight differences with various comparison options"
        icon={GitCompare}
      />

      <QuickActions
        actions={[
          {
            id: "compare",
            label: "Compare Texts",
            onClick: calculateDiff,
            disabled: !text1 || !text2,
            variant: "default" as const,
          },
          {
            id: "sample",
            label: "Load Sample",
            onClick: loadSampleTexts,
            variant: "outline" as const,
          },
          {
            id: "swap",
            label: "Swap Texts",
            onClick: swapTexts,
            disabled: !text1 && !text2,
            variant: "outline" as const,
          },
          {
            id: "clear",
            label: "Clear All",
            onClick: clearAll,
            variant: "outline" as const,
          },
        ]}
      />

      <ResultCard
        title="Comparison Settings"
        description="Configure how the texts should be compared"
        status="info"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="diff-type">View Type</Label>
            <Select
              value={diffType}
              onValueChange={(value: "unified" | "split") =>
                setDiffType(value)
              }
            >
              <SelectTrigger id="diff-type" aria-label="Diff view type">
                <SelectValue placeholder="Select view type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unified">Unified View</SelectItem>
                <SelectItem value="split">Split View</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="diff-level">Comparison Level</Label>
            <Select
              value={diffLevel}
              onValueChange={(value: "line" | "word" | "char") =>
                setDiffLevel(value)
              }
            >
              <SelectTrigger id="diff-level" aria-label="Comparison level">
                <SelectValue placeholder="Select comparison level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">By Line</SelectItem>
                <SelectItem value="word">By Word</SelectItem>
                <SelectItem value="char">By Character</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="ignore-whitespace"
                checked={ignoreWhitespace}
                onCheckedChange={setIgnoreWhitespace}
              />
              <Label htmlFor="ignore-whitespace">Ignore Whitespace</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="ignore-case"
                checked={ignoreCase}
                onCheckedChange={setIgnoreCase}
              />
              <Label htmlFor="ignore-case">Ignore Case</Label>
            </div>
          </div>
        </div>
      </ResultCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="diff-original" className="block text-sm font-medium">
            Original Text
          </Label>
          <ResponsiveTextArea
            id="diff-original"
            value={text1}
            onChange={setText1}
            placeholder="Enter original text here..."
            minHeight={280}
            showCharacterCount={true}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="diff-modified" className="block text-sm font-medium">
            Modified Text
          </Label>
          <ResponsiveTextArea
            id="diff-modified"
            value={text2}
            onChange={setText2}
            placeholder="Enter modified text here..."
            minHeight={280}
            showCharacterCount={true}
          />
        </div>
      </div>

      {diffResult.length > 0 && (
        <ResultCard
          title="Diff Results"
          description={`Found ${stats.additions} additions, ${stats.deletions} deletions, and ${stats.changes} changes`}
          status="success"
        >
          <div className="space-y-4">
            {/* Stats */}
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className="bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-300 dark:border-green-800"
              >
                +{stats.additions} additions
              </Badge>
              <Badge
                variant="outline"
                className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800"
              >
                -{stats.deletions} deletions
              </Badge>
              <Badge
                variant="outline"
                className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800"
              >
                {stats.changes} changes
              </Badge>
            </div>

            {/* Copy/Download Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyResults}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-muted hover:bg-accent text-foreground border border-border rounded-md transition-colors"
              >
                <Copy className="h-4 w-4" />
                Copy Results
              </button>
              <button
                type="button"
                onClick={downloadResults}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-muted hover:bg-accent text-foreground border border-border rounded-md transition-colors"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>

            {/* Diff Display */}
            <div className="border rounded-lg overflow-auto max-h-96">
              {diffType === "unified" ? (
                <div className="font-mono text-sm">
                  {diffResult.map((line, index) => (
                    <div
                      key={index}
                      className={`px-3 py-1 border-l-2 flex items-start ${
                        line.type === "added"
                          ? "bg-green-50 text-green-800 border-green-500 dark:bg-green-900/20 dark:text-green-100 dark:border-green-600"
                          : line.type === "removed"
                            ? "bg-red-50 text-red-800 border-red-500 dark:bg-red-900/20 dark:text-red-100 dark:border-red-600"
                            : "bg-card border-transparent"
                      }`}
                    >
                      <span className="text-muted-foreground w-8 inline-block text-right mr-2 select-none text-xs shrink-0 pt-0.5">
                        {line.oldLineNumber ?? ""}
                      </span>
                      <span className="text-muted-foreground w-8 inline-block text-right mr-3 select-none text-xs shrink-0 pt-0.5">
                        {line.newLineNumber ?? ""}
                      </span>
                      <span className="w-4 inline-block mr-2 font-bold shrink-0">
                        {line.type === "added"
                          ? "+"
                          : line.type === "removed"
                            ? "-"
                            : " "}
                      </span>
                      <span className="whitespace-pre-wrap break-words min-w-0 flex-1">
                        {line.text || " "}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="font-mono text-sm min-w-[640px]">
                  <div className="grid grid-cols-2 border-b bg-muted/60 sticky top-0 z-10">
                    <div className="px-3 py-2 font-semibold text-xs sm:text-sm text-red-700 dark:text-red-400 flex items-center gap-2 border-r">
                      <FileText className="h-4 w-4" />
                      Original Text
                    </div>
                    <div className="px-3 py-2 font-semibold text-xs sm:text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Modified Text
                    </div>
                  </div>

                  {splitRows.map((row, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-2 border-t first:border-t-0"
                    >
                      <div
                        className={`px-3 py-1 border-r flex items-start ${
                          row.left?.type === "removed"
                            ? "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-100"
                            : row.left
                              ? "bg-card"
                              : "bg-muted/25 border-dashed border-border/50"
                        }`}
                      >
                        <span className="text-muted-foreground w-7 inline-block text-right mr-2 select-none text-xs shrink-0 pt-0.5">
                          {row.left?.lineNumber ?? ""}
                        </span>
                        <span className="whitespace-pre-wrap break-words min-w-0 flex-1">
                          {row.left ? row.left.text || " " : "\u00A0"}
                        </span>
                      </div>

                      <div
                        className={`px-3 py-1 flex items-start ${
                          row.right?.type === "added"
                            ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-100"
                            : row.right
                              ? "bg-card"
                              : "bg-muted/25 border-dashed border-border/50"
                        }`}
                      >
                        <span className="text-muted-foreground w-7 inline-block text-right mr-2 select-none text-xs shrink-0 pt-0.5">
                          {row.right?.lineNumber ?? ""}
                        </span>
                        <span className="whitespace-pre-wrap break-words min-w-0 flex-1">
                          {row.right ? row.right.text || " " : "\u00A0"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ResultCard>
      )}
    </div>
  );
}
