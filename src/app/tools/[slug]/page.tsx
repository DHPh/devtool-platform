import { notFound } from "next/navigation";
import { ToolFrame } from "@/components/tool-frame";
import { getToolById } from "@/lib/tool-registry";
import { JsonFormatter } from "@/lib/tools/json-formatter";
import Base64Encoder from "@/lib/tools/base64-encoder";
import { RegexStudio } from "@/lib/tools/regex-studio";
import UuidGenerator from "@/lib/tools/uuid-generator";
import TimestampConverter from "@/lib/tools/timestamp-converter";
import { PasswordStudio } from "@/lib/tools/password-studio/PasswordStudio";
import ColorConverter from "@/lib/tools/color-converter";
import CaseConverter from "@/lib/tools/case-converter";
import UrlEncoder from "@/lib/tools/url-encoder";
import WordCounter from "@/lib/tools/word-counter";
import QrGenerator from "@/lib/tools/qr-generator";
import JsonValidator from "@/lib/tools/json-validator";
import HtmlEntities from "@/lib/tools/html-entities";
import LoremIpsum from "@/lib/tools/lorem-ipsum";
import EmailValidator from "@/lib/tools/email-validator";
import HtmlFormatter from "@/lib/tools/html-formatter";
import DiffChecker from "@/lib/tools/diff-checker";
import CssFormatter from "@/lib/tools/css-formatter";
import MarkdownPreview from "@/lib/tools/markdown-preview";
import CsvViewer from "@/lib/tools/csv-viewer";
import JsonTableViewer from "@/lib/tools/json-table-viewer";
import DataExplorer from "@/lib/tools/data-explorer";
import RandomWheel from "@/lib/tools/random-wheel";
import { JsonStudio } from "@/lib/tools/json-studio/index";
import ColorStudio from "@/lib/tools/color-studio/ColorStudio";
import { NetworkStudio } from "@/lib/tools/network-studio";
import FileProcessingStudio from "@/lib/tools/file-processing/FileProcessingStudio";
import IconPackGenerator from "@/lib/tools/icon-pack-generator";

// Tool component mapping
const TOOL_COMPONENTS: Record<string, React.ComponentType> = {
  "json-formatter": JsonFormatter,
  "base64-encoder": Base64Encoder,
  "regex-studio": RegexStudio,
  "uuid-generator": UuidGenerator,
  "timestamp-converter": TimestampConverter,
  "password-studio": PasswordStudio,
  "color-studio": ColorStudio,
  "color-converter": ColorConverter,
  "case-converter": CaseConverter,
  "url-encoder": UrlEncoder,
  "word-counter": WordCounter,
  "qr-generator": QrGenerator,
  "json-validator": JsonValidator,
  "html-entities": HtmlEntities,
  "lorem-ipsum": LoremIpsum,
  "email-validator": EmailValidator,
  "html-formatter": HtmlFormatter,
  "diff-checker": DiffChecker,
  "css-formatter": CssFormatter,
  "markdown-preview": MarkdownPreview,
  "csv-viewer": CsvViewer,
  "json-table-viewer": JsonTableViewer,
  "data-explorer": DataExplorer,
  "random-wheel": RandomWheel,
  "json-studio": JsonStudio,
  "network-studio": NetworkStudio,
  "file-processing-studio": FileProcessingStudio,
  "icon-pack-generator": IconPackGenerator,
};

interface ToolPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return Object.keys(TOOL_COMPONENTS).map((slug) => ({
    slug: slug,
  }));
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getToolById(slug);

  if (!tool || !TOOL_COMPONENTS[slug]) {
    notFound();
  }

  const ToolComponent = TOOL_COMPONENTS[slug];

  return (
    <ToolFrame tool={tool}>
      <ToolComponent />
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

  // Enhanced structured data with more details
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.name,
    description: tool.description,
    url: `https://devtool-platform.vercel.app/tools/${slug}`,
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
      name: "DevTool Platform",
      url: "https://devtool-platform.vercel.app",
    },
    isPartOf: {
      "@type": "WebSite",
      name: "DevTool Platform",
      url: "https://devtool-platform.vercel.app",
    },
    featureList: tool.tags,
    screenshot: `https://devtool-platform.vercel.app/screenshots/${slug}.png`,
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
    image: `https://devtool-platform.vercel.app/screenshots/${slug}.png`,
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
    step: getToolSteps(slug, tool.name),
  };

  return {
    title: `${tool.name} - Free Online Tool | DevTool Platform`,
    description: `${
      tool.description
    } Free online ${tool.name.toLowerCase()} tool. No registration required, works in your browser. Fast, secure, and private.`,
    keywords: toolKeywords,
    authors: [{ name: "DevTool Platform" }],
    creator: "DevTool Platform",
    publisher: "DevTool Platform",
    category: "Technology",
    classification: "Developer Tools",
    alternates: {
      canonical: `https://devtool-platform.vercel.app/tools/${slug}`,
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
      url: `https://devtool-platform.vercel.app/tools/${slug}`,
      siteName: "DevTool Platform",
      type: "website",
      locale: "en_US",
      images: [
        {
          url: `/api/og?slug=${slug}`,
          width: 1200,
          height: 630,
          alt: `${tool.name} - DevTool Platform`,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@devtoolplatform",
      creator: "@devtoolplatform",
      title: `${tool.name} - Free Online Tool`,
      description: `${
        tool.description
      } Free online ${tool.name.toLowerCase()} tool.`,
      images: [`/api/og?slug=${slug}`],
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
function getToolSteps(slug: string, toolName: string) {
  const commonSteps = [
    {
      "@type": "HowToStep",
      name: "Access the tool",
      text: `Navigate to the ${toolName} page on DevTool Platform`,
      url: `https://devtool-platform.vercel.app/tools/${slug}`,
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
