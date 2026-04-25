"use client";

import { StudioTabs } from "@/components/studio-tabs";
import { FILE_PROCESSING_STUDIO_MANIFEST } from "./manifest";

export default function FileProcessingStudio() {
  return (
    <div className="space-y-6">
      <StudioTabs
        manifest={FILE_PROCESSING_STUDIO_MANIFEST}
        componentProps={{}}
      />
    </div>
  );
}
