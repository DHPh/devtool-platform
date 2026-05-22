"use client";

import { useState } from "react";
import { StudioTabs } from "@/components/studio-tabs";
import {
  stringToFlags,
  type RegexFlags,
} from "@/lib/utils/regex/regex-tester";
import { REGEX_STUDIO_MANIFEST } from "./manifest";

interface RegexStudioProps {
  initialTab?: string;
  initialPattern?: string;
  initialText?: string;
}

const DEFAULT_FLAGS: RegexFlags = {
  global: true,
  ignoreCase: false,
  multiline: false,
  dotAll: false,
  unicode: false,
  sticky: false,
};

export function RegexStudio({
  initialTab = "tester",
  initialPattern = "",
  initialText = "",
}: RegexStudioProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [sharedPattern, setSharedPattern] = useState(initialPattern);
  const [sharedText, setSharedText] = useState(initialText);
  const [sharedReplacement, setSharedReplacement] = useState("");
  const [sharedFlags, setSharedFlags] = useState<RegexFlags>(DEFAULT_FLAGS);

  const handlePatternSelect = (
    pattern: string,
    meta?: { flags?: string; example?: string; targetTab?: "tester" | "replace" },
  ) => {
    setSharedPattern(pattern);
    if (meta?.flags) {
      setSharedFlags(stringToFlags(meta.flags));
    }
    if (meta?.example && !sharedText.trim()) {
      setSharedText(meta.example);
    }
    setActiveTab(meta?.targetTab ?? "tester");
  };

  return (
    <div className="space-y-6">
      <StudioTabs
        manifest={REGEX_STUDIO_MANIFEST}
        componentProps={{
          pattern: sharedPattern,
          onPatternChange: setSharedPattern,
          text: sharedText,
          onTextChange: setSharedText,
          replacement: sharedReplacement,
          onReplacementChange: setSharedReplacement,
          flags: sharedFlags,
          onFlagsChange: setSharedFlags,
          onPatternSelect: handlePatternSelect,
        }}
        defaultTab={initialTab}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}
