"use client";

import { useState } from "react";
import { StudioTabs } from "@/components/studio-tabs";
import { COLOR_STUDIO_MANIFEST } from "./manifest";

export default function ColorStudio() {
  const [sharedColor, setSharedColor] = useState("#3b82f6");

  return (
    <div className="space-y-6">
      <StudioTabs
        manifest={COLOR_STUDIO_MANIFEST}
        componentProps={{
          sharedColor,
          onSharedColorChange: setSharedColor,
        }}
      />
    </div>
  );
}
