"use client";

import React, { useEffect, useState, useMemo } from "react";
import { copyToClipboard } from "@/hooks/use-clipboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Search } from "lucide-react";
import {
  testRegex,
  RegexFlags,
  flagsToString,
} from "@/lib/utils/regex/regex-tester";
import { regexReplace } from "@/lib/utils/regex/regex-replace";
import { runRegexReplaceWithTimeout } from "@/lib/workers/compute-client";
import type { RegexReplaceOutcome } from "@/lib/workers/compute-tasks";
import {
  RegexFlagsControls,
  RegexPatternLibrary,
  RegexReplacePreview,
} from "../components";

interface RegexReplaceTabProps {
  initialPattern?: string;
  initialText?: string;
  initialReplacement?: string;
  initialFlags?: RegexFlags;
}

export function RegexReplaceTab({
  initialPattern = "",
  initialText = "",
  initialReplacement = "",
  initialFlags,
}: RegexReplaceTabProps) {
  const [pattern, setPattern] = useState(initialPattern);
  const [inputText, setInputText] = useState(initialText);
  const [replacement, setReplacement] = useState(initialReplacement);
  const [flags, setFlags] = useState<RegexFlags>(
    initialFlags || {
      global: true,
      ignoreCase: false,
      multiline: false,
      dotAll: false,
      unicode: false,
      sticky: false,
    }
  );
  const [showPatternLibrary, setShowPatternLibrary] = useState(false);
  const [patternSearch, setPatternSearch] = useState("");
  const [workerOutcome, setWorkerOutcome] = useState<{
    key: string;
    outcome: RegexReplaceOutcome;
  } | null>(null);

  const flagString = flagsToString(flags);
  const hasInputs = Boolean(pattern && inputText);
  const workerAvailable = typeof Worker === "function";
  const requestKey = `${pattern}\0${inputText}\0${replacement}\0${flagString}`;

  useEffect(() => {
    if (!hasInputs || !workerAvailable) return;

    const controller = new AbortController();
    void runRegexReplaceWithTimeout(pattern, inputText, replacement, flagString, {
      signal: controller.signal,
    }).then((result) => {
      if (controller.signal.aborted) return;
      if (result.ok) {
        setWorkerOutcome({ key: requestKey, outcome: result.value });
      } else {
        setWorkerOutcome({
          key: requestKey,
          outcome: {
            result: inputText,
            replacementCount: 0,
            isValid: false,
            error: result.error,
          },
        });
      }
    });

    return () => controller.abort();
  }, [
    flagString,
    hasInputs,
    inputText,
    pattern,
    replacement,
    requestKey,
    workerAvailable,
  ]);

  // Synchronous fallback for SSR / environments without Web Workers
  const syncReplaceResult = useMemo<RegexReplaceOutcome>(() => {
    if (!hasInputs || workerAvailable) {
      return {
        result: inputText,
        replacementCount: 0,
        isValid: true,
      };
    }

    try {
      const testResult = testRegex(pattern, inputText, flagString);
      if (!testResult.isValid) {
        return {
          result: inputText,
          replacementCount: 0,
          isValid: false,
          error: testResult.error,
        };
      }

      const replaceResult = regexReplace(
        inputText,
        pattern,
        replacement,
        flagString
      );
      return {
        result: replaceResult.result,
        replacementCount: replaceResult.replacements,
        isValid: true,
      };
    } catch (error) {
      return {
        result: inputText,
        replacementCount: 0,
        isValid: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }, [flagString, hasInputs, inputText, pattern, replacement, workerAvailable]);

  const replaceResult: RegexReplaceOutcome = !hasInputs
    ? { result: inputText, replacementCount: 0, isValid: true }
    : workerAvailable
      ? workerOutcome?.key === requestKey
        ? workerOutcome.outcome
        : { result: inputText, replacementCount: 0, isValid: true }
      : syncReplaceResult;

  const handlePatternSelect = (selectedPattern: string) => {
    setPattern(selectedPattern);
    setShowPatternLibrary(false);
  };

  const handleCopyResult = () => {
    void copyToClipboard(replaceResult.result, "Replaced text copied!");
  };

  const handleDownloadResult = () => {
    const blob = new Blob([replaceResult.result], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "regex-replace-result.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Pattern Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Regex Pattern</CardTitle>
          <CardDescription>
            Enter your regular expression pattern for find and replace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pattern">Pattern</Label>
            <div className="flex gap-2">
              <Input
                id="pattern"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="Enter regex pattern..."
                className="font-mono"
              />
              <Button
                variant="outline"
                onClick={() => setShowPatternLibrary(!showPatternLibrary)}
                className="shrink-0"
              >
                <Search className="h-4 w-4 mr-2" />
                Library
              </Button>
            </div>
          </div>

          {/* Pattern Library */}
          {showPatternLibrary && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">Pattern Library</h3>
                <Input
                  placeholder="Search patterns..."
                  value={patternSearch}
                  onChange={(e) => setPatternSearch(e.target.value)}
                  className="w-48"
                />
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                <RegexPatternLibrary
                  onPatternSelect={handlePatternSelect}
                  searchQuery={patternSearch}
                />
              </div>
            </div>
          )}

          {/* Replacement Input */}
          <div className="space-y-2">
            <Label htmlFor="replacement">Replacement</Label>
            <Input
              id="replacement"
              value={replacement}
              onChange={(e) => setReplacement(e.target.value)}
              placeholder="Enter replacement text (use $1, $2, etc. for groups)..."
              className="font-mono"
            />
            <div className="text-xs text-muted-foreground">
              Use <code>$1</code>, <code>$2</code>, etc. for capture groups. Use{" "}
              <code>$&</code> for the entire match.
            </div>
          </div>

          {/* Error Display */}
          {!replaceResult.isValid && replaceResult.error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                <span className="text-sm text-red-700 dark:text-red-300">
                  Invalid regex pattern: {replaceResult.error}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Flags Controls */}
      <RegexFlagsControls flags={flags} onChange={setFlags} />

      {/* Input Text */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Input Text</CardTitle>
          <CardDescription>
            Enter the text where you want to find and replace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="inputText">Text</Label>
            <Textarea
              id="inputText"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter text to process..."
              className="min-h-[120px] font-mono"
            />
          </div>
        </CardContent>
      </Card>

      {/* Replace Preview */}
      <RegexReplacePreview
        originalText={inputText}
        replacedText={replaceResult.result}
        replacementCount={replaceResult.replacementCount}
        onCopyResult={handleCopyResult}
        onDownloadResult={handleDownloadResult}
      />
    </div>
  );
}
