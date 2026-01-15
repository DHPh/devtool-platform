"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Badge } from "@/components/ui/badge";
import { Shield, Key, Zap } from "lucide-react";
import {
  PasswordGeneratorTab,
  PassphraseGeneratorTab,
  PasswordAnalysisTab,
} from "./tabs";
import { getStudioTabMetadata } from "@/lib/tool-registry";

interface PasswordStudioProps {
  initialTab?: string;
}

const PASSWORD_TABS = [
  {
    ...getStudioTabMetadata("password-studio", "generator"),
    label: getStudioTabMetadata("password-studio", "generator").name,
    shortLabel: "Generator",
    icon: Key,
  },
  {
    ...getStudioTabMetadata("password-studio", "passphrase"),
    label: getStudioTabMetadata("password-studio", "passphrase").name,
    shortLabel: "Passphrase",
    icon: Zap,
  },
  {
    ...getStudioTabMetadata("password-studio", "analysis"),
    label: getStudioTabMetadata("password-studio", "analysis").name,
    shortLabel: "Analysis",
    icon: Shield,
  },
] as const;

export function PasswordStudio({
  initialTab = "generator",
}: PasswordStudioProps) {
  const [activeTab, setActiveTab] = useState(initialTab);

  // Update URL when tab changes
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", activeTab);
    window.history.replaceState({}, "", url.toString());
  }, [activeTab]);

  // Listen for URL changes
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tabFromUrl = urlParams.get("tab");
      if (tabFromUrl && PASSWORD_TABS.some((tab) => tab.id === tabFromUrl)) {
        setActiveTab(tabFromUrl);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Set initial tab from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabFromUrl = urlParams.get("tab");
    if (tabFromUrl && PASSWORD_TABS.some((tab) => tab.id === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, []);

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
        {/* <CardContent className="p-0"> */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* <div className="border-b"> */}
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 h-auto p-1">
            {PASSWORD_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex flex-col items-center gap-2 p-4 text-sm h-auto"
                >
                  <Icon className="h-4 w-4" />
                  <div className="text-center">
                    <div className="font-medium hidden md:block">
                      {tab.label}
                    </div>
                    <div className="text-xs text-muted-foreground block md:hidden">
                      {tab.shortLabel}
                    </div>
                    <div className="text-xs text-muted-foreground hidden lg:block">
                      {tab.description}
                    </div>
                  </div>
                </TabsTrigger>
              );
            })}
          </TabsList>
          {/* </div> */}

          <div className="pt-6">
            <TabsContent value="generator" className="mt-0">
              <PasswordGeneratorTab />
            </TabsContent>

            <TabsContent value="passphrase" className="mt-0">
              <PassphraseGeneratorTab />
            </TabsContent>

            <TabsContent value="analysis" className="mt-0">
              <PasswordAnalysisTab />
            </TabsContent>
          </div>
        </Tabs>
        {/* </CardContent> */}
      </Card>
    </div>
  );
}
