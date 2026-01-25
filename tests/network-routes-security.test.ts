import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/outbound-request-policy", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/lib/server/outbound-request-policy")
  >();
  return {
    ...actual,
    requestOutbound: vi.fn(),
    resolvePublicAddresses: vi.fn(),
  };
});

import { POST as ping } from "@/app/api/network/ping/route";
import { POST as scanPorts } from "@/app/api/network/port-scan/route";
import { POST as speedTest } from "@/app/api/network/speed-test/route";
import { POST as websocketTest } from "@/app/api/network/websocket-test/route";
import {
  OutboundRequestError,
  requestOutbound,
  resolvePublicAddresses,
} from "@/lib/server/outbound-request-policy";
import { resetNetworkRateLimits } from "@/lib/server/network-security";

const requestOutboundMock = vi.mocked(requestOutbound);
const resolvePublicAddressesMock = vi.mocked(resolvePublicAddresses);

function post(path: string, body: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "198.51.100.22",
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  requestOutboundMock.mockReset();
  resolvePublicAddressesMock.mockReset();
  resetNetworkRateLimits();
  vi.spyOn(console, "info").mockImplementation(() => undefined);
});

describe("high-risk network routes", () => {
  it("applies the outbound policy to ping", async () => {
    requestOutboundMock.mockRejectedValue(new OutboundRequestError("DESTINATION_BLOCKED"));
    const response = await ping(post("/api/network/ping", { host: "127.0.0.1" }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ alive: false, errorCode: "DESTINATION_BLOCKED" });
    expect(requestOutboundMock).toHaveBeenCalledWith(
      "https://127.0.0.1",
      expect.objectContaining({ method: "HEAD", maxResponseBytes: 0 }),
    );
  });

  it("rejects private port-scan destinations before opening sockets", async () => {
    resolvePublicAddressesMock.mockRejectedValue(new OutboundRequestError("DESTINATION_BLOCKED"));
    const response = await scanPorts(post("/api/network/port-scan", { host: "10.0.0.1", ports: [80, 443] }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ errorCode: "DESTINATION_BLOCKED" });
    expect(resolvePublicAddressesMock).toHaveBeenCalledWith("10.0.0.1");
  });

  it("applies destination validation and transfer caps to speed tests", async () => {
    requestOutboundMock.mockRejectedValue(new OutboundRequestError("DESTINATION_BLOCKED"));
    const response = await speedTest(post("/api/network/speed-test", {
      testType: "download",
      downloadUrl: "http://169.254.169.254/latest/meta-data",
      duration: 60,
    }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ errorCode: "DESTINATION_BLOCKED" });
    expect(requestOutboundMock).toHaveBeenCalledWith(
      "http://169.254.169.254/latest/meta-data",
      expect.objectContaining({ maxResponseBytes: 1_048_576, totalTimeoutMs: 10_000 }),
    );
  });

  it("validates WebSocket DNS destinations before constructing a connection", async () => {
    resolvePublicAddressesMock.mockRejectedValue(new OutboundRequestError("DESTINATION_BLOCKED"));
    const response = await websocketTest(post("/api/network/websocket-test", { url: "ws://localhost/socket" }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ connected: false, errorCode: "DESTINATION_BLOCKED" });
    expect(resolvePublicAddressesMock).toHaveBeenCalledWith("localhost");
  });
});
