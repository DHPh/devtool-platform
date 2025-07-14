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
  LEGACY_TOOL_CATEGORIES,
  getToolsByCategory,
} from "@/lib/tool-registry";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

// Static metadata for SEO
export const metadata: Metadata = {
  title: "All Developer Tools | DevTool Platform - 100+ Free Online Tools",
  description:
    "Browse our complete collection of 100+ free developer tools including JSON formatter, Base64 encoder, regex tester, UUID generator, and many more. All tools work in your browser with no registration required.",
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
      "Browse our complete collection of 100+ free developer tools. All tools work in your browser with no registration required.",
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
      "Browse our complete collection of 100+ free developer tools. All tools work in your browser with no registration required.",
    images: ["/og-tools-collection.png"],
  },
};

export default function ToolsPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Developer Tools Collection",
    description:
      "A comprehensive collection of 100+ free online developer tools",
    url: "https://devtool-platform.vercel.app/tools",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: TOOL_REGISTRY.length,
      itemListElement: TOOL_REGISTRY.map((tool, index) => ({
        "@type": "SoftwareApplication",
        position: index + 1,
        name: tool.name,
        description: tool.description,
        url: `https://devtool-platform.vercel.app/tools/${tool.id}`,
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
      <div className="container mx-auto px-4 py-6 space-y-8 max-w-7xl">
        <Breadcrumbs items={breadcrumbItems} />

        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">
            Complete Developer Tools Collection
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover {TOOL_REGISTRY.length}+ free online developer tools. All
            tools work entirely in your browser with no registration required.
            Fast, secure, and always available.
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
              All tools process data immediately in your browser with no server
              delays
            </p>
          </div>

          <div className="text-center space-y-3">
            <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold">100% Private</h3>
            <p className="text-sm text-muted-foreground">
              Your data never leaves your device - complete privacy and security
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

          {LEGACY_TOOL_CATEGORIES.map((category) => {
            const categoryTools = getToolsByCategory(category);
            if (categoryTools.length === 0) return null;

            return (
              <div key={category} className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <span className="text-2xl">{getCategoryIcon(category)}</span>
                  {category} Tools
                  <Badge variant="secondary">{categoryTools.length}</Badge>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryTools.map((tool) => (
                    <Link
                      key={tool.id}
                      href={`/tools/${tool.id}`}
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
              <Link key={tool.id} href={`/tools/${tool.id}`} className="block">
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
                All tools run locally in your browser using modern web
                technologies. No waiting for server responses or slow uploads -
                get instant results every time.
              </p>

              <h3 className="text-lg font-semibold">🔒 Privacy First</h3>
              <p className="text-muted-foreground">
                Your data never leaves your device. All processing happens
                client-side, ensuring complete privacy and security for
                sensitive information.
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

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    Text: "📝",
    Data: "📊",
    Crypto: "🔐",
    Web: "🌐",
    Network: "🔗",
    Image: "🖼️",
    Development: "⚡",
    Utility: "🛠️",
  };
  return icons[category] || "🔧";
}
