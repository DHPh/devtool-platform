"use client";

import { StudioTabs } from "@/components/studio-tabs";
import { WEBSITE_DIAGNOSTICS_STUDIO_MANIFEST } from "./manifest";

export default function WebsiteDiagnosticsStudio() {
  return (
    <StudioTabs
      manifest={WEBSITE_DIAGNOSTICS_STUDIO_MANIFEST}
      componentProps={{}}
    />
  );
}
