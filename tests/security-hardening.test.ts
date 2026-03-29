import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import nextConfig from "../next.config";
import { serializeJsonForHtml } from "@/lib/security/safe-json";
import { validateSafeSvg } from "@/lib/security/svg-security";
import {
  API_JSON_MAX_BYTES,
  readBoundedJson,
} from "@/lib/server/bounded-json";

describe("HTML and SVG injection hardening", () => {
  it("serializes JSON without allowing a script element breakout", () => {
    const serialized = serializeJsonForHtml({
      value: "</script><script>alert(1)</script>&\u2028",
    });

    expect(serialized).not.toMatch(/[<>&\u2028\u2029]/);
    expect(JSON.parse(serialized)).toEqual({
      value: "</script><script>alert(1)</script>&\u2028",
    });
    expect(serializeJsonForHtml(undefined)).toBe("null");
  });

  it("allows self-contained SVG graphics", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">' +
      '<defs><linearGradient id="paint"><stop offset="0" stop-color="#fff"/></linearGradient></defs>' +
      '<rect width="10" height="10" fill="url(#paint)"/></svg>';
    expect(validateSafeSvg(svg)).toEqual({ ok: true, value: svg });
  });

  it.each([
    ["scripts", "<svg><script>alert(1)</script></svg>"],
    ["event handlers", '<svg><rect onload="alert(1)"/></svg>'],
    ["foreign HTML", "<svg><foreignObject><div>unsafe</div></foreignObject></svg>"],
    ["external images", '<svg><image href="https://example.com/a.png"/></svg>'],
    ["embedded styles", "<svg><style>rect{fill:red}</style></svg>"],
    ["external paint", '<svg><rect fill="url(https://example.com/a.svg#x)"/></svg>'],
    ["entities", '<!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><svg/>'],
  ])("rejects SVG %s", (_name, svg) => {
    expect(validateSafeSvg(svg).ok).toBe(false);
  });
});

describe("bounded API JSON", () => {
  function jsonRequest(body: string, headers: HeadersInit = {}) {
    return new Request("http://localhost/api/network/test", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body,
    });
  }

  it("parses valid JSON", async () => {
    const result = await readBoundedJson<{ value: number }>(
      jsonRequest('{"value":42}'),
    );
    expect(result).toEqual({ ok: true, data: { value: 42 } });
  });

  it.each([
    [
      "unsupported content types",
      new Request("http://localhost", { method: "POST", body: "{}" }),
      415,
    ],
    ["invalid JSON", jsonRequest("{"), 400],
    [
      "a declared oversized body",
      jsonRequest("{}", {
        "content-length": String(API_JSON_MAX_BYTES + 1),
      }),
      413,
    ],
    [
      "an actual oversized body",
      jsonRequest(JSON.stringify({ value: "x".repeat(API_JSON_MAX_BYTES) })),
      413,
    ],
  ])("rejects %s", async (_name, request, status) => {
    const result = await readBoundedJson(request);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(status);
  });
});

describe("security architecture", () => {
  it("applies browser security headers to every route", async () => {
    const rules = await nextConfig.headers?.();
    const headers = new Map(
      rules?.[0]?.headers.map(({ key, value }) => [key, value]),
    );
    const csp = headers.get("Content-Security-Policy");

    expect(rules?.[0]?.source).toBe("/(.*)");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(headers.get("Strict-Transport-Security")).toContain(
      "includeSubDomains",
    );
    expect(headers.get("Permissions-Policy")).toContain("camera=()");
  });

  it("uses bounded JSON parsing in every network POST route", async () => {
    const apiRoot = path.resolve("src/app/api/network");
    const directories = await readdir(apiRoot, { withFileTypes: true });
    const routeFiles = directories
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(apiRoot, entry.name, "route.ts"));

    for (const routeFile of routeFiles) {
      const source = await readFile(routeFile, "utf8");
      if (!source.includes("export async function POST")) continue;
      expect(source, routeFile).toContain("readBoundedJson");
      expect(source, routeFile).not.toContain("request.json()");
    }
  });

  it("pins every GitHub Action to a full commit SHA", async () => {
    const workflow = await readFile(".github/workflows/ci.yml", "utf8");
    const uses = [...workflow.matchAll(/^\s*uses:\s*([^\s#]+)/gm)].map(
      (match) => match[1],
    );
    expect(uses.length).toBeGreaterThan(0);
    for (const action of uses) {
      expect(action, action).toMatch(/^[^@\s]+@[a-f0-9]{40}$/);
    }
  });
});
