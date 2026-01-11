import Link from "next/link";
import { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Shield, Globe } from "lucide-react";
import {
  TOOL_REGISTRY,
  TOOL_COUNT,
  getToolsByCategory,
} from "@/lib/tool-registry";
import { getAllCategories } from "@/lib/tool-classification";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

// Static metadata for SEO
export const metadata: Metadata = {
  title: `All Developer Tools | DevTool Platform - ${TOOL_COUNT} Free Online Tools`,
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
    canonical: "https://devtool-platform.vercel.app/tools",
  },
  openGraph: {
    title: "All Developer Tools | DevTool Platform",
    description:
      `Browse ${TOOL_COUNT} free developer tools and studio utilities. No registration required.`,
    url: "https://devtool-platform.vercel.app/tools",
    siteName: "DevTool Platform",
    type: "website",
    images: [
      {
        url: "/og-tools-collection.png",
        width: 1200,
        height: 630,
        alt: "DevTool Platform - Complete Tools Collection",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "All Developer Tools | DevTool Platform",
    description:
      `Browse ${TOOL_COUNT} free developer tools and studio utilities. No registration required.`,
    images: ["/og-tools-collection.png"],
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
    url: "https://devtool-platform.vercel.app/tools",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: TOOL_COUNT,
      itemListElement: TOOL_REGISTRY.map((tool, index) => ({
        "@type": "SoftwareApplication",
        position: index + 1,
        name: tool.name,
        description: tool.description,
        url: `https://devtool-platform.vercel.app${tool.path}`,
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
      name: "DevTool Platform",
      url: "https://devtool-platform.vercel.app",
    },
  };

  const breadcrumbItems = [{ label: "Tools" }];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 max-w-7xl ">
        <div className="px-4 sm:px-0">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">
            Complete Developer Tools Collection
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover {TOOL_COUNT} free online developer tools and studio
            utilities. Most process data locally, while network tools contact
            servers or external services when required. No registration needed.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
          <div className="text-center space-y-3">
            <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold">Instant Processing</h3>
            <p className="text-sm text-muted-foreground">
              Most tools process data immediately in your browser; network
              tools make remote requests when needed
            </p>
          </div>

          <div className="text-center space-y-3">
            <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold">Privacy Aware</h3>
            <p className="text-sm text-muted-foreground">
              Local tools keep input on-device; network tools send required
              request data to servers or external services
            </p>
          </div>

          <div className="text-center space-y-3">
            <div className="mx-auto w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Globe className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold">Always Available</h3>
            <p className="text-sm text-muted-foreground">
              Access from any device with a modern web browser, no downloads
              needed
            </p>
          </div>
        </div>

        {/* Tools by Category */}
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-center">
            Browse Tools by Category
          </h2>

          {populatedCategories.map((category) => {
            return (
              <div key={category.id} className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <span className="text-2xl">{category.icon}</span>
                  {category.name} Tools
                  <Badge variant="secondary">{category.tools.length}</Badge>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.tools.map((tool) => (
                    <Link
                      key={tool.id}
                      href={tool.path}
                      className="block"
                    >
                      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader>
                          <div className="flex items-start gap-3">
                            <span className="text-2xl flex-shrink-0">
                              {tool.icon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg">
                                {tool.name}
                              </CardTitle>
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
              </div>
            );
          })}
        </div>

        {/* All Tools Grid */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center">All Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {TOOL_REGISTRY.map((tool) => (
              <Link key={tool.id} href={tool.path} className="block">
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{tool.icon}</span>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">
                          {tool.name}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-xs line-clamp-2">
                      {tool.description}
                    </CardDescription>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tool.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* SEO Content */}
        <div className="bg-muted/30 rounded-lg p-8 space-y-6">
          <h2 className="text-2xl font-bold text-center">
            Why Choose DevTool Platform?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">🚀 Fast & Efficient</h3>
              <p className="text-muted-foreground">
                Most tools run locally in your browser using modern web
                technologies. Network utilities make remote requests because
                their results depend on servers or external services.
              </p>

              <h3 className="text-lg font-semibold">🔒 Privacy First</h3>
              <p className="text-muted-foreground">
                Local formatters and converters keep input on your device.
                Network diagnostics and breach checks send only the request data
                needed to provide their results.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">💯 Completely Free</h3>
              <p className="text-muted-foreground">
                No hidden costs, premium features, or subscription fees. All
                tools are completely free to use with no limitations.
              </p>

              <h3 className="text-lg font-semibold">📱 Mobile Friendly</h3>
              <p className="text-muted-foreground">
                Responsive design that works perfectly on phones, tablets, and
                desktop computers. Access your tools from anywhere.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
