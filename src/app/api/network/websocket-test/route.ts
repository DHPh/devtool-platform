import { NextRequest, NextResponse } from "next/server";
import { WebSocket } from "ws";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { url, timeout = 10 } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "WebSocket URL is required" },
        { status: 400 }
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!["ws:", "wss:"].includes(parsedUrl.protocol)) {
        return NextResponse.json({
          url,
          connected: false,
          error: "Invalid WebSocket protocol. Use ws:// or wss://",
          timestamp: Date.now(),
        });
      }
    } catch {
      return NextResponse.json({
        url,
        connected: false,
        error: "Invalid URL format",
        timestamp: Date.now(),
      });
    }

    const startTime = Date.now();

    return new Promise((resolve) => {
      let resolved = false;

      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(
            NextResponse.json({
              url: parsedUrl.toString(),
              connected: false,
              error: `Connection timeout after ${timeout}s`,
              responseTime: Date.now() - startTime,
              timestamp: Date.now(),
            })
          );
        }
      }, timeout * 1000);

      try {
        const ws = new WebSocket(parsedUrl.toString(), {
          handshakeTimeout: timeout * 1000,
        });

        ws.on("open", () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);

            const responseTime = Date.now() - startTime;
            ws.close();

            resolve(
              NextResponse.json({
                url: parsedUrl.toString(),
                connected: true,
                responseTime,
                protocol: ws.protocol || "unknown",
                timestamp: Date.now(),
              })
            );
          }
        });

        ws.on("error", (error: Error) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);

            let errorMessage = "WebSocket connection failed";
            if (error.message.includes("ENOTFOUND")) {
              errorMessage = "Host not found";
            } else if (error.message.includes("ECONNREFUSED")) {
              errorMessage = "Connection refused";
            } else if (error.message.includes("certificate")) {
              errorMessage = "SSL certificate error";
            } else if (error.message) {
              errorMessage = error.message;
            }

            resolve(
              NextResponse.json({
                url: parsedUrl.toString(),
                connected: false,
                error: errorMessage,
                responseTime: Date.now() - startTime,
                timestamp: Date.now(),
              })
            );
          }
        });

        ws.on("close", (code: number, reason: Buffer) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);

            resolve(
              NextResponse.json({
                url: parsedUrl.toString(),
                connected: false,
                error: `Connection closed: ${code} ${reason.toString()}`,
                responseTime: Date.now() - startTime,
                timestamp: Date.now(),
              })
            );
          }
        });
      } catch (error) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);

          resolve(
            NextResponse.json({
              url: parsedUrl.toString(),
              connected: false,
              error: error instanceof Error ? error.message : "Unknown error",
              responseTime: Date.now() - startTime,
              timestamp: Date.now(),
            })
          );
        }
      }
    });
  } catch (error) {
    console.error("WebSocket test API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
