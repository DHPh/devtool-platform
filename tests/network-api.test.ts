import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { POST as checkFileLink } from "@/app/api/network/file-link-check/route";
import { POST as testUrl } from "@/app/api/network/url-test/route";

function post(path: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("network API boundaries", () => {
  it("rejects missing and malformed URL input", async () => {
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
    });
  });

  it.each([
    "http://localhost/admin",
    "http://127.0.0.1/internal",
    "http://10.0.0.1/private",
    "file:///etc/passwd",
  ])("blocks outbound destination %s", async (url) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const urlResponse = await testUrl(
      post("/api/network/url-test", { url }),
    );
    const fileResponse = await checkFileLink(
      post("/api/network/file-link-check", { url }),
    );

    expect(urlResponse.status).toBe(400);
    expect(fileResponse.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports outbound request timeouts", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn((_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          const abort = () =>
            reject(new DOMException("The operation was aborted", "AbortError"));

          if (init?.signal?.aborted) {
            abort();
          } else {
            init?.signal?.addEventListener("abort", abort, { once: true });
          }
        }),
      ),
    );

    const response = await testUrl(
      post("/api/network/url-test", {
        url: "https://example.com",
        timeout: 0.001,
      }),
    );

    expect(await response.json()).toMatchObject({
      accessible: false,
      error: "Request timeout after 0.001s",
    });
  });
});
