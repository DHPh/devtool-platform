import { Resolver } from "node:dns/promises";
import { isIP } from "node:net";
import { domainToASCII } from "node:url";

export const SUPPORTED_DNS_RECORD_TYPES = [
  "A",
  "AAAA",
  "MX",
  "TXT",
  "NS",
  "SOA",
  "CNAME",
  "PTR",
] as const;

export type SupportedDnsRecordType =
  (typeof SUPPORTED_DNS_RECORD_TYPES)[number];

export type DnsLookupErrorCode =
  | "DNS_INVALID_DOMAIN"
  | "DNS_INVALID_RECORD_TYPE"
  | "DNS_NOT_FOUND"
  | "DNS_REFUSED"
  | "DNS_SERVER_FAILURE"
  | "DNS_TIMEOUT"
  | "DNS_UNAVAILABLE";

export interface DnsLookupResult {
  domain: string;
  recordType: SupportedDnsRecordType;
  records: string[];
  success: boolean;
  error?: string;
  errorCode?: DnsLookupErrorCode;
  timestamp: number;
}

export class DnsLookupError extends Error {
  constructor(
    readonly code: DnsLookupErrorCode,
    options?: ErrorOptions,
  ) {
    super(DNS_ERROR_MESSAGES[code], options);
    this.name = "DnsLookupError";
  }
}

const DNS_ERROR_MESSAGES: Record<DnsLookupErrorCode, string> = {
  DNS_INVALID_DOMAIN: "Enter a valid domain name",
  DNS_INVALID_RECORD_TYPE: "Unsupported DNS record type",
  DNS_NOT_FOUND: "No DNS records found",
  DNS_REFUSED: "DNS query was refused",
  DNS_SERVER_FAILURE: "DNS server could not complete the query",
  DNS_TIMEOUT: "DNS lookup timed out",
  DNS_UNAVAILABLE: "DNS lookup is temporarily unavailable",
};

const QUERY_TIMEOUT_MS = 5_000;
const RESOLVER_TIMEOUT_MS = 2_500;
const RESOLVER_TRIES = 2;
const MAX_RECORD_TYPES = SUPPORTED_DNS_RECORD_TYPES.length;

type DnsResolver = Pick<
  Resolver,
  | "resolve4"
  | "resolve6"
  | "resolveMx"
  | "resolveTxt"
  | "resolveNs"
  | "resolveSoa"
  | "resolveCname"
  | "resolvePtr"
>;

function configuredServers(): string[] {
  return (process.env.DNS_RESOLVERS ?? "")
    .split(",")
    .map((server) => server.trim())
    .filter(Boolean);
}

const resolver = new Resolver({
  timeout: RESOLVER_TIMEOUT_MS,
  tries: RESOLVER_TRIES,
});
const customServers = configuredServers();
if (customServers.length > 0) resolver.setServers(customServers);

export const DNS_RESOLVER_CONFIG = Object.freeze({
  mode: customServers.length > 0 ? "custom" : "system",
  queryTimeoutMs: QUERY_TIMEOUT_MS,
  resolverTimeoutMs: RESOLVER_TIMEOUT_MS,
  tries: RESOLVER_TRIES,
  maxRecordTypes: MAX_RECORD_TYPES,
});

export function normalizeDnsDomain(input: unknown): string {
  if (typeof input !== "string") throw new DnsLookupError("DNS_INVALID_DOMAIN");
  const withoutTrailingDot = input.trim().replace(/\.$/, "");
  const ascii = domainToASCII(withoutTrailingDot).toLowerCase();
  if (!ascii || ascii.length > 253 || ascii.includes("..") || isIP(ascii)) {
    throw new DnsLookupError("DNS_INVALID_DOMAIN");
  }
  const labels = ascii.split(".");
  if (
    labels.length < 2 ||
    labels.some(
      (label) =>
        label.length < 1 ||
        label.length > 63 ||
        !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label),
    )
  ) {
    throw new DnsLookupError("DNS_INVALID_DOMAIN");
  }
  return ascii;
}

export function normalizeDnsRecordTypes(input: unknown): SupportedDnsRecordType[] {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_RECORD_TYPES) {
    throw new DnsLookupError("DNS_INVALID_RECORD_TYPE");
  }
  const normalized = [...new Set(input.map((value) =>
    typeof value === "string" ? value.trim().toUpperCase() : "",
  ))];
  if (
    normalized.some(
      (value) =>
        !SUPPORTED_DNS_RECORD_TYPES.includes(value as SupportedDnsRecordType),
    )
  ) {
    throw new DnsLookupError("DNS_INVALID_RECORD_TYPE");
  }
  return normalized as SupportedDnsRecordType[];
}

function mapDnsError(error: unknown): DnsLookupError {
  if (error instanceof DnsLookupError) return error;
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code).toUpperCase()
      : "";
  if (["ENOTFOUND", "ENODATA", "NOTFOUND", "NODATA"].includes(code)) {
    return new DnsLookupError("DNS_NOT_FOUND", { cause: error });
  }
  if (["ETIMEOUT", "TIMEOUT", "ECANCELLED", "CANCELLED"].includes(code)) {
    return new DnsLookupError("DNS_TIMEOUT", { cause: error });
  }
  if (["EREFUSED", "REFUSED"].includes(code)) {
    return new DnsLookupError("DNS_REFUSED", { cause: error });
  }
  if (["ESERVFAIL", "SERVFAIL"].includes(code)) {
    return new DnsLookupError("DNS_SERVER_FAILURE", { cause: error });
  }
  return new DnsLookupError("DNS_UNAVAILABLE", { cause: error });
}

async function withinQueryTimeout<T>(operation: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(
      () => reject(new DnsLookupError("DNS_TIMEOUT")),
      QUERY_TIMEOUT_MS,
    );
  });
  try {
    return await Promise.race([operation, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

async function resolveRecords(
  activeResolver: DnsResolver,
  domain: string,
  recordType: SupportedDnsRecordType,
): Promise<string[]> {
  switch (recordType) {
    case "A":
      return activeResolver.resolve4(domain);
    case "AAAA":
      return activeResolver.resolve6(domain);
    case "MX":
      return (await activeResolver.resolveMx(domain)).map(
        ({ priority, exchange }) => `${priority} ${exchange}`,
      );
    case "TXT":
      return (await activeResolver.resolveTxt(domain)).map((parts) => parts.join(""));
    case "NS":
      return activeResolver.resolveNs(domain);
    case "SOA": {
      const soa = await activeResolver.resolveSoa(domain);
      return [
        `${soa.nsname} ${soa.hostmaster} ${soa.serial} ${soa.refresh} ${soa.retry} ${soa.expire} ${soa.minttl}`,
      ];
    }
    case "CNAME":
      return activeResolver.resolveCname(domain);
    case "PTR":
      return activeResolver.resolvePtr(domain);
  }
}

export async function performDnsLookup(
  domain: string,
  recordType: SupportedDnsRecordType,
  activeResolver: DnsResolver = resolver,
): Promise<DnsLookupResult> {
  try {
    const records = await withinQueryTimeout(
      resolveRecords(activeResolver, domain, recordType),
    );
    return {
      domain,
      recordType,
      records,
      success: records.length > 0,
      ...(records.length === 0
        ? { error: DNS_ERROR_MESSAGES.DNS_NOT_FOUND, errorCode: "DNS_NOT_FOUND" as const }
        : {}),
      timestamp: Date.now(),
    };
  } catch (error) {
    const safeError = mapDnsError(error);
    return {
      domain,
      recordType,
      records: [],
      success: false,
      error: safeError.message,
      errorCode: safeError.code,
      timestamp: Date.now(),
    };
  }
}
