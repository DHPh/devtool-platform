import { NextRequest, NextResponse } from "next/server";
import { readBoundedJson } from "@/lib/server/bounded-json";
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

const ENDPOINT = "speed-test";
const DOWNLOAD_BYTES = 1_048_576;
const UPLOAD_BYTES = 64 * 1_024;

function speedResult(testType: "download" | "upload", bytes: number, startedAt: number) {
  const duration = Math.max((Date.now() - startedAt) / 1_000, 0.001);
  const speedBps = bytes / duration;
  const speedKbps = (speedBps * 8) / 1_000;
  return {
    testType,
    bytesTransferred: bytes,
    duration,
    speedBps: Math.round(speedBps),
    speedKbps: Math.round(speedKbps * 100) / 100,
    speedMbps: Math.round((speedKbps / 1_000) * 100) / 100,
    completed: true,
    timestamp: Date.now(),
  };
}

export async function POST(request: NextRequest) {
  const rateLimit = checkNetworkRateLimit(request, ENDPOINT, { limit: 5 });
  if (!rateLimit.allowed) {
    logNetworkSecurityEvent({ endpoint: ENDPOINT, operation: "bandwidth_test", outcome: "rate_limited", clientId: rateLimit.clientId });
    return networkRateLimitResponse(rateLimit);
  }
  const startedAt = Date.now();
  const parsed = await readBoundedJson<{
    downloadUrl?: unknown;
    uploadUrl?: unknown;
    testType?: unknown;
    duration?: unknown;
  }>(request);
  if (!parsed.ok) return parsed.response;

  try {
    const {
      downloadUrl = `https://httpbin.org/bytes/${DOWNLOAD_BYTES}`,
      uploadUrl = "https://httpbin.org/post",
      testType = "download",
      duration = 10,
    } = parsed.data;
    if (testType !== "download" && testType !== "upload") {
      return NextResponse.json({ error: "Invalid test type. Use 'download' or 'upload'" }, { status: 400 });
    }
    if (
      typeof downloadUrl !== "string" ||
      typeof uploadUrl !== "string"
    ) {
      return NextResponse.json({ error: "Invalid test URL" }, { status: 400 });
    }
    const timeoutMs = boundedNetworkNumber(Number(duration) * 1_000, 10_000, 1_000, 10_000);

    try {
      const response =
        testType === "download"
          ? await requestOutbound(downloadUrl, {
              method: "GET",
              totalTimeoutMs: timeoutMs,
              responseTimeoutMs: timeoutMs,
              maxResponseBytes: DOWNLOAD_BYTES,
            })
          : await requestOutbound(uploadUrl, {
              method: "POST",
              headers: { "content-type": "application/octet-stream" },
              body: new Uint8Array(UPLOAD_BYTES).fill(65),
              totalTimeoutMs: timeoutMs,
              responseTimeoutMs: timeoutMs,
              maxResponseBytes: 256 * 1_024,
              maxRequestBodyBytes: UPLOAD_BYTES,
            });

      if (response.status < 200 || response.status >= 300) {
        return NextResponse.json({ testType, error: `Upstream returned HTTP ${response.status}`, timestamp: Date.now() });
      }
      const bytes = testType === "download" ? response.body.byteLength : UPLOAD_BYTES;
      logNetworkSecurityEvent({ endpoint: ENDPOINT, operation: testType, outcome: "completed", clientId: rateLimit.clientId, durationMs: Date.now() - startedAt });
      return NextResponse.json(speedResult(testType, bytes, startedAt));
    } catch (error) {
      const safeError = getSafeOutboundError(error);
      const rejected = ["INVALID_URL", "UNSUPPORTED_PROTOCOL", "CREDENTIALS_NOT_ALLOWED", "DESTINATION_BLOCKED"].includes(safeError.code);
      logNetworkSecurityEvent({ endpoint: ENDPOINT, operation: testType, outcome: rejected ? "blocked" : "failed", clientId: rateLimit.clientId, durationMs: Date.now() - startedAt, errorCode: safeError.code });
      return NextResponse.json(
        { testType, error: safeError.message, errorCode: safeError.code, bytesTransferred: 0, duration: (Date.now() - startedAt) / 1_000, timestamp: Date.now() },
        { status: rejected ? 400 : 200 },
      );
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
