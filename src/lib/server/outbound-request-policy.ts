import { lookup as dnsLookup } from "node:dns/promises";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";
import type { IncomingHttpHeaders, IncomingMessage } from "node:http";

export const OUTBOUND_LIMITS = {
  connectionTimeoutMs: 5_000,
  responseTimeoutMs: 10_000,
  totalTimeoutMs: 20_000,
  maxRedirects: 3,
  maxResponseBytes: 1_000_000,
  maxRequestBodyBytes: 256_000,
  maxConcurrency: 8,
} as const;

export type OutboundErrorCode =
  | "INVALID_URL"
  | "UNSUPPORTED_PROTOCOL"
  | "CREDENTIALS_NOT_ALLOWED"
  | "DESTINATION_BLOCKED"
  | "DNS_FAILED"
  | "CONNECTION_TIMEOUT"
  | "RESPONSE_TIMEOUT"
  | "TOTAL_TIMEOUT"
  | "TOO_MANY_REDIRECTS"
  | "REQUEST_BODY_TOO_LARGE"
  | "RESPONSE_TOO_LARGE"
  | "UPSTREAM_ERROR";

const SAFE_MESSAGES: Record<OutboundErrorCode, string> = {
  INVALID_URL: "Invalid URL format",
  UNSUPPORTED_PROTOCOL: "Only HTTP and HTTPS destinations are supported",
  CREDENTIALS_NOT_ALLOWED: "Credentials in URLs are not allowed",
  DESTINATION_BLOCKED: "Destination is not allowed",
  DNS_FAILED: "Destination could not be resolved",
  CONNECTION_TIMEOUT: "Connection timed out",
  RESPONSE_TIMEOUT: "Remote server response timed out",
  TOTAL_TIMEOUT: "Request timed out",
  TOO_MANY_REDIRECTS: "Too many redirects",
  REQUEST_BODY_TOO_LARGE: "Request body is too large",
  RESPONSE_TOO_LARGE: "Remote response is too large",
  UPSTREAM_ERROR: "Remote request failed",
};

export class OutboundRequestError extends Error {
  constructor(
    public readonly code: OutboundErrorCode,
    options?: ErrorOptions,
  ) {
    super(SAFE_MESSAGES[code], options);
    this.name = "OutboundRequestError";
  }
}

export interface OutboundRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string | Uint8Array;
  connectionTimeoutMs?: number;
  responseTimeoutMs?: number;
  totalTimeoutMs?: number;
  maxRedirects?: number;
  maxResponseBytes?: number;
  maxRequestBodyBytes?: number;
  onRedirect?: (redirect: { from: string; to: string; status: number }) => void;
}

export interface OutboundResponse {
  url: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: Uint8Array;
  redirectCount: number;
}

export interface ResolvedAddress {
  address: string;
  family: 4 | 6;
}

type AddressResolver = (hostname: string) => Promise<ResolvedAddress[]>;

interface TransportRequest {
  url: URL;
  address: ResolvedAddress;
  method: string;
  headers: Record<string, string>;
  body?: Uint8Array;
  connectionTimeoutMs: number;
  responseTimeoutMs: number;
  totalTimeoutMs: number;
  maxResponseBytes: number;
}

interface TransportResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: Uint8Array;
}

type OutboundTransport = (
  request: TransportRequest,
) => Promise<TransportResponse>;

export interface OutboundPolicyDependencies {
  resolve?: AddressResolver;
  transport?: OutboundTransport;
}

class Semaphore {
  private active = 0;
  private readonly waiting: Array<() => void> = [];

  constructor(private readonly capacity: number) {}

  async acquire(deadline: number): Promise<() => void> {
    if (this.active < this.capacity) {
      this.active++;
      return this.release;
    }

    await new Promise<void>((resolve, reject) => {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        reject(new OutboundRequestError("TOTAL_TIMEOUT"));
        return;
      }

      const enter = () => {
        clearTimeout(timer);
        this.active++;
        resolve();
      };
      const timer = setTimeout(() => {
        const index = this.waiting.indexOf(enter);
        if (index >= 0) this.waiting.splice(index, 1);
        reject(new OutboundRequestError("TOTAL_TIMEOUT"));
      }, remaining);
      this.waiting.push(enter);
    });

    return this.release;
  }

  private release = () => {
    this.active--;
    this.waiting.shift()?.();
  };
}

const outboundSlots = new Semaphore(OUTBOUND_LIMITS.maxConcurrency);

async function withinDeadline<T>(
  operation: Promise<T>,
  remainingMs: number,
): Promise<T> {
  if (remainingMs <= 0) throw new OutboundRequestError("TOTAL_TIMEOUT");

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new OutboundRequestError("TOTAL_TIMEOUT")),
          remainingMs,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function ipv4ToNumber(address: string): number {
  return address
    .split(".")
    .map(Number)
    .reduce((value, octet) => value * 256 + octet, 0);
}

function matchesIpv4Cidr(address: string, base: string, prefix: number): boolean {
  const shift = 32 - prefix;
  return (
    Math.floor(ipv4ToNumber(address) / 2 ** shift) ===
    Math.floor(ipv4ToNumber(base) / 2 ** shift)
  );
}

const BLOCKED_IPV4_RANGES = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const;

function ipv6ToGroups(address: string): number[] {
  let normalized = address.toLowerCase();
  const lastColon = normalized.lastIndexOf(":");
  const dottedTail = normalized.slice(lastColon + 1);
  if (dottedTail.includes(".")) {
    const value = ipv4ToNumber(dottedTail);
    normalized = `${normalized.slice(0, lastColon)}:${(
      Math.floor(value / 65_536)
    ).toString(16)}:${(value % 65_536).toString(16)}`;
  }

  const halves = normalized.split("::");
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves[1] ? halves[1].split(":") : [];
  const missing = 8 - left.length - right.length;
  const groups = [...left, ...Array(Math.max(0, missing)).fill("0"), ...right];

  return groups.map((group) => parseInt(group || "0", 16));
}

function matchesIpv6Cidr(address: string, base: string, prefix: number): boolean {
  const addressGroups = ipv6ToGroups(address);
  const baseGroups = ipv6ToGroups(base);
  const completeGroups = Math.floor(prefix / 16);
  const remainingBits = prefix % 16;

  for (let index = 0; index < completeGroups; index++) {
    if (addressGroups[index] !== baseGroups[index]) return false;
  }
  if (remainingBits === 0) return true;

  const mask = (0xffff << (16 - remainingBits)) & 0xffff;
  return (
    (addressGroups[completeGroups] & mask) ===
    (baseGroups[completeGroups] & mask)
  );
}

const BLOCKED_IPV6_RANGES = [
  ["::", 128],
  ["::1", 128],
  ["::ffff:0:0", 96],
  ["64:ff9b::", 96],
  ["64:ff9b:1::", 48],
  ["100::", 64],
  ["2001::", 32],
  ["2001:2::", 48],
  ["2001:10::", 28],
  ["2001:20::", 28],
  ["2001:db8::", 32],
  ["2002::", 16],
  ["3fff::", 20],
  ["5f00::", 16],
  ["fc00::", 7],
  ["fe80::", 10],
  ["fec0::", 10],
  ["ff00::", 8],
] as const;

export function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) {
    return !BLOCKED_IPV4_RANGES.some(([base, prefix]) =>
      matchesIpv4Cidr(address, base, prefix),
    );
  }
  if (family === 6) {
    return !BLOCKED_IPV6_RANGES.some(([base, prefix]) =>
      matchesIpv6Cidr(address, base, prefix),
    );
  }
  return false;
}

export function parseOutboundUrl(input: string): URL {
  let url: URL;
  try {
    url = new URL(input);
  } catch (error) {
    throw new OutboundRequestError("INVALID_URL", { cause: error });
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new OutboundRequestError("UNSUPPORTED_PROTOCOL");
  }
  if (url.username || url.password) {
    throw new OutboundRequestError("CREDENTIALS_NOT_ALLOWED");
  }

  return url;
}

export async function resolvePublicAddresses(
  hostname: string,
): Promise<ResolvedAddress[]> {
  const normalized = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (normalized === "localhost" || normalized.endsWith(".localhost")) {
    throw new OutboundRequestError("DESTINATION_BLOCKED");
  }

  const literalFamily = isIP(normalized);
  let addresses: ResolvedAddress[];
  try {
    addresses = literalFamily
      ? [{ address: normalized, family: literalFamily as 4 | 6 }]
      : ((await dnsLookup(normalized, {
          all: true,
          verbatim: true,
        })) as ResolvedAddress[]);
  } catch (error) {
    throw new OutboundRequestError("DNS_FAILED", { cause: error });
  }

  if (
    addresses.length === 0 ||
    addresses.some(({ address }) => !isPublicAddress(address))
  ) {
    throw new OutboundRequestError("DESTINATION_BLOCKED");
  }

  return addresses;
}

function headersToRecord(headers: IncomingHttpHeaders): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers)
      .filter((entry): entry is [string, string | string[]] =>
        entry[1] !== undefined,
      )
      .map(([key, value]) => [key, Array.isArray(value) ? value.join(", ") : value]),
  );
}

async function readResponse(
  response: IncomingMessage,
  maxBytes: number,
  responseTimeoutMs: number,
): Promise<Uint8Array> {
  const declaredLength = Number(response.headers["content-length"] ?? 0);
  if (declaredLength > maxBytes) {
    response.destroy();
    throw new OutboundRequestError("RESPONSE_TOO_LARGE");
  }

  const chunks: Buffer[] = [];
  let size = 0;
  response.setTimeout(responseTimeoutMs, () => {
    response.destroy(new OutboundRequestError("RESPONSE_TIMEOUT"));
  });

  try {
    for await (const chunk of response) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buffer.length;
      if (size > maxBytes) {
        response.destroy();
        throw new OutboundRequestError("RESPONSE_TOO_LARGE");
      }
      chunks.push(buffer);
    }
  } catch (error) {
    if (error instanceof OutboundRequestError) throw error;
    throw new OutboundRequestError("UPSTREAM_ERROR", { cause: error });
  }

  return Buffer.concat(chunks);
}

const nodeTransport: OutboundTransport = (outbound) =>
  new Promise((resolve, reject) => {
    const isHttps = outbound.url.protocol === "https:";
    const originalHostname = outbound.url.hostname.replace(/^\[|\]$/g, "");
    const request = (isHttps ? httpsRequest : httpRequest)(
      {
        protocol: outbound.url.protocol,
        hostname: outbound.address.address,
        port: outbound.url.port || undefined,
        path: `${outbound.url.pathname}${outbound.url.search}`,
        method: outbound.method,
        headers: {
          ...outbound.headers,
          host: outbound.url.host,
        },
        servername:
          isHttps && isIP(originalHostname) === 0
            ? originalHostname
            : undefined,
      },
      async (response) => {
        clearTimeout(headerTimer);
        try {
          const body = await readResponse(
            response,
            outbound.maxResponseBytes,
            outbound.responseTimeoutMs,
          );
          cleanup();
          resolve({
            status: response.statusCode ?? 0,
            statusText: response.statusMessage ?? "",
            headers: headersToRecord(response.headers),
            body,
          });
        } catch (error) {
          cleanup();
          reject(error);
        }
      },
    );

    let connectionTimer: ReturnType<typeof setTimeout> | undefined;
    const cleanup = () => {
      clearTimeout(connectionTimer);
      clearTimeout(headerTimer);
      clearTimeout(totalTimer);
    };

    const headerTimer = setTimeout(() => {
      request.destroy(new OutboundRequestError("RESPONSE_TIMEOUT"));
    }, outbound.responseTimeoutMs);
    const totalTimer = setTimeout(() => {
      request.destroy(new OutboundRequestError("TOTAL_TIMEOUT"));
    }, outbound.totalTimeoutMs);

    request.on("socket", (socket) => {
      connectionTimer = setTimeout(() => {
        request.destroy(new OutboundRequestError("CONNECTION_TIMEOUT"));
      }, outbound.connectionTimeoutMs);
      socket.once(isHttps ? "secureConnect" : "connect", () => {
        clearTimeout(connectionTimer);
      });
    });
    request.on("error", (error) => {
      cleanup();
      reject(
        error instanceof OutboundRequestError
          ? error
          : new OutboundRequestError("UPSTREAM_ERROR", { cause: error }),
      );
    });

    if (outbound.body) request.write(outbound.body);
    request.end();
  });

function boundedInteger(
  value: number | undefined,
  fallback: number,
  minimum: number,
): number {
  return Number.isFinite(value) && value !== undefined
    ? Math.min(fallback, Math.max(minimum, Math.floor(value)))
    : fallback;
}

export async function requestOutbound(
  input: string,
  options: OutboundRequestOptions = {},
  dependencies: OutboundPolicyDependencies = {},
): Promise<OutboundResponse> {
  const limits = {
    connectionTimeoutMs: boundedInteger(
      options.connectionTimeoutMs,
      OUTBOUND_LIMITS.connectionTimeoutMs,
      1,
    ),
    responseTimeoutMs: boundedInteger(
      options.responseTimeoutMs,
      OUTBOUND_LIMITS.responseTimeoutMs,
      1,
    ),
    totalTimeoutMs: boundedInteger(
      options.totalTimeoutMs,
      OUTBOUND_LIMITS.totalTimeoutMs,
      1,
    ),
    maxRedirects: boundedInteger(
      options.maxRedirects,
      OUTBOUND_LIMITS.maxRedirects,
      0,
    ),
    maxResponseBytes: boundedInteger(
      options.maxResponseBytes,
      OUTBOUND_LIMITS.maxResponseBytes,
      0,
    ),
    maxRequestBodyBytes: boundedInteger(
      options.maxRequestBodyBytes,
      OUTBOUND_LIMITS.maxRequestBodyBytes,
      0,
    ),
  };
  const body =
    typeof options.body === "string"
      ? new TextEncoder().encode(options.body)
      : options.body;
  if (body && body.byteLength > limits.maxRequestBodyBytes) {
    throw new OutboundRequestError("REQUEST_BODY_TOO_LARGE");
  }

  const deadline = Date.now() + limits.totalTimeoutMs;
  const release = await outboundSlots.acquire(deadline);
  const resolveAddresses = dependencies.resolve ?? resolvePublicAddresses;
  const transport = dependencies.transport ?? nodeTransport;

  try {
    let url = parseOutboundUrl(input);
    let method = (options.method ?? "GET").toUpperCase();
    let currentBody = body;

    for (let redirectCount = 0; ; redirectCount++) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) throw new OutboundRequestError("TOTAL_TIMEOUT");

      const addresses = await withinDeadline(
        resolveAddresses(url.hostname),
        remaining,
      );
      if (
        addresses.length === 0 ||
        addresses.some(({ address }) => !isPublicAddress(address))
      ) {
        throw new OutboundRequestError("DESTINATION_BLOCKED");
      }

      const response = await transport({
        url,
        address: addresses[0],
        method,
        headers: options.headers ?? {},
        body: currentBody,
        connectionTimeoutMs: Math.min(limits.connectionTimeoutMs, remaining),
        responseTimeoutMs: Math.min(limits.responseTimeoutMs, remaining),
        totalTimeoutMs: remaining,
        maxResponseBytes: limits.maxResponseBytes,
      });
      if (response.body.byteLength > limits.maxResponseBytes) {
        throw new OutboundRequestError("RESPONSE_TOO_LARGE");
      }
      const location = response.headers.location;
      const isRedirect = [301, 302, 303, 307, 308].includes(response.status);
      if (!isRedirect || !location) {
        return {
          url: url.toString(),
          ...response,
          redirectCount,
        };
      }
      if (redirectCount >= limits.maxRedirects) {
        throw new OutboundRequestError("TOO_MANY_REDIRECTS");
      }

      const nextUrl = parseOutboundUrl(new URL(location, url).toString());
      options.onRedirect?.({ from: url.toString(), to: nextUrl.toString(), status: response.status });
      url = nextUrl;
      if (
        response.status === 303 ||
        ((response.status === 301 || response.status === 302) && method === "POST")
      ) {
        method = "GET";
        currentBody = undefined;
      }
    }
  } finally {
    release();
  }
}

export function getSafeOutboundError(error: unknown): {
  code: OutboundErrorCode;
  message: string;
} {
  const outboundError =
    error instanceof OutboundRequestError
      ? error
      : new OutboundRequestError("UPSTREAM_ERROR", { cause: error });
  return { code: outboundError.code, message: outboundError.message };
}
