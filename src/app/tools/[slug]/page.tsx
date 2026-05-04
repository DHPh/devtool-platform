import { notFound } from "next/navigation";
import { ToolFrame } from "@/components/tool-frame";
import { ToolRenderer } from "@/components/tool-renderer";
import {
  isToolComponentId,
  TOOL_COMPONENT_IDS,
} from "@/lib/tool-component-ids";
import { getToolById, TOOL_REGISTRY } from "@/lib/tool-registry";
import { assertValidToolRegistry } from "@/lib/validate-tool-registry";
import { getAbsoluteUrl, getOgImageUrl, siteConfig } from "@/config/site";

assertValidToolRegistry(TOOL_REGISTRY, TOOL_COMPONENT_IDS);

interface ToolPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return TOOL_COMPONENT_IDS.map((slug) => ({
    slug: slug,
  }));
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getToolById(slug);

  if (!tool || !isToolComponentId(slug)) {
    notFound();
  }

  return (
    <ToolFrame tool={tool}>
      <ToolRenderer slug={slug} />
    </ToolFrame>
  );
}

export async function generateMetadata({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getToolById(slug);

  if (!tool) {
    return {
      title: "Tool Not Found",
    };
  }

  const toolKeywords = [
    tool.name.toLowerCase(),
    `${tool.name.toLowerCase()} online`,
    `free ${tool.name.toLowerCase()}`,
    `online ${tool.name.toLowerCase()} tool`,
    `${tool.name.toLowerCase()} free`,
    ...tool.tags.map((tag) => `${tag} tool`),
    ...tool.tags,
    "developer tools",
    "online tools",
    "free tools",
    "web tools",
    "no registration",
    "browser tool",
    "instant tool",
  ];
  const canonicalUrl = getAbsoluteUrl(tool.path);
  const ogImageUrl = getOgImageUrl(slug);

  // Enhanced structured data with more details
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.name,
    description: tool.description,
    url: canonicalUrl,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web Browser",
    browserRequirements: "Modern web browser with JavaScript enabled",
    permissions: "none",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      validFrom: new Date().toISOString(),
    },
    provider: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    isPartOf: {
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    featureList: tool.tags,
    screenshot: ogImageUrl,
    softwareVersion: "1.0",
    datePublished: "2024-01-01",
    dateModified: new Date().toISOString().split("T")[0],
    inLanguage: "en-US",
    creativeWorkStatus: "Published",
  };

  // Add HowTo structured data for tools
  const howToStructuredData = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to use ${tool.name}`,
    description: `Step-by-step guide on using the ${tool.name} tool`,
    image: ogImageUrl,
    totalTime: "PT2M",
    estimatedCost: {
      "@type": "MonetaryAmount",
      currency: "USD",
      value: "0",
    },
    supply: [
      {
        "@type": "HowToSupply",
        name: "Web Browser",
      },
    ],
    tool: [
      {
        "@type": "HowToTool",
        name: tool.name,
      },
    ],
    step: getToolSteps(slug, tool.name, canonicalUrl),
  };

  return {
    title: `${tool.name} - Free Online Tool | ${siteConfig.name}`,
    description: `${
      tool.description
    } Free online ${tool.name.toLowerCase()} tool. No registration required, works in your browser. Fast, secure, and private.`,
    keywords: toolKeywords,
    authors: [{ name: siteConfig.name }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    category: "Technology",
    classification: "Developer Tools",
    alternates: {
      canonical: canonicalUrl,
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
      title: `${tool.name} - Free Online Tool`,
      description: `${
        tool.description
      } Free online ${tool.name.toLowerCase()} tool. No registration required.`,
      url: canonicalUrl,
      siteName: siteConfig.name,
      type: "website",
      locale: "en_US",
      images: [
        {
          url: `/api/og?slug=${encodeURIComponent(slug)}`,
          width: 1200,
          height: 630,
          alt: `${tool.name} - ${siteConfig.name}`,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: siteConfig.twitter.site,
      creator: siteConfig.twitter.handle,
      title: `${tool.name} - Free Online Tool`,
      description: `${
        tool.description
      } Free online ${tool.name.toLowerCase()} tool.`,
      images: [`/api/og?slug=${encodeURIComponent(slug)}`],
    },
    other: {
      "application/ld+json": JSON.stringify([
        structuredData,
        howToStructuredData,
      ]),
    },
  };
}

// Helper function to get step-by-step instructions for tools
function getToolSteps(slug: string, toolName: string, canonicalUrl: string) {
  const commonSteps = [
    {
      "@type": "HowToStep",
      name: "Access the tool",
      text: `Navigate to the ${toolName} page on DevTool Platform`,
      url: canonicalUrl,
    },
  ];

  const toolSpecificSteps: Record<
    string,
    Array<{ "@type": string; name: string; text: string; url?: string }>
  > = {
    "json-formatter": [
      ...commonSteps,
      {
        "@type": "HowToStep",
        name: "Paste JSON data",
        text: "Paste your JSON data into the input textarea",
      },
      {
        "@type": "HowToStep",
        name: "Choose format option",
        text: "Select whether to format (pretty print) or minify the JSON",
      },
      {
        "@type": "HowToStep",
        name: "View result",
        text: "See the formatted or minified JSON in the output area",
      },
    ],
    "regex-tester": [
      ...commonSteps,
      {
        "@type": "HowToStep",
        name: "Enter regex pattern",
        text: "Type your regular expression pattern in the pattern field",
      },
      {
        "@type": "HowToStep",
        name: "Add test text",
        text: "Paste or type the text you want to test against your regex",
      },
      {
        "@type": "HowToStep",
        name: "Configure flags",
        text: "Set appropriate flags like global, ignore case, multiline as needed",
      },
      {
        "@type": "HowToStep",
        name: "View matches",
        text: "See all matches, capturing groups, and match positions in real-time",
      },
    ],
    "base64-encoder": [
      ...commonSteps,
      {
        "@type": "HowToStep",
        name: "Enter text to encode",
        text: "Type or paste the text you want to encode in Base64",
      },
      {
        "@type": "HowToStep",
        name: "Choose operation",
        text: "Select encode to convert to Base64 or decode to convert from Base64",
      },
      {
        "@type": "HowToStep",
        name: "Copy result",
        text: "Copy the encoded or decoded result from the output area",
      },
    ],
  };

  return (
    toolSpecificSteps[slug] || [
      ...commonSteps,
      {
        "@type": "HowToStep",
        name: "Use the tool",
        text: `Follow the on-screen instructions to use the ${toolName} tool`,
      },
      {
        "@type": "HowToStep",
        name: "Get results",
        text: "View or copy your results from the output section",
      },
    ]
  );
}
