import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/outbound-request-policy", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/lib/server/outbound-request-policy")
  >();
  return { ...actual, requestOutbound: vi.fn() };
});

import { POST } from "@/app/api/network/ip-info/route";
import {
  OutboundRequestError,
  requestOutbound,
} from "@/lib/server/outbound-request-policy";
import { resetNetworkRateLimits } from "@/lib/server/network-security";

const requestOutboundMock = vi.mocked(requestOutbound);

function post(body: unknown, client = "203.0.113.25") {
  return new NextRequest("http://localhost/api/network/ip-info", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": client,
    },
    body: JSON.stringify(body),
  });
}

function upstreamResponse(body: unknown, status = 200) {
  return {
    url: "https://ipapi.co/8.8.8.8/json/",
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: { "content-type": "application/json" },
    body: new TextEncoder().encode(JSON.stringify(body)),
    redirectCount: 0,
  };
}

beforeEach(() => {
  requestOutboundMock.mockReset();
  resetNetworkRateLimits();
  vi.spyOn(console, "info").mockImplementation(() => undefined);
});

describe("IP information route", () => {
  it("rejects malformed JSON without making an external request", async () => {
    const request = new NextRequest("http://localhost/api/network/ip-info", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not-json",
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: "Invalid request body",
      errorCode: "INVALID_REQUEST",
    });
    expect(requestOutboundMock).not.toHaveBeenCalled();
  });

  it.each([
    [{}, "IP address is required"],
    [{ ip: 1234 }, "IP address is required"],
    [{ ip: "999.1.1.1" }, "Invalid IP address format"],
    [{ ip: "example.com" }, "Invalid IP address format"],
  ])("rejects invalid input %#", async (body, message) => {
    const response = await POST(post(body));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: message,
      errorCode: "INVALID_IP",
    });
    expect(requestOutboundMock).not.toHaveBeenCalled();
  });

  it.each([
    "127.0.0.1",
    "10.1.2.3",
    "100.64.0.1",
    "169.254.169.254",
    "192.0.2.10",
    "224.0.0.1",
    "::1",
    "fc00::1",
    "fe80::1",
    "2001:db8::1",
  ])("rejects private or special-use address %s", async (ip) => {
    const response = await POST(post({ ip }));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      errorCode: "DESTINATION_BLOCKED",
    });
    expect(requestOutboundMock).not.toHaveBeenCalled();
  });

  it("performs a bounded lookup through the fixed HTTPS upstream", async () => {
    requestOutboundMock.mockResolvedValue(
      upstreamResponse({
        country_name: "United States",
        country_code: "US",
        region: "California",
        city: "Mountain View",
        latitude: 37.386,
        longitude: "-122.0838",
        timezone: "America/Los_Angeles",
        org: "Google LLC",
        asn: "AS15169",
      }),
    );

    const response = await POST(post({ ip: "8.8.8.8" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ip: "8.8.8.8",
      country: "United States",
      countryCode: "US",
      region: "California",
      city: "Mountain View",
      latitude: 37.386,
      longitude: -122.0838,
      timezone: "America/Los_Angeles",
      isp: "Google LLC",
      organization: "Google LLC",
      asn: "AS15169",
    });
    expect(requestOutboundMock).toHaveBeenCalledWith(
      "https://ipapi.co/8.8.8.8/json/",
      expect.objectContaining({
        method: "GET",
        totalTimeoutMs: 8_000,
        responseTimeoutMs: 8_000,
        maxRedirects: 1,
        maxResponseBytes: 65_536,
      }),
    );
  });

  it("supports public IPv6 addresses without allowing URL injection", async () => {
    requestOutboundMock.mockResolvedValue(upstreamResponse({ country_name: "US" }));

    const response = await POST(post({ ip: "2001:4860:4860::8888" }));

    expect(response.status).toBe(200);
    expect(requestOutboundMock).toHaveBeenCalledWith(
      "https://ipapi.co/2001%3A4860%3A4860%3A%3A8888/json/",
      expect.any(Object),
    );
  });

  it.each([
    new OutboundRequestError("TOTAL_TIMEOUT", {
      cause: new Error("socket 10.0.0.4 timed out"),
    }),
    new OutboundRequestError("RESPONSE_TOO_LARGE"),
    new Error("secret upstream diagnostics"),
  ])("returns one safe error contract for upstream failures", async (error) => {
    requestOutboundMock.mockRejectedValue(error);

    const response = await POST(post({ ip: "8.8.8.8" }));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toMatchObject({
      ip: "8.8.8.8",
      error: "IP information service is unavailable",
      errorCode: "UPSTREAM_ERROR",
    });
    expect(JSON.stringify(body)).not.toContain("socket");
    expect(JSON.stringify(body)).not.toContain("secret");
  });

  it("rejects invalid upstream JSON without exposing it", async () => {
    requestOutboundMock.mockResolvedValue({
      ...upstreamResponse({}),
      body: new TextEncoder().encode("<html>provider error</html>"),
    });

    const response = await POST(post({ ip: "8.8.8.8" }));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(JSON.stringify(body)).not.toContain("provider error");
  });

  it.each([
    upstreamResponse({ message: "provider quota details" }, 429),
    upstreamResponse({ error: true, reason: "provider account details" }),
  ])("maps provider rejections to the safe error contract", async (upstream) => {
    requestOutboundMock.mockResolvedValue(upstream);

    const response = await POST(post({ ip: "8.8.8.8" }));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toMatchObject({
      error: "IP information service is unavailable",
      errorCode: "UPSTREAM_ERROR",
    });
    expect(JSON.stringify(body)).not.toContain("provider");
  });

  it("rate limits repeated lookups before calling the upstream", async () => {
    requestOutboundMock.mockResolvedValue(upstreamResponse({}));

    let response: Response | undefined;
    for (let attempt = 0; attempt < 21; attempt++) {
      response = await POST(post({ ip: "8.8.8.8" }, "198.51.100.44"));
    }

    expect(response?.status).toBe(429);
    expect(await response?.json()).toMatchObject({ errorCode: "RATE_LIMITED" });
    expect(requestOutboundMock).toHaveBeenCalledTimes(20);
  });
});
