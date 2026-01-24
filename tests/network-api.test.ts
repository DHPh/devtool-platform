import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/outbound-request-policy", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/lib/server/outbound-request-policy")
  >();
  return { ...actual, requestOutbound: vi.fn() };
});

import { POST as checkFileLink } from "@/app/api/network/file-link-check/route";
import { POST as testUrl } from "@/app/api/network/url-test/route";
import {
  OutboundRequestError,
  requestOutbound,
} from "@/lib/server/outbound-request-policy";

const requestOutboundMock = vi.mocked(requestOutbound);

function post(path: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  requestOutboundMock.mockReset();
});

describe("network API boundaries", () => {
  it("retries HEAD-specific 406 responses with a bounded GET", async () => {
    requestOutboundMock
      .mockResolvedValueOnce({
        url: "https://example.com/",
        status: 406,
        statusText: "Not Acceptable",
        headers: { "content-type": "text/html" },
        body: new Uint8Array(),
        redirectCount: 0,
      })
      .mockResolvedValueOnce({
        url: "https://example.com/",
        status: 200,
        statusText: "OK",
        headers: { "content-type": "text/html" },
        body: new Uint8Array(),
        redirectCount: 0,
      });

    const response = await testUrl(
      post("/api/network/url-test", { url: "https://example.com" }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      accessible: true,
      statusCode: 200,
      statusText: "OK",
    });
    expect(requestOutboundMock).toHaveBeenNthCalledWith(
      1,
      "https://example.com",
      expect.objectContaining({ method: "HEAD" }),
    );
    expect(requestOutboundMock).toHaveBeenNthCalledWith(
      2,
      "https://example.com",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ range: "bytes=0-1023" }),
      }),
    );
  });

  it("rejects missing and malformed URL input", async () => {
    requestOutboundMock.mockRejectedValue(
      new OutboundRequestError("INVALID_URL"),
    );
    const missing = await testUrl(post("/api/network/url-test", {}));
    const malformed = await testUrl(
      post("/api/network/url-test", { url: "not a URL" }),
    );

    expect(missing.status).toBe(400);
    expect(await missing.json()).toMatchObject({ error: "URL is required" });
    expect(malformed.status).toBe(400);
    expect(await malformed.json()).toMatchObject({
      accessible: false,
      error: "Invalid URL format",
      errorCode: "INVALID_URL",
    });
  });

  it.each([
    "http://localhost/admin",
    "http://127.0.0.1/internal",
    "http://10.0.0.1/private",
    "file:///etc/passwd",
  ])("maps blocked outbound destination %s to a safe response", async (url) => {
    requestOutboundMock.mockRejectedValue(
      new OutboundRequestError("DESTINATION_BLOCKED"),
    );

    const urlResponse = await testUrl(
      post("/api/network/url-test", { url }),
    );
    const fileResponse = await checkFileLink(
      post("/api/network/file-link-check", { url }),
    );

    expect(urlResponse.status).toBe(400);
    expect(fileResponse.status).toBe(400);
    expect(await urlResponse.json()).toMatchObject({
      error: "Destination is not allowed",
      errorCode: "DESTINATION_BLOCKED",
    });
  });

  it("reports outbound request timeouts without internal details", async () => {
    requestOutboundMock.mockRejectedValue(
      new OutboundRequestError("TOTAL_TIMEOUT", {
        cause: new Error("internal connection details"),
      }),
    );

    const response = await testUrl(
      post("/api/network/url-test", {
        url: "https://example.com",
        timeout: 0.001,
      }),
    );
    const body = await response.json();

    expect(body).toMatchObject({
      accessible: false,
      error: "Request timed out",
      errorCode: "TOTAL_TIMEOUT",
    });
    expect(JSON.stringify(body)).not.toContain("internal connection details");
  });
});
