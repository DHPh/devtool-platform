import { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Shield, Globe, ArrowRight } from "lucide-react";
import { TOOL_REGISTRY } from "@/lib/tool-registry";
import { ToolClassificationView } from "@/components/tool-classification-view";

// Enhanced SEO metadata
export const metadata: Metadata = {
  title: "DevTool Platform - 100+ Free Online Developer Tools",
  description:
    "The ultimate collection of 100+ free online developer tools including JSON formatter, Base64 encoder, regex tester, UUID generator, hash generators, and many more. All tools work in your browser with no registration required.",
  keywords: [
    "developer tools",
    "online tools",
    "free tools",
    "JSON formatter",
    "Base64 encoder",
    "regex tester",
    "UUID generator",
    "hash generator",
    "password generator",
    "web tools",
    "coding tools",
    "programming tools",
    "text tools",
    "data tools",
    "crypto tools",
    "URL encoder",
    "HTML formatter",
    "CSS formatter",
    "JavaScript tools",
    "markdown preview",
    "color converter",
    "timestamp converter",
    "browser tools",
    "no registration",
    "instant tools",
  ],
  authors: [{ name: "DevTool Platform" }],
  creator: "DevTool Platform",
  publisher: "DevTool Platform",
  category: "Technology",
  alternates: {
    canonical: "https://devtool-platform.vercel.app",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "DevTool Platform - 100+ Free Online Developer Tools",
    description:
      "The ultimate collection of 100+ free online developer tools. All tools work in your browser with no registration required.",
    url: "https://devtool-platform.vercel.app",
    siteName: "DevTool Platform",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-homepage.png", // TODO: Create and upload homepage OG image (1200x630)
        width: 1200,
        height: 630,
        alt: "DevTool Platform - 100+ Free Online Developer Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@devtoolplatform", // TODO: Replace with real Twitter handle
    creator: "@devtoolplatform", // TODO: Replace with real Twitter handle
    title: "DevTool Platform - 100+ Free Online Developer Tools",
    description:
      "The ultimate collection of 100+ free online developer tools. All tools work in your browser with no registration required.",
    images: ["/og-homepage.png"], // TODO: Create and upload homepage OG image
  },
};

export default function HomePage() {
  // Get featured tools from new registry
  const featuredTools = TOOL_REGISTRY.filter(
    (tool) => tool.featured === true
  ).slice(0, 8);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "DevTool Platform",
    description: "The ultimate collection of 100+ free online developer tools",
    url: "https://devtool-platform.vercel.app",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate:
          "https://devtool-platform.vercel.app/tools?search={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
    mainEntity: {
      "@type": "SoftwareApplication",
      name: "DevTool Platform",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web Browser",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "JSON Formatter and Validator",
        "Base64 Encoder/Decoder",
        "Regular Expression Tester",
        "UUID Generator",
        "Hash Generator (MD5, SHA1, SHA256)",
        "Password Generator",
        "Color Converter",
        "URL Encoder/Decoder",
        "HTML Formatter",
        "CSS Formatter",
        "Markdown Preview",
        "Timestamp Converter",
        "QR Code Generator",
        "Word Counter",
        "Case Converter",
      ],
    },
    provider: {
      "@type": "Organization",
      name: "DevTool Platform",
      url: "https://devtool-platform.vercel.app",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <div className="space-y-16">
        {/* Hero Section - SSR for SEO */}
        <section className="text-center space-y-6 py-8 sm:py-16 px-4">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
            100+ Free Developer Tools
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed px-4">
            The ultimate collection of online developer tools. JSON formatter,
            Base64 encoder, regex tester, UUID generator, and many more. All
            tools work in your browser with{" "}
            <strong>no registration required</strong>.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 pt-4 px-4">
            <Link
              href="/tools"
              className="inline-flex items-center px-4 sm:px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors min-h-[44px] w-full sm:w-auto justify-center"
            >
              Browse All Tools
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/tools/json-formatter"
              className="inline-flex items-center px-4 sm:px-6 py-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors min-h-[44px] w-full sm:w-auto justify-center"
            >
              Try JSON Formatter
            </Link>
          </div>
        </section>

        {/* Features Section - SSR for SEO */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-7xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              Why Developers Choose DevTool Platform
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Zap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold">Lightning Fast</h3>
                <p className="text-muted-foreground">
                  All tools process data instantly in your browser. No waiting
                  for server responses or slow uploads. Get results in
                  milliseconds, not seconds.
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <Shield className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold">100% Private</h3>
                <p className="text-muted-foreground">
                  Your data never leaves your device. All processing happens
                  client-side, ensuring complete privacy and security for
                  sensitive information.
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <Globe className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold">Always Available</h3>
                <p className="text-muted-foreground">
                  Access all tools from any device with a modern web browser. No
                  downloads, installations, or account creation required.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Tools Section - SSR for SEO */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-7xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              Most Popular Developer Tools
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredTools.map((tool) => (
                <Link key={tool.id} href={`/tools/${tool.id}`}>
                  <Card className="h-full hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col">
                    <CardHeader className="flex-shrink-0">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">
                          {tool.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg">{tool.name}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <CardDescription className="mb-3 flex-1">
                        {tool.description}
                      </CardDescription>
                      <div className="flex flex-wrap gap-1 mt-auto">
                        {tool.tags.slice(0, 2).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {tool.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{tool.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                href="/tools"
                className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                View All {TOOL_REGISTRY.length} Tools
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Enhanced Tools Section - Client-side for interactivity */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-7xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              Explore All Tools
            </h2>
            <ToolClassificationView defaultView="categories" />
          </div>
        </section>

        {/* SEO Content Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="max-w-4xl mx-auto space-y-12">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold">
                  The Ultimate Developer Tools Collection
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  DevTool Platform brings together 100+ essential developer
                  tools in one fast, secure, and easy-to-use platform. All tools
                  work entirely in your browser with no registration required.
                </p>
              </div>

              <div className="bg-background border rounded-lg p-8">
                <h3 className="text-2xl font-bold mb-6">
                  Popular Developer Tools
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">
                      Text & Data Processing
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>
                        <strong>JSON Formatter:</strong> Pretty print and
                        validate JSON data with syntax highlighting
                      </li>
                      <li>
                        <strong>Base64 Encoder:</strong> Encode and decode
                        Base64 strings for data transmission
                      </li>
                      <li>
                        <strong>URL Encoder:</strong> Safely encode URLs and
                        decode URL-encoded strings
                      </li>
                      <li>
                        <strong>HTML Entities:</strong> Convert HTML entities
                        and special characters
                      </li>
                      <li>
                        <strong>Case Converter:</strong> Transform text between
                        different case formats
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">Development Tools</h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>
                        <strong>Regex Tester:</strong> Test and debug regular
                        expressions with real-time matching
                      </li>
                      <li>
                        <strong>UUID Generator:</strong> Generate unique
                        identifiers for your applications
                      </li>
                      <li>
                        <strong>Hash Generator:</strong> Create MD5, SHA1,
                        SHA256 hashes for data integrity
                      </li>
                      <li>
                        <strong>Password Generator:</strong> Create secure
                        passwords with custom rules
                      </li>
                      <li>
                        <strong>Color Converter:</strong> Convert between HEX,
                        RGB, HSL color formats
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="text-center space-y-4">
                <h3 className="text-2xl font-bold">
                  Why Choose DevTool Platform?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Free Forever</h4>
                    <p className="text-sm text-muted-foreground">
                      All tools are completely free with no hidden costs or
                      premium features
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">No Registration</h4>
                    <p className="text-sm text-muted-foreground">
                      Start using tools immediately without creating accounts or
                      providing emails
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Mobile Friendly</h4>
                    <p className="text-sm text-muted-foreground">
                      Responsive design works perfectly on phones, tablets, and
                      desktop computers
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Regular Updates</h4>
                    <p className="text-sm text-muted-foreground">
                      New tools added regularly based on developer community
                      feedback
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
