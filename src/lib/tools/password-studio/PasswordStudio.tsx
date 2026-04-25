"use client";

import { StudioTabs } from "@/components/studio-tabs";
import { PASSWORD_STUDIO_MANIFEST } from "./manifest";

interface PasswordStudioProps {
  initialTab?: string;
}

export function PasswordStudio({
  initialTab = "generator",
}: PasswordStudioProps) {
  return (
    <div className="space-y-6">
      <StudioTabs
        manifest={PASSWORD_STUDIO_MANIFEST}
        componentProps={{}}
        defaultTab={initialTab}
      />
    </div>
  );
}
