import { NextRequest, NextResponse } from "next/server";
import { readBoundedJson } from "@/lib/server/bounded-json";
import { WebSocket } from "ws";
import {
  getSafeOutboundError,
  OutboundRequestError,
  resolvePublicAddresses,
} from "@/lib/server/outbound-request-policy";
import {
  boundedNetworkNumber,
  checkNetworkRateLimit,
  logNetworkSecurityEvent,
  networkRateLimitResponse,
} from "@/lib/server/network-security";

const ENDPOINT = "websocket-test";

function parseWebSocketUrl(input: string): URL {
  let url: URL;
  try {
    url = new URL(input);
  } catch (error) {
    throw new OutboundRequestError("INVALID_URL", { cause: error });
  }
  if (url.protocol !== "ws:" && url.protocol !== "wss:") {
    throw new OutboundRequestError("UNSUPPORTED_PROTOCOL");
  }
  if (url.username || url.password) {
    throw new OutboundRequestError("CREDENTIALS_NOT_ALLOWED");
  }
  return url;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rateLimit = checkNetworkRateLimit(request, ENDPOINT, { limit: 15 });
  if (!rateLimit.allowed) {
    logNetworkSecurityEvent({ endpoint: ENDPOINT, operation: "websocket_handshake", outcome: "rate_limited", clientId: rateLimit.clientId });
    return networkRateLimitResponse(rateLimit);
  }
  const startedAt = Date.now();
  const parsed = await readBoundedJson<{ url?: unknown; timeout?: unknown }>(
    request,
  );
  if (!parsed.ok) return parsed.response;

  try {
    const { url: input, timeout = 10 } = parsed.data;
    if (typeof input !== "string" || !input.trim()) {
      return NextResponse.json({ error: "WebSocket URL is required" }, { status: 400 });
    }

    try {
      const url = parseWebSocketUrl(input);
      const addresses = await resolvePublicAddresses(url.hostname);
      const pinned = addresses[0];
      const timeoutMs = boundedNetworkNumber(Number(timeout) * 1_000, 10_000, 100, 10_000);

      return await new Promise((resolve) => {
        let settled = false;
        const ws = new WebSocket(url.toString(), {
          followRedirects: false,
          handshakeTimeout: timeoutMs,
          maxPayload: 1_024,
          lookup: (_hostname, _options, callback) =>
            callback(null, pinned.address, pinned.family),
        });
        const finish = (response: NextResponse) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          ws.terminate();
          resolve(response);
        };
        const timer = setTimeout(() => {
          logNetworkSecurityEvent({ endpoint: ENDPOINT, operation: "websocket_handshake", outcome: "failed", clientId: rateLimit.clientId, durationMs: Date.now() - startedAt, errorCode: "TOTAL_TIMEOUT" });
          finish(NextResponse.json({ url: url.toString(), connected: false, error: "Request timed out", errorCode: "TOTAL_TIMEOUT", responseTime: Date.now() - startedAt, timestamp: Date.now() }));
        }, timeoutMs);

        ws.once("open", () => {
          const responseTime = Date.now() - startedAt;
          logNetworkSecurityEvent({ endpoint: ENDPOINT, operation: "websocket_handshake", outcome: "completed", clientId: rateLimit.clientId, durationMs: responseTime });
          finish(NextResponse.json({ url: url.toString(), connected: true, responseTime, protocol: ws.protocol || "unknown", timestamp: Date.now() }));
        });
        ws.once("error", () => {
          logNetworkSecurityEvent({ endpoint: ENDPOINT, operation: "websocket_handshake", outcome: "failed", clientId: rateLimit.clientId, durationMs: Date.now() - startedAt, errorCode: "UPSTREAM_ERROR" });
          finish(NextResponse.json({ url: url.toString(), connected: false, error: "WebSocket connection failed", errorCode: "UPSTREAM_ERROR", responseTime: Date.now() - startedAt, timestamp: Date.now() }));
        });
        ws.once("unexpected-response", (_request, response) => {
          response.destroy();
          finish(NextResponse.json({ url: url.toString(), connected: false, error: "WebSocket handshake was rejected", responseTime: Date.now() - startedAt, timestamp: Date.now() }));
        });
      });
    } catch (error) {
      const safeError = getSafeOutboundError(error);
      const rejected = ["INVALID_URL", "UNSUPPORTED_PROTOCOL", "CREDENTIALS_NOT_ALLOWED", "DESTINATION_BLOCKED"].includes(safeError.code);
      logNetworkSecurityEvent({ endpoint: ENDPOINT, operation: "websocket_handshake", outcome: rejected ? "blocked" : "failed", clientId: rateLimit.clientId, durationMs: Date.now() - startedAt, errorCode: safeError.code });
      return NextResponse.json(
        { url: input, connected: false, error: safeError.message, errorCode: safeError.code, responseTime: Date.now() - startedAt, timestamp: Date.now() },
        { status: rejected ? 400 : 200 },
      );
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
