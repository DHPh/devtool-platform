"use client";

import { StudioTabs } from "@/components/studio-tabs";
import { NETWORK_STUDIO_MANIFEST } from "./manifest";

export default function NetworkStudio() {
  return (
    <div className="space-y-6">
      <StudioTabs
        manifest={NETWORK_STUDIO_MANIFEST}
        componentProps={{}}
      />
    </div>
  );
}
