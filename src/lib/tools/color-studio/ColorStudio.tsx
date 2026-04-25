"use client";

import { StudioTabs } from "@/components/studio-tabs";
import { COLOR_STUDIO_MANIFEST } from "./manifest";

export default function ColorStudio() {
  return (
    <div className="space-y-6">
      <StudioTabs
        manifest={COLOR_STUDIO_MANIFEST}
        componentProps={{}}
      />
    </div>
  );
}
