import { NextRequest, NextResponse } from "next/server";
import {
  getSafeOutboundError,
  requestOutbound,
} from "@/lib/server/outbound-request-policy";
import {
  boundedNetworkNumber,
  checkNetworkRateLimit,
  logNetworkSecurityEvent,
  networkRateLimitResponse,
} from "@/lib/server/network-security";

const ENDPOINT = "ping";

export async function POST(request: NextRequest) {
  const rateLimit = checkNetworkRateLimit(request, ENDPOINT, { limit: 20 });
  if (!rateLimit.allowed) {
    logNetworkSecurityEvent({
      endpoint: ENDPOINT,
      operation: "http_probe",
      outcome: "rate_limited",
      clientId: rateLimit.clientId,
    });
    return networkRateLimitResponse(rateLimit);
  }

  const startedAt = Date.now();
  try {
    const { host, timeout = 5_000 } = await request.json();
    if (typeof host !== "string" || !host.trim()) {
      return NextResponse.json({ error: "Host is required" }, { status: 400 });
    }

    const target = /^https?:\/\//i.test(host.trim())
      ? host.trim()
      : `https://${host.trim()}`;
    const timeoutMs = boundedNetworkNumber(timeout, 5_000, 100, 10_000);

    try {
      const response = await requestOutbound(target, {
        method: "HEAD",
        totalTimeoutMs: timeoutMs,
        responseTimeoutMs: timeoutMs,
        maxResponseBytes: 0,
      });
      const responseTime = Date.now() - startedAt;
      logNetworkSecurityEvent({
        endpoint: ENDPOINT,
        operation: "http_probe",
        outcome: "completed",
        clientId: rateLimit.clientId,
        durationMs: responseTime,
      });
      return NextResponse.json({
        host,
        alive: true,
        responseTime,
        method: "HTTP HEAD",
        statusCode: response.status,
        timestamp: Date.now(),
      });
    } catch (error) {
      const safeError = getSafeOutboundError(error);
      logNetworkSecurityEvent({
        endpoint: ENDPOINT,
        operation: "http_probe",
        outcome: safeError.code === "DESTINATION_BLOCKED" ? "blocked" : "failed",
        clientId: rateLimit.clientId,
        durationMs: Date.now() - startedAt,
        errorCode: safeError.code,
      });
      const rejected = [
        "INVALID_URL",
        "UNSUPPORTED_PROTOCOL",
        "CREDENTIALS_NOT_ALLOWED",
        "DESTINATION_BLOCKED",
      ].includes(safeError.code);
      return NextResponse.json(
        {
          host,
          alive: false,
          error: safeError.message,
          errorCode: safeError.code,
          method: "HTTP HEAD",
          timestamp: Date.now(),
        },
        { status: rejected ? 400 : 200 },
      );
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
