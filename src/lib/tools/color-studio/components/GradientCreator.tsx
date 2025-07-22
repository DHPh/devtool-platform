/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
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
import { Plus, Trash2, Copy, Shuffle } from "lucide-react";
import { toast } from "sonner";
import {
  generateGradientCSS,
  createEvenGradient,
  type Gradient,
  type GradientStop,
  type LinearGradient,
  type RadialGradient,
  type ConicGradient,
} from "@/lib/utils/color/gradient-generator";
import { ColorPicker } from "./ColorPicker";

export function GradientCreator() {
  const [gradient, setGradient] = useState<Gradient>(() =>
    createEvenGradient(["#ff0000", "#0000ff"], "linear")
  );
  const [showColorPicker, setShowColorPicker] = useState<number | null>(null);

  const updateGradient = (updates: any) => {
    setGradient((prev) => ({ ...prev, ...updates }));
  };

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

  const randomizeGradient = () => {
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

    setGradient(createEvenGradient(selectedColors, gradient.type));
    toast.success("Random gradient generated!");
  };

  const changeGradientType = (newType: Gradient["type"]) => {
    const stops = gradient.stops;

    switch (newType) {
      case "linear":
        setGradient({
          type: "linear",
          angle: 90,
          stops,
        });
        break;
      case "radial":
        setGradient({
          type: "radial",
          shape: "circle",
          size: "farthest-corner",
          position: { x: 50, y: 50 },
          stops,
        });
        break;
      case "conic":
        setGradient({
          type: "conic",
          angle: 0,
          position: { x: 50, y: 50 },
          stops,
        });
        break;
    }
  };

  const gradientCSS = generateGradientCSS(gradient);

  const copyCss = () => {
    navigator.clipboard.writeText(gradientCSS);
    toast.success("CSS copied to clipboard");
  };

  const generateSwiftUICode = (): string => {
    const colors = gradient.stops
      .map((stop) => `Color(hex: "${stop.color}")`)
      .join(", ");

    switch (gradient.type) {
      case "linear":
        return `LinearGradient(colors: [${colors}], startPoint: .leading, endPoint: .trailing)`;
      case "radial":
        return `RadialGradient(colors: [${colors}], center: .center, startRadius: 0, endRadius: 200)`;
      case "conic":
        return `AngularGradient(colors: [${colors}], center: .center)`;
      default:
        return "";
    }
  };

  const copySwiftUI = () => {
    navigator.clipboard.writeText(generateSwiftUICode());
    toast.success("SwiftUI code copied to clipboard");
  };

  const directionOptions = [
    { value: 0, label: "Top" },
    { value: 45, label: "Top Right" },
    { value: 90, label: "Right" },
    { value: 135, label: "Bottom Right" },
    { value: 180, label: "Bottom" },
    { value: 225, label: "Bottom Left" },
    { value: 270, label: "Left" },
    { value: 315, label: "Top Left" },
  ];

  return (
    <div className="space-y-6">
      {/* Gradient Preview */}
      <Card>
        <CardHeader>
          <div className="flex sm:items-center items-start justify-between sm:flex-row flex-col gap-2">
            <CardTitle>Gradient Preview</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={randomizeGradient}>
                <Shuffle className="h-4 w-4 mr-2" />
                Random
              </Button>
              <Button variant="outline" size="sm" onClick={copyCss}>
                <Copy className="h-4 w-4 mr-2" />
                Copy CSS
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className="w-full h-32 rounded-lg border"
            style={{ background: gradientCSS }}
          />
        </CardContent>
      </Card>

      {/* Gradient Controls */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Type and Direction */}
        <Card>
          <CardHeader>
            <CardTitle>Gradient Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Type</Label>
              <Select value={gradient.type} onValueChange={changeGradientType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="radial">Radial</SelectItem>
                  <SelectItem value="conic">Conic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {gradient.type === "linear" && (
              <div>
                <Label>Direction</Label>
                <Select
                  value={(gradient as LinearGradient).angle.toString()}
                  onValueChange={(value) =>
                    updateGradient({ angle: Number(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {directionOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value.toString()}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="mt-2">
                  <Label>Custom Angle (degrees)</Label>
                  <Input
                    type="number"
                    value={(gradient as LinearGradient).angle}
                    onChange={(e) =>
                      updateGradient({ angle: Number(e.target.value) })
                    }
                    min={0}
                    max={360}
                  />
                </div>
              </div>
            )}

            {gradient.type === "radial" && (
              <div className="space-y-3">
                <div>
                  <Label>Shape</Label>
                  <Select
                    value={(gradient as RadialGradient).shape}
                    onValueChange={(value: "circle" | "ellipse") =>
                      updateGradient({ shape: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="circle">Circle</SelectItem>
                      <SelectItem value="ellipse">Ellipse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Size</Label>
                  <Select
                    value={(gradient as RadialGradient).size}
                    onValueChange={(value: RadialGradient["size"]) =>
                      updateGradient({ size: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="closest-side">Closest Side</SelectItem>
                      <SelectItem value="closest-corner">
                        Closest Corner
                      </SelectItem>
                      <SelectItem value="farthest-side">
                        Farthest Side
                      </SelectItem>
                      <SelectItem value="farthest-corner">
                        Farthest Corner
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {gradient.type === "conic" && (
              <div>
                <Label>Start Angle (degrees)</Label>
                <Input
                  type="number"
                  value={(gradient as ConicGradient).angle}
                  onChange={(e) =>
                    updateGradient({ angle: Number(e.target.value) })
                  }
                  min={0}
                  max={360}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Color Stops */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Color Stops</CardTitle>
              <Button variant="outline" size="sm" onClick={addColorStop}>
                <Plus className="h-4 w-4 mr-2" />
                Add Stop
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {gradient.stops.map((stop, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                >
                  <button
                    className="w-8 h-8 rounded border-2 border-border hover:border-primary transition-colors"
                    style={{ backgroundColor: stop.color }}
                    onClick={() =>
                      setShowColorPicker(
                        showColorPicker === index ? null : index
                      )
                    }
                  />
                  <div className="flex-1">
                    <Input
                      type="text"
                      value={stop.color}
                      onChange={(e) =>
                        updateGradientStop(index, { color: e.target.value })
                      }
                      placeholder="#000000"
                      className="h-8"
                    />
                  </div>
                  <div className="w-20">
                    <Input
                      type="number"
                      value={stop.position}
                      onChange={(e) =>
                        updateGradientStop(index, {
                          position: Number(e.target.value),
                        })
                      }
                      min={0}
                      max={100}
                      className="h-8"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">%</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeColorStop(index)}
                    disabled={gradient.stops.length <= 2}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Color Picker Modal */}
      {showColorPicker !== null && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pick Color for Stop {showColorPicker + 1}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowColorPicker(null)}
              >
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ColorPicker
              value={gradient.stops[showColorPicker].color}
              onChange={(color) =>
                updateGradientStop(showColorPicker, { color })
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>CSS</Label>
              <Button variant="outline" size="sm" onClick={copyCss}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <code className="text-sm break-all">{gradientCSS}</code>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>SwiftUI</Label>
              <Button variant="outline" size="sm" onClick={copySwiftUI}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <code className="text-sm break-all">{generateSwiftUICode()}</code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
