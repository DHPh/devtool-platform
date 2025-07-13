"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface SettingsTab {
  value: string;
  label: string;
  content: React.ReactNode;
}

interface SettingsPanelProps {
  title?: string;
  tabs?: SettingsTab[];
  children?: React.ReactNode;
  defaultTab?: string;
  className?: string;
  collapsible?: boolean;
}

export function SettingsPanel({
  title = "Settings",
  tabs,
  children,
  defaultTab,
  className = "",
  collapsible = false,
}: SettingsPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };

  if (tabs && tabs.length > 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{title}</CardTitle>
            {collapsible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleCollapsed}
                className="h-8 w-8 p-0"
              >
                {isCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        {!isCollapsed && (
          <CardContent>
            <Tabs defaultValue={defaultTab || tabs[0].value} className="w-full">
              <TabsList
                className="grid w-full"
                style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}
              >
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {tabs.map((tab) => (
                <TabsContent
                  key={tab.value}
                  value={tab.value}
                  className="space-y-4 mt-4"
                >
                  {tab.content}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {collapsible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCollapsed}
              className="h-8 w-8 p-0"
            >
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      {!isCollapsed && <CardContent>{children}</CardContent>}
    </Card>
  );
}
