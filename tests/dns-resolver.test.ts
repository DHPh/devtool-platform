import { describe, expect, it, vi } from "vitest";
import {
  DNS_RESOLVER_CONFIG,
  DnsLookupError,
  normalizeDnsDomain,
  normalizeDnsRecordTypes,
  performDnsLookup,
} from "@/lib/server/dns-resolver";

type TestResolver = NonNullable<Parameters<typeof performDnsLookup>[2]>;

function testResolver(overrides: Record<string, unknown> = {}): TestResolver {
  return {
    resolve4: vi.fn(),
    resolve6: vi.fn(),
    resolveMx: vi.fn(),
    resolveTxt: vi.fn(),
    resolveNs: vi.fn(),
    resolveSoa: vi.fn(),
    resolveCname: vi.fn(),
    resolvePtr: vi.fn(),
    ...overrides,
  } as TestResolver;
}

describe("DNS resolver policy", () => {
  it("normalizes valid domains including IDNs and a trailing root dot", () => {
    expect(normalizeDnsDomain(" Example.COM. ")).toBe("example.com");
    expect(normalizeDnsDomain("münchen.de")).toBe("xn--mnchen-3ya.de");
    expect(normalizeDnsDomain("1.0.0.127.in-addr.arpa")).toBe(
      "1.0.0.127.in-addr.arpa",
    );
  });

  it.each([
    "localhost",
    "127.0.0.1",
    "bad_domain.example",
    "-bad.example",
    "bad-.example",
    "example..com",
  ])("rejects invalid domain %s", (domain) => {
    expect(() => normalizeDnsDomain(domain)).toThrow(DnsLookupError);
  });

  it("accepts only bounded, supported record type lists", () => {
    expect(normalizeDnsRecordTypes(["a", "MX", "a"])).toEqual(["A", "MX"]);
    expect(() => normalizeDnsRecordTypes(["ANY"])).toThrow(
      "Unsupported DNS record type",
    );
    expect(() => normalizeDnsRecordTypes([])).toThrow(
      "Unsupported DNS record type",
    );
    expect(() => normalizeDnsRecordTypes(Array(9).fill("A"))).toThrow(
      "Unsupported DNS record type",
    );
  });

  it("formats supported records through the configured resolver", async () => {
    const resolver = testResolver({
      resolveMx: vi.fn().mockResolvedValue([
        { priority: 10, exchange: "mail.example.com" },
      ]),
      resolveTxt: vi.fn().mockResolvedValue([["v=spf1 ", "-all"]]),
    });
    await expect(performDnsLookup("example.com", "MX", resolver)).resolves.toMatchObject({
      records: ["10 mail.example.com"],
      success: true,
    });
    await expect(performDnsLookup("example.com", "TXT", resolver)).resolves.toMatchObject({
      records: ["v=spf1 -all"],
      success: true,
    });
  });

  it.each([
    ["ENOTFOUND", "DNS_NOT_FOUND", "No DNS records found"],
    ["ESERVFAIL", "DNS_SERVER_FAILURE", "DNS server could not complete the query"],
    ["EREFUSED", "DNS_REFUSED", "DNS query was refused"],
    ["ETIMEOUT", "DNS_TIMEOUT", "DNS lookup timed out"],
    ["INTERNAL_DETAIL", "DNS_UNAVAILABLE", "DNS lookup is temporarily unavailable"],
  ])("maps resolver error %s to %s", async (code, errorCode, message) => {
    const error = Object.assign(new Error("sensitive resolver details"), { code });
    const resolver = testResolver({ resolve4: vi.fn().mockRejectedValue(error) });
    await expect(performDnsLookup("example.com", "A", resolver)).resolves.toMatchObject({
      success: false,
      errorCode,
      error: message,
      records: [],
    });
  });

  it("enforces a consistent total query deadline", async () => {
    vi.useFakeTimers();
    try {
      const resolver = testResolver({
        resolve4: vi.fn(() => new Promise<string[]>(() => undefined)),
      });
      const lookup = performDnsLookup("example.com", "A", resolver);
      await vi.advanceTimersByTimeAsync(DNS_RESOLVER_CONFIG.queryTimeoutMs);
      await expect(lookup).resolves.toMatchObject({
        success: false,
        errorCode: "DNS_TIMEOUT",
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("defines resolver behavior once with bounded retries", () => {
    expect(DNS_RESOLVER_CONFIG).toMatchObject({
      queryTimeoutMs: 5_000,
      resolverTimeoutMs: 2_500,
      tries: 2,
      maxRecordTypes: 8,
    });
    expect(["system", "custom"]).toContain(DNS_RESOLVER_CONFIG.mode);
  });
});
