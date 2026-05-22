"use client";

import React, { useState } from "react";
import { ColorDisplay, ColorPicker } from "../components";
import { getColorInfo } from "@/lib/utils/color";

interface ColorConverterTabProps {
  sharedColor?: string;
  onSharedColorChange?: (color: string) => void;
}

export function ColorConverterTab({
  sharedColor,
  onSharedColorChange,
}: ColorConverterTabProps = {}) {
  const [selectedColor, setSelectedColor] = useState(sharedColor || "#ff0000");
  const colorInfo = getColorInfo(selectedColor);

  const updateColor = (nextColor: string) => {
    setSelectedColor(nextColor);
    onSharedColorChange?.(nextColor);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Color Converter</h2>
        <p className="text-muted-foreground">
          Convert CSS Color 4 values, inspect alpha and gamut, and copy perceptual or display-ready formats
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Color Picker */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Color Picker</h3>
          <ColorPicker value={selectedColor} onChange={updateColor} />
        </div>

        {/* Color Display */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Color Information</h3>
          {colorInfo && (
            <ColorDisplay color={colorInfo} onChange={updateColor} />
          )}
        </div>
      </div>
    </div>
  );
}
