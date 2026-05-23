"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, LayoutGrid, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ToolMonogram } from "@/components/ui/tool-badge";
import { getToolById } from "@/lib/tool-registry";
import {
  getAllStudiosWithSubTools,
  getStandaloneTools,
  getStudioShortCode,
  getStudioShortName,
  getToolMonogram,
} from "@/lib/tool-visuals";
import { cn } from "@/lib/utils";

type OpenMenu = "group" | "item" | null;

const emptySubscribe = () => () => {};

function subscribeMobile(callback: () => void) {
  const media = window.matchMedia("(max-width: 639px)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function useIsMobileViewport() {
  return useSyncExternalStore(
    subscribeMobile,
    () => window.matchMedia("(max-width: 639px)").matches,
    () => false,
  );
}

function useHasHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

function BreadcrumbSwitcherInner() {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const router = useRouter();
  const isMobile = useIsMobileViewport();
  const hydrated = useHasHydrated();

  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const [filter, setFilter] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const filterInputRef = useRef<HTMLInputElement | null>(null);

  const studiosWithSubTools = useMemo(() => getAllStudiosWithSubTools(), []);
  const standaloneTools = useMemo(() => getStandaloneTools(), []);

  const slugMatch = pathname.match(/^\/tools\/([^/?#]+)/);
  const activeSlug = slugMatch?.[1] ?? null;
  const routeTool = activeSlug ? getToolById(activeSlug) : undefined;
  const requestedTab = searchParams?.get("tab") ?? null;

  const activeStudioEntry = useMemo(() => {
    if (!routeTool || routeTool.kind !== "studio") return null;
    return (
      studiosWithSubTools.find((entry) => entry.studio.id === routeTool.id) ??
      null
    );
  }, [routeTool, studiosWithSubTools]);

  const activeSubTool = useMemo(() => {
    if (!activeStudioEntry) return null;
    if (requestedTab) {
      const matched = activeStudioEntry.subTools.find(
        (item) => item.tab === requestedTab,
      );
      if (matched) return matched;
    }
    return activeStudioEntry.subTools[0] ?? null;
  }, [activeStudioEntry, requestedTab]);

  const isStandaloneRoute = routeTool?.kind === "standalone";
  const isToolRoute = Boolean(activeStudioEntry || isStandaloneRoute);

  useEffect(() => {
    if (!openMenu) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    };

    const handlePointerDown = (event: MouseEvent) => {
      if (isMobile) return;
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpenMenu(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [openMenu, isMobile]);

  useEffect(() => {
    if (!openMenu) return;
    const timer = setTimeout(() => {
      filterInputRef.current?.focus();
    }, 20);
    return () => clearTimeout(timer);
  }, [openMenu]);

  const toggleMenu = (target: Exclude<OpenMenu, null>) => {
    setFilter("");
    setOpenMenu((prev) => (prev === target ? null : target));
  };

  const navigateTo = (href: string) => {
    setOpenMenu(null);
    setFilter("");
    router.push(href);
  };

  const normalizedFilter = filter.trim().toLowerCase();

  const filteredStudios = useMemo(() => {
    if (!normalizedFilter) return studiosWithSubTools;
    return studiosWithSubTools.filter(
      ({ studio, shortCode, shortName }) =>
        studio.name.toLowerCase().includes(normalizedFilter) ||
        shortName.toLowerCase().includes(normalizedFilter) ||
        shortCode.toLowerCase().includes(normalizedFilter) ||
        studio.description.toLowerCase().includes(normalizedFilter),
    );
  }, [studiosWithSubTools, normalizedFilter]);

  const showStandaloneGroup =
    !normalizedFilter ||
    "standalone utilities".includes(normalizedFilter) ||
    "util".includes(normalizedFilter);

  const filteredItemList = useMemo(() => {
    if (activeStudioEntry) {
      const items = activeStudioEntry.subTools;
      if (!normalizedFilter) return items;
      return items.filter(
        (item) =>
          item.name.toLowerCase().includes(normalizedFilter) ||
          item.description.toLowerCase().includes(normalizedFilter) ||
          getToolMonogram(item).toLowerCase().includes(normalizedFilter) ||
          item.tags.some((tag) => tag.toLowerCase().includes(normalizedFilter)),
      );
    }

    if (!normalizedFilter) return standaloneTools;
    return standaloneTools.filter(
      (item) =>
        item.name.toLowerCase().includes(normalizedFilter) ||
        item.description.toLowerCase().includes(normalizedFilter) ||
        getToolMonogram(item).toLowerCase().includes(normalizedFilter) ||
        item.tags.some((tag) => tag.toLowerCase().includes(normalizedFilter)),
    );
  }, [activeStudioEntry, standaloneTools, normalizedFilter]);

  const groupCode = activeStudioEntry
    ? activeStudioEntry.shortCode
    : isStandaloneRoute
      ? "UTIL"
      : "ALL";

  const groupLabel = activeStudioEntry
    ? activeStudioEntry.shortName
    : isStandaloneRoute
      ? "Standalone"
      : "Studios";

  const groupCount = activeStudioEntry
    ? activeStudioEntry.subTools.length
    : isStandaloneRoute
      ? standaloneTools.length
      : studiosWithSubTools.length;

  const itemLabel = activeSubTool
    ? activeSubTool.name
    : routeTool
      ? routeTool.name
      : "Browse Tools";

  const renderGroupList = (mobileLayout: boolean) => (
    <div className="space-y-3">
      <div
        className={cn(
          "grid gap-1",
          mobileLayout ? "grid-cols-1" : "grid-cols-2",
        )}
      >
        {filteredStudios.map(({ studio, shortCode, shortName, subTools }) => {
          const isActive = activeStudioEntry?.studio.id === studio.id;
          return (
            <button
              key={studio.id}
              type="button"
              onClick={() => navigateTo(studio.path)}
              className={cn(
                "flex items-center justify-between gap-2 rounded-sm px-2.5 text-left transition-colors",
                mobileLayout ? "min-h-[44px] py-2" : "py-2",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground hover:bg-surface-elevated/80",
              )}
            >
              <span className="flex items-center gap-2 min-w-0">
                <ToolMonogram code={shortCode} size="xs" active={isActive} />
                <span className="text-xs font-medium truncate">
                  {mobileLayout ? studio.name : shortName}
                </span>
              </span>
              <span className="text-[11px] font-mono tabular-nums text-muted-foreground shrink-0">
                {subTools.length}
              </span>
            </button>
          );
        })}

        {showStandaloneGroup && (
          <button
            type="button"
            onClick={() =>
              navigateTo(standaloneTools[0]?.path ?? "/tools")
            }
            className={cn(
              "flex items-center justify-between gap-2 rounded-sm px-2.5 text-left transition-colors",
              mobileLayout ? "min-h-[44px] py-2" : "py-2",
              isStandaloneRoute
                ? "bg-accent text-accent-foreground"
                : "text-foreground hover:bg-surface-elevated/80",
            )}
          >
            <span className="flex items-center gap-2 min-w-0">
              <ToolMonogram code="UTIL" size="xs" active={isStandaloneRoute} />
              <span className="text-xs font-medium truncate">
                Standalone Utilities
              </span>
            </span>
            <span className="text-[11px] font-mono tabular-nums text-muted-foreground shrink-0">
              {standaloneTools.length}
            </span>
          </button>
        )}
      </div>

      {filteredStudios.length === 0 && !showStandaloneGroup && (
        <p className="py-6 text-center text-xs text-muted-foreground">
          No matching studios.
        </p>
      )}

      <div className="border-t border-border pt-2 flex items-center justify-between px-1">
        <Link
          href="/tools"
          onClick={() => setOpenMenu(null)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Browse all tools catalog
        </Link>
        <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
          12 studios
        </span>
      </div>
    </div>
  );

  const renderItemList = (mobileLayout: boolean) => (
    <div className="space-y-1">
      <div
        className={cn(
          "grid gap-1",
          mobileLayout ? "grid-cols-1" : "grid-cols-2",
        )}
      >
        {filteredItemList.map((item) => {
          const isActive = activeSubTool
            ? activeSubTool.id === item.id
            : routeTool?.id === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigateTo(item.path)}
              className={cn(
                "flex items-start gap-2.5 rounded-sm px-2.5 text-left transition-colors",
                mobileLayout ? "min-h-[44px] py-2" : "py-2",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground hover:bg-surface-elevated/80",
              )}
            >
              <ToolMonogram
                code={getToolMonogram(item)}
                size="xs"
                active={isActive}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium truncate">{item.name}</div>
                <div className="text-[11px] text-muted-foreground line-clamp-1">
                  {item.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {filteredItemList.length === 0 && (
        <p className="py-6 text-center text-xs text-muted-foreground">
          No matching tools in this group.
        </p>
      )}
    </div>
  );

  const menuTitle =
    openMenu === "group"
      ? "Switch Studio (12 + Standalone)"
      : activeStudioEntry
        ? `${activeStudioEntry.studio.name} (${activeStudioEntry.subTools.length} tools)`
        : `Standalone Tools (${standaloneTools.length})`;

  return (
    <div ref={containerRef} className="relative flex items-center gap-1.5 min-w-0">
      {!isToolRoute ? (
        <div className="flex items-center gap-1 min-w-0">
          <Link
            href="/tools"
            className={cn(
              "hidden sm:inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors",
              pathname === "/tools"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground",
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            All Tools
          </Link>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => toggleMenu("group")}
            aria-expanded={openMenu === "group"}
            aria-haspopup="dialog"
            aria-label="Browse 12 studios"
            className="h-7 gap-1.5 px-2 text-xs font-medium bg-surface-sunken"
          >
            <span className="font-mono text-[11px] text-primary">12</span>
            <span>Studios</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-muted-foreground/60 text-xs select-none" aria-hidden="true">
            /
          </span>

          {/* Studio / Group Switcher */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => toggleMenu("group")}
            aria-expanded={openMenu === "group"}
            aria-haspopup="dialog"
            aria-label={`Switch studio, current: ${
              activeStudioEntry?.studio.name ?? "Standalone Utilities"
            }`}
            className="h-7 gap-1.5 px-2 text-xs bg-surface-sunken shrink-0"
          >
            <span className="font-mono text-[11px] font-semibold text-primary">
              {groupCode}
            </span>
            <span className="hidden sm:inline font-medium">{groupLabel}</span>
            <span className="hidden md:inline font-mono text-[11px] text-muted-foreground tabular-nums">
              ({groupCount})
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </Button>

          <span className="text-muted-foreground/60 text-xs select-none" aria-hidden="true">
            /
          </span>

          {/* Sub-tool / Standalone Tool Switcher */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => toggleMenu("item")}
            aria-expanded={openMenu === "item"}
            aria-haspopup="dialog"
            aria-label={`Switch tool, current: ${itemLabel}`}
            className="h-7 gap-1.5 px-2 text-xs font-semibold border-border-strong min-w-0 max-w-[165px] sm:max-w-[260px]"
          >
            <span className="truncate">{itemLabel}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
          </Button>
        </div>
      )}

      {/* Desktop & Tablet 2-Column Popover */}
      {hydrated && openMenu && !isMobile && (
        <div
          role="dialog"
          aria-label={menuTitle}
          className={cn(
            "absolute left-0 top-9 z-50 rounded-md border border-border-strong bg-popover text-popover-foreground shadow-popover p-2.5",
            openMenu === "group"
              ? "w-[500px] max-w-[92vw]"
              : "w-[560px] max-w-[92vw]",
          )}
        >
          <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-border">
            <span className="text-xs font-semibold text-foreground">
              {menuTitle}
            </span>
            <div className="relative w-48">
              <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                ref={filterInputRef}
                type="text"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="Filter..."
                aria-label="Filter switcher items"
                className="h-7 pl-7 pr-7 text-xs bg-surface-sunken"
              />
              {filter && (
                <button
                  type="button"
                  onClick={() => setFilter("")}
                  aria-label="Clear filter"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[340px] overflow-y-auto pr-0.5">
            {openMenu === "group"
              ? renderGroupList(false)
              : renderItemList(false)}
          </div>
        </div>
      )}

      {/* Mobile Bottom Sheet */}
      {hydrated && isMobile && (
        <Dialog
          open={openMenu !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setOpenMenu(null);
          }}
        >
          <DialogContent
            className="fixed inset-x-0 bottom-0 top-auto left-0 translate-x-0 translate-y-0 max-w-none w-full max-h-[78dvh] rounded-t-xl rounded-b-none border-t border-border-strong bg-card p-0 gap-0 flex flex-col data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom"
          >
            <DialogTitle className="sr-only">{menuTitle}</DialogTitle>
            <DialogDescription className="sr-only">
              Select a studio or tool to open
            </DialogDescription>

            <div className="pt-2.5 pb-1 flex justify-center shrink-0">
              <div className="w-9 h-1 rounded-full bg-border-strong" />
            </div>

            <div className="px-4 py-2 pr-12 flex items-center justify-between border-b border-border shrink-0">
              <span className="text-xs font-semibold text-foreground">
                {menuTitle}
              </span>
            </div>

            <div className="p-2.5 border-b border-border shrink-0">
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  ref={filterInputRef}
                  type="text"
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  placeholder={
                    openMenu === "group"
                      ? "Filter 12 studios..."
                      : "Filter tools..."
                  }
                  aria-label="Filter switcher items"
                  className="h-9 pl-8 pr-8 text-xs bg-surface-sunken"
                />
                {filter && (
                  <button
                    type="button"
                    onClick={() => setFilter("")}
                    aria-label="Clear filter"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {openMenu === "group"
                ? renderGroupList(true)
                : renderItemList(true)}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export function BreadcrumbSwitcher() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{getStudioShortName("json-studio")}</span>
          <span>/</span>
          <span className="font-mono">{getStudioShortCode("json-studio")}</span>
        </div>
      }
    >
      <BreadcrumbSwitcherInner />
    </Suspense>
  );
}
