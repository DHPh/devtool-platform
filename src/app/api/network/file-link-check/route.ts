import { NextRequest, NextResponse } from "next/server";
import { validateHttpDestination } from "@/lib/server/outbound-destination";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const destination = validateHttpDestination(url);
    if (!destination.allowed) {
      return NextResponse.json(
        {
          url,
          exists: false,
          error: destination.error,
          timestamp: Date.now(),
        },
        { status: 400 },
      );
    }
    const parsedUrl = destination.url;

    try {
      const response = await fetch(parsedUrl.toString(), {
        method: "HEAD",
        headers: {
          "User-Agent": "DevTool-Platform/1.0",
        },
      });

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      const contentLength = response.headers.get("content-length");
      const contentType = response.headers.get("content-type");
      const lastModified = response.headers.get("last-modified");

      return NextResponse.json({
        url: parsedUrl.toString(),
        exists: response.ok,
        statusCode: response.status,
        statusText: response.statusText,
        contentType,
        contentLength: contentLength ? parseInt(contentLength) : undefined,
        lastModified,
        headers,
        timestamp: Date.now(),
      });
    } catch (error) {
      let errorMessage = "Network error";
      if (error instanceof Error) {
        if (error.message.includes("ENOTFOUND")) {
          errorMessage = "Host not found";
        } else if (error.message.includes("ECONNREFUSED")) {
          errorMessage = "Connection refused";
        } else if (error.message.includes("ECONNRESET")) {
          errorMessage = "Connection reset";
        } else {
          errorMessage = error.message;
        }
      }

      return NextResponse.json({
        url: parsedUrl.toString(),
        exists: false,
        error: errorMessage,
        timestamp: Date.now(),
      });
    }
  } catch (error) {
    console.error("File link check API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
