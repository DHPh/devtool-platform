"use client";

import React from "react";
import { AccessibilityPaletteGenerator } from "../components";

export function AccessibilityPaletteTab() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Accessibility Palette</h2>
        <p className="text-muted-foreground">
          Generate colorblind-friendly palettes with simulation preview
        </p>
      </div>

      <AccessibilityPaletteGenerator />
    </div>
  );
}
