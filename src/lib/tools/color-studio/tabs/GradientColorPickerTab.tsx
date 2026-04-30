"use client";

import React, { useState, useCallback, useRef } from "react";
import { copyToClipboard } from "@/hooks/use-clipboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  generateInterpolatedGradientCSS,
  interpolateGradientColorAtPosition,
  createEvenGradient,
  type Gradient,
  type GradientStop,
} from "@/lib/utils/color/gradient-generator";
import { GradientColorStops } from "../components/GradientColorStops";
import { rgbToHex } from "@/lib/utils/color";
import {
  parseInterpolationColor,
  type ColorInterpolationSpace,
  type HueInterpolationMethod,
} from "@/lib/utils/color/color-interpolation";

interface ColorPickerResult {
  hex: string;
  rgb: string;
  hsl: string;
  position: number;
}

export function GradientColorPickerTab() {
  const [gradient, setGradient] = useState<Gradient>(() =>
    createEvenGradient(["#ff0000", "#00ff00", "#0000ff"], "linear")
  );
  const [selectedPosition, setSelectedPosition] = useState(50);
  const [pickedColors, setPickedColors] = useState<ColorPickerResult[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [interpolationSpace, setInterpolationSpace] =
    useState<ColorInterpolationSpace>("srgb");
  const [hueMethod, setHueMethod] =
    useState<HueInterpolationMethod>("shorter");
  const gradientRef = useRef<HTMLDivElement>(null);

  const updateGradientStops = (newStops: GradientStop[]) => {
    setGradient((prev) => ({ ...prev, stops: newStops }));
  };

  const generateRandomGradient = () => {
    const colors = [
      "#ff6b6b",
      "#4ecdc4",
      "#45b7d1",
      "#96ceb4",
      "#feca57",
      "#ff9ff3",
      "#54a0ff",
      "#5f27cd",
      "#00d2d3",
      "#ff9f43",
      "#3742fa",
      "#2f3542",
      "#ff3838",
      "#2ed573",
      "#ffa502",
    ];

    const numStops = Math.floor(Math.random() * 3) + 2; // 2-4 stops
    const selectedColors = [];

    for (let i = 0; i < numStops; i++) {
      selectedColors.push(colors[Math.floor(Math.random() * colors.length)]);
    }

    setGradient(createEvenGradient(selectedColors, "linear"));
    toast.success("Random gradient generated!");
  };

  const interpolateColorAtPosition = useCallback(
    (position: number): string =>
      interpolateGradientColorAtPosition(gradient.stops, position, {
        space: interpolationSpace,
        hue: hueMethod,
      }),
    [gradient.stops, hueMethod, interpolationSpace]
  );

  const pickColorAtPosition = () => {
    const pickedColor = interpolateColorAtPosition(selectedPosition);

    const rgba = parseInterpolationColor(pickedColor);
    if (!rgba) return;
    const rgb = {
      r: Math.round(rgba.r * 255),
      g: Math.round(rgba.g * 255),
      b: Math.round(rgba.b * 255),
    };
    const alphaHex = Math.round(rgba.a * 255)
      .toString(16)
      .padStart(2, "0");
    const hexColor = `${rgbToHex(rgb.r, rgb.g, rgb.b)}${
      rgba.a < 1 ? alphaHex : ""
    }`;

    // Simple HSL conversion
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    const result: ColorPickerResult = {
      hex: hexColor,
      rgb:
        rgba.a < 1
          ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Number(rgba.a.toFixed(4))})`
          : `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      hsl: `${rgba.a < 1 ? "hsla" : "hsl"}(${Math.round(hsl.h)}, ${Math.round(
        hsl.s * 100
      )}%, ${Math.round(hsl.l * 100)}%${
        rgba.a < 1 ? `, ${Number(rgba.a.toFixed(4))}` : ""
      })`,
      position: selectedPosition,
    };

    setPickedColors((prev) => [result, ...prev]);
    toast.success(`Color picked at ${selectedPosition}%: ${hexColor}`);
  };

  const clearPickedColors = () => {
    setPickedColors([]);
    toast.success("Picked colors cleared!");
  };

  const copyColor = (color: string, format: string) => {
    void copyToClipboard(color, `${format} color copied to clipboard!`);
  };

  const removePickedColor = (index: number) => {
    setPickedColors((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle gradient click/drag for position selection
  const handleGradientInteraction = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (!gradientRef.current) return;

    const rect = gradientRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSelectedPosition(Math.round(percentage));
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleGradientInteraction(event);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      handleGradientInteraction(event);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Simple HSL conversion utility
  function rgbToHsl(
    r: number,
    g: number,
    b: number
  ): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0,
      s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return { h: h * 360, s, l };
  }

  const gradientCSS = generateInterpolatedGradientCSS(gradient, {
    space: interpolationSpace,
    hue: hueMethod,
  });
  const pickedColor = interpolateColorAtPosition(selectedPosition);

  return (
    <div className="space-y-6">
      {/* Interactive Gradient Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Interactive Gradient Color Picker</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={generateRandomGradient}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Random Gradient
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Click or drag on the gradient to pick colors at any position
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Interpolation space</Label>
              <Select
                value={interpolationSpace}
                onValueChange={(value: ColorInterpolationSpace) =>
                  setInterpolationSpace(value)
                }
              >
                <SelectTrigger aria-label="Interpolation space">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="srgb">sRGB</SelectItem>
                  <SelectItem value="linear-srgb">Linear sRGB</SelectItem>
                  <SelectItem value="oklab">OKLab</SelectItem>
                  <SelectItem value="oklch">OKLCH</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {interpolationSpace === "oklch" && (
              <div>
                <Label>OKLCH hue path</Label>
                <Select
                  value={hueMethod}
                  onValueChange={(value: HueInterpolationMethod) =>
                    setHueMethod(value)
                  }
                >
                  <SelectTrigger aria-label="OKLCH hue path">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shorter">Shorter</SelectItem>
                    <SelectItem value="longer">Longer</SelectItem>
                    <SelectItem value="increasing">Increasing</SelectItem>
                    <SelectItem value="decreasing">Decreasing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div
            ref={gradientRef}
            className="w-full h-24 rounded-lg border mb-4 relative cursor-crosshair"
            style={{ background: gradientCSS }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Interactive position indicator */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white border border-gray-800 shadow-lg cursor-col-resize hover:w-1 transition-all"
              style={{
                left: `${selectedPosition}%`,
                transform: "translateX(-50%)",
              }}
            />
            {/* Position label */}
            <div
              className="absolute -top-8 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
              style={{
                left: `${selectedPosition}%`,
                transform: "translateX(-50%)",
              }}
            >
              {selectedPosition}%
            </div>
          </div>

          {/* Position Control */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label>Position (%)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={selectedPosition}
                  onChange={(e) =>
                    setSelectedPosition(
                      Math.max(0, Math.min(100, Number(e.target.value)))
                    )
                  }
                  min={0}
                  max={100}
                  className="w-24"
                />
                <Button onClick={pickColorAtPosition}>Pick Color</Button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded border shadow-sm"
                style={{ backgroundColor: pickedColor }}
              />
              <div>
                <div className="text-sm font-mono font-semibold">
                  {pickedColor}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyColor(pickedColor, "HEX")}
                  className="h-6 text-xs"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Gradient Color Stops */}
        <GradientColorStops
          stops={gradient.stops}
          onStopsChange={updateGradientStops}
          defaultColor="#000000"
        />

        {/* Picked Colors History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Picked Colors ({pickedColors.length})</CardTitle>
              {pickedColors.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearPickedColors}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {pickedColors.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <div className="w-16 h-16 mx-auto mb-4 opacity-50">🎨</div>
                <p>Click on the gradient to pick colors</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {pickedColors.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                  >
                    <div
                      className="w-10 h-10 rounded border flex-shrink-0"
                      style={{ backgroundColor: result.hex }}
                    />
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono">{result.hex}</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyColor(result.hex, "HEX")}
                          className="h-6 w-6 p-0"
                          aria-label={`Copy HEX color ${result.hex}`}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono">{result.rgb}</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyColor(result.rgb, "RGB")}
                          className="h-6 w-6 p-0"
                          aria-label={`Copy RGB color ${result.rgb}`}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono">{result.hsl}</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyColor(result.hsl, "HSL")}
                          className="h-6 w-6 p-0"
                          aria-label={`Copy HSL color ${result.hsl}`}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground flex-shrink-0">
                      @{result.position}%
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePickedColor(index)}
                      className="h-8 w-8 p-0"
                      aria-label={`Remove picked color ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
