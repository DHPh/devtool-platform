"use client";

import { useState } from "react";
import { StudioTabs } from "@/components/studio-tabs";
import { PASSWORD_STUDIO_MANIFEST } from "./manifest";

interface PasswordStudioProps {
  initialTab?: string;
}

export function PasswordStudio({
  initialTab = "generator",
}: PasswordStudioProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [sharedPassword, setSharedPassword] = useState("");

  const handleAnalyzePassword = (password: string) => {
    setSharedPassword(password);
    setActiveTab("analysis");
  };

  return (
    <div className="space-y-6">
      <StudioTabs
        manifest={PASSWORD_STUDIO_MANIFEST}
        componentProps={{
          sharedPassword,
          onAnalyzePassword: handleAnalyzePassword,
        }}
        defaultTab={initialTab}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}
