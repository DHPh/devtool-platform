import { ImageResponse } from "next/og";
import { NextRequest, NextResponse } from "next/server";
import { siteConfig } from "@/config/site";
import { TOOL_COUNT, getToolById } from "@/lib/tool-registry";

interface OgCardProps {
  badge: string;
  title: string;
  description: string;
  processingLabel: string;
}

function renderOgCard({
  badge,
  title,
  description,
  processingLabel,
}: OgCardProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        padding: "56px 64px",
        background:
          "linear-gradient(135deg, #09090b 0%, #111827 55%, #1e1b4b 100%)",
        color: "#f8fafc",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              backgroundColor: "#3b82f6",
              color: "#ffffff",
              fontSize: "22px",
              fontWeight: 700,
            }}
          >
            &lt;/&gt;
          </div>
          <span
            style={{
              fontSize: "28px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            {siteConfig.name}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "10px 20px",
            borderRadius: "9999px",
            border: "1px solid rgba(148, 163, 184, 0.35)",
            backgroundColor: "rgba(30, 41, 59, 0.75)",
            color: "#93c5fd",
            fontSize: "20px",
            fontWeight: 600,
          }}
        >
          {badge}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          maxWidth: "980px",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: title.length > 36 ? "52px" : "64px",
            fontWeight: 800,
            lineHeight: 1.12,
            letterSpacing: "-0.03em",
            color: "#ffffff",
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: "28px",
            lineHeight: 1.4,
            color: "#cbd5e1",
          }}
        >
          {description}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          paddingTop: "24px",
          borderTop: "1px solid rgba(148, 163, 184, 0.25)",
          fontSize: "22px",
          color: "#94a3b8",
        }}
      >
        <span>{siteConfig.url}</span>
        <span style={{ color: "#e2e8f0", fontWeight: 600 }}>
          {processingLabel}
        </span>
      </div>
    </div>
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug")?.trim() ?? "";
    const view = searchParams.get("view")?.trim() ?? "";

    const tool = slug ? getToolById(slug) : undefined;
    if (slug && !tool) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }

    const badge = tool
      ? tool.kind === "studio"
        ? `${tool.category} Studio`
        : tool.kind === "studio-subtool"
          ? `${tool.category} Sub-Tool`
          : tool.category
      : view === "tools"
        ? "Tools Directory"
        : `${TOOL_COUNT} Developer Tools`;

    const title = tool
      ? tool.name
      : view === "tools"
        ? `Complete Developer Tools Collection (${TOOL_COUNT})`
        : `${siteConfig.name} — Browser-First Developer Suite`;

    const description = tool ? tool.description : siteConfig.description;

    const processingLabel = tool
      ? tool.processing === "client"
        ? "100% Client-Side"
        : tool.processing === "server"
          ? "Server-Assisted"
          : "Hybrid Execution"
      : "Fast • Private • No Sign-Up";

    return new ImageResponse(
      renderOgCard({ badge, title, description, processingLabel }),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (error) {
    console.error("OG image generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 },
    );
  }
}
