"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "@/components/command-palette";
import { ThemeToggle } from "@/components/theme-toggle";
import { Home, LayoutGrid, Menu, Search, Star, Trash2, X } from "lucide-react";
import { TOOL_REGISTRY } from "@/lib/tool-registry";
import { useBookmarks } from "@/store/bookmarks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
        setIsMobileMenuOpen(false);
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
        setIsMobileMenuOpen(false);
        setIsSearchOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchOpen = () => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(true);
  };

  const handleBookmarksOpen = () => {
    setIsMobileMenuOpen(false);
    setIsBookmarksOpen(true);
  };

  return (
    <>
      <nav className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto px-4 sm:container">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 min-w-0 flex-shrink-0"
            >
              <Image
                src="/logo-icon.png"
                alt="DevTool Platform"
                width={128}
                height={128}
                sizes="32px"
                className="h-8 w-8 flex-shrink-0"
                priority
              />
              <Image
                src="/logo-text.png"
                alt="DevTool Platform"
                width={560}
                height={74}
                sizes="(max-width: 640px) 180px, 240px"
                className="h-6 sm:h-7 w-auto max-w-[180px] sm:max-w-[240px] dark:hidden"
                priority
              />
              <Image
                src="/logo-text-darkmode.png"
                alt="DevTool Platform"
                width={560}
                height={74}
                sizes="(max-width: 640px) 180px, 240px"
                className="hidden h-6 sm:h-7 w-auto max-w-[180px] sm:max-w-[240px] dark:block"
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <Home className="h-4 w-4 mr-1.5" />
                  Home
                </Link>
              </Button>

              <Button variant="ghost" size="sm" asChild>
                <Link href="/tools">
                  <LayoutGrid className="h-4 w-4 mr-1.5" />
                  Tools
                </Link>
              </Button>

              {/* Command Palette Trigger */}
              <Button
                variant="outline"
                size="sm"
                className="w-64 justify-between text-muted-foreground font-normal"
                onClick={handleSearchOpen}
              >
                <span className="flex items-center">
                  <Search className="h-4 w-4 mr-2" />
                  Search tools...
                </span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  ⌘K
                </kbd>
              </Button>

              {/* Bookmarks Trigger */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleBookmarksOpen}
              >
                <Star className="h-4 w-4 mr-1.5" />
                Bookmarks ({bookmarkCount})
              </Button>

              <ThemeToggle />
            </div>

            {/* Mobile/Tablet controls */}
            <div className="lg:hidden flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleSearchOpen}
                aria-label="Open tool search"
              >
                <Search className="h-4 w-4" />
              </Button>

              <ThemeToggle />

              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex-shrink-0"
                aria-label={
                  isMobileMenuOpen
                    ? "Close navigation menu"
                    : "Open navigation menu"
                }
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet dropdown menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden px-4 py-3 space-y-1 border-t bg-background">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              asChild
            >
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                <Home className="h-4 w-4 mr-2" />
                Home
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              asChild
            >
              <Link href="/tools" onClick={() => setIsMobileMenuOpen(false)}>
                <LayoutGrid className="h-4 w-4 mr-2" />
                All Tools
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={handleSearchOpen}
            >
              <Search className="h-4 w-4 mr-2" />
              Search tools...
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={handleBookmarksOpen}
            >
              <Star className="h-4 w-4 mr-2" />
              Bookmarks ({bookmarkCount})
            </Button>
          </div>
        )}
      </nav>

      {/* Shared Bookmarks Dialog */}
      <Dialog open={isBookmarksOpen} onOpenChange={setIsBookmarksOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Bookmarked Tools</DialogTitle>
            <DialogDescription>
              Quickly jump back to your saved developer tools.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {bookmarkedTools.length > 0 ? (
              bookmarkedTools.map((tool) => (
                <div
                  key={tool.id}
                  className="flex items-center justify-between gap-2 rounded-lg border bg-card p-3 hover:bg-accent/50 transition-colors"
                >
                  <Link
                    href={tool.path}
                    onClick={() => setIsBookmarksOpen(false)}
                    className="flex items-center gap-3 min-w-0 flex-1"
                  >
                    <span className="text-xl flex-shrink-0">{tool.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">
                        {tool.name}
                      </p>
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
              <div className="text-center py-8 space-y-2">
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
