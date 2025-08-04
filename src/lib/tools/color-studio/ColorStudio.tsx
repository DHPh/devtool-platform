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
  ContrastCheckerTab,
  ColorBlindnessTab,
  AccessibilityPaletteTab,
} from "./tabs";

const STUDIO_TABS = [
  {
    id: "converter",
    label: "Color Converter",
    shortLabel: "Converter",
    icon: Palette,
    component: ColorConverterTab,
    description: "Convert between color formats",
  },
  {
    id: "picker",
    label: "Color Picker",
    shortLabel: "Picker",
    icon: Pipette,
    component: ColorPickerTab,
    description: "Interactive color selection",
  },
  {
    id: "palette",
    label: "Palette Generator",
    shortLabel: "Palette",
    icon: Layers,
    component: PaletteGeneratorTab,
    description: "Generate color harmonies",
  },
  {
    id: "gradient",
    label: "Gradient Creator",
    shortLabel: "Gradient",
    icon: Zap,
    component: GradientCreatorTab,
    description: "Create CSS gradients",
  },
  {
    id: "contrast",
    label: "Contrast Checker",
    shortLabel: "Contrast",
    icon: Contrast,
    component: ContrastCheckerTab,
    description: "Check WCAG compliance",
  },
  {
    id: "colorblind",
    label: "Color Blindness",
    shortLabel: "Colorblind",
    icon: Eye,
    component: ColorBlindnessTab,
    description: "Accessibility simulation",
  },
  {
    id: "accessibility-palette",
    label: "Accessibility Palette",
    shortLabel: "A11y",
    icon: Accessibility,
    component: AccessibilityPaletteTab,
    description: "Generate accessible color palettes",
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
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-7 h-auto p-1">
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
            RGB, HSL, HSV, CMYK formats with WCAG accessibility compliance.
          </p>
        </div>
      </div>
    </div>
  );
}
