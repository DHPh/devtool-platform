import { describe, expect, it } from "vitest";
import {
  formatJson,
  minifyJson,
  stripJsonComments,
  validateJson,
} from "@/lib/processors/json";

describe("JSONC comments", () => {
  const jsonc = `{
  // keep URL-like text intact
  "url": "https://example.com/a/*literal*/",
  /* block comment */ "count": 2
}`;

  it("strips line and block comments without changing string contents", () => {
    expect(JSON.parse(stripJsonComments(jsonc))).toEqual({
      url: "https://example.com/a/*literal*/",
      count: 2,
    });
    expect(stripJsonComments(jsonc).split("\n")).toHaveLength(jsonc.split("\n").length);
  });

  it("keeps strict JSON validation by default and supports JSONC when requested", () => {
    expect(validateJson(jsonc).isValid).toBe(false);
    expect(validateJson(jsonc, { allowComments: true }).isValid).toBe(true);
    expect(validateJson('{"ok": true}').isValid).toBe(true);
    expect(validateJson('{"ok": true, /* broken').isValid).toBe(false);
  });

  it("formats and minifies comments only when removal is enabled", () => {
    expect(() => formatJson(jsonc)).toThrow();
    expect(formatJson(jsonc, { removeComments: true }).result).toContain("https://example.com/a/*literal*/");
    expect(minifyJson(jsonc, { removeComments: true }).result).toBe(
      '{"url":"https://example.com/a/*literal*/","count":2}',
    );
  });
});
