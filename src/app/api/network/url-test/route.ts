import { NextRequest, NextResponse } from "next/server";
import { validateHttpDestination } from "@/lib/server/outbound-destination";

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { url, timeout = 30 } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    console.log("URL test request:", { url, timeout });

    const startTime = Date.now();
    const destination = validateHttpDestination(url);
    if (!destination.allowed) {
      return NextResponse.json(
        {
          url,
          accessible: false,
          error: destination.error,
          timestamp: Date.now(),
        },
        { status: 400 },
      );
    }
    const parsedUrl = destination.url;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout * 1000);

      // Try HEAD request first, fallback to GET if HEAD fails
      let response;
      try {
        response = await fetch(parsedUrl.toString(), {
          method: "HEAD",
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            Accept: "*/*",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            DNT: "1",
            Connection: "keep-alive",
            "Upgrade-Insecure-Requests": "1",
          },
        });
      } catch (headError) {
        console.log("HEAD request failed, trying GET:", headError);
        // If HEAD fails, try GET with range to limit download
        response = await fetch(parsedUrl.toString(), {
          method: "GET",
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            Accept: "*/*",
            Range: "bytes=0-1023", // Only download first 1KB
          },
        });
      }

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      return NextResponse.json({
        url: parsedUrl.toString(),
        accessible: true,
        statusCode: response.status,
        statusText: response.statusText,
        responseTime,
        headers: Object.fromEntries(response.headers.entries()),
        contentType: response.headers.get("content-type"),
        server: response.headers.get("server"),
        timestamp: Date.now(),
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;

      let errorMessage = "Network error";
      const statusCode = 0;

      if (error instanceof Error) {
        console.log("URL test error:", error.message);

        if (error.name === "AbortError") {
          errorMessage = `Request timeout after ${timeout}s`;
        } else if (error.message.includes("ENOTFOUND")) {
          errorMessage = "Host not found (DNS resolution failed)";
        } else if (error.message.includes("ECONNREFUSED")) {
          errorMessage = "Connection refused by server";
        } else if (error.message.includes("ECONNRESET")) {
          errorMessage = "Connection reset by server";
        } else if (error.message.includes("ECONNABORTED")) {
          errorMessage = "Connection aborted";
        } else if (error.message.includes("ETIMEDOUT")) {
          errorMessage = "Connection timeout";
        } else if (error.message.includes("CERT_")) {
          errorMessage = "SSL/TLS certificate error";
        } else if (error.message.includes("fetch failed")) {
          errorMessage =
            "Network request failed - server may be blocking automated requests";
        } else {
          errorMessage = error.message;
        }
      }

      return NextResponse.json({
        url: parsedUrl.toString(),
        accessible: false,
        error: errorMessage,
        statusCode,
        responseTime,
        timestamp: Date.now(),
      });
    }
  } catch (error) {
    console.error("URL test API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
