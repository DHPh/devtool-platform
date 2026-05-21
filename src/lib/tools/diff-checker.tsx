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
  type DiffEntry,
  type DiffLevel,
  type DiffSplitRow,
} from "@/lib/processors/ui-primitives";
import { calculateTextDiffInWorker } from "@/lib/workers/compute-client";

export default function DiffChecker() {
  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");
  const [diffResult, setDiffResult] = useState<DiffEntry[]>([]);
  const [splitRows, setSplitRows] = useState<DiffSplitRow[]>([]);
  const [hasCompared, setHasCompared] = useState(false);
  const [diffType, setDiffType] = useState<"unified" | "split">("unified");
  const [diffLevel, setDiffLevel] = useState<DiffLevel>("line");
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [stats, setStats] = useState({
    additions: 0,
    deletions: 0,
    changes: 0,
  });

  const runDiff = async (
    left: string,
    right: string,
    opts: { level: DiffLevel; ignoreWhitespace: boolean; ignoreCase: boolean },
    notifySuccess: boolean,
  ) => {
    if (!left && !right) {
      toast.error("Please enter text to compare");
      return;
    }

    const computed = await calculateTextDiffInWorker(
      left,
      right,
      opts,
      { timeoutMs: 10_000 },
    );
    if (!computed.ok) {
      toast.error(computed.error);
      return;
    }
    setDiffResult(computed.value.lines);
    setSplitRows(computed.value.splitRows);
    setStats(computed.value.stats);
    setHasCompared(true);
    if (notifySuccess) {
      toast.success("Diff calculated successfully!");
    }
  };

  const calculateDiff = async () => {
    await runDiff(text1, text2, { level: diffLevel, ignoreWhitespace, ignoreCase }, true);
  };

  const formatDiffExportText = () => {
    if (diffLevel !== "line") {
      return diffResult
        .map((token) =>
          token.type === "added"
            ? `[+${token.text}]`
            : token.type === "removed"
              ? `[-${token.text}]`
              : token.text,
        )
        .join("");
    }
    return diffResult
      .map((line) => {
        const prefix =
          line.type === "added" ? "+" : line.type === "removed" ? "-" : " ";
        return `${prefix} ${line.text}`;
      })
      .join("\n");
  };

  const copyResults = () => {
    if (!hasCompared) {
      toast.error("No diff results to copy");
      return;
    }

    void copyToClipboard(formatDiffExportText(), "Diff copied to clipboard!");
  };

  const downloadResults = () => {
    if (!hasCompared) {
      toast.error("No diff results to download");
      return;
    }

    const blob = new Blob([formatDiffExportText()], { type: "text/plain" });
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
    setHasCompared(false);
    setStats({ additions: 0, deletions: 0, changes: 0 });
    toast.success("All data cleared!");
  };

  const loadSampleTexts = () => {
    const sample1 = `Hello World!
This is a sample text.
Line 3
Line 4
Common line
Another line`;
    const sample2 = `Hello Universe!
This is a sample text.
New Line 3
Line 4 modified
Common line
New line added`;
    setText1(sample1);
    setText2(sample2);
    toast.success("Sample texts loaded!");
  };

  const swapTexts = () => {
    const next1 = text2;
    const next2 = text1;
    setText1(next1);
    setText2(next2);
    if (hasCompared) {
      void runDiff(next1, next2, { level: diffLevel, ignoreWhitespace, ignoreCase }, false);
    }
    toast.success("Texts swapped!");
  };

  const handleDiffLevelChange = (nextLevel: DiffLevel) => {
    setDiffLevel(nextLevel);
    if (hasCompared) {
      void runDiff(text1, text2, { level: nextLevel, ignoreWhitespace, ignoreCase }, false);
    }
  };

  const handleIgnoreWhitespaceChange = (checked: boolean) => {
    setIgnoreWhitespace(checked);
    if (hasCompared) {
      void runDiff(text1, text2, { level: diffLevel, ignoreWhitespace: checked, ignoreCase }, false);
    }
  };

  const handleIgnoreCaseChange = (checked: boolean) => {
    setIgnoreCase(checked);
    if (hasCompared) {
      void runDiff(text1, text2, { level: diffLevel, ignoreWhitespace, ignoreCase: checked }, false);
    }
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
            disabled: !text1 && !text2,
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
              onValueChange={(value: DiffLevel) =>
                handleDiffLevelChange(value)
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
                onCheckedChange={handleIgnoreWhitespaceChange}
              />
              <Label htmlFor="ignore-whitespace">Ignore Whitespace</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="ignore-case"
                checked={ignoreCase}
                onCheckedChange={handleIgnoreCaseChange}
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

      {hasCompared && (
        <ResultCard
          title="Diff Results"
          description={
            stats.additions === 0 && stats.deletions === 0
              ? "Texts are identical under the current comparison settings"
              : `Found ${stats.additions} additions, ${stats.deletions} deletions, and ${stats.changes} changes`
          }
          status="success"
        >
          <div className="space-y-4">
            {/* Stats */}
            <div className="flex flex-wrap gap-2">
              {stats.additions === 0 && stats.deletions === 0 && (
                <Badge variant="secondary">Texts are identical</Badge>
              )}
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
              {diffLevel !== "line" ? (
                diffType === "unified" ? (
                  <pre
                    data-testid="inline-diff-unified"
                    className="p-4 font-mono text-sm whitespace-pre-wrap break-words leading-relaxed"
                  >
                    {diffResult.map((token, index) =>
                      token.type === "added" ? (
                        <ins
                          key={index}
                          className="bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-100 no-underline rounded px-0.5"
                        >
                          {token.text}
                        </ins>
                      ) : token.type === "removed" ? (
                        <del
                          key={index}
                          className="bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-100 line-through rounded px-0.5"
                        >
                          {token.text}
                        </del>
                      ) : (
                        <span key={index}>{token.text}</span>
                      ),
                    )}
                  </pre>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x font-mono text-sm">
                    <pre className="p-4 whitespace-pre-wrap break-words leading-relaxed">
                      {diffResult
                        .filter((token) => token.type !== "added")
                        .map((token, index) =>
                          token.type === "removed" ? (
                            <del
                              key={index}
                              className="bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-100 rounded px-0.5"
                            >
                              {token.text}
                            </del>
                          ) : (
                            <span key={index}>{token.text}</span>
                          ),
                        )}
                    </pre>
                    <pre className="p-4 whitespace-pre-wrap break-words leading-relaxed">
                      {diffResult
                        .filter((token) => token.type !== "removed")
                        .map((token, index) =>
                          token.type === "added" ? (
                            <ins
                              key={index}
                              className="bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-100 no-underline rounded px-0.5"
                            >
                              {token.text}
                            </ins>
                          ) : (
                            <span key={index}>{token.text}</span>
                          ),
                        )}
                    </pre>
                  </div>
                )
              ) : diffType === "unified" ? (
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
