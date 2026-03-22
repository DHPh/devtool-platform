import { NextRequest, NextResponse } from "next/server";
import { getSafeOutboundError, OutboundRequestError } from "@/lib/server/outbound-request-policy";
import {
  analyzeCors,
  analyzeSecurityHeaders,
  inspectOpenGraph,
  inspectRobots,
  traceRedirects,
  validateSitemap,
} from "@/lib/server/website-inspection-core";
import {
  checkNetworkRateLimit,
  logNetworkSecurityEvent,
  networkRateLimitResponse,
} from "@/lib/server/network-security";

const ENDPOINT = "website-inspection";
const OPERATIONS = {
  "redirect-tracer": traceRedirects,
  "security-header-analyzer": analyzeSecurityHeaders,
  "cors-analyzer": analyzeCors,
  "robots-inspector": inspectRobots,
  "sitemap-validator": validateSitemap,
  "open-graph-inspector": inspectOpenGraph,
} as const;

type Operation = keyof typeof OPERATIONS;

export async function POST(request: NextRequest) {
  const rateLimit = checkNetworkRateLimit(request, ENDPOINT, { limit: 20 });
  if (!rateLimit.allowed) return networkRateLimitResponse(rateLimit);
  const startedAt = Date.now();
  try {
    const body = await request.json() as { operation?: unknown; url?: unknown };
    if (typeof body.operation !== "string" || !(body.operation in OPERATIONS)) {
      return NextResponse.json({ error: "A supported website inspection operation is required.", errorCode: "INVALID_OPERATION" }, { status: 400 });
    }
    if (typeof body.url !== "string" || !body.url.trim()) {
      return NextResponse.json({ error: "URL is required.", errorCode: "INVALID_URL" }, { status: 400 });
    }
    const operation = body.operation as Operation;
    const result = await OPERATIONS[operation](body.url);
    logNetworkSecurityEvent({ endpoint: ENDPOINT, operation, outcome: "completed", clientId: rateLimit.clientId, durationMs: Date.now() - startedAt });
    return NextResponse.json({ operation, result });
  } catch (error) {
    const isOutbound = error instanceof OutboundRequestError;
    const safe = isOutbound ? getSafeOutboundError(error) : { code: "ANALYSIS_FAILED", message: "Remote content could not be analyzed." };
    logNetworkSecurityEvent({ endpoint: ENDPOINT, operation: "website_inspection", outcome: isOutbound ? "blocked" : "failed", clientId: rateLimit.clientId, durationMs: Date.now() - startedAt, errorCode: safe.code });
    return NextResponse.json({ error: safe.message, errorCode: safe.code }, { status: isOutbound ? 400 : 422 });
  }
}
