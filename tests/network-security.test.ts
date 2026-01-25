import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  boundedNetworkNumber,
  checkNetworkRateLimit,
  logNetworkSecurityEvent,
  networkRateLimitResponse,
  resetNetworkRateLimits,
} from "@/lib/server/network-security";
import {
  PORT_SCAN_LIMITS,
  validatePortScanInput,
} from "@/app/api/network/port-scan/route";

function request(address = "203.0.113.10") {
  return new NextRequest("http://localhost/api/network/url-test", {
    headers: { "x-forwarded-for": address },
  });
}

beforeEach(() => resetNetworkRateLimits());

describe("network endpoint security controls", () => {
  it("bounds invalid and excessive network timing inputs", () => {
    expect(boundedNetworkNumber("not-a-number", 3_000, 100, 5_000)).toBe(3_000);
    expect(boundedNetworkNumber(-1, 3_000, 100, 5_000)).toBe(100);
    expect(boundedNetworkNumber(60_000, 3_000, 100, 5_000)).toBe(5_000);
  });

  it("rate limits by endpoint and anonymized client", async () => {
    const first = checkNetworkRateLimit(request(), "url-test", {
      limit: 2,
      windowMs: 60_000,
      now: 1_000,
    });
    const second = checkNetworkRateLimit(request(), "url-test", {
      limit: 2,
      windowMs: 60_000,
      now: 1_001,
    });
    const third = checkNetworkRateLimit(request(), "url-test", {
      limit: 2,
      windowMs: 60_000,
      now: 1_002,
    });

    expect(first.clientId).toMatch(/^[a-f0-9]{16}$/);
    expect(first.clientId).not.toContain("203.0.113.10");
    expect(second.allowed).toBe(true);
    expect(third).toMatchObject({ allowed: false, remaining: 0 });

    const response = networkRateLimitResponse(third);
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("60");
    expect(await response.json()).toMatchObject({ errorCode: "RATE_LIMITED" });
  });

  it("uses structured logs with no destination or payload field", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    logNetworkSecurityEvent({
      endpoint: "port-scan",
      operation: "tcp_scan",
      outcome: "blocked",
      clientId: "anonymous",
      errorCode: "DESTINATION_BLOCKED",
      itemCount: 2,
    });

    const logged = JSON.parse(String(info.mock.calls[0][0]));
    expect(logged).toMatchObject({
      type: "network_security",
      endpoint: "port-scan",
      outcome: "blocked",
      errorCode: "DESTINATION_BLOCKED",
    });
    expect(logged).not.toHaveProperty("url");
    expect(logged).not.toHaveProperty("host");
    expect(logged).not.toHaveProperty("payload");
  });

  it("constrains port values and scan size", () => {
    expect(PORT_SCAN_LIMITS).toEqual({
      maxPorts: 20,
      concurrency: 4,
      maxTimeoutMs: 5_000,
    });
    expect(validatePortScanInput([80, 443, 443])).toEqual([80, 443]);
    expect(() => validatePortScanInput([0])).toThrow("between 1 and 65535");
    expect(() => validatePortScanInput([65_536])).toThrow("between 1 and 65535");
    expect(() => validatePortScanInput(Array.from({ length: 21 }, (_, index) => index + 1))).toThrow("between 1 and 20 entries");
  });
});
