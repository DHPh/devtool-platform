"use client";

import { StudioTabs } from "@/components/studio-tabs";
import { WEBSITE_DIAGNOSTICS_STUDIO_MANIFEST } from "./manifest";

export default function WebsiteDiagnosticsStudio() {
  return (
    <StudioTabs
      manifest={WEBSITE_DIAGNOSTICS_STUDIO_MANIFEST}
      componentProps={{}}
      listClassName="grid h-auto w-full grid-cols-2 p-1 md:grid-cols-4 xl:grid-cols-8"
    />
  );
}
