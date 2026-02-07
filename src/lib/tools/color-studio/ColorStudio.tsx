"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Badge } from "@/components/ui/badge";
import {
  Palette,
  Pipette,
  Layers,
  Zap,
  Eye,
  Contrast,
  Accessibility,
} from "lucide-react";
import {
  ColorConverterTab,
  ColorPickerTab,
  PaletteGeneratorTab,
  GradientCreatorTab,
  GradientColorPickerTab,
  ContrastCheckerTab,
  ColorBlindnessTab,
  AccessibilityPaletteTab,
} from "./tabs";
import { getStudioTabMetadata } from "@/lib/tool-registry";

const STUDIO_TABS = [
  {
    ...getStudioTabMetadata("color-studio", "converter"),
    label: getStudioTabMetadata("color-studio", "converter").name,
    shortLabel: "Converter",
    icon: Palette,
    component: ColorConverterTab,
  },
  {
    ...getStudioTabMetadata("color-studio", "picker"),
    label: getStudioTabMetadata("color-studio", "picker").name,
    shortLabel: "Picker",
    icon: Pipette,
    component: ColorPickerTab,
  },
  {
    ...getStudioTabMetadata("color-studio", "palette"),
    label: getStudioTabMetadata("color-studio", "palette").name,
    shortLabel: "Palette",
    icon: Layers,
    component: PaletteGeneratorTab,
  },
  {
    ...getStudioTabMetadata("color-studio", "gradient"),
    label: getStudioTabMetadata("color-studio", "gradient").name,
    shortLabel: "Gradient",
    icon: Zap,
    component: GradientCreatorTab,
  },
  {
    ...getStudioTabMetadata("color-studio", "gradient-picker"),
    label: getStudioTabMetadata("color-studio", "gradient-picker").name,
    shortLabel: "Picker",
    icon: Pipette,
    component: GradientColorPickerTab,
  },
  {
    ...getStudioTabMetadata("color-studio", "contrast"),
    label: getStudioTabMetadata("color-studio", "contrast").name,
    shortLabel: "Contrast",
    icon: Contrast,
    component: ContrastCheckerTab,
  },
  {
    ...getStudioTabMetadata("color-studio", "colorblind"),
    label: getStudioTabMetadata("color-studio", "colorblind").name,
    shortLabel: "Colorblind",
    icon: Eye,
    component: ColorBlindnessTab,
  },
  {
    ...getStudioTabMetadata("color-studio", "accessibility-palette"),
    label: getStudioTabMetadata("color-studio", "accessibility-palette").name,
    shortLabel: "A11y",
    icon: Accessibility,
    component: AccessibilityPaletteTab,
  },
] as const;

type StudioTab = (typeof STUDIO_TABS)[number]["id"];

export default function ColorStudio() {
  const [activeTab, setActiveTab] = useState<StudioTab>("converter");

  // Handle URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab") as StudioTab;
    if (tab && STUDIO_TABS.some((t) => t.id === tab)) {
      setActiveTab(tab);
    }
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as StudioTab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url.toString());
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        {/* <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Palette className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold">Color Studio</h1>
            <Badge variant="secondary" className="ml-2">
              Professional
            </Badge>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Complete color toolkit with advanced features for designers and
            developers
          </p>
        </div> */}

        {/* Main Content */}
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          {/* Tab Navigation */}
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-8 h-auto p-1">
            {STUDIO_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex flex-col items-center gap-2 py-3 px-2 text-xs"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {/* <span className="sm:hidden">{tab.label.split(" ")[0]}</span> */}
                  <span className="sm:hidden">{tab.shortLabel}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Tab Content */}
          {STUDIO_TABS.map((tab) => {
            const TabComponent = tab.component;
            return (
              <TabsContent
                key={tab.id}
                value={tab.id}
                className="mt-8 focus:outline-none"
              >
                <TabComponent />
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>
            Professional color tools for design and development. Supports HEX,
            RGB, HSL, HSV, and CMYK formats, plus WCAG 2.2 contrast checks.
          </p>
        </div>
      </div>
    </div>
  );
}
