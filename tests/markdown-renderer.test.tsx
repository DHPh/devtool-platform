import { describe, expect, it } from "vitest";
import {
  renderMarkdownToSafeHtml,
  sanitizeMarkdownUrl,
} from "@/lib/markdown/markdown-renderer";

describe("Markdown Preview safe renderer", () => {
  it("renders CommonMark and GFM constructs", () => {
    const output = renderMarkdownToSafeHtml(`# Heading

| Name | Active |
| --- | --- |
| Ada | yes |

- [x] tested`);

    expect(output).toContain("<h1>Heading</h1>");
    expect(output).toContain("<table>");
    expect(output).toContain('type="checkbox" disabled="" checked=""');
  });

  it("does not render raw HTML or event-handler attributes", () => {
    const output = renderMarkdownToSafeHtml(
      '<script>alert(1)</script><img src="x" onerror="alert(2)">\n\n**safe**'
    );

    expect(output).not.toContain("<script");
    expect(output).not.toContain("<img");
    expect(output).not.toContain("onerror");
    expect(output).not.toContain("alert(1)");
    expect(output).toContain("<strong>safe</strong>");
  });

  it.each([
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
  ])("rejects an unsafe link URL: %s", (url) => {
    expect(sanitizeMarkdownUrl(url, "link")).toBe("");
  });

  it("uses a stricter scheme allowlist for images", () => {
    expect(sanitizeMarkdownUrl("mailto:user@example.com", "link")).toBe(
      "mailto:user@example.com"
    );
    expect(sanitizeMarkdownUrl("mailto:user@example.com", "image")).toBe("");
    expect(sanitizeMarkdownUrl("https://example.com/image.png", "image")).toBe(
      "https://example.com/image.png"
    );
  });

  it("removes unsafe destinations while retaining visible link text", () => {
    const output = renderMarkdownToSafeHtml(
      "[click me](javascript:alert(1)) ![pixel](data:image/svg+xml,bad)"
    );

    expect(output).not.toContain("javascript:");
    expect(output).not.toContain("data:image");
    expect(output).toContain("click me");
    expect(output).toContain("pixel");
  });

  it("handles broken markup as inert text", () => {
    const output = renderMarkdownToSafeHtml(
      "[broken](<javascript:alert(1)> and <img src=x onerror=alert(2)"
    );

    expect(output).not.toContain("<img");
    expect(output).not.toContain('href="javascript:');
    expect(output).toContain("&lt;img src=x onerror=alert(2)");
  });
});
