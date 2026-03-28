"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { Search, Menu, X, Star, Home } from "lucide-react";
import { TOOL_REGISTRY, searchTools } from "@/lib/tool-registry";
import { useBookmarks } from "@/store/bookmarks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function Navigation() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { bookmarks } = useBookmarks();

  const searchResults = searchQuery ? searchTools(searchQuery) : [];
  const bookmarkedTools = TOOL_REGISTRY.filter((tool) =>
    bookmarks.includes(tool.id),
  );

  // Handle ESC key to close search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSearchOpen) {
        setIsSearchOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen]);

  // Close search when opening
  const handleSearchOpen = () => {
    setIsSearchOpen(true);
    setSearchQuery("");
  };

  return (
    <>
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
                width={32}
                height={32}
                className="h-8 w-8 flex-shrink-0"
                priority
                unoptimized
              />
              <Image
                src="/logo-text.png"
                alt="DevTool Platform"
                width={2048}
                height={272}
                className="h-6 sm:h-7 w-auto max-w-[180px] sm:max-w-[240px] dark:hidden"
                priority
                unoptimized
              />
              <Image
                src="/logo-text-darkmode.png"
                alt="DevTool Platform"
                width={2048}
                height={272}
                className="hidden h-6 sm:h-7 w-auto max-w-[180px] sm:max-w-[240px] dark:block"
                priority
                unoptimized
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>

              {/* Search */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-64 justify-start"
                  onClick={handleSearchOpen}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search tools...
                </Button>
              </div>

              {/* Bookmarks */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Star className="h-4 w-4 mr-2" />
                    Bookmarks ({bookmarks.length})
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Bookmarked Tools</DialogTitle>
                  </DialogHeader>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {bookmarkedTools.length > 0 ? (
                      bookmarkedTools.map((tool) => (
                        <Card
                          key={tool.id}
                          className="cursor-pointer hover:bg-accent"
                        >
                          <Link href={tool.path}>
                            <CardHeader className="pb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{tool.icon}</span>
                                <CardTitle className="text-sm">
                                  {tool.name}
                                </CardTitle>
                              </div>
                              <CardDescription className="text-xs">
                                {tool.description}
                              </CardDescription>
                            </CardHeader>
                          </Link>
                        </Card>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        No bookmarked tools yet
                      </p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <ThemeToggle />
            </div>

            {/* Mobile/Tablet menu button */}
            <div className="lg:hidden flex items-center space-x-2">
              {/* Tablet Navigation (md:block lg:hidden) - Show search and bookmarks */}
              <div className="hidden md:flex lg:hidden items-center space-x-2">
                <div className="relative">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleSearchOpen}
                    aria-label="Open tool search"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <ThemeToggle />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex-shrink-0"
                aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
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
      </nav>

      {/* Mobile/Tablet menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden py-4 space-y-2 border-t">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </Link>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={handleSearchOpen}
            >
              <Search className="h-4 w-4 mr-2" />
              Search tools...
            </Button>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
              >
                <Star className="h-4 w-4 mr-2" />
                Bookmarks ({bookmarks.length})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Bookmarked Tools</DialogTitle>
              </DialogHeader>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {bookmarkedTools.map((tool) => (
                  <Card
                    key={tool.id}
                    className="cursor-pointer hover:bg-accent"
                  >
                    <Link
                      href={tool.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <span>{tool.icon}</span>
                          <div>
                            <p className="font-medium text-sm">{tool.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {tool.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Custom Search Overlay */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-[9999]"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
          }}
        >
          {/* Backdrop - Full screen */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsSearchOpen(false)}
          />

          {/* Search Container */}
          <div className="relative top-20 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4 z-10">
            <div className="space-y-2">
              {/* Search Input */}
              <div className="relative">
                <Input
                  placeholder="Type to search tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 text-lg border-2 border-primary/50 rounded-xl shadow-lg focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background/95 backdrop-blur"
                  autoFocus
                />
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>

              {/* Results */}
              {(searchQuery || searchResults.length > 0) && (
                <div className="max-h-96 overflow-y-auto space-y-1 bg-background/95 backdrop-blur border border-border rounded-xl shadow-lg p-2">
                  {searchResults.length > 0 ? (
                    searchResults.map((tool) => (
                      <div
                        key={tool.id}
                        className="p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => {
                          window.location.href = tool.path;
                          setIsSearchOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl flex-shrink-0">
                            {tool.icon}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm truncate">
                              {tool.name}
                            </div>
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {tool.description}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : searchQuery ? (
                    <div className="text-muted-foreground text-center py-8">
                      No tools found for &quot;{searchQuery}&quot;
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-center py-8">
                      Start typing to search tools...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
