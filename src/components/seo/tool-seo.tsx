import { ToolMetadata } from "@/lib/tool-registry";
import { serializeJsonForHtml } from "@/lib/security/safe-json";

interface ToolSEOProps {
  tool: ToolMetadata;
  slug: string;
}

export function ToolSEO({ tool, slug }: ToolSEOProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.name,
    description: tool.description,
    url: `https://devtool-platform.vercel.app/tools/${slug}`,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    provider: {
      "@type": "Organization",
      name: "DevTool Platform",
      url: "https://devtool-platform.vercel.app",
    },
    isPartOf: {
      "@type": "WebSite",
      name: "DevTool Platform",
      url: "https://devtool-platform.vercel.app",
    },
    keywords: tool.tags.join(", "),
    mainEntity: {
      "@type": "SoftwareApplication",
      name: tool.name,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web Browser",
      description: tool.description,
      url: `https://devtool-platform.vercel.app/tools/${slug}`,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
  };

  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://devtool-platform.vercel.app",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Tools",
        item: "https://devtool-platform.vercel.app/tools",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: tool.name,
        item: `https://devtool-platform.vercel.app/tools/${slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonForHtml(structuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonForHtml(breadcrumbStructuredData),
        }}
      />

      {/* Preconnect to important domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />

      {/* Tool-specific meta tags */}
      <meta name="tool-category" content={tool.category} />
      <meta name="tool-tags" content={tool.tags.join(", ")} />
      <meta name="format-detection" content="telephone=no" />

      {/* Canonical URL */}
      <link
        rel="canonical"
        href={`https://devtool-platform.vercel.app/tools/${slug}`}
      />

      {/* Alternate languages (if you support multiple languages) */}
      <link
        rel="alternate"
        hrefLang="en"
        href={`https://devtool-platform.vercel.app/tools/${slug}`}
      />

      {/* Prefetch related tools */}
      <link rel="prefetch" href="/tools" />
    </>
  );
}
