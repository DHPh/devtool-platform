"use client";

import { useState } from "react";
import { StudioTabs } from "@/components/studio-tabs";
import { REGEX_STUDIO_MANIFEST } from "./manifest";

interface RegexStudioProps {
  initialTab?: string;
  initialPattern?: string;
  initialText?: string;
}

export function RegexStudio({
  initialTab = "tester",
  initialPattern = "",
  initialText = "",
}: RegexStudioProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [sharedPattern, setSharedPattern] = useState(initialPattern);

  // Handle pattern selection from library
  const handlePatternSelect = (pattern: string) => {
    setSharedPattern(pattern);
    setActiveTab("tester");
  };

  return (
    <div className="space-y-6">
      <StudioTabs
        manifest={REGEX_STUDIO_MANIFEST}
        componentProps={{
          initialPattern: sharedPattern || initialPattern,
          initialText,
          onPatternSelect: handlePatternSelect,
        }}
        defaultTab={initialTab}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}
