import { describe, expect, it } from "vitest";
import {
  interpolateColor,
  interpolateColorValues,
  interpolateHue,
  oklabToOklch,
  parseInterpolationColor,
  rgbaToOklab,
} from "@/lib/utils/color/color-interpolation";
import {
  interpolateColors,
  materializeGradientStops,
} from "@/lib/utils/color/gradient-generator";
import { generateOklchPalette } from "@/lib/utils/color/palette-generator";

describe("perceptual color interpolation", () => {
  it("preserves endpoints in every interpolation space", () => {
    for (const space of ["srgb", "linear-srgb", "oklab", "oklch"] as const) {
      const colors = interpolateColors("#ff0000", "#0000ff", 3, { space });
      expect(colors[0]).toBe("rgb(255, 0, 0)");
      expect(colors[2]).toBe("rgb(0, 0, 255)");
    }
  });

  it("uses the shared CSS Color 4 parser for production gradient inputs", () => {
    const stops = materializeGradientStops(
      [
        { color: "oklch(62% 0.2 30 / 80%)", position: 0 },
        { color: "color(display-p3 0.1 0.8 0.3)", position: 50 },
        { color: "hsl(240 100% 50%)", position: 100 },
      ],
      { space: "oklch", samplesPerSegment: 2 }
    );

    expect(stops).toHaveLength(5);
    expect(stops.every((stop) => /^rgba?\(/.test(stop.color))).toBe(true);
    expect(stops[0].color).toMatch(/^rgba\(.+, 0\.8\)$/);
    expect(stops[2].color).toMatch(/^rgb\(/);
    expect(stops[4].color).toBe("rgb(0, 0, 255)");
  });

  it("produces visibly different encoded, linear, and perceptual midpoints", () => {
    expect(interpolateColor("#000000", "#ffffff", 0.5, { space: "srgb" })).toBe(
      "rgb(128, 128, 128)"
    );
    expect(
      interpolateColor("#000000", "#ffffff", 0.5, { space: "linear-srgb" })
    ).toBe("rgb(188, 188, 188)");
    expect(interpolateColor("#000000", "#ffffff", 0.5, { space: "oklab" })).toBe(
      "rgb(99, 99, 99)"
    );
  });

  it("supports every CSS hue interpolation route", () => {
    expect(interpolateHue(30, 330, 0.5, "shorter")).toBeCloseTo(0);
    expect(interpolateHue(30, 330, 0.5, "longer")).toBeCloseTo(180);
    expect(interpolateHue(30, 330, 0.5, "increasing")).toBeCloseTo(180);
    expect(interpolateHue(30, 330, 0.5, "decreasing")).toBeCloseTo(0);
    expect(interpolateHue(30, 210, 0.5, "shorter")).toBeCloseTo(120);
    expect(interpolateHue(30, 30, 0.25, "longer")).toBeCloseTo(120);
  });

  it("preserves endpoint alpha and interpolates intermediate alpha", () => {
    const colors = interpolateColors("#ff000000", "rgba(0, 0, 255, 1)", 3, {
      space: "oklab",
    });
    expect(colors[0]).toBe("rgba(0, 0, 0, 0)");
    expect(colors[1]).toBe("rgba(0, 0, 255, 0.5)");
    expect(colors[2]).toBe("rgb(0, 0, 255)");
  });

  it("premultiplies alpha to avoid transparent endpoint color fringes", () => {
    for (const space of ["srgb", "linear-srgb", "oklab", "oklch"] as const) {
      expect(
        interpolateColor("#ff000000", "#0000ff", 0.5, { space })
      ).toBe("rgba(0, 0, 255, 0.5)");
    }
  });

  it("carries a chromatic hue through an achromatic endpoint", () => {
    const white = parseInterpolationColor("#ffffff");
    const red = parseInterpolationColor("#ff0000");
    expect(white).not.toBeNull();
    expect(red).not.toBeNull();
    const midpoint = interpolateColorValues(white!, red!, 0.5, { space: "oklch" });
    const lch = oklabToOklch(rgbaToOklab(midpoint));
    expect(lch.h).not.toBeNull();
    expect(Math.min(Math.abs(lch.h!), Math.abs(360 - lch.h!))).toBeLessThan(35);
  });

  it("handles one requested step without division by zero", () => {
    expect(interpolateColors("#123456", "#abcdef", 1, { space: "oklch" })).toEqual([
      "rgb(18, 52, 86)",
    ]);
  });

  it("materializes perceptual interpolation as portable CSS stops", () => {
    const stops = materializeGradientStops(
      [
        { color: "#ff000080", position: 10 },
        { color: "#0000ff", position: 90 },
      ],
      { space: "oklch", hue: "longer", samplesPerSegment: 4 }
    );
    expect(stops).toHaveLength(5);
    expect(stops.map((stop) => stop.position)).toEqual([10, 30, 50, 70, 90]);
    expect(stops[0].color).toBe("rgba(255, 0, 0, 0.502)");
    expect(stops[2].color).toMatch(/^rgba\(.+, 0\.751\)$/);
    expect(stops[4].color).toBe("rgb(0, 0, 255)");
  });
});

describe("OKLCH palette generation", () => {
  it("orders tones by perceptual lightness", () => {
    const palette = generateOklchPalette("#7c3aed", 7, {
      minLightness: 0.25,
      maxLightness: 0.85,
      chromaScale: 0.65,
    });
    const lightnesses = palette.colors.map((color) => {
      const parsed = parseInterpolationColor(color.hex);
      expect(parsed).not.toBeNull();
      return rgbaToOklab(parsed!).l;
    });

    expect(palette.colors).toHaveLength(7);
    for (let index = 1; index < lightnesses.length; index++) {
      expect(lightnesses[index]).toBeGreaterThan(lightnesses[index - 1]);
    }
  });

  it.each([
    "oklch(62% 0.2 30)",
    "color(display-p3 0.15 0.7 0.4)",
    "hsl(210 80% 55%)",
  ])("accepts shared CSS Color 4 input %s", (input) => {
    const palette = generateOklchPalette(input, 5);

    expect(palette.colors).toHaveLength(5);
    expect(palette.colors.every((color) => /^#[0-9a-f]{6}$/i.test(color.hex))).toBe(
      true
    );
  });

  it("validates count and lightness bounds", () => {
    expect(() => generateOklchPalette("#123456", 0)).toThrow(/positive integer/);
    expect(() =>
      generateOklchPalette("#123456", 5, { minLightness: 0.9, maxLightness: 0.2 })
    ).toThrow(/options/);
  });
});
