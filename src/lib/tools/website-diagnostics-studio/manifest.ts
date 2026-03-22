import { defineStudioManifest } from "@/lib/studio-manifest";

export const WEBSITE_DIAGNOSTICS_STUDIO_MANIFEST = defineStudioManifest(
  "website-diagnostics-studio",
  "website-diagnostics-studio",
  [
    {
      id: "redirect-tracer",
      shortLabel: "Redirects",
      icon: "RefreshCw",
      loadComponent: () =>
        import("./tabs/RedirectTracerTab").then((module) => ({
          default: module.RedirectTracerTab,
        })),
    },
    {
      id: "security-header-analyzer",
      shortLabel: "Headers",
      icon: "Shield",
      loadComponent: () =>
        import("./tabs/SecurityHeaderAnalyzerTab").then((module) => ({
          default: module.SecurityHeaderAnalyzerTab,
        })),
    },
    {
      id: "cors-analyzer",
      shortLabel: "CORS",
      icon: "Globe",
      loadComponent: () =>
        import("./tabs/CorsAnalyzerTab").then((module) => ({
          default: module.CorsAnalyzerTab,
        })),
    },
    {
      id: "robots-inspector",
      shortLabel: "Robots",
      icon: "FileText",
      loadComponent: () =>
        import("./tabs/RobotsInspectorTab").then((module) => ({
          default: module.RobotsInspectorTab,
        })),
    },
    {
      id: "sitemap-validator",
      shortLabel: "Sitemap",
      icon: "CheckCircle",
      loadComponent: () =>
        import("./tabs/SitemapValidatorTab").then((module) => ({
          default: module.SitemapValidatorTab,
        })),
    },
    {
      id: "open-graph-inspector",
      shortLabel: "Open Graph",
      icon: "Eye",
      loadComponent: () =>
        import("./tabs/OpenGraphInspectorTab").then((module) => ({
          default: module.OpenGraphInspectorTab,
        })),
    },
    {
      id: "email-dns-analyzer",
      shortLabel: "Email DNS",
      icon: "Search",
      loadComponent: () =>
        import("./tabs/EmailDnsAnalyzerTab").then((module) => ({
          default: module.EmailDnsAnalyzerTab,
        })),
    },
    {
      id: "dns-propagation-checker",
      shortLabel: "DNS spread",
      icon: "Activity",
      loadComponent: () =>
        import("./tabs/DnsPropagationCheckerTab").then((module) => ({
          default: module.DnsPropagationCheckerTab,
        })),
    },
  ],
);
