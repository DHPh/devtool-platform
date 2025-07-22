"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shuffle } from "lucide-react";
import { PaletteDisplay, ColorPicker } from "../components";
import {
  generatePalette,
  PALETTE_TYPES,
  type PaletteType,
} from "@/lib/utils/color/palette-generator";

export function PaletteGeneratorTab() {
  const [baseColor, setBaseColor] = useState("#3b82f6");
  const [paletteType, setPaletteType] = useState<PaletteType>("analogous");
  const [showColorPicker, setShowColorPicker] = useState(false);

  const palette = generatePalette(paletteType, baseColor);

  const generateRandomPalette = () => {
    const colors = [
      "#ff6b6b",
      "#4ecdc4",
      "#45b7d1",
      "#96ceb4",
      "#feca57",
      "#ff9ff3",
      "#54a0ff",
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomType =
      PALETTE_TYPES[Math.floor(Math.random() * PALETTE_TYPES.length)];

    setBaseColor(randomColor);
    setPaletteType(randomType.id);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Palette Generator</h2>
        <p className="text-muted-foreground">
          Generate beautiful color palettes using color theory principles
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Palette Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Base Color</label>
              <div className="flex items-center gap-3">
                <button
                  className="w-12 h-12 rounded border-2 border-border hover:border-primary transition-colors"
                  style={{ backgroundColor: baseColor }}
                  onClick={() => setShowColorPicker(!showColorPicker)}
                />
                <div className="flex-1">
                  <input
                    type="text"
                    value={baseColor}
                    onChange={(e) => setBaseColor(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Palette Type</label>
              <Select
                value={paletteType}
                onValueChange={(value: PaletteType) => setPaletteType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PALETTE_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div>
                        <div className="font-medium">{type.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {type.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={generateRandomPalette}>
              <Shuffle className="h-4 w-4 mr-2" />
              Random Palette
            </Button>
          </div>

          {showColorPicker && (
            <div className="mt-4">
              <ColorPicker value={baseColor} onChange={setBaseColor} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Palette */}
      <PaletteDisplay palette={palette} onColorSelect={setBaseColor} />
    </div>
  );
}
