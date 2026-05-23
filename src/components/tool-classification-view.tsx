"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ToolMonogram } from "@/components/ui/tool-badge";
import {
  TOOL_REGISTRY,
  getToolsByCategory,
  getToolsByType,
  getFeaturedTools,
  getAllToolTypes,
  isStudioTool,
  ToolMetadata,
} from "@/lib/tool-registry";
import {
  TOOL_TYPES,
  getAllCategories,
  ToolType,
} from "@/lib/tool-classification";
import { getCategoryIcon, getToolMonogram } from "@/lib/tool-visuals";

interface ToolClassificationViewProps {
  defaultView?: "categories" | "types" | "featured";
}

export function ToolClassificationView({
  defaultView = "categories",
}: ToolClassificationViewProps) {
  const [activeView, setActiveView] = useState(defaultView);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<ToolType | "all">("all");

  const categories = getAllCategories().filter(
    (category) => getToolsByCategory(category.id).length > 0,
  );
  const toolTypes = getAllToolTypes();
  const featuredTools = getFeaturedTools();

  const getFilteredTools = (): ToolMetadata[] => {
    if (activeView === "featured") {
      return featuredTools;
    }

    if (activeView === "categories") {
      return selectedCategory === "all"
        ? TOOL_REGISTRY
        : getToolsByCategory(selectedCategory);
    }

    if (activeView === "types") {
      return selectedType === "all"
        ? TOOL_REGISTRY
        : getToolsByType(selectedType);
    }

    return TOOL_REGISTRY;
  };

  return (
    <div className="space-y-5">
      <Tabs
        value={activeView}
        onValueChange={(value) =>
          setActiveView(value as "categories" | "types" | "featured")
        }
      >
        <div className="border-b border-border">
          <TabsList className="inline-flex h-auto rounded-none bg-transparent p-0 gap-1">
            <TabsTrigger
              value="categories"
              className="rounded-none border-b-2 border-transparent px-3 py-2 text-xs sm:text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              By Categories
            </TabsTrigger>
            <TabsTrigger
              value="types"
              className="rounded-none border-b-2 border-transparent px-3 py-2 text-xs sm:text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              By Types
            </TabsTrigger>
            <TabsTrigger
              value="featured"
              className="rounded-none border-b-2 border-transparent px-3 py-2 text-xs sm:text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              Featured
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Categories View */}
        <TabsContent value="categories" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-1.5">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className="h-7 text-xs px-2.5"
            >
              All Categories
            </Button>
            {categories.map((category) => {
              const Icon = getCategoryIcon(category.id);
              return (
                <Button
                  key={category.id}
                  variant={
                    selectedCategory === category.id ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="h-7 text-xs px-2.5 gap-1.5"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {category.name}
                </Button>
              );
            })}
          </div>

          {selectedCategory !== "all" && (
            <div className="rounded-md border border-border bg-surface-sunken px-3.5 py-2.5">
              {(() => {
                const category = categories.find(
                  (c) => c.id === selectedCategory,
                );
                if (!category) return null;
                const Icon = getCategoryIcon(category.id);
                return (
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className="h-4 w-4 text-primary shrink-0"
                      aria-hidden="true"
                    />
                    <div>
                      <h3 className="text-xs font-semibold">{category.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {category.description}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </TabsContent>

        {/* Types View */}
        <TabsContent value="types" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-1.5">
            <Button
              variant={selectedType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType("all")}
              className="h-7 text-xs px-2.5"
            >
              All Types
            </Button>
            {toolTypes.map((type) => (
              <Button
                key={type}
                variant={selectedType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType(type)}
                className="h-7 text-xs px-2.5 capitalize"
              >
                {type.replace("-", " ")}
              </Button>
            ))}
          </div>

          {selectedType !== "all" && (
            <div className="rounded-md border border-border bg-surface-sunken px-3.5 py-2.5">
              <h3 className="text-xs font-semibold capitalize">
                {selectedType.replace("-", " ")} Tools
              </h3>
              <p className="text-xs text-muted-foreground">
                Tools that {getTypeDescription(selectedType)}
              </p>
            </div>
          )}
        </TabsContent>

        {/* Featured View */}
        <TabsContent value="featured" className="mt-4">
          <div className="rounded-md border border-border bg-surface-sunken px-3.5 py-2.5">
            <h3 className="text-xs font-semibold">Featured Utilities</h3>
            <p className="text-xs text-muted-foreground">
              Frequently used developer studios and standalone tools.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Tools Grid */}
      <ToolGrid tools={getFilteredTools()} />
    </div>
  );
}

function ToolGrid({ tools }: { tools: ToolMetadata[] }) {
  if (tools.length === 0) {
    return (
      <div className="py-10 text-center text-xs text-muted-foreground">
        No tools found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
      {tools.map((tool) => {
        const badgeLabel = isStudioTool(tool)
          ? "Studio"
          : tool.processing !== "client"
            ? "Network"
            : null;

        return (
          <Link
            key={tool.id}
            href={tool.path}
            className="group flex items-start gap-3 rounded-md border border-border bg-card p-3.5 transition-colors hover:border-border-strong hover:bg-surface-sunken/60"
          >
            <ToolMonogram
              code={getToolMonogram(tool)}
              size="sm"
              className="mt-0.5"
            />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                  {tool.name}
                </span>
                {badgeLabel && (
                  <Badge
                    variant="outline"
                    className="text-[11px] px-1.5 py-0 shrink-0 text-muted-foreground"
                  >
                    {badgeLabel}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {tool.description}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function getTypeDescription(type: ToolType): string {
  const descriptions: Record<ToolType, string> = {
    [TOOL_TYPES.GENERATOR]: "generate new data, IDs, or content",
    [TOOL_TYPES.VALIDATOR]: "validate data format and syntax",
    [TOOL_TYPES.CONVERTER]: "convert between different formats",
    [TOOL_TYPES.FORMATTER]: "format and beautify code or data",
    [TOOL_TYPES.ENCODER]: "encode data into different formats",
    [TOOL_TYPES.DECODER]: "decode data from encoded formats",
    [TOOL_TYPES.PARSER]: "parse and analyze data structure",
    [TOOL_TYPES.ANALYZER]: "analyze and examine data",
    [TOOL_TYPES.CALCULATOR]: "perform calculations and computations",
    [TOOL_TYPES.RANDOM]: "generate random values and data",
    [TOOL_TYPES.SECURITY]: "provide security-related functionality",
    [TOOL_TYPES.UTILITY]: "provide general utility functions",
    [TOOL_TYPES.VIEWER]: "view and display data",
    [TOOL_TYPES.EDITOR]: "edit and modify content",
  };

  return descriptions[type] || "provide specialized functionality";
}
