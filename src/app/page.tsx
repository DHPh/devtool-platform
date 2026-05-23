import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ToolMonogram } from "@/components/ui/tool-badge";
import { ToolClassificationView } from "@/components/tool-classification-view";
import { getAbsoluteUrl, siteConfig } from "@/config/site";
import { serializeJsonForHtml } from "@/lib/security/safe-json";
import { TOOL_COUNT } from "@/lib/tool-registry";
import { getAllStudiosWithSubTools } from "@/lib/tool-visuals";

export const metadata: Metadata = {
  title: `${siteConfig.name} - ${TOOL_COUNT} Free Online Developer Tools`,
  description:
    `Explore ${TOOL_COUNT} free online developer tools and studio utilities, including JSON formatting, Base64 encoding, regex testing, UUID generation, and network diagnostics. No registration required.`,
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
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: "Technology",
  alternates: {
    canonical: siteConfig.url,
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
    title: `${siteConfig.name} - ${TOOL_COUNT} Free Online Developer Tools`,
    description:
      `Explore ${TOOL_COUNT} free online developer tools and studio utilities. No registration required.`,
    url: siteConfig.url,
    siteName: siteConfig.name,
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/api/og?view=home",
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} - ${TOOL_COUNT} Free Online Developer Tools`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: siteConfig.twitter.site,
    creator: siteConfig.twitter.handle,
    title: `${siteConfig.name} - ${TOOL_COUNT} Free Online Developer Tools`,
    description:
      `Explore ${TOOL_COUNT} free online developer tools and studio utilities. No registration required.`,
    images: ["/api/og?view=home"],
  },
};

export default function HomePage() {
  const studios = getAllStudiosWithSubTools();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    description: `A collection of ${TOOL_COUNT} free online developer tools and studio utilities`,
    url: siteConfig.url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: getAbsoluteUrl("/tools?search={search_term_string}"),
      },
      "query-input": "required name=search_term_string",
    },
    mainEntity: {
      "@type": "SoftwareApplication",
      name: siteConfig.name,
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
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonForHtml(structuredData),
        }}
      />
      <div className="max-w-[var(--workspace-max-w)] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Compact Workbench Header */}
        <section className="pb-6 border-b border-border flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 font-mono text-xs text-primary">
              <span>LOCAL-FIRST DEVELOPER WORKBENCH</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground tabular-nums">
                {studios.length} STUDIOS · {TOOL_COUNT} UTILITIES
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              {TOOL_COUNT} Free Developer Tools
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Formatters, encoders, validators, and network diagnostics in one
              keyboard-driven workspace. Most tools run locally in your browser;
              network tools contact servers or external services when required.
              No registration needed.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              href="/tools"
              className="inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-4 py-2 text-xs sm:text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors min-h-[38px]"
            >
              Browse All Tools
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/tools/json-studio"
              className="inline-flex items-center justify-center rounded-sm border border-border bg-card px-4 py-2 text-xs sm:text-sm font-medium text-foreground hover:bg-surface-elevated transition-colors min-h-[38px]"
            >
              Open JSON Studio
            </Link>
          </div>
        </section>

        {/* 12 Studios Directory */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Studios ({studios.length})
            </h2>
            <Link
              href="/tools"
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Full catalog →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {studios.map(({ studio, shortCode, subTools }) => (
              <div
                key={studio.id}
                className="flex flex-col justify-between rounded-md border border-border bg-card p-3.5 transition-colors hover:border-border-strong"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={studio.path}
                      className="flex items-center gap-2.5 min-w-0 group"
                    >
                      <ToolMonogram code={shortCode} size="sm" />
                      <span className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                        {studio.name}
                      </span>
                    </Link>
                    <Badge
                      variant="secondary"
                      className="font-mono text-[11px] tabular-nums shrink-0"
                    >
                      {subTools.length}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {studio.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-border flex flex-wrap gap-1.5">
                  {subTools.slice(0, 3).map((sub) => (
                    <Link
                      key={sub.id}
                      href={sub.path}
                      className="rounded-sm border border-border bg-surface-sunken px-1.5 py-0.5 text-[11px] text-muted-foreground hover:border-border-strong hover:text-foreground transition-colors truncate max-w-[130px]"
                    >
                      {sub.name}
                    </Link>
                  ))}
                  {subTools.length > 3 && (
                    <Link
                      href={studio.path}
                      className="px-1 py-0.5 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors"
                    >
                      +{subTools.length - 3}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Interactive Explorer */}
        <section className="space-y-3 pt-2 border-t border-border">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Explore All Tools
          </h2>
          <ToolClassificationView defaultView="categories" />
        </section>
      </div>
    </>
  );
}
