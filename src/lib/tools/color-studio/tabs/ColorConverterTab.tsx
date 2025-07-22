"use client";

import React, { useState } from "react";
import { ColorDisplay, ColorPicker } from "../components";
import { getColorInfo } from "@/lib/utils/color";

export function ColorConverterTab() {
  const [selectedColor, setSelectedColor] = useState("#ff0000");
  const colorInfo = getColorInfo(selectedColor);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Color Converter</h2>
        <p className="text-muted-foreground">
          Convert colors between different formats and explore color properties
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Color Picker */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Color Picker</h3>
          <ColorPicker value={selectedColor} onChange={setSelectedColor} />
        </div>

        {/* Color Display */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Color Information</h3>
          {colorInfo && (
            <ColorDisplay color={colorInfo} onChange={setSelectedColor} />
          )}
        </div>
      </div>
    </div>
  );
}
