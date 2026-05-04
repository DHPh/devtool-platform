// @vitest-environment node

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/og/route";

function collectTsFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return collectTsFiles(full);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

describe("dynamic /api/og route & centralized site URLs", () => {
  it("renders a real PNG OpenGraph card for homepage, directory, and tool slugs", async () => {
    const endpoints = [
      "https://example.com/api/og",
      "https://example.com/api/og?view=tools",
      "https://example.com/api/og?slug=json-studio",
    ];

    for (const url of endpoints) {
      const response = await GET(new NextRequest(url));
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("image/png");

      const bytes = new Uint8Array(await response.arrayBuffer());
      expect(bytes.length).toBeGreaterThan(1000);
      // PNG file signature magic bytes: 0x89 P N G
      expect(Array.from(bytes.slice(0, 4))).toEqual([0x89, 0x50, 0x4e, 0x47]);
    }
  }, 15_000);

  it("returns 404 JSON when slug does not exist", async () => {
    const response = await GET(
      new NextRequest("https://example.com/api/og?slug=not-a-real-tool"),
    );
    expect(response.status).toBe(404);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe("Tool not found");
  });

  it("keeps hardcoded domain literals out of app pages and breadcrumbs", () => {
    const targets = [
      ...collectTsFiles(join(process.cwd(), "src", "app")),
      join(process.cwd(), "src", "components", "ui", "breadcrumbs.tsx"),
    ];

    const offenders = targets.filter((filePath) =>
      readFileSync(filePath, "utf8").includes("devtool-platform.vercel.app"),
    );

    expect(offenders).toEqual([]);
  });
});
