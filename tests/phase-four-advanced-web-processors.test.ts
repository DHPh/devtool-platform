import { describe, expect, it } from "vitest";
import { minifyJavaScript, optimizeSvg } from "@/lib/processors";

describe("Phase 4 advanced web processors", () => {
  it("minifies modern JavaScript and reports exact UTF-8 sizes", async () => {
    const input = "function greet(name) { const message = `Hello ${name}`; return message; } console.log(greet('Ada'));";
    const result = await minifyJavaScript(input, { mangle: false });
    expect(result).toMatchObject({ ok: true });
    if (result.ok) {
      expect(result.value.output).toContain('console.log(greet("Ada"))');
      expect(result.value.outputBytes).toBe(new TextEncoder().encode(result.value.output).byteLength);
      expect(result.value.outputBytes).toBeLessThan(result.value.originalBytes);
    }
    await expect(minifyJavaScript("function {")).resolves.toMatchObject({ ok: false });
  });

  it("optimizes safe SVG and rejects active content", async () => {
    const input = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><!-- note --><rect x="0" y="0" width="10" height="10" fill="#ff0000" /></svg>';
    const result = await optimizeSvg(input);
    expect(result).toMatchObject({ ok: true });
    if (result.ok) {
      expect(result.value.output).toContain('viewBox="0 0 10 10"');
      expect(result.value.output).not.toContain("note");
      expect(result.value.outputBytes).toBeLessThan(result.value.originalBytes);
    }
    await expect(optimizeSvg("<svg><script/></svg>")).resolves.toMatchObject({ ok: false });
  });
});
