"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, FileText, GitCompare } from "lucide-react";
import { toast } from "sonner";

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

  const preprocessText = (text: string) => {
    let processed = text;
    if (ignoreCase) {
      processed = processed.toLowerCase();
    }
    if (ignoreWhitespace) {
      processed = processed.replace(/\s+/g, " ").trim();
    }
    return processed;
  };

  const calculateDiff = () => {
    const processed1 = preprocessText(text1);
    const processed2 = preprocessText(text2);

    let tokens1: string[];
    let tokens2: string[];

    // Split based on diff level
    if (diffLevel === "line") {
      tokens1 = processed1.split("\n");
      tokens2 = processed2.split("\n");
    } else if (diffLevel === "word") {
      // Split by words but preserve whitespace info
      tokens1 = processed1.split(/(\s+)/).filter((token) => token.length > 0);
      tokens2 = processed2.split(/(\s+)/).filter((token) => token.length > 0);
    } else {
      // Character level
      tokens1 = processed1.split("");
      tokens2 = processed2.split("");
    }

    const diff: DiffLine[] = [];
    let additions = 0;
    let deletions = 0;
    let changes = 0;

    if (diffLevel === "line") {
      // Use existing line-based algorithm
      const maxLength = Math.max(tokens1.length, tokens2.length);
      let originalLineNum = 1;
      let modifiedLineNum = 1;

      for (let i = 0; i < maxLength; i++) {
        const line1 = i < tokens1.length ? tokens1[i] : null;
        const line2 = i < tokens2.length ? tokens2[i] : null;

        if (line1 === null && line2 !== null) {
          diff.push({
            type: "added",
            text: line2,
            lineNumber: modifiedLineNum,
          });
          additions++;
          modifiedLineNum++;
        } else if (line1 !== null && line2 === null) {
          diff.push({
            type: "removed",
            text: line1!,
            lineNumber: originalLineNum,
          });
          deletions++;
          originalLineNum++;
        } else if (line1 === line2) {
          diff.push({
            type: "unchanged",
            text: line1!,
            lineNumber: originalLineNum,
          });
          originalLineNum++;
          modifiedLineNum++;
        } else {
          diff.push({
            type: "removed",
            text: line1!,
            lineNumber: originalLineNum,
          });
          diff.push({
            type: "added",
            text: line2!,
            lineNumber: modifiedLineNum,
          });
          deletions++;
          additions++;
          changes++;
          originalLineNum++;
          modifiedLineNum++;
        }
      }
    } else {
      // Use LCS algorithm for word/character level
      const lcsMatrix = calculateLCS(tokens1, tokens2);
      const diffTokens = backtrackLCS(tokens1, tokens2, lcsMatrix);

      // Group tokens into lines for display
      let currentLine = "";
      let currentType: "added" | "removed" | "unchanged" = "unchanged";
      let lineNumber = 1;

      for (const token of diffTokens) {
        if (diffLevel === "word" && /\n/.test(token.text)) {
          // New line found - push current line and start new one
          if (currentLine.trim()) {
            diff.push({
              type: currentType,
              text: currentLine.trim(),
              lineNumber: lineNumber,
            });
            if (currentType === "added") additions++;
            if (currentType === "removed") deletions++;
            if (currentType !== "unchanged") changes++;
          }
          lineNumber++;
          currentLine = "";
          currentType = "unchanged";
        } else {
          if (currentType !== token.type) {
            // Type changed - push current line if not empty
            if (currentLine.trim()) {
              diff.push({
                type: currentType,
                text: currentLine.trim(),
                lineNumber: lineNumber,
              });
              if (currentType === "added") additions++;
              if (currentType === "removed") deletions++;
              if (currentType !== "unchanged") changes++;
              lineNumber++;
            }
            currentLine = token.text;
            currentType = token.type;
          } else {
            currentLine += token.text;
          }
        }
      }

      // Push remaining line
      if (currentLine.trim()) {
        diff.push({
          type: currentType,
          text: currentLine.trim(),
          lineNumber: lineNumber,
        });
        if (currentType === "added") additions++;
        if (currentType === "removed") deletions++;
        if (currentType !== "unchanged") changes++;
      }
    }

    setDiffResult(diff);
    setStats({ additions, deletions, changes });
  };

  // LCS calculation for word/character diff
  const calculateLCS = (tokens1: string[], tokens2: string[]): number[][] => {
    const m = tokens1.length;
    const n = tokens2.length;
    const lcs: number[][] = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (tokens1[i - 1] === tokens2[j - 1]) {
          lcs[i][j] = lcs[i - 1][j - 1] + 1;
        } else {
          lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1]);
        }
      }
    }

    return lcs;
  };

  // Backtrack LCS to generate diff
  const backtrackLCS = (
    tokens1: string[],
    tokens2: string[],
    lcs: number[][]
  ): Array<{ type: "added" | "removed" | "unchanged"; text: string }> => {
    const result: Array<{
      type: "added" | "removed" | "unchanged";
      text: string;
    }> = [];
    let i = tokens1.length;
    let j = tokens2.length;

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && tokens1[i - 1] === tokens2[j - 1]) {
        result.unshift({ type: "unchanged", text: tokens1[i - 1] });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
        result.unshift({ type: "added", text: tokens2[j - 1] });
        j--;
      } else if (i > 0) {
        result.unshift({ type: "removed", text: tokens1[i - 1] });
        i--;
      }
    }

    return result;
  };

  const copyResults = () => {
    const diffText = diffResult
      .map((line) => {
        const prefix =
          line.type === "added" ? "+" : line.type === "removed" ? "-" : " ";
        return `${prefix} ${line.text}`;
      })
      .join("\n");

    navigator.clipboard.writeText(diffText);
    toast.success("Diff copied to clipboard!");
  };

  const downloadResults = () => {
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
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            Text Diff Checker
          </CardTitle>
          <CardDescription>
            Compare two texts and highlight differences with various options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <Label htmlFor="diff-type">Diff Type</Label>
              <Select
                value={diffType}
                onValueChange={(value: "unified" | "split") =>
                  setDiffType(value)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select diff type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unified">Unified View</SelectItem>
                  <SelectItem value="split">Split View</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="diff-level">Diff Level</Label>
              <Select
                value={diffLevel}
                onValueChange={(value: "line" | "word" | "char") =>
                  setDiffLevel(value)
                }
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select diff level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">By Line</SelectItem>
                  <SelectItem value="word">By Word</SelectItem>
                  <SelectItem value="char">By Character</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {diffLevel === "line"
                  ? "Compare line by line (traditional diff)"
                  : diffLevel === "word"
                  ? "Compare word by word (great for prose)"
                  : "Compare character by character (most detailed)"}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="ignore-whitespace"
                checked={ignoreWhitespace}
                onChange={(e) => setIgnoreWhitespace(e.target.checked)}
                className="rounded border-gray-300"
              />
              <div className="space-y-1">
                <Label htmlFor="ignore-whitespace" className="text-sm">
                  Ignore whitespace
                </Label>
                <p className="text-xs text-muted-foreground">
                  Treat multiple spaces, tabs, and line breaks as single spaces
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="ignore-case"
                checked={ignoreCase}
                onChange={(e) => setIgnoreCase(e.target.checked)}
                className="rounded border-gray-300"
              />
              <div className="space-y-1">
                <Label htmlFor="ignore-case" className="text-sm">
                  Ignore case
                </Label>
                <p className="text-xs text-muted-foreground">
                  Make comparison case-insensitive (A = a)
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="text1">Original Text</Label>
              <Textarea
                id="text1"
                placeholder="Enter original text here..."
                value={text1}
                onChange={(e) => setText1(e.target.value)}
                className="min-h-[300px] font-mono text-sm code-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="text2">Modified Text</Label>
              <Textarea
                id="text2"
                placeholder="Enter modified text here..."
                value={text2}
                onChange={(e) => setText2(e.target.value)}
                className="min-h-[300px] font-mono text-sm code-input"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={calculateDiff} className="flex items-center gap-2">
              <GitCompare className="h-4 w-4" />
              Compare
            </Button>
            <Button variant="outline" onClick={clearAll}>
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {diffResult.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Diff Results
            </CardTitle>
            <CardDescription>
              <div className="flex gap-4">
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-300"
                >
                  +{stats.additions} additions
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-red-50 text-red-700 border-red-300"
                >
                  -{stats.deletions} deletions
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-300"
                >
                  {stats.changes} changes
                </Badge>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyResults}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={downloadResults}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>

            <div className="border rounded-lg p-4 code-block max-h-96 overflow-y-auto">
              {diffType === "unified" ? (
                // Unified View - single column with +/- indicators
                <div className="font-mono text-sm space-y-1">
                  {diffResult.map((line, index) => (
                    <div
                      key={index}
                      className={`diff-line flex flex-rows items-center gap-2 ${
                        line.type === "added"
                          ? "diff-added"
                          : line.type === "removed"
                          ? "diff-removed"
                          : "diff-unchanged"
                      }`}
                    >
                      <span className="flex items-center w-12 text-right mr-3 text-gray-500 dark:text-gray-400 select-none flex-shrink-0 text-xs">
                        {line.lineNumber}
                      </span>
                      <span className="flex items-center w-6 text-center mr-3 select-none flex-shrink-0 font-bold">
                        {line.type === "added"
                          ? "+"
                          : line.type === "removed"
                          ? "-"
                          : " "}
                      </span>
                      <span className="flex-1 whitespace-pre-wrap break-words">
                        {line.text || " "}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                // Split View - side by side comparison with synchronized rows
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="font-semibold text-sm text-red-600 dark:text-red-400 border-b pb-2">
                      Original Text
                    </div>
                    <div className="font-mono text-sm space-y-1">
                      {diffResult.map((line, index) => {
                        // Show all lines but only display content for non-added lines
                        if (line.type === "added") {
                          // Show empty space for added lines to maintain sync
                          return (
                            <div
                              key={`orig-empty-${index}`}
                              className="diff-line flex items-center gap-2 opacity-0"
                            >
                              <span className="w-8 text-right text-gray-500 dark:text-gray-400 select-none text-xs"></span>
                              <span className="flex-1 whitespace-pre-wrap break-words">
                                &nbsp;
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={`orig-${index}`}
                            className={`diff-line flex items-center gap-2 ${
                              line.type === "removed"
                                ? "diff-removed"
                                : "diff-unchanged"
                            }`}
                          >
                            <span className="w-8 text-right text-gray-500 dark:text-gray-400 select-none text-xs">
                              {line.lineNumber}
                            </span>
                            <span className="flex-1 whitespace-pre-wrap break-words">
                              {line.text || " "}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-semibold text-sm text-green-600 dark:text-green-400 border-b pb-2">
                      Modified Text
                    </div>
                    <div className="font-mono text-sm space-y-1">
                      {diffResult.map((line, index) => {
                        // Show all lines but only display content for non-removed lines
                        if (line.type === "removed") {
                          // Show empty space for removed lines to maintain sync
                          return (
                            <div
                              key={`mod-empty-${index}`}
                              className="diff-line flex items-center gap-2 opacity-0"
                            >
                              <span className="w-8 text-right text-gray-500 dark:text-gray-400 select-none text-xs"></span>
                              <span className="flex-1 whitespace-pre-wrap break-words">
                                &nbsp;
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={`mod-${index}`}
                            className={`diff-line flex items-center gap-2 ${
                              line.type === "added"
                                ? "diff-added"
                                : "diff-unchanged"
                            }`}
                          >
                            <span className="w-8 text-right text-gray-500 dark:text-gray-400 select-none text-xs">
                              {line.lineNumber}
                            </span>
                            <span className="flex-1 whitespace-pre-wrap break-words">
                              {line.text || " "}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
