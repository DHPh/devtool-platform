import { NextRequest, NextResponse } from "next/server";
import {
  getSafeOutboundError,
  requestOutbound,
} from "@/lib/server/outbound-request-policy";
import {
  checkNetworkRateLimit,
  logNetworkSecurityEvent,
  networkRateLimitResponse,
} from "@/lib/server/network-security";

const ENDPOINT = "file-link-check";

export async function POST(request: NextRequest) {
  const rateLimit = checkNetworkRateLimit(request, ENDPOINT, { limit: 30 });
  if (!rateLimit.allowed) {
    logNetworkSecurityEvent({ endpoint: ENDPOINT, operation: "file_probe", outcome: "rate_limited", clientId: rateLimit.clientId });
    return networkRateLimitResponse(rateLimit);
  }
  const startedAt = Date.now();
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
      logNetworkSecurityEvent({ endpoint: ENDPOINT, operation: "file_probe", outcome: "completed", clientId: rateLimit.clientId, durationMs: Date.now() - startedAt });

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
      logNetworkSecurityEvent({ endpoint: ENDPOINT, operation: "file_probe", outcome: rejectedInput ? "blocked" : "failed", clientId: rateLimit.clientId, durationMs: Date.now() - startedAt, errorCode: safeError.code });
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
  } catch {
    logNetworkSecurityEvent({ endpoint: ENDPOINT, operation: "file_probe", outcome: "failed", clientId: rateLimit.clientId, durationMs: Date.now() - startedAt, errorCode: "INVALID_REQUEST" });
    return NextResponse.json(
      {
        error: "Invalid request body",
      },
      { status: 400 }
    );
  }
}
