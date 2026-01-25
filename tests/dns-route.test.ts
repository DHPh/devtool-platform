import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/dns-resolver", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/server/dns-resolver")>();
  return { ...actual, performDnsLookup: vi.fn() };
});

import { POST as dnsLookup } from "@/app/api/network/dns-lookup/route";
import { performDnsLookup } from "@/lib/server/dns-resolver";
import { resetNetworkRateLimits } from "@/lib/server/network-security";

const performDnsLookupMock = vi.mocked(performDnsLookup);

function post(body: unknown) {
  return new NextRequest("http://localhost/api/network/dns-lookup", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "198.51.100.40",
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  resetNetworkRateLimits();
  performDnsLookupMock.mockReset();
  vi.spyOn(console, "info").mockImplementation(() => undefined);
});

describe("DNS lookup API", () => {
  it("rejects invalid domains and record types before resolution", async () => {
    const invalidDomain = await dnsLookup(post({ domain: "localhost", recordType: "A" }));
    const invalidType = await dnsLookup(post({ domain: "example.com", recordType: "ANY" }));
    expect(invalidDomain.status).toBe(400);
    expect(invalidType.status).toBe(400);
    expect(await invalidDomain.json()).toMatchObject({ errorCode: "DNS_INVALID_DOMAIN" });
    expect(await invalidType.json()).toMatchObject({ errorCode: "DNS_INVALID_RECORD_TYPE" });
    expect(performDnsLookupMock).not.toHaveBeenCalled();
  });

  it("preserves single-record and multi-record response contracts", async () => {
    performDnsLookupMock.mockImplementation(async (domain, recordType) => ({
      domain,
      recordType,
      records: [recordType === "A" ? "203.0.113.8" : "2001:db8::8"],
      success: true,
      timestamp: Date.now(),
    }));

    const single = await dnsLookup(post({ domain: "Example.COM.", recordType: "a" }));
    const defaulted = await dnsLookup(post({ domain: "example.com" }));
    const multiple = await dnsLookup(post({ domain: "example.com", recordTypes: ["A", "AAAA"] }));
    expect(await single.json()).toMatchObject({ domain: "example.com", recordType: "A", success: true });
    expect(await defaulted.json()).toMatchObject({
      results: [{ domain: "example.com", recordType: "A" }],
    });
    expect(await multiple.json()).toMatchObject({
      results: [
        { domain: "example.com", recordType: "A" },
        { domain: "example.com", recordType: "AAAA" },
      ],
    });
  });
});
