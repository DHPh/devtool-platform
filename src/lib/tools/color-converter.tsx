"use client";

import { useState } from "react";
import { writeClipboardText } from "@/hooks/use-clipboard";
import { Palette, Copy } from "lucide-react";
import { toast } from "sonner";
import {
  ToolHeader,
  QuickActions,
  ResultCard,
} from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  id: "color-converter",
  name: "Color Converter",
  description: "Convert between HEX, RGB, HSL, and other color formats",
  category: "Converters",
  tags: ["color", "hex", "rgb", "hsl", "converter"],
  path: "/tools/color-converter",
  icon: "🎨",
};

interface ColorValues {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  cmyk: { c: number; m: number; y: number; k: number };
}

export default function ColorConverter() {
  const [colorValues, setColorValues] = useState<ColorValues>({
    hex: "#3b82f6",
    rgb: { r: 59, g: 130, b: 246 },
    hsl: { h: 217, s: 91, l: 60 },
    cmyk: { c: 76, m: 47, y: 0, k: 4 },
  });
  const [hexInput, setHexInput] = useState("#3b82f6");

  const hexToRgb = (
    hex: string
  ): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const rgbToHsl = (
    r: number,
    g: number,
    b: number
  ): { h: number; s: number; l: number } => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let h, s;
    const l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
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
        default:
          h = 0;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  };

  const hslToRgb = (
    h: number,
    s: number,
    l: number
  ): { r: number; g: number; b: number } => {
    h /= 360;
    s /= 100;
    l /= 100;

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  };

  const rgbToCmyk = (
    r: number,
    g: number,
    b: number
  ): { c: number; m: number; y: number; k: number } => {
    const rPercent = r / 255;
    const gPercent = g / 255;
    const bPercent = b / 255;

    const k = 1 - Math.max(rPercent, gPercent, bPercent);
    const c = k === 1 ? 0 : (1 - rPercent - k) / (1 - k);
    const m = k === 1 ? 0 : (1 - gPercent - k) / (1 - k);
    const y = k === 1 ? 0 : (1 - bPercent - k) / (1 - k);

    return {
      c: Math.round(c * 100),
      m: Math.round(m * 100),
      y: Math.round(y * 100),
      k: Math.round(k * 100),
    };
  };

  const updateFromHex = (hex: string) => {
    setHexInput(hex); // Always update the input field
    const rgb = hexToRgb(hex);
    if (rgb) {
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
      setColorValues({ hex, rgb, hsl, cmyk });
    }
  };

  const updateFromRgb = (r: number, g: number, b: number) => {
    const hex = rgbToHex(r, g, b);
    const hsl = rgbToHsl(r, g, b);
    const cmyk = rgbToCmyk(r, g, b);
    setHexInput(hex); // Update hex input when RGB changes
    setColorValues({ hex, rgb: { r, g, b }, hsl, cmyk });
  };

  const updateFromHsl = (h: number, s: number, l: number) => {
    const rgb = hslToRgb(h, s, l);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
    setHexInput(hex); // Update hex input when HSL changes
    setColorValues({ hex, rgb, hsl: { h, s, l }, cmyk });
  };

  const copyColor = async (format: string, value: string) => {
    await writeClipboardText(value);
    toast.success(`${format} value copied to clipboard!`);
  };

  const loadColorPreset = (color: string) => {
    updateFromHex(color);
    toast.success("Color preset loaded!");
  };

  const randomColor = () => {
    const randomHex = "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    updateFromHex(randomHex);
    toast.success("Random color generated!");
  };

  const resetColor = () => {
    updateFromHex("#3b82f6");
  };

  const colorPresets = [
    { name: "Blue", color: "#3b82f6" },
    { name: "Red", color: "#ef4444" },
    { name: "Green", color: "#22c55e" },
    { name: "Purple", color: "#a855f7" },
    { name: "Orange", color: "#f97316" },
    { name: "Pink", color: "#ec4899" },
  ];

  return (
    <div className="space-y-6">
      <ToolHeader
        title="Color Converter"
        description="Convert between different color formats: HEX, RGB, HSL, and CMYK"
        icon={Palette}
      />

      <QuickActions
        actions={[
          {
            id: "random",
            label: "Random Color",
            onClick: randomColor,
            variant: "default" as const,
          },
          {
            id: "reset",
            label: "Reset",
            onClick: resetColor,
            variant: "outline" as const,
          },
          ...colorPresets.map(preset => ({
            id: preset.name.toLowerCase(),
            label: preset.name,
            onClick: () => loadColorPreset(preset.color),
            variant: "outline" as const,
          })),
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Color Preview */}
        <div className="space-y-4">
          <ResultCard
            title="Color Preview"
            description="Visual representation of the current color"
            status="info"
          >
            <div className="space-y-4">
              <div
                className="w-full h-32 rounded-lg border-2 border-gray-200 dark:border-gray-700"
                style={{ backgroundColor: colorValues.hex }}
              />
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{colorValues.hex}</Badge>
                <Badge variant="outline">
                  rgb({colorValues.rgb.r}, {colorValues.rgb.g}, {colorValues.rgb.b})
                </Badge>
              </div>
            </div>
          </ResultCard>
        </div>

        {/* Color Inputs */}
        <div className="space-y-4">
          <ResultCard
            title="Color Input"
            description="Enter color values in different formats"
            status="info"
          >
            <div className="space-y-6">
              {/* HEX */}
              <div className="space-y-2">
                <Label htmlFor="hex">HEX</Label>
                <Input
                  id="hex"
                  type="text"
                  value={hexInput}
                  onChange={(e) => updateFromHex(e.target.value)}
                  placeholder="#3b82f6"
                />
              </div>

              {/* RGB */}
              <div className="space-y-2">
                <Label>RGB</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="255"
                    value={colorValues.rgb.r}
                    onChange={(e) =>
                      updateFromRgb(
                        parseInt(e.target.value) || 0,
                        colorValues.rgb.g,
                        colorValues.rgb.b
                      )
                    }
                    placeholder="R"
                  />
                  <Input
                    type="number"
                    min="0"
                    max="255"
                    value={colorValues.rgb.g}
                    onChange={(e) =>
                      updateFromRgb(
                        colorValues.rgb.r,
                        parseInt(e.target.value) || 0,
                        colorValues.rgb.b
                      )
                    }
                    placeholder="G"
                  />
                  <Input
                    type="number"
                    min="0"
                    max="255"
                    value={colorValues.rgb.b}
                    onChange={(e) =>
                      updateFromRgb(
                        colorValues.rgb.r,
                        colorValues.rgb.g,
                        parseInt(e.target.value) || 0
                      )
                    }
                    placeholder="B"
                  />
                </div>
              </div>

              {/* HSL */}
              <div className="space-y-2">
                <Label>HSL</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="360"
                    value={colorValues.hsl.h}
                    onChange={(e) =>
                      updateFromHsl(
                        parseInt(e.target.value) || 0,
                        colorValues.hsl.s,
                        colorValues.hsl.l
                      )
                    }
                    placeholder="H"
                  />
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={colorValues.hsl.s}
                    onChange={(e) =>
                      updateFromHsl(
                        colorValues.hsl.h,
                        parseInt(e.target.value) || 0,
                        colorValues.hsl.l
                      )
                    }
                    placeholder="S%"
                  />
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={colorValues.hsl.l}
                    onChange={(e) =>
                      updateFromHsl(
                        colorValues.hsl.h,
                        colorValues.hsl.s,
                        parseInt(e.target.value) || 0
                      )
                    }
                    placeholder="L%"
                  />
                </div>
              </div>
            </div>
          </ResultCard>
        </div>
      </div>

      {/* Color Values */}
      <ResultCard
        title="Color Values"
        description="All color format values for the current color"
        status="success"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">HEX</Label>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyColor("HEX", colorValues.hex)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-lg font-mono">{colorValues.hex}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">RGB</Label>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyColor("RGB", `rgb(${colorValues.rgb.r}, ${colorValues.rgb.g}, ${colorValues.rgb.b})`)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-lg font-mono">
              {colorValues.rgb.r}, {colorValues.rgb.g}, {colorValues.rgb.b}
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">HSL</Label>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyColor("HSL", `hsl(${colorValues.hsl.h}, ${colorValues.hsl.s}%, ${colorValues.hsl.l}%)`)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-lg font-mono">
              {colorValues.hsl.h}°, {colorValues.hsl.s}%, {colorValues.hsl.l}%
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">CMYK</Label>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyColor("CMYK", `cmyk(${colorValues.cmyk.c}%, ${colorValues.cmyk.m}%, ${colorValues.cmyk.y}%, ${colorValues.cmyk.k}%)`)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-lg font-mono">
              {colorValues.cmyk.c}%, {colorValues.cmyk.m}%, {colorValues.cmyk.y}%, {colorValues.cmyk.k}%
            </p>
          </div>
        </div>
      </ResultCard>

      {/* Information */}
      <ResultCard
        title="About Color Formats"
        status="info"
        description="Learn about different color representation formats"
      >
        <div className="space-y-4 text-sm text-muted-foreground">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-medium mb-2">Color Formats</p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>HEX:</strong> Hexadecimal notation (#RRGGBB)</li>
                <li><strong>RGB:</strong> Red, Green, Blue (0-255 each)</li>
                <li><strong>HSL:</strong> Hue, Saturation, Lightness</li>
                <li><strong>CMYK:</strong> Cyan, Magenta, Yellow, Black</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Use Cases</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Web design and CSS styling</li>
                <li>Graphic design and branding</li>
                <li>Print media (CMYK)</li>
                <li>Digital art and photography</li>
              </ul>
            </div>
          </div>
          <p className="text-xs bg-muted p-2 rounded">
            <strong>Note:</strong> RGB and HSL are best for digital displays, while CMYK is used for print media.
          </p>
        </div>
      </ResultCard>
    </div>
  );
}
