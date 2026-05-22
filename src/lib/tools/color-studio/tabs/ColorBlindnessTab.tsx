"use client";

import React from "react";
import { ColorBlindnessSimulator } from "../components";

interface ColorBlindnessTabProps {
  sharedColor?: string;
  onSharedColorChange?: (color: string) => void;
}

export function ColorBlindnessTab({
  sharedColor,
  onSharedColorChange,
}: ColorBlindnessTabProps = {}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Color Blindness Simulator</h2>
        <p className="text-muted-foreground">
          Test how your colors appear to users with different types of color
          blindness
        </p>
      </div>

      <ColorBlindnessSimulator
        sharedColor={sharedColor}
        onSharedColorChange={onSharedColorChange}
      />
    </div>
  );
}
