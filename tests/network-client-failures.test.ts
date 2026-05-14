import { afterEach, describe, expect, it, vi } from "vitest";
import { serverPortScan, serverSpeedTest } from "@/lib/utils/network/server-api-client";

afterEach(() => vi.unstubAllGlobals());

describe("network client failure contracts", () => {
  it("preserves a port scan API error instead of inventing closed results", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ error: "Ports must contain at most 20 entries" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(serverPortScan("example.com", [80, 443])).rejects.toThrow(
      "Ports must contain at most 20 entries",
    );
  });

  it("preserves an error payload with HTTP 200 for the UI to report as failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ testType: "download", error: "Upstream unavailable" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(serverSpeedTest("download", 10)).resolves.toMatchObject({
      error: "Upstream unavailable",
    });
  });
});
