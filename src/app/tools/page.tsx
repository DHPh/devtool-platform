import Link from "next/link";
import { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ToolMonogram } from "@/components/ui/tool-badge";
import { ToolsCatalog } from "@/components/tools-catalog";
import { serializeJsonForHtml } from "@/lib/security/safe-json";
import {
  TOOL_REGISTRY,
  TOOL_COUNT,
  getToolsByCategory,
  isStudioTool,
} from "@/lib/tool-registry";
import { getAllCategories } from "@/lib/tool-classification";
import { getCategoryIcon, getToolMonogram } from "@/lib/tool-visuals";
import { getAbsoluteUrl, siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `All Developer Tools | ${siteConfig.name} - ${TOOL_COUNT} Free Online Tools`,
  description:
    `Browse ${TOOL_COUNT} free developer tools and studio utilities for formatting, encoding, validation, generation, and network diagnostics. No registration required.`,
  keywords: [
    "developer tools list",
    "online tools collection",
    "free web tools",
    "JSON formatter",
    "Base64 encoder",
    "regex tester",
    "UUID generator",
    "hash generator",
    "password generator",
    "color converter",
    "URL encoder",
    "HTML formatter",
    "CSS formatter",
    "JavaScript tools",
    "markdown preview",
    "timestamp converter",
    "text tools",
    "data tools",
    "crypto tools",
    "web development tools",
  ],
  alternates: {
    canonical: getAbsoluteUrl("/tools"),
  },
  openGraph: {
    title: `All Developer Tools | ${siteConfig.name}`,
    description:
      `Browse ${TOOL_COUNT} free developer tools and studio utilities. No registration required.`,
    url: getAbsoluteUrl("/tools"),
    siteName: siteConfig.name,
    type: "website",
    images: [
      {
        url: "/api/og?view=tools",
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} - Complete Tools Collection`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `All Developer Tools | ${siteConfig.name}`,
    description:
      `Browse ${TOOL_COUNT} free developer tools and studio utilities. No registration required.`,
    images: ["/api/og?view=tools"],
  },
};

export default function ToolsPage() {
  const populatedCategories = getAllCategories()
    .map((category) => ({
      ...category,
      tools: getToolsByCategory(category.id),
    }))
    .filter((category) => category.tools.length > 0);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Developer Tools Collection",
    description:
      `A collection of ${TOOL_COUNT} free online developer tools and studio utilities`,
    url: getAbsoluteUrl("/tools"),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: TOOL_COUNT,
      itemListElement: TOOL_REGISTRY.map((tool, index) => ({
        "@type": "SoftwareApplication",
        position: index + 1,
        name: tool.name,
        description: tool.description,
        url: getAbsoluteUrl(tool.path),
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web Browser",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      })),
    },
    provider: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };

  const breadcrumbItems = [{ label: "Tools" }];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonForHtml(structuredData),
        }}
      />
      <div className="max-w-[var(--workspace-max-w)] mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-6">
        <div className="sr-only">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        {/* Compact Catalog Header */}
        <header className="pb-5 border-b border-border space-y-1.5">
          <div className="font-mono text-xs text-primary tabular-nums">
            DIRECTORY · {TOOL_COUNT} UTILITIES
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Developer Tools Catalog
          </h1>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Most tools process data locally in your browser, while network tools
            contact servers or external services when required. No registration
            needed.
          </p>
        </header>

        {/* Interactive Search & Tools by Category */}
        <ToolsCatalog
          categories={populatedCategories.map((category) => ({
            id: category.id,
            name: category.name,
            count: category.tools.length,
          }))}
        >
          <div className="space-y-8">
            {populatedCategories.map((category) => {
              const CategoryIcon = getCategoryIcon(category.id);
              return (
                <section key={category.id} className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h2 className="text-base font-semibold flex items-center gap-2">
                      <CategoryIcon
                        className="h-4 w-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span>{category.name} Tools</span>
                    </h2>
                    <span className="font-mono text-xs text-muted-foreground tabular-nums">
                      {category.tools.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {category.tools.map((tool) => {
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
                </section>
              );
            })}
          </div>
        </ToolsCatalog>
      </div>
    </>
  );
}
