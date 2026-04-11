import { describe, expect, it } from "vitest";
import { convertCssUnit, createCssClamp, dataUriToSvg, formatJavaScript, generateOpenGraphTags, generateWebManifest, svgToDataUri } from "@/lib/processors/web-code-core";

describe("Phase 3 web-code processors", () => {
  it("formats JavaScript and TypeScript with parser errors", async () => {
    await expect(formatJavaScript("const value={a:1}", "javascript")).resolves.toMatchObject({ ok: true, value: expect.stringContaining("a: 1") });
    await expect(formatJavaScript("type User={id:number}", "typescript")).resolves.toMatchObject({ ok: true, value: expect.stringContaining("id: number") });
    await expect(formatJavaScript("const =", "javascript")).resolves.toMatchObject({ ok: false });
  });

  it("round-trips UTF-8 SVG data URIs and rejects scripts", () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><text>Xin chào</text></svg>';
    for (const encoding of ["percent", "base64"] as const) {
      const uri = svgToDataUri(svg, encoding);
      expect(uri.ok).toBe(true);
      if (uri.ok) expect(dataUriToSvg(uri.value)).toEqual({ ok: true, value: svg });
    }
    expect(svgToDataUri("<svg><script>alert(1)</script></svg>").ok).toBe(false);
  });

  it("converts CSS units with explicit context", () => {
    expect(convertCssUnit(2, "rem", { rootFontPx: 16 })).toMatchObject({ ok: true, value: { px: 32, rem: 2 } });
    expect(convertCssUnit(50, "%", { parentPx: 200 })).toMatchObject({ ok: true, value: { px: 100 } });
    expect(convertCssUnit(1, "rem", { rootFontPx: 0 }).ok).toBe(false);
  });

  it("generates bounded CSS clamp expressions", () => {
    expect(createCssClamp(16, 32, 320, 1280)).toEqual({ ok: true, value: { slope: 1.6666666666666667, intercept: 10.666666666666666, css: "clamp(16px, 10.6667px + 1.6667vw, 32px)" } });
    expect(createCssClamp(32, 16, 320, 1280).ok).toBe(false);
  });

  it("escapes generated Open Graph attributes and validates URLs", () => {
    const result = generateOpenGraphTags({ title: 'A "title"', description: "<unsafe>", url: "https://example.com", image: "https://example.com/image.png" });
    expect(result).toMatchObject({ ok: true });
    if (result.ok) {
      expect(result.value).toContain("A &quot;title&quot;");
      expect(result.value).toContain("&lt;unsafe&gt;");
    }
    expect(generateOpenGraphTags({ title: "A", description: "B", url: "javascript:x", image: "https://example.com/x" }).ok).toBe(false);
  });

  it("generates valid web manifests and enforces core constraints", () => {
    const result = generateWebManifest({ name: "Dev Tool", shortName: "DevTool", startUrl: "/", display: "standalone", themeColor: "#112233", backgroundColor: "#ffffff" });
    expect(result).toMatchObject({ ok: true });
    if (result.ok) expect(JSON.parse(result.value)).toMatchObject({ short_name: "DevTool", display: "standalone" });
    expect(generateWebManifest({ name: "Dev Tool", shortName: "This name is too long", startUrl: "/", display: "standalone", themeColor: "#112233", backgroundColor: "#ffffff" }).ok).toBe(false);
  });
});
