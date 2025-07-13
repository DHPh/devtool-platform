"use client";

import Link from "next/link";
import { useState } from "react";
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
    bookmarks.includes(tool.id)
  );

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-primary text-primary-foreground rounded-md flex items-center justify-center font-bold">
              DT
            </div>
            <span className="font-bold text-xl">DevTool Platform</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>

            {/* Search */}
            <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-64 justify-start"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search tools...
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Search Tools</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Type to search tools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {searchResults.length > 0 ? (
                      searchResults.map((tool) => (
                        <Card
                          key={tool.id}
                          className="cursor-pointer hover:bg-accent"
                        >
                          <Link
                            href={tool.path}
                            onClick={() => setIsSearchOpen(false)}
                          >
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
                    ) : searchQuery ? (
                      <p className="text-muted-foreground text-center py-4">
                        No tools found for &quot;{searchQuery}&quot;
                      </p>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        Start typing to search tools...
                      </p>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

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

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search tools...
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Search Tools</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Type to search tools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {searchResults.map((tool) => (
                      <Card
                        key={tool.id}
                        className="cursor-pointer hover:bg-accent"
                      >
                        <Link
                          href={tool.path}
                          onClick={() => {
                            setIsSearchOpen(false);
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2">
                              <span>{tool.icon}</span>
                              <div>
                                <p className="font-medium text-sm">
                                  {tool.name}
                                </p>
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
                </div>
              </DialogContent>
            </Dialog>
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
      </div>
    </nav>
  );
}
