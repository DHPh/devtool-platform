"use client";

import { StudioTabs } from "@/components/studio-tabs";
import { NETWORK_STUDIO_MANIFEST } from "./manifest";

export default function NetworkStudio() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Main Content */}
        <StudioTabs
          manifest={NETWORK_STUDIO_MANIFEST}
          componentProps={{}}
        />

        {/* Footer */}
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>
            Professional network tools for testing, monitoring, and analysis.
            Includes API testing, DNS lookup, port scanning, and connectivity
            monitoring.
          </p>
        </div>
      </div>
    </div>
  );
}
