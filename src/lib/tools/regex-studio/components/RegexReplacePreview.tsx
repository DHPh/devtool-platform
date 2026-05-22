"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RegexReplacePreviewProps {
  originalText: string;
  replacedText: string;
  replacementCount: number;
  onCopyResult?: () => void;
  onDownloadResult?: () => void;
}

export function RegexReplacePreview({
  originalText,
  replacedText,
  replacementCount,
  onCopyResult,
  onDownloadResult,
}: RegexReplacePreviewProps) {
  const hasChanges = replacementCount > 0 || originalText !== replacedText;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Replace Preview</CardTitle>
            <CardDescription>
              {hasChanges ? (
                <span>
                  Made {replacementCount} replacement
                  {replacementCount !== 1 ? "s" : ""}
                </span>
              ) : (
                "No replacements made"
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="secondary">
                {replacementCount} change{replacementCount !== 1 ? "s" : ""}
              </Badge>
            )}
            {hasChanges && onCopyResult && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCopyResult}
                className="h-8"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            )}
            {hasChanges && onDownloadResult && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDownloadResult}
                className="h-8"
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!hasChanges ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-4xl mb-2">📝</div>
            <p>No matches found or replacement text is the same</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Before */}
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Before ({originalText.length} characters):
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 max-h-[200px] overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap font-mono break-words">
                  {originalText || "(empty)"}
                </pre>
              </div>
            </div>

            {/* After */}
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-2">
                After ({replacedText.length} characters):
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 max-h-[200px] overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap font-mono break-words">
                  {replacedText || "(empty)"}
                </pre>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {replacementCount}
                </div>
                <div className="text-xs text-muted-foreground">
                  Replacements
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {originalText.length}
                </div>
                <div className="text-xs text-muted-foreground">
                  Original Length
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {replacedText.length}
                </div>
                <div className="text-xs text-muted-foreground">New Length</div>
              </div>
              <div className="text-center">
                <div
                  className={`text-2xl font-bold ${
                    replacedText.length > originalText.length
                      ? "text-red-500"
                      : replacedText.length < originalText.length
                      ? "text-green-500"
                      : "text-gray-500"
                  }`}
                >
                  {replacedText.length > originalText.length ? "+" : ""}
                  {replacedText.length - originalText.length}
                </div>
                <div className="text-xs text-muted-foreground">Length Diff</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
