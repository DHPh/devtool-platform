import { isIP, Socket } from "node:net";
import { NextRequest, NextResponse } from "next/server";
import { readBoundedJson } from "@/lib/server/bounded-json";
import {
  getSafeOutboundError,
  resolvePublicAddresses,
  type ResolvedAddress,
} from "@/lib/server/outbound-request-policy";
import {
  boundedNetworkNumber,
  checkNetworkRateLimit,
  logNetworkSecurityEvent,
  networkRateLimitResponse,
} from "@/lib/server/network-security";

const ENDPOINT = "port-scan";
export const PORT_SCAN_LIMITS = Object.freeze({
  maxPorts: 20,
  concurrency: 4,
  maxTimeoutMs: 5_000,
});

function normalizeHostname(input: string): string {
  const value = input.trim();
  if (!value || /[\s/@?#]/.test(value)) throw new Error("INVALID_HOST");
  const bracketed = isIP(value) === 6 ? `[${value}]` : value;
  const parsed = new URL(`http://${bracketed}`);
  if (parsed.port || parsed.pathname !== "/") throw new Error("INVALID_HOST");
  return parsed.hostname.replace(/^\[|\]$/g, "");
}

export function validatePortScanInput(ports: unknown): number[] {
  if (
    !Array.isArray(ports) ||
    ports.length === 0 ||
    ports.length > PORT_SCAN_LIMITS.maxPorts
  ) {
    throw new Error(
      `Ports must contain between 1 and ${PORT_SCAN_LIMITS.maxPorts} entries`,
    );
  }
  const normalized = [...new Set(ports.map(Number))];
  if (normalized.some((port) => !Number.isInteger(port) || port < 1 || port > 65_535)) {
    throw new Error("Every port must be an integer between 1 and 65535");
  }
  return normalized;
}

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  task: (value: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, async () => {
      while (cursor < values.length) {
        const index = cursor++;
        results[index] = await task(values[index]);
      }
    }),
  );
  return results;
}

function scanPort(
  displayHost: string,
  address: ResolvedAddress,
  port: number,
  timeoutMs: number,
) {
  const timestamp = Date.now();
  const startedAt = Date.now();
  return new Promise<Record<string, unknown>>((resolve) => {
    const socket = new Socket();
    let settled = false;
    const finish = (result: Record<string, unknown>) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () =>
      finish({
        host: displayHost,
        port,
        open: true,
        service: getServiceName(port),
        responseTime: Date.now() - startedAt,
        method: "TCP Connect",
        timestamp,
      }),
    );
    socket.once("timeout", () =>
      finish({ host: displayHost, port, open: false, error: "Connection timeout", method: "TCP Connect", timestamp }),
    );
    socket.once("error", () =>
      finish({ host: displayHost, port, open: false, error: "Connection refused or filtered", method: "TCP Connect", timestamp }),
    );
    socket.connect({ host: address.address, family: address.family, port });
  });
}

export async function POST(request: NextRequest) {
  const rateLimit = checkNetworkRateLimit(request, ENDPOINT, { limit: 10 });
  if (!rateLimit.allowed) {
    logNetworkSecurityEvent({ endpoint: ENDPOINT, operation: "tcp_scan", outcome: "rate_limited", clientId: rateLimit.clientId });
    return networkRateLimitResponse(rateLimit);
  }
  const startedAt = Date.now();
  const parsed = await readBoundedJson<{
    host?: unknown;
    ports?: unknown;
    timeout?: unknown;
  }>(request);
  if (!parsed.ok) return parsed.response;

  try {
    const { host, ports, timeout = 3_000 } = parsed.data;
    if (typeof host !== "string") throw new Error("Host is required");
    const hostname = normalizeHostname(host);
    const validatedPorts = validatePortScanInput(ports);
    const timeoutMs = boundedNetworkNumber(
      timeout,
      3_000,
      100,
      PORT_SCAN_LIMITS.maxTimeoutMs,
    );

    let addresses: ResolvedAddress[];
    try {
      addresses = await resolvePublicAddresses(hostname);
    } catch (error) {
      const safeError = getSafeOutboundError(error);
      logNetworkSecurityEvent({ endpoint: ENDPOINT, operation: "tcp_scan", outcome: "blocked", clientId: rateLimit.clientId, errorCode: safeError.code, itemCount: validatedPorts.length });
      return NextResponse.json({ error: safeError.message, errorCode: safeError.code }, { status: 400 });
    }

    const results = await mapWithConcurrency(
      validatedPorts,
      PORT_SCAN_LIMITS.concurrency,
      (port) => scanPort(host, addresses[0], port, timeoutMs),
    );
    logNetworkSecurityEvent({ endpoint: ENDPOINT, operation: "tcp_scan", outcome: "completed", clientId: rateLimit.clientId, durationMs: Date.now() - startedAt, itemCount: results.length });
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 },
    );
  }
}

function getServiceName(port: number): string {
  const services: Record<number, string> = {
    21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP", 53: "DNS",
    80: "HTTP", 110: "POP3", 143: "IMAP", 443: "HTTPS", 993: "IMAPS",
    995: "POP3S", 3306: "MySQL", 3389: "RDP", 5432: "PostgreSQL",
    6379: "Redis", 8080: "HTTP Alt", 8443: "HTTPS Alt", 27017: "MongoDB",
  };
  return services[port] || "Unknown";
}
