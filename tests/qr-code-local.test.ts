import { describe, expect, it, vi } from "vitest";

import {
  createQrCodeModel,
  qrSvgDataUrl,
  QrGenerationError,
  renderQrCodeSvg,
  validateQrOutputSize,
  type QrCodeModel,
} from "@/lib/processors/qr-code";

function expectFinderPattern(model: QrCodeModel, startRow: number, startColumn: number) {
  for (let row = 0; row < 7; row += 1) {
    for (let column = 0; column < 7; column += 1) {
      const expected = row === 0 || row === 6 || column === 0 || column === 6
        || (row >= 2 && row <= 4 && column >= 2 && column <= 4);
      expect(model.modules[startRow + row][startColumn + column]).toBe(expected);
    }
  }
}

describe("local QR production processor", () => {
  it.each(["L", "M", "Q", "H"] as const)("creates a structurally valid %s-level QR matrix", level => {
    const model = createQrCodeModel("https://example.com/こんにちは", level);
    expect(model.errorCorrectionLevel).toBe(level);
    expect(model.moduleCount).toBe(21 + (model.version - 1) * 4);
    expect(model.modules).toHaveLength(model.moduleCount);
    expect(model.modules.every(row => row.length === model.moduleCount)).toBe(true);
    expectFinderPattern(model, 0, 0);
    expectFinderPattern(model, 0, model.moduleCount - 7);
    expectFinderPattern(model, model.moduleCount - 7, 0);
  });

  it("renders a self-contained structural SVG without transmitting or embedding content", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const secret = '</svg><script data-secret="never-embed">bad()</script>';
    const model = createQrCodeModel(secret, "M");
    const svg = renderQrCodeSvg(model);
    const dimension = model.moduleCount + 8;

    expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    expect(svg).toContain(`viewBox="0 0 ${dimension} ${dimension}"`);
    expect(svg).toContain("shape-rendering=\"crispEdges\"");
    expect(svg).toContain("<path d=\"");
    expect(svg).not.toContain(secret);
    expect(qrSvgDataUrl(svg)).toMatch(/^data:image\/svg\+xml;charset=utf-8,/);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("reports empty, invalid-level, oversize, and undersized-output errors", () => {
    expect(() => createQrCodeModel("", "M")).toThrowError(expect.objectContaining({ code: "EMPTY_CONTENT" }));
    expect(() => createQrCodeModel("data", "X" as "M")).toThrowError(expect.objectContaining({ code: "INVALID_ERROR_CORRECTION" }));
    expect(() => createQrCodeModel("🙂".repeat(4_000), "H")).toThrowError(expect.objectContaining({ code: "CAPACITY_EXCEEDED" }));

    const model = createQrCodeModel("small", "M");
    expect(() => validateQrOutputSize(model, 63)).toThrowError(expect.objectContaining({ code: "INVALID_SIZE" }));
    const largeModel = { ...model, version: 40, moduleCount: 177 };
    expect(() => validateQrOutputSize(largeModel, 100)).toThrowError(expect.objectContaining({ code: "SIZE_TOO_SMALL" }));
    expect(() => validateQrOutputSize(model, 200)).not.toThrow();
  });

  it("uses typed errors with actionable capacity guidance", () => {
    try {
      createQrCodeModel("x".repeat(10_000), "H");
      throw new Error("expected capacity failure");
    } catch (error) {
      expect(error).toBeInstanceOf(QrGenerationError);
      expect((error as QrGenerationError).message).toMatch(/UTF-8 byte length|lower correction level/i);
    }
  });
});
