"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Search, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BreadcrumbSwitcher } from "@/components/breadcrumb-switcher";
import { CommandPalette } from "@/components/command-palette";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ToolMonogram } from "@/components/ui/tool-badge";
import { TOOL_REGISTRY } from "@/lib/tool-registry";
import { getToolMonogram } from "@/lib/tool-visuals";
import { useBookmarks } from "@/store/bookmarks";

const emptySubscribe = () => () => {};

function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName;
  return (
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT" ||
    target.isContentEditable
  );
}

export function Navigation() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const { bookmarks, removeBookmark } = useBookmarks();

  const hasHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const bookmarkedTools = TOOL_REGISTRY.filter((tool) =>
    bookmarks.includes(tool.id),
  );
  const bookmarkCount = hasHydrated ? bookmarkedTools.length : 0;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        setIsSearchOpen((prev) => !prev);
        return;
      }

      if (
        event.key === "/" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isEditableElement(event.target)
      ) {
        event.preventDefault();
        setIsSearchOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 h-12 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85">
        <div className="mx-auto flex h-full max-w-[var(--workspace-max-w)] items-center justify-between gap-2 px-3 sm:px-6">
          {/* Left: Brand Mark + Breadcrumb Switcher */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Link
              href="/"
              className="flex items-center gap-2 shrink-0 hover:opacity-90 transition-opacity"
              aria-label="DevTool Platform Home"
            >
              <Image
                src="/logo-icon.png"
                alt="DevTool Platform"
                width={128}
                height={128}
                sizes="28px"
                className="h-7 w-7 shrink-0"
                priority
              />
              <span className="hidden sm:inline-flex items-center">
                <Image
                  src="/logo-text.png"
                  alt="DevTool Platform"
                  width={560}
                  height={74}
                  sizes="160px"
                  className="h-5 w-auto max-w-[160px] dark:hidden"
                  priority
                />
                <Image
                  src="/logo-text-darkmode.png"
                  alt="DevTool Platform"
                  width={560}
                  height={74}
                  sizes="160px"
                  className="hidden h-5 w-auto max-w-[160px] dark:block"
                  priority
                />
              </span>
            </Link>

            <BreadcrumbSwitcher />
          </div>

          {/* Right: Command Palette, Bookmarks, Theme Palette & Mode */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsSearchOpen(true)}
              className="hidden md:inline-flex h-8 w-48 lg:w-56 justify-between bg-surface-sunken text-muted-foreground font-normal px-2.5"
            >
              <span className="flex items-center gap-1.5 text-xs">
                <Search className="h-3.5 w-3.5" />
                <span>Search tools...</span>
              </span>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center rounded-sm border border-border bg-card px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Open tool search"
              className="md:hidden h-8 w-8 bg-surface-sunken"
            >
              <Search className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsBookmarksOpen(true)}
              aria-label={`Open bookmarked tools (${bookmarkCount})`}
              className="h-8 gap-1.5 px-2.5 bg-surface-sunken"
            >
              <Star className="h-3.5 w-3.5" />
              <span className="hidden lg:inline text-xs">Bookmarks</span>
              <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                {bookmarkCount}
              </span>
            </Button>

            <ThemeSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Bookmarks Dialog */}
      <Dialog open={isBookmarksOpen} onOpenChange={setIsBookmarksOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Bookmarked Tools</DialogTitle>
            <DialogDescription>
              Quickly jump back to your saved developer utilities.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto space-y-1.5">
            {bookmarkedTools.length > 0 ? (
              bookmarkedTools.map((tool) => (
                <div
                  key={tool.id}
                  className="flex items-center justify-between gap-2 rounded-sm border border-border bg-surface-sunken p-2.5 hover:bg-surface-elevated transition-colors"
                >
                  <Link
                    href={tool.path}
                    onClick={() => setIsBookmarksOpen(false)}
                    className="flex items-center gap-3 min-w-0 flex-1"
                  >
                    <ToolMonogram code={getToolMonogram(tool)} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{tool.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {tool.description}
                      </p>
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeBookmark(tool.id)}
                    aria-label={`Remove ${tool.name} from bookmarks`}
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 space-y-1.5">
                <p className="text-sm text-muted-foreground">
                  No bookmarked tools yet.
                </p>
                <p className="text-xs text-muted-foreground">
                  Click the Bookmark button on any tool page to save it here.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Command Palette */}
      <CommandPalette open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  );
}
