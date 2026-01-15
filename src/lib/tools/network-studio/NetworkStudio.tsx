"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Globe,
  Wifi,
  Search,
  MapPin,
  Shield,
  Activity,
  Link,
  CheckCircle,
  File,
} from "lucide-react";
import {
  UnifiedHttpTesterTab,
  WebSocketTesterTab,
  DnsLookupTab,
  IpInfoTab,
  PortScannerTab,
  NetworkMonitorTab,
  UrlTesterTab,
  OnAirCheckerTab,
  FileLinkCheckerTab,
} from "./tabs";
import { getStudioTabMetadata } from "@/lib/tool-registry";

const STUDIO_TABS = [
  {
    ...getStudioTabMetadata("network-studio", "api-tester"),
    shortLabel: "API",
    icon: Globe,
    component: UnifiedHttpTesterTab,
  },
  {
    ...getStudioTabMetadata("network-studio", "http-client"),
    shortLabel: "HTTP",
    icon: Globe,
    component: UnifiedHttpTesterTab,
  },
  {
    ...getStudioTabMetadata("network-studio", "websocket"),
    shortLabel: "WS",
    icon: Wifi,
    component: WebSocketTesterTab,
  },
  {
    ...getStudioTabMetadata("network-studio", "dns-lookup"),
    shortLabel: "DNS",
    icon: Search,
    component: DnsLookupTab,
  },
  {
    ...getStudioTabMetadata("network-studio", "ip-info"),
    shortLabel: "IP",
    icon: MapPin,
    component: IpInfoTab,
  },
  {
    ...getStudioTabMetadata("network-studio", "port-scanner"),
    shortLabel: "Ports",
    icon: Shield,
    component: PortScannerTab,
  },
  {
    ...getStudioTabMetadata("network-studio", "network-monitor"),
    shortLabel: "Monitor",
    icon: Activity,
    component: NetworkMonitorTab,
  },
  {
    ...getStudioTabMetadata("network-studio", "url-tester"),
    shortLabel: "URL",
    icon: Link,
    component: UrlTesterTab,
  },
  {
    ...getStudioTabMetadata("network-studio", "on-air-checker"),
    shortLabel: "Status",
    icon: CheckCircle,
    component: OnAirCheckerTab,
  },
  {
    ...getStudioTabMetadata("network-studio", "file-link-check"),
    shortLabel: "Files",
    icon: File,
    component: FileLinkCheckerTab,
  },
] as const;

type StudioTab = (typeof STUDIO_TABS)[number]["id"];

export default function NetworkStudio() {
  const [activeTab, setActiveTab] = useState<StudioTab>("api-tester");

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
        {/* Main Content */}
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          {/* Tab Navigation */}
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 h-auto p-1">
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
            Professional network tools for testing, monitoring, and analysis.
            Includes API testing, DNS lookup, port scanning, and connectivity
            monitoring.
          </p>
        </div>
      </div>
    </div>
  );
}
