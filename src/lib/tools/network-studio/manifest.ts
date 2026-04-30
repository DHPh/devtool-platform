import { defineStudioManifest } from "@/lib/studio-manifest";

export const NETWORK_STUDIO_MANIFEST = defineStudioManifest(
  "network-studio",
  "network-studio",
  [
    { id: "api-tester", shortLabel: "API", icon: "Zap", loadComponent: () => import("./tabs/UnifiedHttpTesterTab").then((module) => ({ default: module.ApiTesterTab })) },
    { id: "http-client", shortLabel: "HTTP", icon: "Globe", loadComponent: () => import("./tabs/UnifiedHttpTesterTab").then((module) => ({ default: module.HttpClientTab })) },
    { id: "websocket", shortLabel: "WS", icon: "Wifi", loadComponent: () => import("./tabs/WebSocketTesterTab").then((module) => ({ default: module.WebSocketTesterTab })) },
    { id: "dns-lookup", shortLabel: "DNS", icon: "Search", loadComponent: () => import("./tabs/DnsLookupTab").then((module) => ({ default: module.DnsLookupTab })) },
    { id: "ip-info", shortLabel: "IP", icon: "MapPin", loadComponent: () => import("./tabs/IpInfoTab").then((module) => ({ default: module.IpInfoTab })) },
    { id: "port-scanner", shortLabel: "Ports", icon: "Shield", loadComponent: () => import("./tabs/PortScannerTab").then((module) => ({ default: module.PortScannerTab })) },
    { id: "network-monitor", shortLabel: "Monitor", icon: "Activity", loadComponent: () => import("./tabs/NetworkMonitorTab").then((module) => ({ default: module.NetworkMonitorTab })) },
    { id: "url-tester", shortLabel: "URL", icon: "Link", loadComponent: () => import("./tabs/UrlTesterTab").then((module) => ({ default: module.UrlTesterTab })) },
    { id: "on-air-checker", shortLabel: "Status", icon: "CheckCircle", loadComponent: () => import("./tabs/OnAirCheckerTab").then((module) => ({ default: module.OnAirCheckerTab })) },
    { id: "file-link-check", shortLabel: "Files", icon: "File", loadComponent: () => import("./tabs/FileLinkCheckerTab").then((module) => ({ default: module.FileLinkCheckerTab })) },
    // create-tool:tabs
  ],
);
