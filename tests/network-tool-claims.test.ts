import { describe, expect, it } from "vitest";
import { buildQrCodeUrl } from "@/lib/processors";
import { TOOL_REGISTRY } from "@/lib/registry";

function tool(id: string) {
  const result = TOOL_REGISTRY.find((entry) => entry.id === id);
  if (!result) throw new Error(`Missing tool ${id}`);
  return result;
}

describe("network tool execution claims", () => {
  it("describes browser HTTP execution and its CORS boundary", () => {
    for (const id of ["api-tester", "http-client"]) {
      expect(tool(id)).toMatchObject({ processing: "client" });
      expect(tool(id).description).toMatch(/Browser-based.*CORS/i);
    }
  });

  it("describes DNS as server-side DNS without unsupported WHOIS claims", () => {
    const dns = tool("dns-lookup");
    expect(dns.processing).toBe("server");
    expect(`${dns.description} ${dns.tags.join(" ")}`).not.toMatch(/whois/i);
  });

  it("describes WebSocket execution as a bounded server-side handshake", () => {
    const websocket = tool("websocket-tester");
    expect(websocket.processing).toBe("server");
    expect(websocket.description).toMatch(/bounded server-side WebSocket handshake/i);
    expect(websocket.description).not.toMatch(/messaging|persistent/i);
  });

  it("discloses remote QR processing and validates provider inputs", () => {
    const qr = tool("qr-generator");
    expect(qr.processing).toBe("hybrid");
    expect(qr.description).toMatch(/third-party.*sent/i);

    const url = new URL(buildQrCodeUrl("hello world", 256, "h"));
    expect(url.origin).toBe("https://api.qrserver.com");
    expect(url.searchParams.get("data")).toBe("hello world");
    expect(url.searchParams.get("ecc")).toBe("H");
    expect(() => buildQrCodeUrl("secret", 256, "invalid")).toThrow(
      "Unsupported QR error correction level",
    );
    expect(() => buildQrCodeUrl("x".repeat(2_001))).toThrow(
      "QR content must be 2,000 characters or fewer",
    );
  });
});
