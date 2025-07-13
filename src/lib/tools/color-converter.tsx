"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    setColorValues({ hex, rgb: { r, g, b }, hsl, cmyk });
  };

  const updateFromHsl = (h: number, s: number, l: number) => {
    const rgb = hslToRgb(h, s, l);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
    setColorValues({ hex, rgb, hsl: { h, s, l }, cmyk });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Color Converter</CardTitle>
          <CardDescription>
            Convert between different color formats: HEX, RGB, HSL, and CMYK
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Color Preview */}
            <div className="space-y-4">
              <Label>Color Preview</Label>
              <div
                className="w-full h-32 rounded-lg border-2 border-gray-200 dark:border-gray-700"
                style={{ backgroundColor: colorValues.hex }}
              />
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{colorValues.hex}</Badge>
                <Badge variant="outline">
                  rgb({colorValues.rgb.r}, {colorValues.rgb.g},{" "}
                  {colorValues.rgb.b})
                </Badge>
              </div>
            </div>

            {/* Color Inputs */}
            <div className="space-y-6">
              {/* HEX */}
              <div className="space-y-2">
                <Label htmlFor="hex">HEX</Label>
                <Input
                  id="hex"
                  type="text"
                  value={colorValues.hex}
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
          </div>

          {/* Color Information */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <Label className="text-sm font-medium">HEX</Label>
              <p className="text-lg font-mono">{colorValues.hex}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <Label className="text-sm font-medium">RGB</Label>
              <p className="text-lg font-mono">
                {colorValues.rgb.r}, {colorValues.rgb.g}, {colorValues.rgb.b}
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <Label className="text-sm font-medium">HSL</Label>
              <p className="text-lg font-mono">
                {colorValues.hsl.h}°, {colorValues.hsl.s}%, {colorValues.hsl.l}%
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <Label className="text-sm font-medium">CMYK</Label>
              <p className="text-lg font-mono">
                {colorValues.cmyk.c}%, {colorValues.cmyk.m}%,{" "}
                {colorValues.cmyk.y}%, {colorValues.cmyk.k}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
