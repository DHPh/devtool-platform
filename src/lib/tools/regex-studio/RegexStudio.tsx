"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TestTube, Replace, BookOpen } from "lucide-react";
import { RegexTesterTab, RegexReplaceTab, RegexLibraryTab } from "./tabs";

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
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [sharedPattern, setSharedPattern] = useState(initialPattern);

  // Update active tab based on URL parameters
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["tester", "replace", "library"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Handle pattern selection from library
  const handlePatternSelect = (pattern: string) => {
    setSharedPattern(pattern);
    setActiveTab("tester");
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "tester");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    // <div className="container mx-auto p-6 max-w-7xl">
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tester" className="flex items-center gap-2">
                <TestTube className="h-4 w-4" />
                Tester
              </TabsTrigger>
              <TabsTrigger value="replace" className="flex items-center gap-2">
                <Replace className="h-4 w-4" />
                Replace
              </TabsTrigger>
              <TabsTrigger value="library" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Library
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="tester" className="space-y-6">
                <RegexTesterTab
                  initialPattern={sharedPattern || initialPattern}
                  initialText={initialText}
                />
              </TabsContent>

              <TabsContent value="replace" className="space-y-6">
                <RegexReplaceTab
                  initialPattern={sharedPattern || initialPattern}
                  initialText={initialText}
                />
              </TabsContent>

              <TabsContent value="library" className="space-y-6">
                <RegexLibraryTab onPatternSelect={handlePatternSelect} />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    // </div>
  );
}
