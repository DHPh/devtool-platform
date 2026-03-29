import { NextRequest, NextResponse } from "next/server";
import { readBoundedJson } from "@/lib/server/bounded-json";
import {
  getSafeOutboundError,
  requestOutbound,
} from "@/lib/server/outbound-request-policy";
import {
  checkNetworkRateLimit,
  logNetworkSecurityEvent,
  networkRateLimitResponse,
} from "@/lib/server/network-security";

const ENDPOINT = "url-test";

export async function POST(request: NextRequest) {
  const rateLimit = checkNetworkRateLimit(request, ENDPOINT, { limit: 30 });
  if (!rateLimit.allowed) {
    logNetworkSecurityEvent({ endpoint: ENDPOINT, operation: "http_probe", outcome: "rate_limited", clientId: rateLimit.clientId });
    return networkRateLimitResponse(rateLimit);
  }
  const parsed = await readBoundedJson<{ url?: unknown; timeout?: unknown }>(
    request,
  );
  if (!parsed.ok) {
    logNetworkSecurityEvent({ endpoint: ENDPOINT, operation: "http_probe", outcome: "failed", clientId: rateLimit.clientId, errorCode: "INVALID_REQUEST" });
    return parsed.response;
  }

  try {
    const { url, timeout = 30 } = parsed.data;

    if (typeof url !== "string" || !url.trim()) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const startTime = Date.now();
    try {
      const timeoutMs = Math.min(
        Math.max(Math.floor(Number(timeout) * 1_000), 1),
        30_000,
      );
      const requestHeaders = {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9," +
          "image/avif,image/webp,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.5",
      };
      let response = await requestOutbound(url, {
        method: "HEAD",
        headers: requestHeaders,
        totalTimeoutMs: timeoutMs,
        responseTimeoutMs: timeoutMs,
      });

      if (response.status === 405 || response.status === 406) {
        const remainingMs = Math.max(
          1,
          timeoutMs - (Date.now() - startTime),
        );
        response = await requestOutbound(url, {
          method: "GET",
          headers: {
            ...requestHeaders,
            range: "bytes=0-1023",
          },
          totalTimeoutMs: remainingMs,
          responseTimeoutMs: remainingMs,
        });
      }
      const responseTime = Date.now() - startTime;
      logNetworkSecurityEvent({ endpoint: ENDPOINT, operation: "http_probe", outcome: "completed", clientId: rateLimit.clientId, durationMs: responseTime });

      return NextResponse.json({
        url: response.url,
        accessible: true,
        statusCode: response.status,
        statusText: response.statusText,
        responseTime,
        headers: response.headers,
        contentType: response.headers["content-type"] ?? null,
        server: response.headers.server ?? null,
        redirectCount: response.redirectCount,
        timestamp: Date.now(),
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const safeError = getSafeOutboundError(error);
      const rejectedInput = [
        "INVALID_URL",
        "UNSUPPORTED_PROTOCOL",
        "CREDENTIALS_NOT_ALLOWED",
        "DESTINATION_BLOCKED",
      ].includes(safeError.code);
      logNetworkSecurityEvent({ endpoint: ENDPOINT, operation: "http_probe", outcome: rejectedInput ? "blocked" : "failed", clientId: rateLimit.clientId, durationMs: responseTime, errorCode: safeError.code });

      return NextResponse.json(
        {
          url,
          accessible: false,
          error: safeError.message,
          errorCode: safeError.code,
          statusCode: 0,
          responseTime,
          timestamp: Date.now(),
        },
        { status: rejectedInput ? 400 : 200 },
      );
    }
  } catch {
    logNetworkSecurityEvent({ endpoint: ENDPOINT, operation: "http_probe", outcome: "failed", clientId: rateLimit.clientId, errorCode: "INTERNAL_ERROR" });
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
