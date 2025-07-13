"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, Star } from "lucide-react";
import {
  TOOL_REGISTRY,
  LEGACY_TOOL_CATEGORIES,
  getToolsByCategory,
  searchTools,
} from "@/lib/tool-registry";
import { useBookmarks } from "@/store/bookmarks";

interface InteractiveToolsProps {
  featuredToolIds: string[];
}

export function InteractiveTools({ featuredToolIds }: InteractiveToolsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [mounted, setMounted] = useState(false);
  const { bookmarks } = useBookmarks();

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredTools = searchQuery
    ? searchTools(searchQuery)
    : selectedCategory === "all"
    ? TOOL_REGISTRY
    : getToolsByCategory(selectedCategory);

  const bookmarkedTools = mounted
    ? TOOL_REGISTRY.filter((tool) => bookmarks.includes(tool.id))
    : [];

  const featuredTools = TOOL_REGISTRY.filter((tool) =>
    featuredToolIds.includes(tool.id)
  );

  return (
    <div className="space-y-8">
      {/* Search */}
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="Search tools..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tool Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="bookmarks">
            <Star className="h-4 w-4 mr-1" />
            Bookmarks
          </TabsTrigger>
          {LEGACY_TOOL_CATEGORIES.slice(0, 4).map((category) => (
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <ToolGrid tools={filteredTools} />
        </TabsContent>

        <TabsContent value="bookmarks" className="space-y-6">
          {bookmarkedTools.length === 0 ? (
            <div className="text-center py-12">
              <Star className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No bookmarks yet</h3>
              <p className="text-muted-foreground">
                Bookmark your favorite tools to find them quickly later.
              </p>
            </div>
          ) : (
            <ToolGrid tools={bookmarkedTools} />
          )}
        </TabsContent>

        {LEGACY_TOOL_CATEGORIES.map((category) => (
          <TabsContent key={category} value={category} className="space-y-6">
            <ToolGrid tools={getToolsByCategory(category)} />
          </TabsContent>
        ))}
      </Tabs>

      {/* Featured Tools - Always visible */}
      {!searchQuery && selectedCategory === "all" && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Featured Tools</h2>
          <ToolGrid tools={featuredTools} />
        </div>
      )}
    </div>
  );
}

function ToolGrid({ tools }: { tools: typeof TOOL_REGISTRY }) {
  if (tools.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No tools found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {tools.map((tool) => (
        <Link key={tool.id} href={`/tools/${tool.id}`}>
          <Card className="h-full hover:shadow-md transition-shadow cursor-pointer flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{tool.icon}</span>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg">{tool.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {tool.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex flex-wrap gap-1 mt-auto">
                {tool.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {tool.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{tool.tags.length - 3}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
