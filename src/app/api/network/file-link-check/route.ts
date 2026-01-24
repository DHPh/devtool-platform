import { NextRequest, NextResponse } from "next/server";
import {
  getSafeOutboundError,
  requestOutbound,
} from "@/lib/server/outbound-request-policy";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    try {
      const response = await requestOutbound(url, {
        method: "HEAD",
        headers: {
          "user-agent": "DevTool-Platform/1.0",
        },
      });
      const contentLength = response.headers["content-length"];

      return NextResponse.json({
        url: response.url,
        exists: response.status >= 200 && response.status < 400,
        statusCode: response.status,
        statusText: response.statusText,
        contentType: response.headers["content-type"] ?? null,
        contentLength: contentLength ? parseInt(contentLength) : undefined,
        lastModified: response.headers["last-modified"] ?? null,
        headers: response.headers,
        redirectCount: response.redirectCount,
        timestamp: Date.now(),
      });
    } catch (error) {
      const safeError = getSafeOutboundError(error);
      const rejectedInput = [
        "INVALID_URL",
        "UNSUPPORTED_PROTOCOL",
        "CREDENTIALS_NOT_ALLOWED",
        "DESTINATION_BLOCKED",
      ].includes(safeError.code);
      return NextResponse.json(
        {
          url,
          exists: false,
          error: safeError.message,
          errorCode: safeError.code,
          timestamp: Date.now(),
        },
        { status: rejectedInput ? 400 : 200 },
      );
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
