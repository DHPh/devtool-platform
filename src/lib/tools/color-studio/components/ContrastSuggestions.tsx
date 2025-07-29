"use client";

import React, { useState, useEffect } from "react";
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
  const [suggestions, setSuggestions] =
    useState<ContrastSuggestionRange | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "aa" | "aaa">("aa");
  const [isExpanded, setIsExpanded] = useState(true);
  const [loading, setLoading] = useState(false);

  const generateSuggestions = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = generateContrastSuggestions(baseColor, isBackground, 30);
      setSuggestions(result);
    } catch (error) {
      toast.error("Failed to generate contrast suggestions");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [baseColor, isBackground]);

  useEffect(() => {
    if (isVisible && baseColor) {
      generateSuggestions();
    }
  }, [isVisible, baseColor, generateSuggestions]);

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
    navigator.clipboard.writeText(suggestion.hex);
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
          label: "A",
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
          <div className="flex gap-2 mt-3">
            <Button
              variant={activeTab === "aaa" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("aaa")}
              className="flex items-center gap-1"
            >
              <span className="text-xs">Best</span>
            </Button>
            <Button
              variant={activeTab === "aa" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("aa")}
              className="flex items-center gap-1"
            >
              <span className="text-xs">Good</span>
            </Button>
            <Button
              variant={activeTab === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("all")}
              className="flex items-center gap-1"
            >
              <span className="text-xs">All</span>
            </Button>
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 lg:grid-cols-16 gap-2">
                {getCurrentSuggestions()
                  .slice(0, 48)
                  .map((suggestion, index) => (
                    <div
                      key={index}
                      className="group relative cursor-pointer"
                      onClick={() => handleColorClick(suggestion)}
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
                          {suggestion.level}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {getCurrentSuggestions().length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Palette className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">
                    No colors found that meet {activeTab.toUpperCase()}{" "}
                    accessibility standards
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
          )}
        </CardContent>
      )}
    </Card>
  );
}
