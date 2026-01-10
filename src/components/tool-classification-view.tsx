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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  TOOL_REGISTRY,
  getToolsByCategory,
  getToolsByType,
  getFeaturedTools,
  getAllToolTypes,
  ToolMetadata,
} from "@/lib/tool-registry";
import {
  TOOL_TYPES,
  getAllCategories,
  ToolType,
} from "@/lib/tool-classification";

interface ToolClassificationViewProps {
  defaultView?: "categories" | "types" | "featured";
}

export function ToolClassificationView({
  defaultView = "categories",
}: ToolClassificationViewProps) {
  const [activeView, setActiveView] = useState(defaultView);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<ToolType | "all">("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  const categories = getAllCategories().filter(
    (category) => getToolsByCategory(category.id).length > 0
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
    <div className="space-y-6">
      {/* View Selection */}
      <Tabs
        value={activeView}
        onValueChange={(value) =>
          setActiveView(value as "categories" | "types" | "featured")
        }
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categories">By Categories</TabsTrigger>
          <TabsTrigger value="types">By Types</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
        </TabsList>

        {/* Categories View */}
        <TabsContent value="categories" className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
            >
              All Categories
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={
                  selectedCategory === category.id ? "default" : "outline"
                }
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center gap-2"
              >
                <span>{category.icon}</span>
                {category.name}
              </Button>
            ))}
          </div>

          {selectedCategory !== "all" && (
            <div className="bg-muted/50 p-4 rounded-lg">
              {(() => {
                const category = categories.find(
                  (c) => c.id === selectedCategory
                );
                return category ? (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category.icon}</span>
                    <div>
                      <h3 className="font-semibold">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {category.description}
                      </p>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </TabsContent>

        {/* Types View */}
        <TabsContent value="types" className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType("all")}
            >
              All Types
            </Button>
            {toolTypes.map((type) => (
              <Button
                key={type}
                variant={selectedType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType(type)}
                className="capitalize"
              >
                {type.replace("-", " ")}
              </Button>
            ))}
          </div>

          {selectedType !== "all" && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="font-semibold capitalize">
                    {selectedType.replace("-", " ")} Tools
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Tools that {getTypeDescription(selectedType)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Featured View */}
        <TabsContent value="featured" className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-2">⭐ Featured Tools</h3>
            <p className="text-muted-foreground">
              Our most popular and frequently used developer tools, handpicked
              for their utility and ease of use.
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
      <div className="text-center py-12">
        <p className="text-muted-foreground">No tools found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {tools.map((tool) => (
        <Link key={tool.id} href={tool.path}>
          <Card className="h-full hover:shadow-md transition-shadow cursor-pointer flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{tool.icon}</span>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {tool.name}
                    {tool.featured && (
                      <span className="text-yellow-500">⭐</span>
                    )}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {tool.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="space-y-2 mt-auto">
                {/* Tool Type */}
                <div className="flex flex-wrap gap-1">
                  <Badge variant="default" className="text-xs capitalize">
                    {tool.type.replace("-", " ")}
                  </Badge>
                  {tool.types &&
                    tool.types.slice(0, 2).map((type) => (
                      <Badge
                        key={type}
                        variant="secondary"
                        className="text-xs capitalize"
                      >
                        {type.replace("-", " ")}
                      </Badge>
                    ))}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {tool.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {tool.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{tool.tags.length - 3}
                    </Badge>
                  )}
                </div>

                {/* Complexity */}
                {tool.complexity && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {getComplexityIndicator(tool.complexity)}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {tool.complexity}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
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

function getComplexityIndicator(
  complexity: "simple" | "intermediate" | "advanced"
): string {
  switch (complexity) {
    case "simple":
      return "●○○";
    case "intermediate":
      return "●●○";
    case "advanced":
      return "●●●";
    default:
      return "○○○";
  }
}
