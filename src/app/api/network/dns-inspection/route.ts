import { NextRequest, NextResponse } from "next/server";
import { DnsLookupError } from "@/lib/server/dns-resolver";
import {
  analyzeEmailDns,
  checkDnsPropagation,
} from "@/lib/server/website-inspection-core";
import {
  checkNetworkRateLimit,
  logNetworkSecurityEvent,
  networkRateLimitResponse,
} from "@/lib/server/network-security";

const ENDPOINT = "dns-inspection";

export async function POST(request: NextRequest) {
  const rateLimit = checkNetworkRateLimit(request, ENDPOINT, { limit: 15 });
  if (!rateLimit.allowed) return networkRateLimitResponse(rateLimit);
  const startedAt = Date.now();
  try {
    const body = (await request.json()) as {
      operation?: unknown;
      domain?: unknown;
      recordType?: unknown;
    };
    if (typeof body.domain !== "string")
      return NextResponse.json(
        { error: "Domain is required.", errorCode: "DNS_INVALID_DOMAIN" },
        { status: 400 },
      );
    let result;
    if (body.operation === "email-dns-analyzer")
      result = await analyzeEmailDns(body.domain);
    else if (body.operation === "dns-propagation-checker")
      result = await checkDnsPropagation(
        body.domain,
        typeof body.recordType === "string" ? body.recordType : "A",
      );
    else
      return NextResponse.json(
        {
          error: "A supported DNS inspection operation is required.",
          errorCode: "INVALID_OPERATION",
        },
        { status: 400 },
      );
    logNetworkSecurityEvent({
      endpoint: ENDPOINT,
      operation: String(body.operation),
      outcome: "completed",
      clientId: rateLimit.clientId,
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json({ operation: body.operation, result });
  } catch (error) {
    const safe =
      error instanceof DnsLookupError
        ? { error: error.message, errorCode: error.code }
        : { error: "DNS inspection failed.", errorCode: "DNS_UNAVAILABLE" };
    logNetworkSecurityEvent({
      endpoint: ENDPOINT,
      operation: "dns_inspection",
      outcome: "failed",
      clientId: rateLimit.clientId,
      durationMs: Date.now() - startedAt,
      errorCode: safe.errorCode,
    });
    return NextResponse.json(safe, { status: 400 });
  }
}
