"use client";

import React, { useState } from "react";
import { writeClipboardText } from "@/hooks/use-clipboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Copy, Eye, Palette } from "lucide-react";
import { toast } from "sonner";
import {
  simulateColorBlindness,
  type ColorBlindnessType,
} from "@/lib/utils/color/color-blindness";
import { ColorPicker } from "./ColorPicker";
import { getColorInfo } from "@/lib/utils/color";

const COLOR_BLINDNESS_TYPES: {
  value: ColorBlindnessType;
  label: string;
  description: string;
}[] = [
  {
    value: "protanopia",
    label: "Protanopia",
    description: "No red cones (1% of males)",
  },
  {
    value: "deuteranopia",
    label: "Deuteranopia",
    description: "No green cones (1% of males)",
  },
  {
    value: "tritanopia",
    label: "Tritanopia",
    description: "No blue cones (very rare)",
  },
  {
    value: "protanomaly",
    label: "Protanomaly",
    description: "Reduced red sensitivity (1% of males)",
  },
  {
    value: "deuteranomaly",
    label: "Deuteranomaly",
    description: "Reduced green sensitivity (5% of males)",
  },
  {
    value: "tritanomaly",
    label: "Tritanomaly",
    description: "Reduced blue sensitivity (rare)",
  },
  {
    value: "achromatopsia",
    label: "Achromatopsia",
    description: "Complete color blindness (very rare)",
  },
];

const SAMPLE_COLORS = [
  "#ff0000",
  "#00ff00",
  "#0000ff",
  "#ffff00",
  "#ff00ff",
  "#00ffff",
  "#ff8000",
  "#8000ff",
  "#80ff00",
  "#ff0080",
  "#0080ff",
  "#ff8080",
  "#8080ff",
  "#80ff80",
  "#ffa500",
  "#800080",
  "#008080",
  "#808000",
];

const initialColor = "#ff0000";

export function ColorBlindnessSimulator() {
  const [inputColor, setInputColor] = useState(initialColor);
  const [pickedColor, setPickedColor] = useState(initialColor);
  const [selectedType, setSelectedType] =
    useState<ColorBlindnessType>("deuteranomaly");
  const [showColorPicker, setShowColorPicker] = useState(false);

  const simulateColor = (color: string, type: ColorBlindnessType) => {
    try {
      return simulateColorBlindness(color, type);
    } catch {
      return color; // Return original if simulation fails
    }
  };

  const copySimulatedColor = (color: string, type: ColorBlindnessType) => {
    const simulated = simulateColor(color, type);
    void writeClipboardText(simulated);
    toast.success(`Simulated color (${type}) copied to clipboard`);
  };

  const copyAllSimulations = () => {
    const results = COLOR_BLINDNESS_TYPES.map(
      (type) => `${type.label}: ${simulateColor(inputColor, type.value)}`
    ).join("\n");

    const output = `Original: ${inputColor}\n${results}`;
    void writeClipboardText(output);
    toast.success("All simulations copied to clipboard");
  };

  return (
    <div className="space-y-6">
      {/* Input Color */}
      <Card>
        <CardHeader>
          <CardTitle>Test Color</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={`Edit input color ${inputColor}`}
              className="w-16 h-16 rounded-lg border-2 border-border hover:border-primary transition-colors"
              style={{ backgroundColor: inputColor }}
              onClick={() => setShowColorPicker(!showColorPicker)}
            />
            <div className="flex-1">
              <Input
                type="text"
                value={pickedColor}
                onChange={(e) => {
                  if (getColorInfo(e.target.value)) {
                    setInputColor(e.target.value);
                  }
                  setPickedColor(e.target.value);
                }}
                placeholder="#ff0000"
              />
            </div>
            <Button variant="outline" size="sm" onClick={copyAllSimulations}>
              <Copy className="h-4 w-4 mr-2" />
              Copy All
            </Button>
          </div>

          {showColorPicker && (
            <ColorPicker
              value={inputColor}
              onChange={(value) => {
                setInputColor(value);
                setPickedColor(value);
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Sample Colors Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Quick Test Colors</CardTitle>
            <Badge variant="secondary">{SAMPLE_COLORS.length} colors</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 md:grid-cols-9 gap-2">
            {SAMPLE_COLORS.map((color, index) => (
              <button
                type="button"
                aria-label={`Select color ${color}`}
                key={index}
                className="w-12 h-12 rounded border-2 border-border hover:border-primary transition-colors"
                style={{ backgroundColor: color }}
                onClick={() => {
                  setInputColor(color);
                  setPickedColor(color);
                }}
                title={color}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Simulation Type Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Color Blindness Type</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            This preview applies fixed matrices in linear sRGB. It is an
            approximation for design review, not a diagnostic or an exact
            model of any individual&apos;s vision.
          </p>
          <Select
            value={selectedType}
            onValueChange={(value: ColorBlindnessType) =>
              setSelectedType(value)
            }
          >
            <SelectTrigger aria-label="Color blindness simulation type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COLOR_BLINDNESS_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {type.description}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Simulation Results */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Single Type Simulation */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Selected Type Simulation</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copySimulatedColor(inputColor, selectedType)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-lg font-medium mb-2">
                {
                  COLOR_BLINDNESS_TYPES.find((t) => t.value === selectedType)
                    ?.label
                }
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {
                  COLOR_BLINDNESS_TYPES.find((t) => t.value === selectedType)
                    ?.description
                }
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div
                  className="w-full h-24 rounded-lg border mb-2"
                  style={{ backgroundColor: inputColor }}
                />
                <div className="text-sm">
                  <div className="font-medium">Original</div>
                  <div className="text-muted-foreground font-mono text-xs">
                    {inputColor}
                  </div>
                </div>
              </div>

              <div className="text-center">
                <div
                  className="w-full h-24 rounded-lg border mb-2"
                  style={{
                    backgroundColor: simulateColor(inputColor, selectedType),
                  }}
                />
                <div className="text-sm">
                  <div className="font-medium">Simulated</div>
                  <div className="text-muted-foreground font-mono text-xs">
                    {simulateColor(inputColor, selectedType)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* All Types Overview */}
        <Card>
          <CardHeader>
            <CardTitle>All Types Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: inputColor }}
                  />
                  <div>
                    <div className="font-medium text-sm">Normal Vision</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {inputColor}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void writeClipboardText(inputColor)}
                  className="h-6 w-6 p-0"
                  aria-label={`Copy input color ${inputColor}`}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>

              {COLOR_BLINDNESS_TYPES.map((type) => {
                const simulatedColor = simulateColor(inputColor, type.value);
                return (
                  <div
                    key={type.value}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded border"
                        style={{ backgroundColor: simulatedColor }}
                      />
                      <div>
                        <div className="font-medium text-sm">{type.label}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {simulatedColor}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copySimulatedColor(inputColor, type.value)}
                      className="h-6 w-6 p-0"
                      aria-label={`Copy ${type.label} simulated color`}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Accessibility Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Design Tips
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Don&apos;t rely solely on color to convey information</li>
                <li>• Use patterns, shapes, or text labels as well</li>
                <li>• Use simulations as one review aid, not as proof</li>
                <li>• Check text contrast against WCAG 2.2 thresholds</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Color Selection
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Avoid problematic color combinations</li>
                <li>• Red-green combinations are most problematic</li>
                <li>• Blue-yellow combinations work better</li>
                <li>• Consider using colorblind-friendly palettes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
