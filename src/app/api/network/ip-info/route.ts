import { isIP } from "node:net";
import { NextRequest, NextResponse } from "next/server";
import { readBoundedJson } from "@/lib/server/bounded-json";
import {
  getSafeOutboundError,
  isPublicAddress,
  requestOutbound,
} from "@/lib/server/outbound-request-policy";
import {
  checkNetworkRateLimit,
  logNetworkSecurityEvent,
  networkRateLimitResponse,
} from "@/lib/server/network-security";

const ENDPOINT = "ip-info";
const OPERATION = "ip_lookup";
const UPSTREAM_BASE_URL = "https://ipapi.co";
const UPSTREAM_TIMEOUT_MS = 8_000;
const UPSTREAM_MAX_RESPONSE_BYTES = 64 * 1024;

export const runtime = "nodejs";

interface IpApiResponse {
  error?: unknown;
  country_name?: unknown;
  country_code?: unknown;
  region?: unknown;
  city?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  timezone?: unknown;
  org?: unknown;
  asn?: unknown;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, 500)
    : undefined;
}

function optionalCoordinate(
  value: unknown,
  minimum: number,
  maximum: number,
): number | undefined {
  if (
    typeof value !== "number" &&
    (typeof value !== "string" || !value.trim())
  ) {
    return undefined;
  }
  const coordinate = typeof value === "number" ? value : Number(value);
  return Number.isFinite(coordinate) &&
    coordinate >= minimum &&
    coordinate <= maximum
    ? coordinate
    : undefined;
}

function invalidInput(
  message: string,
  errorCode: "INVALID_IP" | "DESTINATION_BLOCKED",
) {
  return NextResponse.json({ error: message, errorCode }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const rateLimit = checkNetworkRateLimit(request, ENDPOINT, { limit: 20 });
  if (!rateLimit.allowed) {
    logNetworkSecurityEvent({
      endpoint: ENDPOINT,
      operation: OPERATION,
      outcome: "rate_limited",
      clientId: rateLimit.clientId,
    });
    return networkRateLimitResponse(rateLimit);
  }

  const startedAt = Date.now();
  const parsed = await readBoundedJson<{ ip?: unknown }>(request);
  if (!parsed.ok) {
    logNetworkSecurityEvent({
      endpoint: ENDPOINT,
      operation: OPERATION,
      outcome: "failed",
      clientId: rateLimit.clientId,
      errorCode: "INVALID_REQUEST",
    });
    return parsed.response;
  }
  const input = parsed.data.ip;

  if (typeof input !== "string" || !input.trim()) {
    return invalidInput("IP address is required", "INVALID_IP");
  }

  const ip = input.trim();
  if (isIP(ip) === 0) {
    logNetworkSecurityEvent({
      endpoint: ENDPOINT,
      operation: OPERATION,
      outcome: "blocked",
      clientId: rateLimit.clientId,
      errorCode: "INVALID_IP",
    });
    return invalidInput("Invalid IP address format", "INVALID_IP");
  }
  if (!isPublicAddress(ip)) {
    logNetworkSecurityEvent({
      endpoint: ENDPOINT,
      operation: OPERATION,
      outcome: "blocked",
      clientId: rateLimit.clientId,
      errorCode: "DESTINATION_BLOCKED",
    });
    return invalidInput(
      "Private, reserved, and special-use IP addresses cannot be looked up",
      "DESTINATION_BLOCKED",
    );
  }

  try {
    const response = await requestOutbound(
      `${UPSTREAM_BASE_URL}/${encodeURIComponent(ip)}/json/`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          "user-agent": "DevTool-Platform/1.0",
        },
        connectionTimeoutMs: 4_000,
        responseTimeoutMs: UPSTREAM_TIMEOUT_MS,
        totalTimeoutMs: UPSTREAM_TIMEOUT_MS,
        maxRedirects: 1,
        maxResponseBytes: UPSTREAM_MAX_RESPONSE_BYTES,
      },
    );

    if (response.status < 200 || response.status >= 300) {
      throw new Error("IP information upstream returned a non-success status");
    }

    let data: IpApiResponse;
    try {
      data = JSON.parse(new TextDecoder().decode(response.body)) as IpApiResponse;
    } catch (error) {
      throw new Error("IP information upstream returned invalid JSON", {
        cause: error,
      });
    }
    if (!data || typeof data !== "object" || data.error) {
      throw new Error("IP information upstream rejected the lookup");
    }

    const organization = optionalString(data.org);
    logNetworkSecurityEvent({
      endpoint: ENDPOINT,
      operation: OPERATION,
      outcome: "completed",
      clientId: rateLimit.clientId,
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json({
      ip,
      country: optionalString(data.country_name),
      countryCode: optionalString(data.country_code),
      region: optionalString(data.region),
      city: optionalString(data.city),
      latitude: optionalCoordinate(data.latitude, -90, 90),
      longitude: optionalCoordinate(data.longitude, -180, 180),
      timezone: optionalString(data.timezone),
      organization,
      isp: organization,
      asn: optionalString(data.asn),
      timestamp: Date.now(),
    });
  } catch (error) {
    const safeError = getSafeOutboundError(error);
    logNetworkSecurityEvent({
      endpoint: ENDPOINT,
      operation: OPERATION,
      outcome: "failed",
      clientId: rateLimit.clientId,
      durationMs: Date.now() - startedAt,
      errorCode: safeError.code,
    });
    return NextResponse.json(
      {
        ip,
        error: "IP information service is unavailable",
        errorCode: "UPSTREAM_ERROR",
        timestamp: Date.now(),
      },
      { status: 502 },
    );
  }
}
