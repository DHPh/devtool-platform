import { describe, expect, it } from "vitest";
import {
  analyzeCors,
  analyzeEmailDns,
  analyzeSecurityHeaders,
  checkDnsPropagation,
  inspectOpenGraph,
  inspectRobots,
  traceRedirects,
  validateSitemap,
  type WebsiteRequester,
} from "@/lib/server/website-inspection-core";

function response(
  url: string,
  body: string,
  headers: Record<string, string> = {},
  status = 200,
) {
  return {
    url,
    body: new TextEncoder().encode(body),
    headers,
    status,
    statusText: "OK",
    redirectCount: 0,
  };
}

describe("Phase 5 website inspection core", () => {
  it("collects redirect hops only through the bounded request callback", async () => {
    const request: WebsiteRequester = async (url, options) => {
      options?.onRedirect?.({
        from: url,
        to: "https://example.com/final",
        status: 301,
      });
      return response("https://example.com/final", "");
    };
    await expect(
      traceRedirects("https://example.com", request),
    ).resolves.toEqual({
      finalUrl: "https://example.com/final",
      status: 200,
      hops: [
        {
          from: "https://example.com",
          to: "https://example.com/final",
          status: 301,
        },
      ],
    });
  });

  it("scores security headers and preserves recommendations", async () => {
    const request: WebsiteRequester = async () =>
      response("https://example.com/", "", {
        "content-security-policy": "default-src 'self'",
        "strict-transport-security": "max-age=31536000",
        "x-content-type-options": "nosniff",
      });
    const result = await analyzeSecurityHeaders("https://example.com", request);
    expect(result.score).toBe(50);
    expect(
      result.checks.filter(({ status }) => status === "missing"),
    ).toHaveLength(3);
  });

  it("detects unsafe credentialed wildcard CORS", async () => {
    const request: WebsiteRequester = async () =>
      response(
        "https://api.example.com/",
        "",
        {
          "access-control-allow-origin": "*",
          "access-control-allow-credentials": "true",
          "access-control-allow-methods": "GET, POST",
        },
        204,
      );
    const result = await analyzeCors("https://api.example.com", request);
    expect(result.issues).toContain(
      "Wildcard origin cannot be combined safely with credentialed CORS.",
    );
  });

  it("parses robots directives without fetching linked sitemaps", async () => {
    const request: WebsiteRequester = async (url) =>
      response(
        url,
        "User-agent: *\nDisallow: /private\nSitemap: https://example.com/sitemap.xml",
      );
    const result = await inspectRobots("https://example.com/page", request);
    expect(result.rules).toHaveLength(2);
    expect(result.sitemaps).toEqual(["https://example.com/sitemap.xml"]);
  });

  it("validates and bounds sitemap locations", async () => {
    const request: WebsiteRequester = async (url) =>
      response(
        url,
        '<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://example.com/</loc></url></urlset>',
      );
    await expect(
      validateSitemap("https://example.com/sitemap.xml", request),
    ).resolves.toMatchObject({
      kind: "urlset",
      locations: ["https://example.com/"],
      issues: [],
      truncated: false,
    });
  });

  it("extracts bounded Open Graph metadata without executing HTML", async () => {
    const html =
      '<html><head><meta property="og:title" content="Example"><meta property="og:description" content="Summary"><meta property="og:image" content="https://example.com/image.png"><link rel="canonical" href="https://example.com/"><script>alert(1)</script></head></html>';
    const request: WebsiteRequester = async (url) =>
      response(url, html, { "content-type": "text/html" });
    await expect(
      inspectOpenGraph("https://example.com", request),
    ).resolves.toMatchObject({
      title: "Example",
      description: "Summary",
      image: "https://example.com/image.png",
      canonical: "https://example.com/",
      issues: [],
    });
  });

  it("analyzes mail DNS records and policy weaknesses", async () => {
    const lookup = async (
      domain: string,
      recordType: "A" | "AAAA" | "MX" | "TXT" | "NS" | "SOA" | "CNAME" | "PTR",
    ) => ({
      domain,
      recordType,
      success: true,
      timestamp: 0,
      records:
        recordType === "MX"
          ? ["10 mail.example.com"]
          : domain.startsWith("_dmarc")
            ? ["v=DMARC1; p=none"]
            : ["v=spf1 include:_spf.example.com -all"],
    });
    await expect(analyzeEmailDns("Example.COM", lookup)).resolves.toEqual({
      domain: "example.com",
      mx: ["10 mail.example.com"],
      spf: ["v=spf1 include:_spf.example.com -all"],
      dmarc: ["v=DMARC1; p=none"],
      issues: ["DMARC policy is monitoring-only (p=none)."],
    });
  });

  it("compares a bounded set of DNS-over-HTTPS resolvers", async () => {
    const request: WebsiteRequester = async (url) =>
      response(
        url,
        JSON.stringify({ Status: 0, Answer: [{ data: "93.184.216.34" }] }),
        { "content-type": "application/dns-json" },
      );
    const result = await checkDnsPropagation("example.com", "A", request);
    expect(result.consistent).toBe(true);
    expect(result.results).toHaveLength(3);
    expect(result.results.map(({ resolver }) => resolver)).toEqual([
      "Cloudflare",
      "Google",
      "Quad9",
    ]);
  });
});
