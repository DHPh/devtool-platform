"use client";

import { Suspense, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RotateCcw, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToolMonogram } from "@/components/ui/tool-badge";
import {
  TOOL_COUNT,
  isStudioTool,
  searchTools,
  type ToolMetadata,
} from "@/lib/tool-registry";
import { getCategoryIcon, getToolMonogram } from "@/lib/tool-visuals";

export interface CatalogCategoryOption {
  id: string;
  name: string;
  count: number;
}

interface ToolsCatalogProps {
  categories: CatalogCategoryOption[];
  children: ReactNode;
}

type KindFilter = "all" | "tools" | "studios";
type ViewLayout = "grid" | "list";

function ToolsCatalogBody({
  categories,
  initialSearch = "",
  children,
}: ToolsCatalogProps & { initialSearch?: string }) {
  const [query, setQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [viewLayout, setViewLayout] = useState<ViewLayout>("grid");

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
    <div className="space-y-6">
      {/* Interactive Search & Filter Controls */}
      <div className="rounded-md border border-border bg-card p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              aria-label="Search developer tools catalog"
              placeholder={`Search ${TOOL_COUNT} tools by name, format, or tag (e.g. json, jwt, cron, svg)...`}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-9 pl-9 pr-9 bg-surface-sunken text-xs sm:text-sm"
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

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div
              className="inline-flex rounded-sm border border-border bg-surface-sunken p-0.5"
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
                  className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors ${
                    kindFilter === option.value
                      ? "bg-card text-foreground border border-border"
                      : "text-muted-foreground hover:text-foreground border border-transparent"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {hasActiveFilter && (
              <div
                className="inline-flex rounded-sm border border-border bg-surface-sunken p-0.5"
                role="group"
                aria-label="Result view layout"
              >
                {(["grid", "list"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setViewLayout(mode)}
                    className={`px-2.5 py-1 text-xs font-medium capitalize rounded-sm transition-colors ${
                      viewLayout === mode
                        ? "bg-card text-foreground border border-border"
                        : "text-muted-foreground hover:text-foreground border border-transparent"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Category Chips */}
        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
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
                type="button"
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === category.id ? "all" : category.id,
                  )
                }
                className="h-7 text-xs gap-1.5 px-2.5"
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{category.name}</span>
                <span className="font-mono text-[11px] opacity-75 tabular-nums">
                  {category.count}
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Default SSR Category View vs Active Filtered View */}
      {!hasActiveFilter ? (
        children
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Showing{" "}
              <strong className="text-foreground font-mono tabular-nums">
                {filteredTools.length}
              </strong>{" "}
              {filteredTools.length === 1 ? "result" : "results"}
              {query.trim() ? (
                <>
                  {" "}
                  for{" "}
                  <strong className="text-foreground">
                    &ldquo;{query.trim()}&rdquo;
                  </strong>
                </>
              ) : null}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-7 text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reset filters
            </Button>
          </div>

          {filteredTools.length > 0 ? (
            viewLayout === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {filteredTools.map((tool) => {
                  const roleBadge = isStudioTool(tool)
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
                          {roleBadge && (
                            <Badge
                              variant="outline"
                              className="text-[11px] px-1.5 py-0 shrink-0 text-muted-foreground"
                            >
                              {roleBadge}
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
            ) : (
              <div className="overflow-hidden rounded-md border border-border bg-card divide-y divide-border">
                {filteredTools.map((tool) => {
                  const roleBadge = isStudioTool(tool)
                    ? "Studio"
                    : tool.processing !== "client"
                      ? "Network"
                      : null;

                  return (
                    <Link
                      key={tool.id}
                      href={tool.path}
                      className="group flex items-center justify-between gap-4 px-3.5 py-2.5 hover:bg-surface-sunken/70 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <ToolMonogram code={getToolMonogram(tool)} size="xs" />
                        <span className="text-xs sm:text-sm font-semibold shrink-0 w-44 sm:w-56 truncate group-hover:text-primary transition-colors">
                          {tool.name}
                        </span>
                        <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                          {tool.description}
                        </span>
                      </div>
                      {roleBadge && (
                        <Badge
                          variant="outline"
                          className="text-[11px] px-1.5 py-0 shrink-0 text-muted-foreground"
                        >
                          {roleBadge}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </div>
            )
          ) : (
            <div className="rounded-md border border-dashed border-border-strong p-10 text-center space-y-2.5">
              <p className="text-sm font-medium">No matching tools found</p>
              <p className="text-xs text-muted-foreground">
                Try broadening your search or clearing the active category
                filter.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetFilters}
              >
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
