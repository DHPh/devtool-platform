import { describe, expect, it } from "vitest";
import {
  areColorsDistinguishable,
  calculateOKLabDeltaE,
  calculatePerceptualDifference,
  simulateColorPalette,
} from "@/lib/utils/color/color-blindness";
import {
  generateColorBlindnessPalette,
  MINIMUM_DISTINGUISHABLE_OKLAB_DELTA_E,
} from "@/lib/utils/color/color-blindness-palette";

describe("color-vision accessibility metrics", () => {
  it("uses OKLab delta-E rather than raw RGB distance", () => {
    expect(calculateOKLabDeltaE("#336699", "#336699")).toBe(0);
    expect(calculateOKLabDeltaE("#000000", "#ffffff")).toBeCloseTo(1, 6);
    expect(calculatePerceptualDifference("#000000", "#ffffff")).toBe(100);
  });

  it("reports simulation differences on the documented OKLab display scale", () => {
    const [result] = simulateColorPalette(["#ff0000"], "deuteranopia");
    expect(result.difference).toBe(
      calculatePerceptualDifference(result.original, result.simulated)
    );
  });

  it("compares colors after simulation with the perceptual threshold", () => {
    expect(
      areColorsDistinguishable("#000000", "#ffffff", "achromatopsia")
    ).toBe(true);
    expect(
      areColorsDistinguishable("#000000", "#010101", "achromatopsia")
    ).toBe(false);
  });

  it("requires both WCAG contrast and pairwise simulated distinguishability", () => {
    const accessible = generateColorBlindnessPalette({
      colorBlindnessType: "achromatopsia",
      baseColor: "#000000",
      colorCount: 2,
      contrastLevel: "AA",
      algorithm: "lightness-variation",
      customColors: ["#000000", "#ffffff"],
    });
    expect(accessible.colors).toHaveLength(2);
    expect(accessible.colors.every((color) => color.contrastRatio! >= 4.5)).toBe(
      true
    );
    expect(accessible.colors.every((color) => color.isDistinguishable)).toBe(
      true
    );
    expect(accessible.averageDistinguishability).toBeGreaterThanOrEqual(
      MINIMUM_DISTINGUISHABLE_OKLAB_DELTA_E
    );
    expect(accessible.isAccessible).toBe(true);

    const tooSimilar = generateColorBlindnessPalette({
      colorBlindnessType: "achromatopsia",
      baseColor: "#000000",
      colorCount: 2,
      contrastLevel: "AA",
      algorithm: "lightness-variation",
      customColors: ["#000000", "#010101"],
    });
    expect(tooSimilar.colors).toHaveLength(2);
    expect(tooSimilar.colors.every((color) => color.contrastRatio! >= 4.5)).toBe(
      true
    );
    expect(tooSimilar.colors.every((color) => !color.isDistinguishable)).toBe(
      true
    );
    expect(tooSimilar.isAccessible).toBe(false);
  });
});
