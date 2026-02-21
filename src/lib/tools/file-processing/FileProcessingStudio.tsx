"use client";

import { StudioTabs } from "@/components/studio-tabs";
import { FILE_PROCESSING_STUDIO_MANIFEST } from "./manifest";

export default function FileProcessingStudio() {
  return (
    <div className="space-y-6">
      {/* Main Content */}
      <StudioTabs
        manifest={FILE_PROCESSING_STUDIO_MANIFEST}
        componentProps={{}}
        listClassName="grid h-auto w-full grid-cols-2 p-1 md:grid-cols-4 lg:grid-cols-8"
      />

      {/* Footer */}
      <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
        <p>
          Professional file processing tools for image editing, document
          management, and file organization.
        </p>
      </div>
    </div>
  );
}
