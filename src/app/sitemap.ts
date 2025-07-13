import { MetadataRoute } from "next";
import { TOOL_REGISTRY, ToolMetadata } from "@/lib/tool-registry";
import { siteConfig } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url;
  const tools = TOOL_REGISTRY;

  // Main pages
  const mainPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/tools`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  // Tool pages
  const toolPages: MetadataRoute.Sitemap = tools.map((tool: ToolMetadata) => ({
    url: `${baseUrl}/tools/${tool.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  // Category pages (if you have them)
  const categories = Array.from(
    new Set(tools.map((tool: ToolMetadata) => tool.category))
  );
  const categoryPages: MetadataRoute.Sitemap = categories.map(
    (category: string) => ({
      url: `${baseUrl}/category/${category.toLowerCase().replace(/\s+/g, "-")}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })
  );

  return [...mainPages, ...toolPages, ...categoryPages];
}
