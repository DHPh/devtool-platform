"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";
import {
  convertCSSColor,
  getColorInfo,
  hslToRgb,
  mapCSSColorToGamut,
  rgbToHex,
  hsvToRgb,
} from "@/lib/utils/color";
import { TermHelp } from "@/components/tool-glossary";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  showPresets?: boolean;
}

const COLOR_PRESETS = [
  "#FF0000",
  "#FF8000",
  "#FFFF00",
  "#80FF00",
  "#00FF00",
  "#00FF80",
  "#00FFFF",
  "#0080FF",
  "#0000FF",
  "#8000FF",
  "#FF00FF",
  "#FF0080",
  "#000000",
  "#404040",
  "#808080",
  "#C0C0C0",
  "#FFFFFF",
  "#8B4513",
  "#FF69B4",
  "#FFA500",
  "#32CD32",
  "#1E90FF",
  "#9932CC",
  "#FF1493",
];

export function ColorPicker({
  value,
  onChange,
  showPresets = true,
}: ColorPickerProps) {
  const [inputState, setInputState] = useState({ source: value, draft: value });
  const inputValue = inputState.source === value ? inputState.draft : value;
  const colorInfo = getColorInfo(value);
  const cssColor = colorInfo?.cssColor;
  const mapped = cssColor ? mapCSSColorToGamut(cssColor) : null;
  const oklch = cssColor ? convertCSSColor(cssColor, "oklch") : null;

  const handleColorChange = useCallback(
    (newColor: string) => {
      if (getColorInfo(newColor)) {
        onChange(newColor);
        setInputState({ source: newColor, draft: newColor });
      }
    },
    [onChange]
  );

  const handleInputChange = (newValue: string) => {
    setInputState({ source: value, draft: newValue });
    if (getColorInfo(newValue)) {
      onChange(newValue);
    }
  };

  const handleHslChange = (property: "h" | "s" | "l", newValue: number) => {
    if (!colorInfo) return;

    const newHsl = { ...colorInfo.hsl, [property]: newValue };
    const rgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    handleColorChange(preserveAlpha(hex));
  };

  const handleRgbChange = (property: "r" | "g" | "b", newValue: number) => {
    if (!colorInfo) return;

    const newRgb = { ...colorInfo.rgb, [property]: newValue };
    const hex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    handleColorChange(preserveAlpha(hex));
  };

  const handleHsvChange = (property: "h" | "s" | "v", newValue: number) => {
    if (!colorInfo) return;

    const newHsv = { ...colorInfo.hsv, [property]: newValue };
    const rgb = hsvToRgb(newHsv.h, newHsv.s, newHsv.v);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    handleColorChange(preserveAlpha(hex));
  };

  const preserveAlpha = (hex: string) => {
    if (!cssColor || cssColor.alpha >= 1) return hex;
    return `${hex}${Math.round(cssColor.alpha * 255).toString(16).padStart(2, "0")}`;
  };

  const handleOklchChange = (property: "l" | "c" | "h", newValue: number) => {
    if (!oklch || !cssColor) return;
    const next = [...oklch] as [number, number, number];
    next[property === "l" ? 0 : property === "c" ? 1 : 2] = property === "l" ? newValue / 100 : newValue;
    handleColorChange(`oklch(${next[0]} ${next[1]} ${next[2]}${cssColor.alpha < 1 ? ` / ${cssColor.alpha}` : ""})`);
  };

  const handleAlphaChange = (newValue: number) => {
    if (!oklch) return;
    handleColorChange(`oklch(${oklch[0]} ${oklch[1]} ${oklch[2]} / ${newValue / 100})`);
  };

  const generateRandomColor = () => {
    const bytes = new Uint8Array(3);
    crypto.getRandomValues(bytes);
    const randomHex = `#${[...bytes].map(value => value.toString(16).padStart(2, "0")).join("")}`;
    handleColorChange(randomHex);
  };

  if (!colorInfo) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Enter a valid color to use the picker
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Color Picker</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={generateRandomColor}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Random
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Color Input */}
        <div className="space-y-2">
          <Label htmlFor="colorInput">Color Value</Label>
          <div className="flex gap-2">
            <div className="relative">
              <div
                className="w-12 h-10 rounded border-2 border-border flex-shrink-0 cursor-pointer hover:border-primary transition-colors"
                style={{ backgroundColor: mapped?.css ?? colorInfo.hex }}
                onClick={() =>
                  document.getElementById("color-picker-native")?.click()
                }
              />
              <input
                id="color-picker-native"
                type="color"
                value={colorInfo.hex.slice(0, 7)}
                onChange={(e) => handleColorChange(preserveAlpha(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <Input
              id="colorInput"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="oklch(62% 0.2 30 / 0.8)"
              className="font-mono"
            />
          </div>
        </div>

        {/* Color Sliders */}
        <div className="flex flex-wrap gap-2" aria-label="Color gamut status">
          <Badge variant={cssColor?.gamut.srgb ? "secondary" : "destructive"}>
            <TermHelp definition="sRGB is the standard web color range. If the color is outside it, this on-screen preview clips channels to the nearest representable sRGB value.">
              sRGB: {cssColor?.gamut.srgb ? "in gamut" : "clipped in preview"}
            </TermHelp>
          </Badge>
          <Badge variant={cssColor?.gamut.displayP3 ? "secondary" : "destructive"}>
            <TermHelp definition="Display-P3 is a wider color range available on compatible displays. “Out of gamut” means P3 cannot reproduce the exact requested color.">
              Display-P3: {cssColor?.gamut.displayP3 ? "in gamut" : "out of gamut"}
            </TermHelp>
          </Badge>
        </div>

        <Tabs defaultValue="hsl" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="hsl">HSL</TabsTrigger>
            <TabsTrigger value="rgb">RGB</TabsTrigger>
            <TabsTrigger value="hsv">HSV</TabsTrigger>
            <TabsTrigger value="oklch">OKLCH</TabsTrigger>
          </TabsList>

          <TabsContent value="hsl" className="space-y-4 mt-4">
            {/* Hue */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Hue</Label>
                <span className="text-sm text-muted-foreground">
                  {colorInfo.hsl.h}°
                </span>
              </div>
              <Slider
                value={[colorInfo.hsl.h]}
                onValueChange={([value]) => handleHslChange("h", value)}
                max={360}
                step={1}
                className="w-full"
              />
            </div>

            {/* Saturation */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Saturation</Label>
                <span className="text-sm text-muted-foreground">
                  {colorInfo.hsl.s}%
                </span>
              </div>
              <Slider
                value={[colorInfo.hsl.s]}
                onValueChange={([value]) => handleHslChange("s", value)}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            {/* Lightness */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Lightness</Label>
                <span className="text-sm text-muted-foreground">
                  {colorInfo.hsl.l}%
                </span>
              </div>
              <Slider
                value={[colorInfo.hsl.l]}
                onValueChange={([value]) => handleHslChange("l", value)}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          </TabsContent>

          <TabsContent value="rgb" className="space-y-4 mt-4">
            {/* Red */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Red</Label>
                <span className="text-sm text-muted-foreground">
                  {colorInfo.rgb.r}
                </span>
              </div>
              <Slider
                value={[colorInfo.rgb.r]}
                onValueChange={([value]) => handleRgbChange("r", value)}
                max={255}
                step={1}
                className="w-full"
              />
            </div>

            {/* Green */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Green</Label>
                <span className="text-sm text-muted-foreground">
                  {colorInfo.rgb.g}
                </span>
              </div>
              <Slider
                value={[colorInfo.rgb.g]}
                onValueChange={([value]) => handleRgbChange("g", value)}
                max={255}
                step={1}
                className="w-full"
              />
            </div>

            {/* Blue */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Blue</Label>
                <span className="text-sm text-muted-foreground">
                  {colorInfo.rgb.b}
                </span>
              </div>
              <Slider
                value={[colorInfo.rgb.b]}
                onValueChange={([value]) => handleRgbChange("b", value)}
                max={255}
                step={1}
                className="w-full"
              />
            </div>
          </TabsContent>

          <TabsContent value="hsv" className="space-y-4 mt-4">
            {/* Hue */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Hue</Label>
                <span className="text-sm text-muted-foreground">
                  {colorInfo.hsv.h}°
                </span>
              </div>
              <Slider
                value={[colorInfo.hsv.h]}
                onValueChange={([value]) => handleHsvChange("h", value)}
                max={360}
                step={1}
                className="w-full"
              />
            </div>

            {/* Saturation */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Saturation</Label>
                <span className="text-sm text-muted-foreground">
                  {colorInfo.hsv.s}%
                </span>
              </div>
              <Slider
                value={[colorInfo.hsv.s]}
                onValueChange={([value]) => handleHsvChange("s", value)}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            {/* Value */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Value</Label>
                <span className="text-sm text-muted-foreground">
                  {colorInfo.hsv.v}%
                </span>
              </div>
              <Slider
                value={[colorInfo.hsv.v]}
                onValueChange={([value]) => handleHsvChange("v", value)}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          </TabsContent>

          <TabsContent value="oklch" className="space-y-4 mt-4">
            {oklch && (
              <>
                <ColorSlider label="Lightness" value={oklch[0] * 100} max={100} step={0.1} suffix="%" onChange={value => handleOklchChange("l", value)} />
                <ColorSlider label="Chroma" value={oklch[1]} max={0.5} step={0.001} onChange={value => handleOklchChange("c", value)} />
                <ColorSlider label="Hue" value={oklch[2]} max={360} step={0.1} suffix="°" onChange={value => handleOklchChange("h", value)} />
                <p className="text-xs text-muted-foreground">
                  Chroma boundaries depend on lightness and hue. The gamut badges and clipped preview update as you cross them.
                </p>
              </>
            )}
          </TabsContent>
        </Tabs>

        <ColorSlider label="Alpha" value={(cssColor?.alpha ?? 1) * 100} max={100} step={1} suffix="%" onChange={handleAlphaChange} />

        {/* Color Presets */}
        {showPresets && (
          <div className="space-y-3">
            <Label>Color Presets</Label>
            <div className="grid grid-cols-6 gap-2">
              {COLOR_PRESETS.map((preset, index) => (
                <button
                  type="button"
                  key={index}
                  className="w-8 h-8 rounded border-2 border-border hover:border-primary transition-colors"
                  style={{ backgroundColor: preset }}
                  onClick={() => handleColorChange(preset)}
                  title={preset}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ColorSliderProps {
  label: string;
  value: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}

function ColorSlider({ label, value, max, step, suffix = "", onChange }: ColorSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <Label>{label}</Label>
        <span className="text-sm text-muted-foreground">{Number(value.toFixed(3))}{suffix}</span>
      </div>
      <Slider value={[value]} onValueChange={([next]) => onChange(next)} max={max} step={step} className="w-full" />
    </div>
  );
}
