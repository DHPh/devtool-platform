import { NextRequest, NextResponse } from "next/server";
import { getToolById } from "@/lib/tool-registry";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "Missing slug parameter" },
        { status: 400 }
      );
    }

    const tool = getToolById(slug);
    if (!tool) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }

    // TODO: Implement actual image generation with @vercel/og or Canvas API
    // TODO: Create dynamic OG images with tool name, description, and branding
    // TODO: Add tool category, icon, and usage statistics to OG image
    // TODO: Implement caching mechanism for generated images
    // For now, redirect to a placeholder OG image
    const fallbackImageUrl = `https://via.placeholder.com/1200x630/667eea/ffffff?text=${encodeURIComponent(
      tool.name
    )}`;

    return NextResponse.redirect(fallbackImageUrl);
  } catch (error) {
    console.error("OG image generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}
