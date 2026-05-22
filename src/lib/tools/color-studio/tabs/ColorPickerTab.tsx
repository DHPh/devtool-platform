"use client";

import React, { useState } from "react";
import { ColorDisplay, ColorPicker } from "../components";
import { getColorInfo } from "@/lib/utils/color";

interface ColorPickerTabProps {
  sharedColor?: string;
  onSharedColorChange?: (color: string) => void;
}

export function ColorPickerTab({
  sharedColor,
  onSharedColorChange,
}: ColorPickerTabProps = {}) {
  const [selectedColor, setSelectedColor] = useState(sharedColor || "#ff0000");
  const colorInfo = getColorInfo(selectedColor);

  const updateColor = (nextColor: string) => {
    setSelectedColor(nextColor);
    onSharedColorChange?.(nextColor);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Color Picker</h2>
        <p className="text-muted-foreground">
          Adjust RGB, HSL, HSV, or OKLCH with live sRGB and Display-P3 gamut feedback
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Color Picker */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Interactive Picker</h3>
          <ColorPicker
            value={selectedColor}
            onChange={updateColor}
            showPresets={true}
          />
        </div>

        {/* Color Preview */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Color Preview</h3>
          {colorInfo && (
            <ColorDisplay color={colorInfo} onChange={updateColor} />
          )}
        </div>
      </div>
    </div>
  );
}
