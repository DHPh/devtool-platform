"use client";

import {
  Accessibility,
  Activity,
  Archive,
  BookOpen,
  CheckCircle,
  Contrast,
  Copy,
  Download,
  Eye,
  File,
  FileCode,
  FileText,
  FolderOpen,
  GitCompare,
  Globe,
  Hash,
  Image,
  Key,
  Layers,
  Link,
  MapPin,
  Palette,
  Pipette,
  RefreshCw,
  Replace,
  Search,
  Shield,
  TestTube,
  Wifi,
  Wrench,
  Zap,
} from "lucide-react";
import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
} from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { StudioIconName, StudioManifest } from "@/lib/studio-manifest";

const ICONS = {
  Accessibility,
  Activity,
  Archive,
  BookOpen,
  CheckCircle,
  Contrast,
  Copy,
  Download,
  Eye,
  File,
  FileCode,
  FileText,
  FolderOpen,
  GitCompare,
  Globe,
  Hash,
  Image,
  Key,
  Layers,
  Link,
  MapPin,
  Palette,
  Pipette,
  RefreshCw,
  Replace,
  Search,
  Shield,
  TestTube,
  Wifi,
  Wrench,
  Zap,
} satisfies Record<StudioIconName, ComponentType<{ className?: string }>>;

interface StudioTabsProps<Props extends object> {
  manifest: StudioManifest;
  componentProps: Props;
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  listClassName?: string;
  contentClassName?: string;
}

export function StudioTabs<Props extends object>({
  manifest,
  componentProps,
  defaultTab = manifest.defaultTab,
  activeTab: controlledTab,
  onTabChange,
  listClassName,
  contentClassName = "mt-8 focus:outline-none",
}: StudioTabsProps<Props>) {
  const [internalTab, setInternalTab] = useState(defaultTab);
  const activeTab = controlledTab ?? internalTab;
  const components = useMemo(
    () =>
      new Map(
        manifest.tabs.map((tab) => [
          tab.id,
          lazy(async () => {
            const loaded = await tab.loadComponent();
            return { default: loaded.default as ComponentType<Props> };
          }),
        ]),
      ),
    [manifest],
  );

  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get("tab");
    if (requestedTab && manifest.tabs.some((tab) => tab.id === requestedTab)) {
      // The query string is external state and is available only after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (controlledTab === undefined) setInternalTab(requestedTab);
      onTabChange?.(requestedTab);
    }
  }, [controlledTab, manifest, onTabChange]);

  const handleTabChange = (tab: string) => {
    if (controlledTab === undefined) setInternalTab(tab);
    onTabChange?.(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url.toString());
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className={listClassName}>
        {manifest.tabs.map((tab) => {
          const Icon = ICONS[tab.icon];
          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex flex-col items-center gap-2 px-2 py-3 text-xs"
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>

      {manifest.tabs.map((tab) => {
        const TabComponent = components.get(tab.id);
        if (!TabComponent) return null;
        return (
          <TabsContent key={tab.id} value={tab.id} className={contentClassName}>
            <Suspense fallback={<div className="py-8 text-center">Loading…</div>}>
              <TabComponent {...componentProps} />
            </Suspense>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
