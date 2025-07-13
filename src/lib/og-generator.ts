import { TOOL_REGISTRY } from "@/lib/tool-registry";

// This script generates OpenGraph image metadata for all tools
// You can use this data with an image generation service like Vercel OG or Cloudinary

export function generateOGImageData() {
  return TOOL_REGISTRY.map((tool) => ({
    slug: tool.id,
    title: tool.name,
    description: tool.description,
    icon: tool.icon,
    category: tool.category,
    tags: tool.tags.slice(0, 3), // Limit to first 3 tags for image
    template: "tool", // Template type for image generation
    colors: getCategoryColors(tool.category),
    dimensions: {
      width: 1200,
      height: 630,
    },
  }));
}

function getCategoryColors(category: string) {
  const colorMap: Record<string, { bg: string; accent: string; text: string }> =
    {
      Text: { bg: "#1e293b", accent: "#3b82f6", text: "#ffffff" },
      Data: { bg: "#166534", accent: "#22c55e", text: "#ffffff" },
      Crypto: { bg: "#7c2d12", accent: "#f97316", text: "#ffffff" },
      Web: { bg: "#581c87", accent: "#a855f7", text: "#ffffff" },
      Network: { bg: "#0f172a", accent: "#06b6d4", text: "#ffffff" },
      Image: { bg: "#4c1d95", accent: "#8b5cf6", text: "#ffffff" },
      Development: { bg: "#1f2937", accent: "#10b981", text: "#ffffff" },
      Utility: { bg: "#374151", accent: "#6b7280", text: "#ffffff" },
    };

  return colorMap[category] || colorMap["Utility"];
}

// Example usage for Vercel OG API route
export function createOGImageApiRoute() {
  return `
import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { getToolById } from '@/lib/tool-registry';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    
    if (!slug) {
      return new Response('Missing slug parameter', { status: 400 });
    }
    
    const tool = getToolById(slug);
    if (!tool) {
      return new Response('Tool not found', { status: 404 });
    }
    
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 48,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            color: 'white',
            textAlign: 'center',
            padding: '40px',
          }}
        >
          <div style={{ fontSize: 96, marginBottom: 20 }}>
            {tool.icon}
          </div>
          <div style={{ fontSize: 56, fontWeight: 'bold', marginBottom: 20 }}>
            {tool.name}
          </div>
          <div style={{ fontSize: 32, opacity: 0.9, lineHeight: 1.4, maxWidth: 800 }}>
            {tool.description}
          </div>
          <div style={{ fontSize: 24, marginTop: 40, opacity: 0.8 }}>
            DevTool Platform
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(\`Failed to generate image: \${e.message}\`);
    return new Response(\`Failed to generate image\`, {
      status: 500,
    });
  }
}
`;
}

// Generate HTML meta tags for tool pages
export function generateToolMetaTags(toolSlug: string) {
  const tool = TOOL_REGISTRY.find((t) => t.id === toolSlug);
  if (!tool) return "";

  const keywords = [
    tool.name.toLowerCase(),
    ...tool.tags,
    "developer tools",
    "online tools",
    "free tools",
    "web tools",
    `${tool.name.toLowerCase()} online`,
    `free ${tool.name.toLowerCase()}`,
    `online ${tool.name.toLowerCase()} tool`,
  ].join(", ");

  return `
<!-- SEO Meta Tags -->
<title>${tool.name} - Free Online Tool | DevTool Platform</title>
<meta name="description" content="${
    tool.description
  } Free online ${tool.name.toLowerCase()} tool. No registration required, works in your browser." />
<meta name="keywords" content="${keywords}" />
<meta name="author" content="DevTool Platform" />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="https://devtool-platform.vercel.app/tools/${toolSlug}" />

<!-- OpenGraph Meta Tags -->
<meta property="og:title" content="${tool.name} - Free Online Tool" />
<meta property="og:description" content="${
    tool.description
  } Free online ${tool.name.toLowerCase()} tool. No registration required." />
<meta property="og:url" content="https://devtool-platform.vercel.app/tools/${toolSlug}" />
<meta property="og:site_name" content="DevTool Platform" />
<meta property="og:type" content="website" />
<meta property="og:image" content="https://devtool-platform.vercel.app/api/og?slug=${toolSlug}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="${tool.name} - DevTool Platform" />

<!-- Twitter Meta Tags -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${tool.name} - Free Online Tool" />
<meta name="twitter:description" content="${
    tool.description
  } Free online ${tool.name.toLowerCase()} tool." />
<meta name="twitter:image" content="https://devtool-platform.vercel.app/api/og?slug=${toolSlug}" />

<!-- Structured Data -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "${tool.name}",
  "description": "${tool.description}",
  "url": "https://devtool-platform.vercel.app/tools/${toolSlug}",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "provider": {
    "@type": "Organization",
    "name": "DevTool Platform"
  },
  "isPartOf": {
    "@type": "WebSite",
    "name": "DevTool Platform",
    "url": "https://devtool-platform.vercel.app"
  }
}
</script>
`;
}
