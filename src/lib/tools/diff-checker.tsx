"use client";

import { useState } from "react";
import { writeClipboardText } from "@/hooks/use-clipboard";
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
import { calculateTextDiff } from "@/lib/processors/ui-primitives";

export const metadata = {
  id: "diff-checker",
  name: "Text Diff Checker",
  description: "Compare two texts and highlight differences",
  category: "Utilities",
  tags: ["diff", "compare", "text"],
  path: "/tools/diff-checker",
  icon: "🔍",
};

interface DiffLine {
  type: "added" | "removed" | "unchanged";
  text: string;
  lineNumber: number;
}

export default function DiffChecker() {
  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");
  const [diffResult, setDiffResult] = useState<DiffLine[]>([]);
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

    void writeClipboardText(diffText);
    toast.success("Diff copied to clipboard!");
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
              <SelectTrigger aria-label="Diff view type">
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
              <SelectTrigger aria-label="Comparison level">
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
        <div className="space-y-4">
          <div>
            <Label className="block text-sm font-medium mb-2">Original Text</Label>
            <ResponsiveTextArea
              value={text1}
              onChange={setText1}
              placeholder="Enter original text here..."
              minHeight={300}
              showCharacterCount={true}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="block text-sm font-medium mb-2">Modified Text</Label>
            <ResponsiveTextArea
              value={text2}
              onChange={setText2}
              placeholder="Enter modified text here..."
              minHeight={300}
              showCharacterCount={true}
            />
          </div>
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
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                +{stats.additions} additions
              </Badge>
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                -{stats.deletions} deletions
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                {stats.changes} changes
              </Badge>
            </div>

            {/* Copy/Download Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyResults}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <Copy className="h-4 w-4" />
                Copy Results
              </button>
              <button
                type="button"
                onClick={downloadResults}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>

            {/* Diff Display */}
            <div className="border rounded-lg overflow-auto max-h-96">
              {diffType === "unified" ? (
                // Unified View - single column with +/- indicators
                <div className="font-mono text-sm">
                  {diffResult.map((line, index) => (
                    <div
                      key={index}
                      className={`px-4 py-1 border-l-2 ${
                        line.type === "added"
                          ? "bg-green-50 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-100 dark:border-green-700"
                          : line.type === "removed"
                          ? "bg-red-50 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-100 dark:border-red-700"
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600"
                      }`}
                    >
                      <span className="text-gray-400 w-8 inline-block text-right mr-4 select-none">
                        {line.lineNumber}
                      </span>
                      <span className="w-4 inline-block mr-2 font-bold">
                        {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
                      </span>
                      <span className="whitespace-pre-wrap break-words">
                        {line.text || " "}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                // Split View - side by side comparison
                <div className="grid grid-cols-2 gap-4 p-4">
                  <div className="space-y-2">
                    <div className="font-semibold text-sm text-red-600 dark:text-red-400 border-b pb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Original Text
                    </div>
                    <div className="font-mono text-sm space-y-1">
                      {diffResult
                        .filter(line => line.type !== "added")
                        .map((line, index) => (
                          <div
                            key={`orig-${index}`}
                            className={`px-2 py-1 rounded ${
                              line.type === "removed"
                                ? "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-100"
                                : "bg-gray-50 dark:bg-gray-800"
                            }`}
                          >
                            <span className="text-gray-400 w-6 inline-block text-right mr-2 select-none text-xs">
                              {line.lineNumber}
                            </span>
                            <span className="whitespace-pre-wrap break-words">
                              {line.text || " "}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-semibold text-sm text-green-600 dark:text-green-400 border-b pb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Modified Text
                    </div>
                    <div className="font-mono text-sm space-y-1">
                      {diffResult
                        .filter(line => line.type !== "removed")
                        .map((line, index) => (
                          <div
                            key={`mod-${index}`}
                            className={`px-2 py-1 rounded ${
                              line.type === "added"
                                ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-100"
                                : "bg-gray-50 dark:bg-gray-800"
                            }`}
                          >
                            <span className="text-gray-400 w-6 inline-block text-right mr-2 select-none text-xs">
                              {line.lineNumber}
                            </span>
                            <span className="whitespace-pre-wrap break-words">
                              {line.text || " "}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ResultCard>
      )}
    </div>
  );
}
