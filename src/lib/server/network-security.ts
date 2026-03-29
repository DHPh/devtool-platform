import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_LIMIT = 30;
const MAX_TRACKED_CLIENTS = 10_000;

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

export interface NetworkRateLimitOptions {
  limit?: number;
  windowMs?: number;
  now?: number;
  trustedProxyHeaders?: boolean;
}

export interface NetworkRateLimitDecision {
  allowed: boolean;
  clientId: string;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  resetAt: number;
}

export type NetworkSecurityOutcome =
  | "allowed"
  | "blocked"
  | "completed"
  | "failed"
  | "rate_limited";

export interface NetworkSecurityEvent {
  endpoint: string;
  operation: string;
  outcome: NetworkSecurityOutcome;
  clientId?: string;
  durationMs?: number;
  errorCode?: string;
  itemCount?: number;
}

export function boundedNetworkNumber(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const numeric = Number(value);
  return Number.isFinite(numeric)
    ? Math.min(maximum, Math.max(minimum, Math.floor(numeric)))
    : fallback;
}

const buckets = new Map<string, RateLimitBucket>();

function boundedPositiveInteger(value: number | undefined, fallback: number) {
  return Number.isFinite(value) && value !== undefined
    ? Math.max(1, Math.floor(value))
    : fallback;
}

function validClientAddress(value: string | null | undefined): string | undefined {
  const candidate = value?.trim();
  return candidate && candidate.length <= 45 && isIP(candidate) !== 0
    ? candidate
    : undefined;
}

export function resolveRateLimitClientAddress(
  request: NextRequest,
  trustedProxyHeaders =
    process.env.VERCEL === "1" ||
    process.env.TRUST_PROXY_HEADERS?.toLowerCase() === "true",
): string {
  if (!trustedProxyHeaders) return "unknown";

  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",", 1)[0];
  return (
    validClientAddress(forwarded) ||
    validClientAddress(request.headers.get("cf-connecting-ip")) ||
    validClientAddress(request.headers.get("x-real-ip")) ||
    "unknown"
  );
}

function anonymizeClient(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function pruneExpiredBuckets(now: number) {
  if (buckets.size < MAX_TRACKED_CLIENTS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  while (buckets.size >= MAX_TRACKED_CLIENTS) {
    const oldestKey = buckets.keys().next().value;
    if (oldestKey === undefined) break;
    buckets.delete(oldestKey);
  }
}

export function checkNetworkRateLimit(
  request: NextRequest,
  endpoint: string,
  options: NetworkRateLimitOptions = {},
): NetworkRateLimitDecision {
  const now = options.now ?? Date.now();
  const limit = boundedPositiveInteger(options.limit, DEFAULT_LIMIT);
  const windowMs = boundedPositiveInteger(options.windowMs, DEFAULT_WINDOW_MS);
  const clientId = anonymizeClient(
    resolveRateLimitClientAddress(request, options.trustedProxyHeaders),
  );
  const key = `${endpoint}:${clientId}`;

  pruneExpiredBuckets(now);
  const existing = buckets.get(key);
  const bucket =
    !existing || existing.resetAt <= now
      ? { count: 0, resetAt: now + windowMs }
      : existing;
  bucket.count += 1;
  buckets.set(key, bucket);

  return {
    allowed: bucket.count <= limit,
    clientId,
    limit,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1_000)),
    resetAt: bucket.resetAt,
  };
}

export function networkRateLimitResponse(
  decision: NetworkRateLimitDecision,
): NextResponse {
  return NextResponse.json(
    { error: "Too many network requests. Try again later.", errorCode: "RATE_LIMITED" },
    {
      status: 429,
      headers: {
        "Retry-After": String(decision.retryAfterSeconds),
        "X-RateLimit-Limit": String(decision.limit),
        "X-RateLimit-Remaining": String(decision.remaining),
        "X-RateLimit-Reset": String(Math.ceil(decision.resetAt / 1_000)),
      },
    },
  );
}

export function logNetworkSecurityEvent(event: NetworkSecurityEvent): void {
  console.info(
    JSON.stringify({
      type: "network_security",
      timestamp: new Date().toISOString(),
      ...event,
    }),
  );
}

export function resetNetworkRateLimits(): void {
  buckets.clear();
}
