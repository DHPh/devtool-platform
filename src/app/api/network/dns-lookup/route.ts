import { NextRequest, NextResponse } from "next/server";
import { readBoundedJson } from "@/lib/server/bounded-json";
import {
  DnsLookupError,
  normalizeDnsDomain,
  normalizeDnsRecordTypes,
  performDnsLookup,
} from "@/lib/server/dns-resolver";
import {
  checkNetworkRateLimit,
  logNetworkSecurityEvent,
  networkRateLimitResponse,
} from "@/lib/server/network-security";

const ENDPOINT = "dns-lookup";

export async function POST(request: NextRequest) {
  const rateLimit = checkNetworkRateLimit(request, ENDPOINT, { limit: 30 });
  if (!rateLimit.allowed) {
    logNetworkSecurityEvent({ endpoint: ENDPOINT, operation: "dns_query", outcome: "rate_limited", clientId: rateLimit.clientId });
    return networkRateLimitResponse(rateLimit);
  }
  const startedAt = Date.now();
  const parsed = await readBoundedJson<{
    domain?: unknown;
    recordType?: unknown;
    recordTypes?: unknown;
  }>(request);
  if (!parsed.ok) return parsed.response;

  try {
    const { domain: inputDomain, recordType, recordTypes } = parsed.data;
    const domain = normalizeDnsDomain(inputDomain);
    const requestedTypes = normalizeDnsRecordTypes(
      recordTypes ?? [recordType ?? "A"],
    );
    const results = await Promise.all(
      requestedTypes.map((type) => performDnsLookup(domain, type)),
    );
    const failed = results.every((result) => !result.success);
    logNetworkSecurityEvent({
      endpoint: ENDPOINT,
      operation: "dns_query",
      outcome: failed ? "failed" : "completed",
      clientId: rateLimit.clientId,
      durationMs: Date.now() - startedAt,
      itemCount: requestedTypes.length,
      ...(failed ? { errorCode: results[0]?.errorCode } : {}),
    });

    if (recordType !== undefined && recordTypes === undefined) {
      return NextResponse.json(results[0]);
    }
    return NextResponse.json({ results });
  } catch (error) {
    const validationError =
      error instanceof DnsLookupError
        ? error
        : new DnsLookupError("DNS_INVALID_DOMAIN", { cause: error });
    logNetworkSecurityEvent({ endpoint: ENDPOINT, operation: "dns_query", outcome: "blocked", clientId: rateLimit.clientId, durationMs: Date.now() - startedAt, errorCode: validationError.code });
    return NextResponse.json(
      { error: validationError.message, errorCode: validationError.code },
      { status: 400 },
    );
  }
}
