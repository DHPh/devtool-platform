import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/website-inspection-core", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@/lib/server/website-inspection-core")
    >();
  return { ...actual, analyzeEmailDns: vi.fn(), checkDnsPropagation: vi.fn() };
});

import { POST } from "@/app/api/network/dns-inspection/route";
import {
  analyzeEmailDns,
  checkDnsPropagation,
} from "@/lib/server/website-inspection-core";
import { resetNetworkRateLimits } from "@/lib/server/network-security";

function post(body: unknown) {
  return new NextRequest("http://localhost/api/network/dns-inspection", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "198.51.100.32",
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.mocked(analyzeEmailDns).mockReset();
  vi.mocked(checkDnsPropagation).mockReset();
  resetNetworkRateLimits();
  vi.spyOn(console, "info").mockImplementation(() => undefined);
});

describe("DNS inspection route", () => {
  it("dispatches bounded email DNS analysis", async () => {
    vi.mocked(analyzeEmailDns).mockResolvedValue({
      domain: "example.com",
      mx: [],
      spf: [],
      dmarc: [],
      issues: [],
    });
    const response = await POST(
      post({ operation: "email-dns-analyzer", domain: "example.com" }),
    );
    expect(response.status).toBe(200);
    expect(analyzeEmailDns).toHaveBeenCalledWith("example.com");
  });

  it("dispatches DNS propagation with a bounded record type", async () => {
    vi.mocked(checkDnsPropagation).mockResolvedValue({
      domain: "example.com",
      recordType: "A",
      consistent: true,
      results: [],
    });
    const response = await POST(
      post({
        operation: "dns-propagation-checker",
        domain: "example.com",
        recordType: "A",
      }),
    );
    expect(response.status).toBe(200);
    expect(checkDnsPropagation).toHaveBeenCalledWith("example.com", "A");
  });

  it("rejects unsupported operations", async () => {
    const response = await POST(
      post({ operation: "recursive-zone-transfer", domain: "example.com" }),
    );
    expect(response.status).toBe(400);
    expect(analyzeEmailDns).not.toHaveBeenCalled();
    expect(checkDnsPropagation).not.toHaveBeenCalled();
  });
});
