"use client";

import { StudioTabs } from "@/components/studio-tabs";
import { DEVOPS_CONFIGURATION_STUDIO_MANIFEST } from "./manifest";

export default function DevOpsConfigurationStudio() {
  return (
    <StudioTabs
      manifest={DEVOPS_CONFIGURATION_STUDIO_MANIFEST}
      componentProps={{}}
    />
  );
}
