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
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToolIoGuide } from "@/components/tool-io-guide";
import { useActiveTool } from "@/components/active-tool-context";
import type { StudioIconName, StudioManifest } from "@/lib/studio-manifest";
import { cn } from "@/lib/utils";

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

export function getStudioGridColumns(tabCount: number) {
  if (tabCount <= 1) return "grid-cols-1";
  if (tabCount === 2) return "grid-cols-2";
  if (tabCount === 3) return "grid-cols-2 sm:grid-cols-3";
  if (tabCount === 4) return "grid-cols-2 sm:grid-cols-4";
  if (tabCount === 5) return "grid-cols-2 md:grid-cols-5";
  if (tabCount === 6) return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6";
  if (tabCount <= 8) return "grid-cols-2 sm:grid-cols-4";
  if (tabCount <= 10) return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5";
  return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";
}

function writeTabQueryParam(tab: string, addHistoryEntry = false) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (url.searchParams.get("tab") === tab) return;
  url.searchParams.set("tab", tab);
  const updateHistory = addHistoryEntry
    ? window.history.pushState
    : window.history.replaceState;
  updateHistory.call(window.history, window.history.state, "", url.toString());
}

function StudioUrlObserver({
  manifest,
  onUrlTab,
}: {
  manifest: StudioManifest;
  onUrlTab: (tab: string) => void;
}) {
  const searchParams = useSearchParams();
  const routerTab = searchParams?.get("tab") ?? null;
  const lastAppliedSearchRef = useRef<string | null>(null);

  const syncFromLocation = useCallback(
    (force = false) => {
      if (typeof window === "undefined") return;
      const currentSearch = window.location.search;
      if (!force && lastAppliedSearchRef.current === currentSearch) return;
      lastAppliedSearchRef.current = currentSearch;

      const requestedTab = new URLSearchParams(currentSearch).get("tab");
      if (requestedTab && manifest.tabs.some((tab) => tab.id === requestedTab)) {
        onUrlTab(requestedTab);
      }
    },
    [manifest.tabs, onUrlTab],
  );

  useEffect(() => {
    if (routerTab && manifest.tabs.some((tab) => tab.id === routerTab)) {
      lastAppliedSearchRef.current = window.location.search;
      onUrlTab(routerTab);
      return;
    }
    syncFromLocation();
  }, [routerTab, manifest.tabs, onUrlTab, syncFromLocation]);

  useEffect(() => {
    const handlePopState = () => syncFromLocation(true);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [syncFromLocation]);

  return null;
}

export function StudioTabs<Props extends object>({
  manifest,
  componentProps,
  defaultTab = manifest.defaultTab,
  activeTab: controlledTab,
  onTabChange,
  listClassName,
  contentClassName = "mt-5 focus:outline-none",
}: StudioTabsProps<Props>) {
  const [internalTab, setInternalTab] = useState(defaultTab);
  const activeTab = controlledTab ?? internalTab;
  const activeToolCtx = useActiveTool();
  const setActiveSubTool = activeToolCtx?.setActiveSubTool;

  const isControlledRef = useRef(controlledTab !== undefined);
  const onTabChangeRef = useRef(onTabChange);
  const prevControlledTabRef = useRef(controlledTab);
  const pendingUrlTabRef = useRef<string | null>(null);

  useEffect(() => {
    isControlledRef.current = controlledTab !== undefined;
    onTabChangeRef.current = onTabChange;
  }, [controlledTab, onTabChange]);

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

  const applyUrlTab = useCallback((requestedTab: string) => {
    pendingUrlTabRef.current = requestedTab;
    if (!isControlledRef.current) {
      setInternalTab(requestedTab);
    }
    onTabChangeRef.current?.(requestedTab);
  }, []);

  // Sync programmatic controlled tab updates (e.g. RegexLibrary -> Tester) to URL
  useEffect(() => {
    if (
      controlledTab === undefined ||
      prevControlledTabRef.current === controlledTab
    ) {
      return;
    }
    prevControlledTabRef.current = controlledTab;
    if (pendingUrlTabRef.current === controlledTab) {
      pendingUrlTabRef.current = null;
      return;
    }
    pendingUrlTabRef.current = null;
    writeTabQueryParam(controlledTab);
  }, [controlledTab]);

  // Report active sub-tool metadata to parent ToolFrame
  useEffect(() => {
    if (!setActiveSubTool) return;
    const current =
      manifest.tabs.find((tab) => tab.id === activeTab) ?? manifest.tabs[0];
    if (current?.metadata && "id" in current.metadata && current.metadata.id) {
      setActiveSubTool(current.metadata);
    }
    return () => setActiveSubTool(null);
  }, [activeTab, manifest.tabs, setActiveSubTool]);

  const handleTabChange = (tab: string) => {
    pendingUrlTabRef.current = null;
    prevControlledTabRef.current = tab;
    if (controlledTab === undefined) {
      setInternalTab(tab);
    }
    onTabChange?.(tab);
    writeTabQueryParam(tab, true);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <Suspense fallback={null}>
        <StudioUrlObserver manifest={manifest} onUrlTab={applyUrlTab} />
      </Suspense>

      <TabsList
        aria-label={`${manifest.id.replaceAll("-", " ")} tools`}
        className={cn(
          "grid h-auto w-full auto-rows-fr gap-1 p-1",
          getStudioGridColumns(manifest.tabs.length),
          listClassName,
        )}
      >
        {manifest.tabs.map((tab) => {
          const Icon = ICONS[tab.icon];
          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="h-full min-h-11 min-w-0 gap-2 whitespace-normal px-2.5 py-2 text-left text-xs sm:text-sm leading-snug justify-start sm:justify-center"
            >
              <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline line-clamp-2">{tab.label}</span>
              <span className="sm:hidden truncate">{tab.shortLabel}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>

      {manifest.tabs.map((tab) => {
        const TabComponent = components.get(tab.id);
        if (!TabComponent) return null;
        return (
          <TabsContent key={tab.id} value={tab.id} className={contentClassName}>
            <ToolIoGuide
              inputDescription={tab.metadata.inputDescription}
              outputDescription={tab.metadata.outputDescription}
              example={tab.metadata.example}
            />
            <Suspense
              fallback={
                <div
                  role="status"
                  aria-live="polite"
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  Loading…
                </div>
              }
            >
              <TabComponent {...componentProps} />
            </Suspense>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
