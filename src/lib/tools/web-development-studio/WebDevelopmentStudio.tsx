"use client";

import { StudioTabs } from "@/components/studio-tabs";
import { WEB_DEVELOPMENT_STUDIO_MANIFEST } from "./manifest";

export default function WebDevelopmentStudio() {
  return (
    <StudioTabs
      manifest={WEB_DEVELOPMENT_STUDIO_MANIFEST}
      componentProps={{}}
    />
  );
}
