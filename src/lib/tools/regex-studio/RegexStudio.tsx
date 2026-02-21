"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
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
    // <div className="container mx-auto p-6 max-w-7xl">
      <Card className="sm:p-6 p-0 sm:border border-none">
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
          listClassName="grid w-full grid-cols-3"
          contentClassName="mt-6 space-y-6"
        />
      </Card>
    // </div>
  );
}
