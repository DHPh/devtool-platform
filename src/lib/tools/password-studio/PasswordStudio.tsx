"use client";

import { Card } from "@/components/ui/card";
import { StudioTabs } from "@/components/studio-tabs";
import { PASSWORD_STUDIO_MANIFEST } from "./manifest";

interface PasswordStudioProps {
  initialTab?: string;
}

export function PasswordStudio({
  initialTab = "generator",
}: PasswordStudioProps) {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      {/* <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-blue-500" />
          <h1 className="text-2xl font-bold">Password Studio</h1>
          <Badge variant="secondary">Security Tools</Badge>
        </div>
        <p className="text-muted-foreground">
          Comprehensive password generation, analysis, and security tools
        </p>
      </div> */}

      {/* Main Content */}
      <Card className="mmd:border border-none">
        <StudioTabs
          manifest={PASSWORD_STUDIO_MANIFEST}
          componentProps={{}}
          defaultTab={initialTab}
          contentClassName="mt-0 pt-6"
        />
      </Card>
    </div>
  );
}
