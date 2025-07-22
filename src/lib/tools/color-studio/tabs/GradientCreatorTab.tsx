"use client";

import React from "react";
import { GradientCreator } from "../components";

export function GradientCreatorTab() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Gradient Creator</h2>
        <p className="text-muted-foreground">
          Create beautiful gradients with visual controls and export code
        </p>
      </div>

      <GradientCreator />
    </div>
  );
}
