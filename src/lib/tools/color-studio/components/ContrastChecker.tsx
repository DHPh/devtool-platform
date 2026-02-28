"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  AlertTriangle,
  CheckCircle,
  Copy,
  Shuffle,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";
import {
  calculateWCAGCompliance,
  type ContrastResult,
} from "@/lib/utils/color/contrast-checker";
import { ColorPicker } from "./ColorPicker";
import { ContrastSuggestions } from "./ContrastSuggestions";
import { getColorInfo } from "@/lib/utils/color";

const initialForegroundColor = "#000000"; // Default black color
const initialBackgroundColor = "#ffffff"; // Default white color

export function ContrastChecker() {
  const [foregroundColor, setForegroundColor] = useState(
    initialForegroundColor
  );
  const [backgroundColor, setBackgroundColor] = useState(
    initialBackgroundColor
  );
  const [pickedForegroundColor, setPickedForegroundColor] = useState(
    initialForegroundColor
  );
  const [pickedBackgroundColor, setPickedBackgroundColor] = useState(
    initialBackgroundColor
  );
  const [showForegroundPicker, setShowForegroundPicker] = useState(false);
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [showForegroundSuggestions, setShowForegroundSuggestions] =
    useState(false);
  const [showBackgroundSuggestions, setShowBackgroundSuggestions] =
    useState(false);

  const contrastResult = calculateWCAGCompliance(
    foregroundColor,
    backgroundColor
  );

  const handleSwapColors = () => {
    const temp = foregroundColor;
    setForegroundColor(backgroundColor);
    setBackgroundColor(temp);

    setPickedForegroundColor(backgroundColor);
    setPickedBackgroundColor(temp);
  };

  const generateRandomPair = () => {
    const colors = [
      "#000000",
      "#ffffff",
      "#ff0000",
      "#00ff00",
      "#0000ff",
      "#ffff00",
      "#ff00ff",
      "#00ffff",
      "#800000",
      "#008000",
      "#000080",
      "#808000",
      "#800080",
      "#008080",
      "#c0c0c0",
      "#808080",
      "#ff8080",
      "#80ff80",
      "#8080ff",
      "#ffff80",
    ];

    const fg = colors[Math.floor(Math.random() * colors.length)];
    const bg = colors[Math.floor(Math.random() * colors.length)];

    setForegroundColor(fg);
    setBackgroundColor(bg);

    setPickedForegroundColor(fg);
    setPickedBackgroundColor(bg);
    toast.success("Random color pair generated!");
  };

  const copyContrastInfo = () => {
    const info = `
Contrast Ratio: ${contrastResult.ratio.toFixed(2)}:1
WCAG 2.2 AA Normal Text: ${contrastResult.details.normalText.aa ? "Pass" : "Fail"}
WCAG 2.2 AA Large Text: ${contrastResult.details.largeText.aa ? "Pass" : "Fail"}
WCAG 2.2 AAA Normal Text: ${contrastResult.details.normalText.aaa ? "Pass" : "Fail"}
WCAG 2.2 AAA Large Text: ${contrastResult.details.largeText.aaa ? "Pass" : "Fail"}
Foreground: ${foregroundColor}
Background: ${backgroundColor}
    `.trim();

    navigator.clipboard.writeText(info);
    toast.success("Contrast information copied to clipboard");
  };

  const handleShowForegroundSuggestions = () => {
    setShowForegroundSuggestions(!showForegroundSuggestions);
    setShowBackgroundSuggestions(false); // Hide the other one
  };

  const handleShowBackgroundSuggestions = () => {
    setShowBackgroundSuggestions(!showBackgroundSuggestions);
    setShowForegroundSuggestions(false); // Hide the other one
  };

  const handleForegroundSuggestionSelect = (color: string) => {
    setForegroundColor(color);
    setPickedForegroundColor(color);
  };

  const handleBackgroundSuggestionSelect = (color: string) => {
    setBackgroundColor(color);
    setPickedBackgroundColor(color);
  };

  const getContrastGrade = (
    result: ContrastResult
  ): { grade: string; color: string; icon: React.ReactNode } => {
    if (result.details.normalText.aaa) {
      return {
        grade: "AAA",
        color: "text-green-600",
        icon: <CheckCircle className="h-4 w-4" />,
      };
    } else if (result.details.normalText.aa) {
      return {
        grade: "AA",
        color: "text-blue-600",
        icon: <CheckCircle className="h-4 w-4" />,
      };
    } else if (result.details.largeText.aa) {
      return {
        grade: "AA Large",
        color: "text-yellow-600",
        icon: <AlertTriangle className="h-4 w-4" />,
      };
    } else {
      return {
        grade: "Fail",
        color: "text-red-600",
        icon: <AlertTriangle className="h-4 w-4" />,
      };
    }
  };

  const contrastGrade = getContrastGrade(contrastResult);

  return (
    <div className="space-y-6">
      {/* Color Inputs */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Foreground Color</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label={`Edit foreground color ${foregroundColor}`}
                className="w-16 h-16 rounded-lg border-2 border-border hover:border-primary transition-colors"
                style={{ backgroundColor: foregroundColor }}
                onClick={() => setShowForegroundPicker(!showForegroundPicker)}
              />
              <div className="flex-1">
                <Input
                  type="text"
                  value={pickedForegroundColor}
                  onChange={(e) => {
                    if (getColorInfo(e.target.value)) {
                      setForegroundColor(e.target.value);
                    }
                    setPickedForegroundColor(e.target.value);
                  }}
                  placeholder="#000000"
                />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShowForegroundSuggestions}
              className="w-full"
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              {showForegroundSuggestions ? "Hide" : "Show"} Contrast Suggestions
            </Button>
            {showForegroundPicker && (
              <ColorPicker
                value={foregroundColor}
                onChange={(value) => {
                  setForegroundColor(value);
                  setPickedForegroundColor(value);
                }}
              />
            )}
            <ContrastSuggestions
              baseColor={backgroundColor}
              isBackground={false}
              isVisible={showForegroundSuggestions}
              onColorSelect={handleForegroundSuggestionSelect}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Background Color</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label={`Edit background color ${backgroundColor}`}
                className="w-16 h-16 rounded-lg border-2 border-border hover:border-primary transition-colors"
                style={{ backgroundColor: backgroundColor }}
                onClick={() => setShowBackgroundPicker(!showBackgroundPicker)}
              />
              <div className="flex-1">
                <Input
                  type="text"
                  value={pickedBackgroundColor}
                  onChange={(e) => {
                    if (getColorInfo(e.target.value)) {
                      setBackgroundColor(e.target.value);
                    }
                    setPickedBackgroundColor(e.target.value);
                  }}
                  placeholder="#ffffff"
                />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShowBackgroundSuggestions}
              className="w-full"
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              {showBackgroundSuggestions ? "Hide" : "Show"} Contrast Suggestions
            </Button>
            {showBackgroundPicker && (
              <ColorPicker
                value={backgroundColor}
                onChange={(value) => {
                  setBackgroundColor(value);
                  setPickedBackgroundColor(value);
                }}
              />
            )}
            <ContrastSuggestions
              baseColor={foregroundColor}
              isBackground={true}
              isVisible={showBackgroundSuggestions}
              onColorSelect={handleBackgroundSuggestionSelect}
            />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleSwapColors}>
              <Eye className="h-4 w-4 mr-2" />
              Swap Colors
            </Button>
            <Button variant="outline" size="sm" onClick={generateRandomPair}>
              <Shuffle className="h-4 w-4 mr-2" />
              Random Pair
            </Button>
            <Button variant="outline" size="sm" onClick={copyContrastInfo}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contrast Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Contrast Analysis</CardTitle>
            <div className="flex items-center gap-2">
              <span className={contrastGrade.color}>{contrastGrade.icon}</span>
              <Badge
                variant={
                  contrastGrade.grade === "Fail" ? "destructive" : "default"
                }
              >
                {contrastGrade.grade}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Contrast Ratio */}
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">
              {contrastResult.ratio.toFixed(2)}:1
            </div>
            <p className="text-muted-foreground">Contrast Ratio</p>
          </div>

          {/* WCAG Compliance */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-3">WCAG 2.2 AA</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span>Normal Text (≥4.5:1)</span>
                  <div className="flex items-center gap-2">
                    {contrastResult.details.normalText.aa ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    <Badge
                      variant={
                        contrastResult.details.normalText.aa
                          ? "default"
                          : "destructive"
                      }
                    >
                      {contrastResult.details.normalText.aa ? "Pass" : "Fail"}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span>Large Text (≥3:1)</span>
                  <div className="flex items-center gap-2">
                    {contrastResult.details.largeText.aa ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    <Badge
                      variant={
                        contrastResult.details.largeText.aa
                          ? "default"
                          : "destructive"
                      }
                    >
                      {contrastResult.details.largeText.aa ? "Pass" : "Fail"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">WCAG 2.2 AAA</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span>Normal Text (≥7:1)</span>
                  <div className="flex items-center gap-2">
                    {contrastResult.details.normalText.aaa ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    <Badge
                      variant={
                        contrastResult.details.normalText.aaa
                          ? "default"
                          : "destructive"
                      }
                    >
                      {contrastResult.details.normalText.aaa ? "Pass" : "Fail"}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span>Large Text (≥4.5:1)</span>
                  <div className="flex items-center gap-2">
                    {contrastResult.details.largeText.aaa ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    <Badge
                      variant={
                        contrastResult.details.largeText.aaa
                          ? "default"
                          : "destructive"
                      }
                    >
                      {contrastResult.details.largeText.aaa ? "Pass" : "Fail"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div>
            <h4 className="font-medium mb-3">Preview</h4>
            <div className="space-y-3">
              <div
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: backgroundColor,
                  color: foregroundColor,
                }}
              >
                <p className="text-sm">Normal text example (14px)</p>
                <p className="text-2xl font-normal">
                  Large text example (24px+ regular)
                </p>
                <p className="text-[19px] font-bold">
                  Large bold text example (about 19px+)
                </p>
                <p className="text-xs">
                  Small text that might be harder to read
                </p>
              </div>

              <div
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: foregroundColor,
                  color: backgroundColor,
                }}
              >
                <p className="text-sm">Inverted colors preview</p>
                <p className="text-lg font-medium">
                  Large text with swapped colors
                </p>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {!contrastResult.details.normalText.aa && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">
                    Accessibility Warning
                  </p>
                  <p className="text-yellow-700 mt-1">
                    The current color combination does not meet the WCAG 2.2 AA
                    contrast requirement for normal text. Consider using colors
                    with higher contrast.
                    {contrastResult.ratio < 3 && (
                      <span className="block mt-1">
                        Try increasing the lightness difference between the
                        colors.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
