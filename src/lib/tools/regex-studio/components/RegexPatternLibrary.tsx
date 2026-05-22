"use client";

import React from "react";
import { copyToClipboard } from "@/hooks/use-clipboard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Copy } from "lucide-react";
import { REGEX_PATTERNS } from "@/lib/utils/regex/regex-patterns";
import { RegexPattern } from "@/lib/utils/regex/regex-tester";

interface RegexPatternLibraryProps {
  onPatternSelect: (
    pattern: string,
    meta?: { flags?: string; example?: string; targetTab?: "tester" | "replace" },
  ) => void;
  searchQuery?: string;
  showReplaceAction?: boolean;
}

export function RegexPatternLibrary({
  onPatternSelect,
  searchQuery = "",
  showReplaceAction = false,
}: RegexPatternLibraryProps) {
  const handleCopyPattern = (pattern: string) => {
    void copyToClipboard(pattern, "Pattern copied to clipboard!");
  };

  const handleSelectPattern = (
    pattern: RegexPattern,
    targetTab: "tester" | "replace" = "tester",
  ) => {
    onPatternSelect(pattern.pattern, {
      flags: pattern.flags,
      example: pattern.example,
      targetTab,
    });
  };

  const filteredPatterns = React.useMemo(() => {
    if (!searchQuery) return REGEX_PATTERNS;

    const query = searchQuery.toLowerCase();
    const filtered: typeof REGEX_PATTERNS = {};

    Object.entries(REGEX_PATTERNS).forEach(([category, patterns]) => {
      const matchingPatterns = patterns.filter(
        (pattern: RegexPattern) =>
          pattern.name.toLowerCase().includes(query) ||
          pattern.description.toLowerCase().includes(query) ||
          pattern.pattern.toLowerCase().includes(query)
      );

      if (matchingPatterns.length > 0) {
        filtered[category as keyof typeof REGEX_PATTERNS] = matchingPatterns;
      }
    });

    return filtered;
  }, [searchQuery]);

  const renderPattern = (pattern: RegexPattern) => (
    <Card key={pattern.name} className="mb-3">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{pattern.name}</CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyPattern(pattern.pattern)}
              className="h-8 w-8 p-0"
              aria-label={`Copy ${pattern.name} pattern`}
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectPattern(pattern, "tester")}
              className="h-8 px-2 text-xs"
            >
              Use
            </Button>
            {showReplaceAction && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectPattern(pattern, "replace")}
                className="h-8 px-2 text-xs"
              >
                Replace
              </Button>
            )}
          </div>
        </div>
        <CardDescription className="text-sm">
          {pattern.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="font-mono text-sm bg-muted p-2 rounded border">
            {pattern.pattern}
          </div>
          <div>
            <p className="text-sm font-medium mb-1">Example:</p>
            <div className="text-sm text-muted-foreground">
              <span className="font-mono bg-muted px-1 rounded">
                {pattern.example}
              </span>
            </div>
          </div>
          {pattern.flags && (
            <div>
              <p className="text-sm font-medium mb-1">Recommended flags:</p>
              <div className="flex flex-wrap gap-1">
                {pattern.flags.split("").map((flag: string) => (
                  <Badge key={flag} variant="secondary" className="text-xs">
                    {flag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="h-[600px] overflow-y-auto">
      <div className="space-y-6">
        {Object.entries(filteredPatterns).map(([category, patterns]) => (
          <div key={category}>
            <h3 className="text-lg font-semibold mb-3 capitalize">
              {category.replace(/([A-Z])/g, " $1").trim()}
            </h3>
            <div className="space-y-3">{patterns.map(renderPattern)}</div>
          </div>
        ))}

        {Object.keys(filteredPatterns).length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No patterns found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
