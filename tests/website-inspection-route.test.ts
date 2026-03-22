import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/outbound-request-policy", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/server/outbound-request-policy")>();
  return { ...actual, requestOutbound: vi.fn() };
});

import { POST } from "@/app/api/network/website-inspection/route";
import { OutboundRequestError, requestOutbound } from "@/lib/server/outbound-request-policy";
import { resetNetworkRateLimits } from "@/lib/server/network-security";

const requestOutboundMock = vi.mocked(requestOutbound);

function post(body: unknown) {
  return new NextRequest("http://localhost/api/network/website-inspection", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "198.51.100.31" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  requestOutboundMock.mockReset();
  resetNetworkRateLimits();
  vi.spyOn(console, "info").mockImplementation(() => undefined);
});

describe("website inspection route", () => {
  it("runs a bounded header analysis through the outbound policy", async () => {
    requestOutboundMock.mockResolvedValue({ url: "https://example.com/", status: 200, statusText: "OK", headers: { "content-security-policy": "default-src 'self'" }, body: new Uint8Array(), redirectCount: 0 });
    const response = await POST(post({ operation: "security-header-analyzer", url: "https://example.com" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ operation: "security-header-analyzer", result: { status: 200 } });
    expect(requestOutboundMock).toHaveBeenCalledWith("https://example.com", expect.objectContaining({ method: "HEAD", maxResponseBytes: 0, maxRedirects: 3 }));
  });

  it("rejects unsupported operations before any outbound request", async () => {
    const response = await POST(post({ operation: "proxy-anything", url: "https://example.com" }));
    expect(response.status).toBe(400);
    expect(requestOutboundMock).not.toHaveBeenCalled();
  });

  it("returns safe errors for blocked destinations", async () => {
    requestOutboundMock.mockRejectedValue(new OutboundRequestError("DESTINATION_BLOCKED", { cause: new Error("internal address detail") }));
    const response = await POST(post({ operation: "robots-inspector", url: "http://127.0.0.1" }));
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Destination is not allowed", errorCode: "DESTINATION_BLOCKED" });
    expect(JSON.stringify(body)).not.toContain("internal address detail");
  });
});
