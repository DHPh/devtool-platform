"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock, CornerDownLeft, Search, Sparkles, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  TOOL_COUNT,
  getFeaturedTools,
  getToolById,
  isStudioTool,
  searchTools,
  type ToolMetadata,
} from "@/lib/tool-registry";
import { useBookmarks } from "@/store/bookmarks";
import { useRecentTools } from "@/store/recent-tools";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PaletteItem {
  tool: ToolMetadata;
  flatIndex: number;
}

interface PaletteSection {
  id: string;
  label: string;
  icon: typeof Clock;
  items: PaletteItem[];
}

const MAX_SEARCH_RESULTS = 16;

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listContainerRef = useRef<HTMLDivElement | null>(null);

  const { bookmarks } = useBookmarks();
  const { recentTools } = useRecentTools();

  const { sections, flatItems } = useMemo(() => {
    const rawGroups: { id: string; label: string; icon: typeof Clock; tools: ToolMetadata[] }[] = [];
    const trimmed = query.trim();

    if (trimmed) {
      rawGroups.push({
        id: "results",
        label: "Matching Tools",
        icon: Search,
        tools: searchTools(trimmed).slice(0, MAX_SEARCH_RESULTS),
      });
    } else {
      const seen = new Set<string>();
      const takeUnique = (
        tools: (ToolMetadata | undefined)[],
        limit: number,
      ) => {
        const picked: ToolMetadata[] = [];
        for (const tool of tools) {
          if (!tool || seen.has(tool.id)) continue;
          seen.add(tool.id);
          picked.push(tool);
          if (picked.length >= limit) break;
        }
        return picked;
      };

      const recent = takeUnique(
        recentTools.map((id) => getToolById(id)),
        5,
      );
      const saved = takeUnique(
        bookmarks.map((id) => getToolById(id)),
        5,
      );
      const featured = takeUnique(getFeaturedTools(), 8);

      if (recent.length > 0) {
        rawGroups.push({ id: "recent", label: "Recent", icon: Clock, tools: recent });
      }
      if (saved.length > 0) {
        rawGroups.push({ id: "bookmarks", label: "Bookmarked", icon: Star, tools: saved });
      }
      if (featured.length > 0) {
        rawGroups.push({
          id: "featured",
          label: "Popular Tools",
          icon: Sparkles,
          tools: featured,
        });
      }
    }

    const allTools: ToolMetadata[] = [];
    const indexedSections: PaletteSection[] = rawGroups.map((group) => ({
      id: group.id,
      label: group.label,
      icon: group.icon,
      items: group.tools.map((tool) => {
        const flatIndex = allTools.length;
        allTools.push(tool);
        return { tool, flatIndex };
      }),
    }));

    return { sections: indexedSections, flatItems: allTools };
  }, [query, recentTools, bookmarks]);

  const clampedIndex =
    flatItems.length === 0 ? 0 : Math.min(selectedIndex, flatItems.length - 1);

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
    onOpenChange(nextOpen);
  };

  const navigateToTool = (tool: ToolMetadata) => {
    handleClose(false);
    router.push(tool.path);
  };

  const navigateToCatalogSearch = () => {
    const trimmed = query.trim();
    handleClose(false);
    router.push(
      trimmed ? `/tools?search=${encodeURIComponent(trimmed)}` : "/tools",
    );
  };

  const scrollItemIntoView = (index: number) => {
    const element = listContainerRef.current?.querySelector<HTMLElement>(
      `[data-palette-index="${index}"]`,
    );
    element?.scrollIntoView({ block: "nearest" });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      if (flatItems.length === 0) return;
      event.preventDefault();
      const next = (clampedIndex + 1) % flatItems.length;
      setSelectedIndex(next);
      scrollItemIntoView(next);
    } else if (event.key === "ArrowUp") {
      if (flatItems.length === 0) return;
      event.preventDefault();
      const prev = (clampedIndex - 1 + flatItems.length) % flatItems.length;
      setSelectedIndex(prev);
      scrollItemIntoView(prev);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const active = flatItems[clampedIndex];
      if (active) {
        navigateToTool(active);
      } else if (query.trim()) {
        navigateToCatalogSearch();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="top-[10%] sm:top-[14%] translate-y-0 max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Search Developer Tools</DialogTitle>
        <DialogDescription className="sr-only">
          Search across {TOOL_COUNT} developer tools by name, tag, or category
        </DialogDescription>

        {/* Search Input Bar */}
        <div className="flex items-center border-b px-4 pr-12">
          <Search className="h-4 w-4 text-muted-foreground shrink-0 mr-3" />
          <input
            type="text"
            aria-label="Search developer tools"
            placeholder="Search tools by name, format, or tag (e.g. json, jwt, cron, dns)..."
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            autoFocus
            className="flex h-12 w-full bg-transparent py-3 text-sm sm:text-base outline-none placeholder:text-muted-foreground"
          />
        </div>

        {/* Results / Sections */}
        <div
          ref={listContainerRef}
          className="max-h-[60vh] overflow-y-auto p-2 space-y-3"
        >
          {flatItems.length > 0 ? (
            sections.map((section) => {
              if (section.items.length === 0) return null;
              const SectionIcon = section.icon;
              return (
                <div key={section.id} className="space-y-1">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    <SectionIcon className="h-3.5 w-3.5" />
                    <span>{section.label}</span>
                  </div>
                  <div className="space-y-0.5" role="listbox" aria-label={section.label}>
                    {section.items.map(({ tool, flatIndex }) => {
                      const isActive = flatIndex === clampedIndex;
                      return (
                        <button
                          key={`${section.id}-${tool.id}`}
                          data-palette-index={flatIndex}
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          onMouseEnter={() => setSelectedIndex(flatIndex)}
                          onClick={() => navigateToTool(tool)}
                          className={`w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${
                            isActive
                              ? "bg-accent text-accent-foreground"
                              : "hover:bg-accent/60"
                          }`}
                        >
                          <span className="text-xl shrink-0" aria-hidden="true">
                            {tool.icon}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">
                                {tool.name}
                              </span>
                              {isStudioTool(tool) && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                  Studio
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {tool.description}
                            </div>
                          </div>
                          {isActive && (
                            <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-10 text-center space-y-2">
              <p className="text-sm font-medium">
                No tools found for &ldquo;{query.trim()}&rdquo;
              </p>
              <p className="text-xs text-muted-foreground">
                Try keywords like json, base64, regex, jwt, yaml, or dns
              </p>
            </div>
          )}

          {query.trim() && flatItems.length > 0 && (
            <div className="pt-1 border-t">
              <button
                type="button"
                onClick={navigateToCatalogSearch}
                className="w-full flex items-center justify-between rounded-md px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <span>View all results for &ldquo;{query.trim()}&rdquo; in Tools Catalog</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Keyboard Footer */}
        <div className="hidden sm:flex items-center justify-between border-t bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">
                ↑↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">
                ↵
              </kbd>
              Open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">
                Esc
              </kbd>
              Close
            </span>
          </div>
          <span>{TOOL_COUNT} tools available</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
