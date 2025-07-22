"use client";

import React, { useState } from "react";
import { ColorDisplay, ColorPicker } from "../components";
import { getColorInfo } from "@/lib/utils/color";

export function ColorPickerTab() {
  const [selectedColor, setSelectedColor] = useState("#ff0000");
  const colorInfo = getColorInfo(selectedColor);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Color Picker</h2>
        <p className="text-muted-foreground">
          Pick and adjust colors with interactive controls and instant preview
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Color Picker */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Interactive Picker</h3>
          <ColorPicker
            value={selectedColor}
            onChange={setSelectedColor}
            showPresets={true}
          />
        </div>

        {/* Color Preview */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Color Preview</h3>
          {colorInfo && (
            <ColorDisplay color={colorInfo} onChange={setSelectedColor} />
          )}
        </div>
      </div>
    </div>
  );
}
