"use client";

import React, { useState } from "react";
import { writeClipboardText } from "@/hooks/use-clipboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Palette } from "lucide-react";
import { toast } from "sonner";
import {
  generateContrastSuggestions,
  type ContrastSuggestion,
  type ContrastSuggestionRange,
} from "@/lib/utils/color/contrast-suggestions";

interface ContrastSuggestionsProps {
  baseColor: string;
  isBackground: boolean;
  isVisible: boolean;
  onColorSelect: (color: string) => void;
}

export function ContrastSuggestions({
  baseColor,
  isBackground,
  isVisible,
  onColorSelect,
}: ContrastSuggestionsProps) {
  const [activeTab, setActiveTab] = useState<"all" | "aa" | "aaa">("aa");
  const [isExpanded, setIsExpanded] = useState(true);

  const suggestions = React.useMemo<ContrastSuggestionRange | null>(() => {
    if (!isVisible || !baseColor) return null;
    try {
      return generateContrastSuggestions(baseColor, isBackground, 30);
    } catch (error) {
      console.error(error);
      return null;
    }
  }, [baseColor, isBackground, isVisible]);

  const getCurrentSuggestions = (): ContrastSuggestion[] => {
    if (!suggestions) return [];

    switch (activeTab) {
      case "aaa":
        return suggestions.aaaRange;
      case "aa":
        return suggestions.aaRange;
      default:
        return suggestions.suggestions.filter((s) => s.ratio >= 3);
    }
  };

  const handleColorClick = (suggestion: ContrastSuggestion) => {
    onColorSelect(suggestion.hex);
    void writeClipboardText(suggestion.hex);
    toast.success(`Color ${suggestion.hex} copied and applied!`);
  };

  const getContrastLevel = (level: string) => {
    switch (level) {
      case "AAA":
        return {
          label: "AAA",
          variant: "default" as const,
          color: "text-green-600",
        };
      case "AA":
        return {
          label: "AA",
          variant: "secondary" as const,
          color: "text-blue-600",
        };
      case "A":
        return {
          label: "Large text/UI only",
          variant: "outline" as const,
          color: "text-yellow-600",
        };
      default:
        return {
          label: "Fail",
          variant: "destructive" as const,
          color: "text-red-600",
        };
    }
  };

  if (!isVisible) return null;

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {isBackground ? "Background" : "Foreground"} Color Suggestions
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {isExpanded && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-muted-foreground">
              WCAG 2.2 normal-text contrast: AA ≥4.5:1; AAA ≥7:1.
            </p>
            <div className="flex gap-2">
              <Button
              variant={activeTab === "aaa" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("aaa")}
              className="flex items-center gap-1"
            >
                <span className="text-xs">AAA normal text</span>
              </Button>
              <Button
              variant={activeTab === "aa" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("aa")}
              className="flex items-center gap-1"
            >
                <span className="text-xs">AA normal text</span>
              </Button>
              <Button
              variant={activeTab === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("all")}
              className="flex items-center gap-1"
            >
                <span className="text-xs">All (≥3:1)</span>
              </Button>
            </div>
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="space-y-4">
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 lg:grid-cols-16 gap-2">
                {getCurrentSuggestions()
                  .slice(0, 48)
                  .map((suggestion, index) => (
                    <button
                      type="button"
                      key={index}
                      className="group relative cursor-pointer"
                      onClick={() => handleColorClick(suggestion)}
                      aria-label={`Use suggested color ${suggestion.hex}, contrast ${suggestion.ratio.toFixed(2)} to 1, ${suggestion.level}`}
                    >
                      <div
                        className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-all duration-200 hover:scale-110"
                        style={{ backgroundColor: suggestion.hex }}
                        title={`${suggestion.hex} - ${suggestion.ratio.toFixed(
                          2
                        )}:1 - ${suggestion.level}`}
                      />

                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        <div>{suggestion.hex}</div>
                        <div>{suggestion.ratio.toFixed(2)}:1</div>
                        <div
                          className={getContrastLevel(suggestion.level).color}
                        >
                          {getContrastLevel(suggestion.level).label}
                        </div>
                      </div>
                    </button>
                  ))}
              </div>

              {getCurrentSuggestions().length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Palette className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">
                    No colors found that meet the selected WCAG 2.2
                    normal-text contrast target
                  </p>
                  <p className="text-xs mt-1">
                    Try selecting a different base color or lower standard
                  </p>
                </div>
              )}

              {getCurrentSuggestions().length > 0 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{getCurrentSuggestions().length} colors found</span>
                  <span>Click any color to copy and apply</span>
                </div>
              )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
