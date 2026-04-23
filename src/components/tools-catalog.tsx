"use client";

import { Suspense, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RotateCcw, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TOOL_COUNT,
  isStudioTool,
  searchTools,
  type ToolMetadata,
} from "@/lib/tool-registry";

export interface CatalogCategoryOption {
  id: string;
  name: string;
  icon: string;
  count: number;
}

interface ToolsCatalogProps {
  categories: CatalogCategoryOption[];
  children: ReactNode;
}

type KindFilter = "all" | "tools" | "studios";

function ToolsCatalogBody({
  categories,
  initialSearch = "",
  children,
}: ToolsCatalogProps & { initialSearch?: string }) {
  const [query, setQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");

  const hasActiveFilter =
    query.trim().length > 0 ||
    selectedCategory !== "all" ||
    kindFilter !== "all";

  const filteredTools = useMemo<ToolMetadata[]>(() => {
    if (!hasActiveFilter) return [];

    let results = searchTools(query);

    if (selectedCategory !== "all") {
      results = results.filter((tool) => tool.category === selectedCategory);
    }

    if (kindFilter === "tools") {
      results = results.filter((tool) => !isStudioTool(tool));
    } else if (kindFilter === "studios") {
      results = results.filter((tool) => isStudioTool(tool));
    }

    return results;
  }, [hasActiveFilter, query, selectedCategory, kindFilter]);

  const resetFilters = () => {
    setQuery("");
    setSelectedCategory("all");
    setKindFilter("all");
  };

  return (
    <div className="space-y-8">
      {/* Interactive Search & Filter Controls */}
      <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              aria-label="Search developer tools catalog"
              placeholder={`Search ${TOOL_COUNT} tools by name, format, or tag (e.g. json, jwt, cron, svg)...`}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-9 pr-9"
            />
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Clear search query"
                onClick={() => setQuery("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          <div
            className="inline-flex rounded-lg border bg-muted/40 p-1 self-start sm:self-auto"
            role="group"
            aria-label="Filter by tool kind"
          >
            {(
              [
                { value: "all", label: "All" },
                { value: "tools", label: "Tools" },
                { value: "studios", label: "Studios" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setKindFilter(option.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  kindFilter === option.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
            className="h-8 text-xs"
          >
            All Categories
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              type="button"
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setSelectedCategory(
                  selectedCategory === category.id ? "all" : category.id,
                )
              }
              className="h-8 text-xs gap-1.5"
            >
              <span aria-hidden="true">{category.icon}</span>
              <span>{category.name}</span>
              <span className="opacity-70">({category.count})</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Default SSR Category View vs Active Filtered View */}
      {!hasActiveFilter ? (
        children
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Showing <strong className="text-foreground">{filteredTools.length}</strong>{" "}
              {filteredTools.length === 1 ? "result" : "results"}
              {query.trim() ? (
                <>
                  {" "}
                  for <strong className="text-foreground">&ldquo;{query.trim()}&rdquo;</strong>
                </>
              ) : null}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-8 text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reset filters
            </Button>
          </div>

          {filteredTools.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTools.map((tool) => (
                <Link key={tool.id} href={tool.path} className="block">
                  <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">
                          {tool.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg truncate">
                              {tool.name}
                            </CardTitle>
                            {isStudioTool(tool) && (
                              <Badge variant="secondary" className="text-xs shrink-0">
                                Studio
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="text-sm">
                            {tool.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {tool.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {tool.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{tool.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-12 text-center space-y-3">
              <p className="text-base font-medium">No matching tools found</p>
              <p className="text-sm text-muted-foreground">
                Try broadening your search or clearing the active category filter.
              </p>
              <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
                Reset filters
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ToolsCatalogWithParams({ categories, children }: ToolsCatalogProps) {
  const searchParams = useSearchParams();
  const initialSearch = searchParams?.get("search") ?? "";

  return (
    <ToolsCatalogBody
      key={initialSearch}
      categories={categories}
      initialSearch={initialSearch}
    >
      {children}
    </ToolsCatalogBody>
  );
}

export function ToolsCatalog({ categories, children }: ToolsCatalogProps) {
  return (
    <Suspense
      fallback={
        <ToolsCatalogBody categories={categories}>{children}</ToolsCatalogBody>
      }
    >
      <ToolsCatalogWithParams categories={categories}>
        {children}
      </ToolsCatalogWithParams>
    </Suspense>
  );
}
