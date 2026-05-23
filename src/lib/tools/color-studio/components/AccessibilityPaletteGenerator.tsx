"use client";

import React, { useMemo, useState } from "react";
import { copyToClipboard } from "@/hooks/use-clipboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Palette,
  Eye,
  Copy,
  RefreshCw,
  Download,
  CheckCircle,
  AlertTriangle,
  Plus,
  X,
} from "lucide-react";
import { CheckCircleIcon as PhosphorCheckCircle } from "@phosphor-icons/react/CheckCircle";
import { WarningIcon as Warning } from "@phosphor-icons/react/Warning";
import { toast } from "sonner";
import { ColorPicker } from "./ColorPicker";
import {
  generateColorBlindnessPalette,
  type ColorBlindnessPalette,
  type PaletteGenerationOptions,
} from "@/lib/utils/color/color-blindness-palette";
import {
  COLOR_BLINDNESS_TYPES,
  type ColorBlindnessType,
} from "@/lib/utils/color/color-blindness";

interface CustomColor {
  id: string;
  color: string;
}

interface AccessibilityPaletteGeneratorProps {
  sharedColor?: string;
  onSharedColorChange?: (color: string) => void;
}

export function AccessibilityPaletteGenerator({
  sharedColor,
  onSharedColorChange,
}: AccessibilityPaletteGeneratorProps = {}) {
  const [baseColor, setBaseColor] = useState(sharedColor || "#3b82f6");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorBlindnessType, setColorBlindnessType] =
    useState<ColorBlindnessType>("deuteranopia");
  const [colorCount, setColorCount] = useState([5]);
  const [contrastLevel, setContrastLevel] = useState<"AA" | "AAA">("AA");
  const [algorithm, setAlgorithm] = useState<
    "hue-shift" | "lightness-variation" | "saturation-variation" | "complement"
  >("hue-shift");
  const [isGenerating, setIsGenerating] = useState(false);

  // Custom palette management
  const [useCustomPalette, setUseCustomPalette] = useState(false);
  const [customColors, setCustomColors] = useState<CustomColor[]>([
    { id: "1", color: "#3b82f6" },
    { id: "2", color: "#ef4444" },
    { id: "3", color: "#22c55e" },
  ]);
  const [showCustomColorPicker, setShowCustomColorPicker] = useState<
    string | null
  >(null);

  const palette = useMemo<ColorBlindnessPalette | null>(() => {
    try {
      const options: PaletteGenerationOptions = useCustomPalette
        ? {
            colorBlindnessType,
            baseColor: customColors[0]?.color || baseColor,
            colorCount: customColors.length,
            contrastLevel,
            algorithm: "hue-shift",
            customColors: customColors.map((c) => c.color),
          }
        : {
            colorBlindnessType,
            baseColor,
            colorCount: colorCount[0],
            contrastLevel,
            algorithm,
          };
      return generateColorBlindnessPalette(options);
    } catch {
      return null;
    }
  }, [
    useCustomPalette,
    customColors,
    colorBlindnessType,
    baseColor,
    colorCount,
    contrastLevel,
    algorithm,
  ]);

  const generatePalette = () => {
    setIsGenerating(true);
    try {
      if (!palette) {
        toast.error("Failed to generate palette");
      } else {
        toast.success("Accessibility palette updated");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const copyColor = (color: string) => {
    void copyToClipboard(color, `Color ${color} copied to clipboard!`);
  };

  const copyPalette = () => {
    if (!palette) return;

    const paletteData = {
      colors: palette.colors.map((c) => ({
        original: c.original,
        simulated: c.simulated,
      })),
      colorBlindnessType: palette.colorBlindnessType,
      baseColor: palette.baseColor,
    };

    void copyToClipboard(
      JSON.stringify(paletteData, null, 2),
      "Palette data copied to clipboard!",
    );
  };

  const exportPalette = () => {
    if (!palette) return;

    const cssVars = palette.colors
      .map((color, index) => `  --color-${index + 1}: ${color.original};`)
      .join("\n");

    const cssContent = `:root {\n${cssVars}\n}`;

    const blob = new Blob([cssContent], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `accessibility-palette-${colorBlindnessType}.css`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Palette exported as CSS!");
  };

  const addCustomColor = () => {
    const newColor: CustomColor = {
      id: Date.now().toString(),
      color: "#" + Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, "0"),
    };
    setCustomColors([...customColors, newColor]);
  };

  const removeCustomColor = (id: string) => {
    if (customColors.length > 1) {
      setCustomColors(customColors.filter((c) => c.id !== id));
    }
  };

  const updateCustomColor = (id: string, color: string) => {
    setCustomColors(
      customColors.map((c) => (c.id === id ? { ...c, color } : c))
    );
  };

  const getAlgorithmDescription = (alg: string) => {
    switch (alg) {
      case "hue-shift":
        return "Uses safe hue ranges optimized for the selected color blindness type";
      case "lightness-variation":
        return "Varies lightness while maintaining hue and saturation";
      case "saturation-variation":
        return "Varies saturation levels for better distinguishability";
      case "complement":
        return "Uses complementary and triadic color relationships";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Accessibility Palette Generator
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            WCAG 2.2 contrast is checked against black or white text. Color
            separation uses OKLab delta-E after an approximate linear-sRGB
            color-vision simulation; it is a design heuristic, not a WCAG
            success criterion.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Palette Mode Toggle */}
          <div className="space-y-3">
            <Label>Palette Mode</Label>
            <div className="flex gap-2">
              <Button
                onClick={() => setUseCustomPalette(false)}
                variant={!useCustomPalette ? "default" : "outline"}
                size="sm"
              >
                Auto Generate
              </Button>
              <Button
                onClick={() => setUseCustomPalette(true)}
                variant={useCustomPalette ? "default" : "outline"}
                size="sm"
              >
                Custom Colors
              </Button>
            </div>
          </div>

          {useCustomPalette ? (
            /* Custom Palette Section */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Custom Colors ({customColors.length})</Label>
                <Button onClick={addCustomColor} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Color
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {customColors.map((customColor) => (
                  <div key={customColor.id} className="relative group">
                    <button
                      type="button"
                      aria-label={`Edit ${customColor.color}`}
                      className="w-full h-16 rounded-lg border-2 border-border hover:border-primary transition-colors relative"
                      style={{ backgroundColor: customColor.color }}
                      onClick={() =>
                        setShowCustomColorPicker(
                          showCustomColorPicker === customColor.id
                            ? null
                            : customColor.id
                        )
                      }
                    />
                    {customColors.length > 1 && (
                      <button
                        type="button"
                        aria-label={`Remove ${customColor.color}`}
                        onClick={() => removeCustomColor(customColor.id)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                    <div className="text-xs font-mono text-center mt-1">
                      {customColor.color}
                    </div>
                    {showCustomColorPicker === customColor.id && (
                      <div className="absolute top-20 left-0 z-10">
                        <ColorPicker
                          value={customColor.color}
                          onChange={(color) =>
                            updateCustomColor(customColor.id, color)
                          }
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Auto Generation Section */
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Base Color */}
              <div className="space-y-3">
                <Label>Base Color</Label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-label={`Edit base color ${baseColor}`}
                    className="w-12 h-12 rounded-lg border-2 border-border hover:border-primary transition-colors"
                    style={{ backgroundColor: baseColor }}
                    onClick={() => setShowColorPicker(!showColorPicker)}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-mono">{baseColor}</div>
                  </div>
                </div>
                {showColorPicker && (
                  <ColorPicker
                    value={baseColor}
                    onChange={(nextColor) => {
                      setBaseColor(nextColor);
                      onSharedColorChange?.(nextColor);
                    }}
                  />
                )}
              </div>

              {/* Color Count */}
              <div className="space-y-3">
                <Label>Number of Colors: {colorCount[0]}</Label>
                <Slider
                  value={colorCount}
                  onValueChange={setColorCount}
                  min={3}
                  max={12}
                  step={1}
                />
              </div>

              {/* Algorithm */}
              <div className="space-y-3">
                <Label>Generation Algorithm</Label>
                <Select
                  value={algorithm}
                  onValueChange={(
                    value:
                      | "hue-shift"
                      | "lightness-variation"
                      | "saturation-variation"
                      | "complement"
                  ) => setAlgorithm(value)}
                >
                  <SelectTrigger aria-label="Palette generation algorithm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hue-shift">Safe Hue Ranges</SelectItem>
                    <SelectItem value="lightness-variation">
                      Lightness Variation
                    </SelectItem>
                    <SelectItem value="saturation-variation">
                      Saturation Variation
                    </SelectItem>
                    <SelectItem value="complement">Complementary</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {getAlgorithmDescription(algorithm)}
                </p>
              </div>
            </div>
          )}

          {/* Common Settings */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t">
            {/* Color Blindness Type */}
            <div className="space-y-3">
              <Label>Color Blindness Type</Label>
              <Select
                value={colorBlindnessType}
                onValueChange={(value: ColorBlindnessType) =>
                  setColorBlindnessType(value)
                }
              >
                <SelectTrigger aria-label="Color blindness type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(COLOR_BLINDNESS_TYPES).map((type) => (
                    <SelectItem key={type.type} value={type.type}>
                      <div className="flex flex-col">
                        <span>{type.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {type.affectedPopulation}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Contrast Level */}
            <div className="space-y-3">
              <Label>Contrast Level</Label>
              <Select
                value={contrastLevel}
                onValueChange={(value: "AA" | "AAA") => setContrastLevel(value)}
              >
                <SelectTrigger aria-label="Contrast level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AA">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">AA</Badge>
                      <span>Good (4.5:1)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="AAA">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">AAA</Badge>
                      <span>Best (7:1)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Label>Actions</Label>
              <div className="flex gap-2">
                <Button
                  onClick={generatePalette}
                  disabled={isGenerating}
                  size="sm"
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${
                      isGenerating ? "animate-spin" : ""
                    }`}
                  />
                  Generate
                </Button>
                <Button
                  onClick={copyPalette}
                  variant="outline"
                  size="sm"
                  disabled={!palette}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button
                  onClick={exportPalette}
                  variant="outline"
                  size="sm"
                  disabled={!palette}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Palette Results */}
      {palette && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Original Palette */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Original Colors
                </CardTitle>
                <div className="flex items-center gap-2">
                  {palette.isAccessible ? (
                    <Badge
                      variant="default"
                      className="flex items-center gap-1"
                    >
                      <CheckCircle className="h-3 w-3" />
                      Accessible
                    </Badge>
                  ) : (
                    <Badge
                      variant="destructive"
                      className="flex items-center gap-1"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      Needs Improvement
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {palette.colors.map((color, index) => (
                  <div key={index} className="space-y-2">
                    <div
                      className="w-full h-20 rounded-lg border cursor-pointer hover:scale-105 transition-transform"
                      style={{ backgroundColor: color.original }}
                      onClick={() => copyColor(color.original)}
                      title={`Click to copy ${color.original}`}
                    />
                    <div className="text-center">
                      <div className="text-xs font-mono">{color.original}</div>
                      {color.contrastRatio && (
                        <div className="text-xs text-muted-foreground">
                          {color.contrastRatio.toFixed(1)}:1
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Simulated Palette */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {COLOR_BLINDNESS_TYPES[colorBlindnessType].name} Simulation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {palette.colors.map((color, index) => (
                  <div key={index} className="space-y-2">
                    <div
                      className="w-full h-20 rounded-lg border cursor-pointer hover:scale-105 transition-transform"
                      style={{ backgroundColor: color.simulated }}
                      onClick={() => copyColor(color.simulated)}
                      title={`Click to copy ${color.simulated}`}
                    />
                    <div className="text-center">
                      <div className="text-xs font-mono">{color.simulated}</div>
                      <div className="text-xs text-muted-foreground inline-flex items-center justify-center gap-1">
                        {color.isDistinguishable ? (
                          <>
                            <PhosphorCheckCircle
                              aria-hidden="true"
                              className="h-3.5 w-3.5 text-status-ok"
                            />
                            <span>Clear</span>
                          </>
                        ) : (
                          <>
                            <Warning
                              aria-hidden="true"
                              className="h-3.5 w-3.5 text-status-warn"
                            />
                            <span>Similar</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium mb-1">
                  Accessibility Metrics
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>
                    Average OKLab delta-E:{" "}
                    {palette.averageDistinguishability.toFixed(3)}
                  </div>
                  <div>Colors Generated: {palette.colors.length}</div>
                  <div>
                    WCAG 2.2 text contrast target: {contrastLevel} (
                    {contrastLevel === "AAA" ? "7:1" : "4.5:1"})
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Side-by-side Preview */}
      {palette && (
        <Card>
          <CardHeader>
            <CardTitle>Side-by-side Color Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Color Strip Comparison */}
              <div className="space-y-3">
                <div className="text-sm font-medium">Gradient Preview</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">
                      Normal Vision
                    </div>
                    <div
                      className="h-16 rounded-lg border"
                      style={{
                        background: `linear-gradient(to right, ${palette.colors
                          .map((c) => c.original)
                          .join(", ")})`,
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">
                      {COLOR_BLINDNESS_TYPES[colorBlindnessType].name}{" "}
                      Simulation
                    </div>
                    <div
                      className="h-16 rounded-lg border"
                      style={{
                        background: `linear-gradient(to right, ${palette.colors
                          .map((c) => c.simulated)
                          .join(", ")})`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* UI Elements Preview */}
              <div className="space-y-3">
                <div className="text-sm font-medium">UI Elements Preview</div>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Normal Vision */}
                  <div className="space-y-3">
                    <div className="text-xs text-muted-foreground">
                      Normal Vision
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {palette.colors.slice(0, 3).map((color, index) => (
                        <div
                          key={index}
                          className="p-4 rounded-lg border"
                          style={{ backgroundColor: color.original }}
                        >
                          <div
                            className="font-medium mb-1"
                            style={{
                              color: index % 2 === 0 ? "#ffffff" : "#000000",
                              textShadow:
                                index % 2 === 0
                                  ? "0 1px 2px rgba(0,0,0,0.5)"
                                  : "0 1px 2px rgba(255,255,255,0.5)",
                            }}
                          >
                            Button
                          </div>
                          <div
                            className="text-xs"
                            style={{
                              color: index % 2 === 0 ? "#e5e5e5" : "#333333",
                              textShadow:
                                index % 2 === 0
                                  ? "0 1px 2px rgba(0,0,0,0.3)"
                                  : "0 1px 2px rgba(255,255,255,0.3)",
                            }}
                          >
                            {color.original}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Color Blind Simulation */}
                  <div className="space-y-3">
                    <div className="text-xs text-muted-foreground">
                      {COLOR_BLINDNESS_TYPES[colorBlindnessType].name}{" "}
                      Simulation
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {palette.colors.slice(0, 3).map((color, index) => (
                        <div
                          key={index}
                          className="p-4 rounded-lg border"
                          style={{ backgroundColor: color.simulated }}
                        >
                          <div
                            className="font-medium mb-1"
                            style={{
                              color: index % 2 === 0 ? "#ffffff" : "#000000",
                              textShadow:
                                index % 2 === 0
                                  ? "0 1px 2px rgba(0,0,0,0.5)"
                                  : "0 1px 2px rgba(255,255,255,0.5)",
                            }}
                          >
                            Button
                          </div>
                          <div
                            className="text-xs"
                            style={{
                              color: index % 2 === 0 ? "#e5e5e5" : "#333333",
                              textShadow:
                                index % 2 === 0
                                  ? "0 1px 2px rgba(0,0,0,0.3)"
                                  : "0 1px 2px rgba(255,255,255,0.3)",
                            }}
                          >
                            {color.simulated}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
