"use client";

import React, { useState, useMemo } from "react";
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
  RegexMatch,
  flagsToString,
} from "@/lib/utils/regex/regex-tester";
import {
  RegexMatchHighlighter,
  RegexFlagsControls,
  RegexMatchesList,
  RegexPatternLibrary,
} from "../components";

interface RegexTesterTabProps {
  initialPattern?: string;
  initialText?: string;
  initialFlags?: RegexFlags;
}

export function RegexTesterTab({
  initialPattern = "",
  initialText = "",
  initialFlags,
}: RegexTesterTabProps) {
  const [pattern, setPattern] = useState(initialPattern);
  const [testText, setTestText] = useState(initialText);
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

  // Test the regex automatically when inputs change
  const testResult = useMemo(() => {
    if (!pattern || !testText) {
      return {
        isValid: true,
        matches: [],
        totalMatches: 0,
        executionTime: 0,
      };
    }

    try {
      return testRegex(pattern, testText, flagsToString(flags));
    } catch (error) {
      return {
        isValid: false,
        matches: [],
        totalMatches: 0,
        executionTime: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }, [pattern, testText, flags]);

  const handlePatternSelect = (selectedPattern: string) => {
    setPattern(selectedPattern);
    setShowPatternLibrary(false);
  };

  const handleHighlightMatch = (match: RegexMatch) => {
    // Could implement highlighting logic here if needed
    void match;
  };

  return (
    <div className="space-y-6">
      {/* Pattern Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Regex Pattern</CardTitle>
          <CardDescription>
            Enter your regular expression pattern
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

          {/* Error Display */}
          {!testResult.isValid && testResult.error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                <span className="text-sm text-red-700 dark:text-red-300">
                  Invalid regex pattern: {testResult.error}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Flags Controls */}
      <RegexFlagsControls flags={flags} onChange={setFlags} />

      {/* Test Text */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Test Text</CardTitle>
          <CardDescription>
            Enter the text to test your regex against
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="testText">Input Text</Label>
            <Textarea
              id="testText"
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Enter text to test..."
              className="min-h-[120px] font-mono"
            />
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Text with Highlights */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Text with Matches</CardTitle>
            <CardDescription>
              Your text with regex matches highlighted
            </CardDescription>
          </CardHeader>
          <CardContent>
            {testText && testResult.isValid && testResult.matches.length > 0 ? (
              <div className="bg-muted p-3 rounded-lg max-h-[400px] overflow-y-auto">
                <RegexMatchHighlighter
                  text={testText}
                  matches={testResult.matches}
                />
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-4xl mb-2">📝</div>
                <p>
                  {!testText
                    ? "Enter some test text to see matches"
                    : !pattern
                    ? "Enter a regex pattern to test"
                    : "No matches found"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Matches List */}
        <RegexMatchesList
          matches={testResult.matches}
          executionTime={testResult.executionTime}
          onHighlightMatch={handleHighlightMatch}
        />
      </div>
    </div>
  );
}
