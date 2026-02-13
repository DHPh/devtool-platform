import { describe, expect, it } from "vitest";
import { createQrCodeModel, qrSvgDataUrl, renderQrCodeSvg } from "@/lib/processors";
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

  it("keeps QR processing local and produces an inline artifact", () => {
    const qr = tool("qr-generator");
    expect(qr.processing).toBe("client");
    expect(qr.description).toMatch(/locally|browser/i);
    const model = createQrCodeModel("hello world", "H");
    expect(qrSvgDataUrl(renderQrCodeSvg(model))).toMatch(/^data:image\/svg\+xml/);
  });
});
