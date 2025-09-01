"use client";

import React, { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, RefreshCw, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import {
  generateGradientCSS,
  createEvenGradient,
  type Gradient,
  type GradientStop,
} from "@/lib/utils/color/gradient-generator";
import { GradientColorStop } from "../components/GradientColorStop";
import { hexToRgb, rgbToHex } from "@/lib/utils/color";

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
  const gradientRef = useRef<HTMLDivElement>(null);

  const updateGradientStop = (
    index: number,
    updates: Partial<GradientStop>
  ) => {
    const newStops = gradient.stops
      .map((stop, i) => (i === index ? { ...stop, ...updates } : stop))
      .sort((a, b) => a.position - b.position);

    setGradient((prev) => ({ ...prev, stops: newStops }));
  };

  const addColorStop = () => {
    const newPosition =
      gradient.stops.length > 0
        ? Math.min(100, Math.max(...gradient.stops.map((s) => s.position)) + 20)
        : 50;

    const newStops = [
      ...gradient.stops,
      { color: "#000000", position: newPosition },
    ].sort((a, b) => a.position - b.position);

    setGradient((prev) => ({ ...prev, stops: newStops }));
  };

  const removeColorStop = (index: number) => {
    if (gradient.stops.length > 2) {
      const newStops = gradient.stops.filter((_, i) => i !== index);
      setGradient((prev) => ({ ...prev, stops: newStops }));
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(gradient.stops);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setGradient((prev) => ({ ...prev, stops: items }));
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

  // Color interpolation function
  const interpolateColor = useCallback(
    (color1: string, color2: string, ratio: number): string => {
      const rgb1 = hexToRgb(color1);
      const rgb2 = hexToRgb(color2);

      if (!rgb1 || !rgb2) return color1;

      const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * ratio);
      const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * ratio);
      const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * ratio);

      return rgbToHex(r, g, b);
    },
    []
  );

  const interpolateColorAtPosition = useCallback(
    (position: number): string => {
      const sortedStops = [...gradient.stops].sort(
        (a, b) => a.position - b.position
      );

      // If position matches a stop exactly
      const exactMatch = sortedStops.find((stop) => stop.position === position);
      if (exactMatch) {
        return exactMatch.color;
      }

      // Find the two stops to interpolate between
      let leftStop = sortedStops[0];
      let rightStop = sortedStops[sortedStops.length - 1];

      for (let i = 0; i < sortedStops.length - 1; i++) {
        if (
          position >= sortedStops[i].position &&
          position <= sortedStops[i + 1].position
        ) {
          leftStop = sortedStops[i];
          rightStop = sortedStops[i + 1];
          break;
        }
      }

      // If position is outside range, return closest stop
      if (position <= leftStop.position) return leftStop.color;
      if (position >= rightStop.position) return rightStop.color;

      // Interpolate between the two stops
      const ratio =
        (position - leftStop.position) /
        (rightStop.position - leftStop.position);
      return interpolateColor(leftStop.color, rightStop.color, ratio);
    },
    [gradient.stops, interpolateColor]
  );

  const pickColorAtPosition = () => {
    const pickedColor = interpolateColorAtPosition(selectedPosition);

    // Convert hex to RGB and HSL
    const hexColor = pickedColor;
    const rgb = hexToRgb(hexColor);
    if (!rgb) return;

    // Simple HSL conversion
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    const result: ColorPickerResult = {
      hex: hexColor,
      rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      hsl: `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s * 100)}%, ${Math.round(
        hsl.l * 100
      )}%)`,
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
    navigator.clipboard.writeText(color);
    toast.success(`${format} color copied to clipboard!`);
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

  const gradientCSS = generateGradientCSS(gradient);
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
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Gradient Stops</CardTitle>
              <Button variant="outline" size="sm" onClick={addColorStop}>
                <Plus className="h-4 w-4 mr-2" />
                Add Stop
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="color-stops">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-3"
                  >
                    {gradient.stops.map((stop, index) => (
                      <GradientColorStop
                        key={`stop-${index}-${stop.color}-${stop.position}`}
                        stop={stop}
                        index={index}
                        onUpdate={(updates) =>
                          updateGradientStop(index, updates)
                        }
                        onRemove={() => removeColorStop(index)}
                        onColorPick={() => {}} // No additional color picker needed
                        canRemove={gradient.stops.length > 2}
                        defaultColor="#000000"
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </CardContent>
        </Card>

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
