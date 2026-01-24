import { describe, expect, it, vi } from "vitest";

import {
  OUTBOUND_LIMITS,
  OutboundRequestError,
  getSafeOutboundError,
  isPublicAddress,
  parseOutboundUrl,
  requestOutbound,
  type OutboundPolicyDependencies,
} from "@/lib/server/outbound-request-policy";

const PUBLIC_ADDRESS = [{ address: "93.184.216.34", family: 4 as const }];

const response = (
  overrides: Partial<{
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: Uint8Array;
  }> = {},
) => ({
  status: 200,
  statusText: "OK",
  headers: {},
  body: new Uint8Array(),
  ...overrides,
});

describe("outbound request policy", () => {
  it("allows HTTP(S) URLs without credentials", () => {
    expect(parseOutboundUrl("https://example.com/path").hostname)
      .toBe("example.com");
    expect(() => parseOutboundUrl("file:///etc/passwd"))
      .toThrowError(new OutboundRequestError("UNSUPPORTED_PROTOCOL"));
    expect(() => parseOutboundUrl("https://user:secret@example.com"))
      .toThrowError(new OutboundRequestError("CREDENTIALS_NOT_ALLOWED"));
  });

  it.each([
    "0.0.0.0",
    "10.0.0.1",
    "100.64.0.1",
    "127.0.0.1",
    "169.254.169.254",
    "172.16.0.1",
    "192.168.1.1",
    "224.0.0.1",
    "::",
    "::1",
    "::ffff:127.0.0.1",
    "64:ff9b::1",
    "2001:db8::1",
    "2002::1",
    "3fff::1",
    "fc00::1",
    "fe80::1",
    "ff00::1",
  ])("blocks non-public address %s", (address) => {
    expect(isPublicAddress(address)).toBe(false);
  });

  it.each(["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111"])(
    "allows public address %s",
    (address) => {
      expect(isPublicAddress(address)).toBe(true);
    },
  );

  it("rejects a hostname when any resolved address is non-public", async () => {
    const transport = vi.fn();

    await expect(
      requestOutbound("https://example.com", {}, {
        resolve: async () => [
          ...PUBLIC_ADDRESS,
          { address: "127.0.0.1", family: 4 },
        ],
        transport,
      }),
    ).rejects.toMatchObject({ code: "DESTINATION_BLOCKED" });
    expect(transport).not.toHaveBeenCalled();
  });

  it("revalidates every redirect destination", async () => {
    const resolve = vi.fn(async (hostname: string) => {
      if (hostname === "127.0.0.1") {
        throw new OutboundRequestError("DESTINATION_BLOCKED");
      }
      return PUBLIC_ADDRESS;
    });
    const transport: NonNullable<OutboundPolicyDependencies["transport"]> =
      vi.fn(async () =>
        response({ status: 302, headers: { location: "http://127.0.0.1" } }),
      );

    await expect(
      requestOutbound("https://example.com", {}, { resolve, transport }),
    ).rejects.toMatchObject({ code: "DESTINATION_BLOCKED" });
    expect(resolve).toHaveBeenCalledTimes(2);
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it("limits redirects, request bodies, and response bodies", async () => {
    const resolve = async () => PUBLIC_ADDRESS;
    const redirectTransport: NonNullable<
      OutboundPolicyDependencies["transport"]
    > = vi.fn(async () =>
      response({ status: 302, headers: { location: "/again" } }),
    );

    await expect(
      requestOutbound(
        "https://example.com",
        { maxRedirects: 1 },
        { resolve, transport: redirectTransport },
      ),
    ).rejects.toMatchObject({ code: "TOO_MANY_REDIRECTS" });
    await expect(
      requestOutbound("https://example.com", {
        body: "four",
        maxRequestBodyBytes: 3,
      }),
    ).rejects.toMatchObject({ code: "REQUEST_BODY_TOO_LARGE" });
    await expect(
      requestOutbound(
        "https://example.com",
        { maxResponseBytes: 3 },
        {
          resolve,
          transport: async () => response({ body: new Uint8Array(4) }),
        },
      ),
    ).rejects.toMatchObject({ code: "RESPONSE_TOO_LARGE" });
  });

  it("does not allow callers to raise policy limits", async () => {
    const transport: NonNullable<OutboundPolicyDependencies["transport"]> =
      vi.fn(async (request) => {
        expect(request.connectionTimeoutMs).toBe(
          OUTBOUND_LIMITS.connectionTimeoutMs,
        );
        expect(request.responseTimeoutMs).toBe(
          OUTBOUND_LIMITS.responseTimeoutMs,
        );
        expect(request.maxResponseBytes).toBe(
          OUTBOUND_LIMITS.maxResponseBytes,
        );
        return response();
      });

    await requestOutbound(
      "https://example.com",
      {
        connectionTimeoutMs: Number.MAX_SAFE_INTEGER,
        responseTimeoutMs: Number.MAX_SAFE_INTEGER,
        totalTimeoutMs: Number.MAX_SAFE_INTEGER,
        maxResponseBytes: Number.MAX_SAFE_INTEGER,
      },
      { resolve: async () => PUBLIC_ADDRESS, transport },
    );
  });

  it("bounds DNS resolution with the total timeout", async () => {
    await expect(
      requestOutbound(
        "https://example.com",
        { totalTimeoutMs: 5 },
        {
          resolve: () => new Promise(() => undefined),
          transport: async () => response(),
        },
      ),
    ).rejects.toMatchObject({ code: "TOTAL_TIMEOUT" });
  });

  it("caps concurrent requests", async () => {
    let active = 0;
    let peak = 0;
    let openGate: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      openGate = resolve;
    });
    const transport: NonNullable<OutboundPolicyDependencies["transport"]> =
      vi.fn(async () => {
        active++;
        peak = Math.max(peak, active);
        await gate;
        active--;
        return response();
      });
    const requests = Array.from({ length: OUTBOUND_LIMITS.maxConcurrency + 1 },
      () =>
        requestOutbound(
          "https://example.com",
          { totalTimeoutMs: 1_000 },
          { resolve: async () => PUBLIC_ADDRESS, transport },
        ),
    );

    await vi.waitFor(() => {
      expect(active).toBe(OUTBOUND_LIMITS.maxConcurrency);
    });
    openGate?.();
    await Promise.all(requests);

    expect(peak).toBe(OUTBOUND_LIMITS.maxConcurrency);
  });

  it("returns stable safe errors without leaking causes", () => {
    const safe = getSafeOutboundError(new Error("secret internal address"));

    expect(safe).toEqual({
      code: "UPSTREAM_ERROR",
      message: "Remote request failed",
    });
    expect(JSON.stringify(safe)).not.toContain("secret internal address");
  });
});
