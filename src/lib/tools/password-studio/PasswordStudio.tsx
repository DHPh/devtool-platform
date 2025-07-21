"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Shield, Key, Zap } from "lucide-react";
import {
  PasswordGeneratorTab,
  PassphraseGeneratorTab,
  PasswordAnalysisTab,
} from "./tabs";

interface PasswordStudioProps {
  initialTab?: string;
}

const PASSWORD_TABS = [
  {
    id: "generator",
    label: "Password Generator",
    icon: Key,
    description: "Generate secure passwords with customizable options",
  },
  {
    id: "passphrase",
    label: "Passphrase Generator",
    icon: Zap,
    description: "Create memorable passphrases from word lists",
  },
  {
    id: "analysis",
    label: "Password Analysis",
    icon: Shield,
    description: "Analyze password strength and check for breaches",
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
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-blue-500" />
          <h1 className="text-2xl font-bold">Password Studio</h1>
          <Badge variant="secondary">Security Tools</Badge>
        </div>
        <p className="text-muted-foreground">
          Comprehensive password generation, analysis, and security tools
        </p>
      </div>

      {/* Main Content */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b">
              <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-transparent">
                {PASSWORD_TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex flex-col items-center gap-2 p-4 text-sm h-auto data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      <Icon className="h-4 w-4" />
                      <div className="text-center">
                        <div className="font-medium">{tab.label}</div>
                        <div className="text-xs text-muted-foreground hidden sm:block">
                          {tab.description}
                        </div>
                      </div>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            <div className="p-6">
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
        </CardContent>
      </Card>

      {/* Feature Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PASSWORD_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <Card
              key={tab.id}
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                isActive ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Icon
                    className={`h-5 w-5 mt-0.5 ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <div>
                    <h3 className="font-medium">{tab.label}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {tab.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
