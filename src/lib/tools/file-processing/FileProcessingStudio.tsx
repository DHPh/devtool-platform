"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Image,
  FileText,
  RefreshCw,
  Archive,
  Hash,
  Eye,
  Copy,
  FolderOpen,
} from "lucide-react";
import {
  ImageResizerTab,
  PdfToolsTab,
  FileConverterTab,
  ArchiveManagerTab,
  FileHasherTab,
  MetadataViewerTab,
  DuplicateFinderTab,
  FileOrganizerTab,
} from "./tabs";
import { getStudioTabMetadata } from "@/lib/tool-registry";

const STUDIO_TABS = [
  {
    ...getStudioTabMetadata("file-processing-studio", "image-resizer"),
    label: getStudioTabMetadata("file-processing-studio", "image-resizer").name,
    shortLabel: "Resizer",
    icon: Image,
    component: ImageResizerTab,
  },
  {
    ...getStudioTabMetadata("file-processing-studio", "pdf-tools"),
    label: getStudioTabMetadata("file-processing-studio", "pdf-tools").name,
    shortLabel: "PDF",
    icon: FileText,
    component: PdfToolsTab,
  },
  {
    ...getStudioTabMetadata("file-processing-studio", "file-converter"),
    label: getStudioTabMetadata("file-processing-studio", "file-converter")
      .name,
    shortLabel: "Convert",
    icon: RefreshCw,
    component: FileConverterTab,
  },
  {
    ...getStudioTabMetadata("file-processing-studio", "archive-manager"),
    label: getStudioTabMetadata("file-processing-studio", "archive-manager")
      .name,
    shortLabel: "Archive",
    icon: Archive,
    component: ArchiveManagerTab,
  },
  {
    ...getStudioTabMetadata("file-processing-studio", "file-hasher"),
    label: getStudioTabMetadata("file-processing-studio", "file-hasher").name,
    shortLabel: "Hash",
    icon: Hash,
    component: FileHasherTab,
  },
  {
    ...getStudioTabMetadata("file-processing-studio", "metadata-viewer"),
    label: getStudioTabMetadata("file-processing-studio", "metadata-viewer")
      .name,
    shortLabel: "Metadata",
    icon: Eye,
    component: MetadataViewerTab,
  },
  {
    ...getStudioTabMetadata("file-processing-studio", "duplicate-finder"),
    label: getStudioTabMetadata("file-processing-studio", "duplicate-finder")
      .name,
    shortLabel: "Duplicates",
    icon: Copy,
    component: DuplicateFinderTab,
  },
  {
    ...getStudioTabMetadata("file-processing-studio", "file-organizer"),
    label: getStudioTabMetadata("file-processing-studio", "file-organizer")
      .name,
    shortLabel: "Organize",
    icon: FolderOpen,
    component: FileOrganizerTab,
  },
] as const;

type StudioTab = (typeof STUDIO_TABS)[number]["id"];

export default function FileProcessingStudio() {
  const [activeTab, setActiveTab] = useState<StudioTab>("image-resizer");

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
    <div className="space-y-6">
      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        {/* Tab Navigation */}
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-8 h-auto p-1">
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
          Professional file processing tools for image editing, document
          management, and file organization.
        </p>
      </div>
    </div>
  );
}
