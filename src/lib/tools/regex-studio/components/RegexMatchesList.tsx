"use client";

import React from "react";
import { copyToClipboard } from "@/hooks/use-clipboard";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Eye } from "lucide-react";
import { MagnifyingGlassIcon as MagnifyingGlass } from "@phosphor-icons/react/MagnifyingGlass";
import { RegexMatch } from "@/lib/utils/regex/regex-tester";

interface RegexMatchesListProps {
  matches: RegexMatch[];
  executionTime?: number;
  onHighlightMatch?: (match: RegexMatch) => void;
}

export function RegexMatchesList({
  matches,
  executionTime,
  onHighlightMatch,
}: RegexMatchesListProps) {
  const handleCopyMatch = (match: string) => {
    void copyToClipboard(match, "Match copied to clipboard!");
  };

  const handleHighlightMatch = (match: RegexMatch) => {
    onHighlightMatch?.(match);
  };

  if (matches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Matches</CardTitle>
          <CardDescription>
            No matches found with the current pattern
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <MagnifyingGlass
              aria-hidden="true"
              weight="duotone"
              className="mx-auto mb-2.5 h-9 w-9 text-muted-foreground/60"
            />
            <p>Try adjusting your regex pattern or input text</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Matches</CardTitle>
            <CardDescription>
              Found {matches.length} match{matches.length !== 1 ? "es" : ""}
              {executionTime && (
                <span className="ml-2">
                  • Executed in {executionTime.toFixed(2)}ms
                </span>
              )}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-sm">
            {matches.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {matches.map((match, index) => (
            <div
              key={index}
              className="border rounded-lg p-3 bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Match {index + 1}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Position {match.index}-{match.index + match.length}
                  </span>
                </div>
                <div className="flex gap-1">
                  {onHighlightMatch && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleHighlightMatch(match)}
                      className="h-6 w-6 p-0"
                      aria-label={`Highlight match ${index + 1}`}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyMatch(match.match)}
                    className="h-6 w-6 p-0"
                    aria-label={`Copy match ${index + 1}`}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Matched Text:
                  </div>
                  <div className="font-mono text-sm bg-background p-2 rounded border break-all">
                    {match.match}
                  </div>
                </div>

                {match.groups.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Capture Groups:
                    </div>
                    <div className="space-y-1">
                      {match.groups.map((group, groupIndex) => (
                        <div
                          key={groupIndex}
                          className="flex items-center gap-2"
                        >
                          <Badge variant="secondary" className="text-xs">
                            ${groupIndex + 1}
                          </Badge>
                          <span className="font-mono text-sm bg-background px-2 py-1 rounded border break-all">
                            {group || "(empty)"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Object.keys(match.namedGroups).length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Named Groups:
                    </div>
                    <div className="space-y-1">
                      {Object.entries(match.namedGroups).map(
                        ([name, value]) => (
                          <div key={name} className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {name}
                            </Badge>
                            <span className="font-mono text-sm bg-background px-2 py-1 rounded border break-all">
                              {value || "(empty)"}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
