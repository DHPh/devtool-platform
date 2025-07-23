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

const STUDIO_TABS = [
  {
    id: "http-tester",
    label: "HTTP Tester",
    shortLabel: "HTTP",
    icon: Globe,
    component: UnifiedHttpTesterTab,
    description: "Unified HTTP/API testing tool with header library",
  },
  {
    id: "websocket",
    label: "WebSocket",
    shortLabel: "WS",
    icon: Wifi,
    component: WebSocketTesterTab,
    description: "WebSocket connection tester",
  },
  {
    id: "dns-lookup",
    label: "DNS Lookup",
    shortLabel: "DNS",
    icon: Search,
    component: DnsLookupTab,
    description: "DNS record lookup",
  },
  {
    id: "ip-info",
    label: "IP Info",
    shortLabel: "IP",
    icon: MapPin,
    component: IpInfoTab,
    description: "IP address information",
  },
  {
    id: "port-scanner",
    label: "Port Scanner",
    shortLabel: "Ports",
    icon: Shield,
    component: PortScannerTab,
    description: "Network port scanner",
  },
  {
    id: "network-monitor",
    label: "Network Monitor",
    shortLabel: "Monitor",
    icon: Activity,
    component: NetworkMonitorTab,
    description: "Network performance monitor",
  },
  {
    id: "url-tester",
    label: "URL Tester",
    shortLabel: "URL",
    icon: Link,
    component: UrlTesterTab,
    description: "Check URL response headers",
  },
  {
    id: "on-air-checker",
    label: "On Air Checker",
    shortLabel: "Status",
    icon: CheckCircle,
    component: OnAirCheckerTab,
    description: "Ping web services",
  },
  {
    id: "file-link-check",
    label: "File Link Check",
    shortLabel: "Files",
    icon: File,
    component: FileLinkCheckerTab,
    description: "Check file links without download",
  },
] as const;

type StudioTab = (typeof STUDIO_TABS)[number]["id"];

export default function NetworkStudio() {
  const [activeTab, setActiveTab] = useState<StudioTab>("http-tester");

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
