/**
 * Color contrast suggestion utilities
 * Generate color suggestions that meet WCAG accessibility standards
 */

import {
  RGBColor,
  HSLColor,
  getColorInfo,
  hslToRgb,
  rgbToHex,
  getContrastRatio,
} from "./color-converter";
import { calculateWCAGCompliance } from "./contrast-checker";

export interface ContrastSuggestion {
  hex: string;
  rgb: RGBColor;
  hsl: HSLColor;
  ratio: number;
  level: "AAA" | "AA" | "A" | "Fail";
  isRecommended: boolean;
}

export interface ContrastSuggestionRange {
  suggestions: ContrastSuggestion[];
  aaRange: ContrastSuggestion[];
  aaaRange: ContrastSuggestion[];
}

/**
 * Generate contrast suggestions for a given base color
 */
export function generateContrastSuggestions(
  baseColorHex: string,
  isBackground: boolean = true,
  steps: number = 50
): ContrastSuggestionRange {
  const baseColor = getColorInfo(baseColorHex);
  if (!baseColor) {
    throw new Error("Invalid color format");
  }

  const suggestions: ContrastSuggestion[] = [];
  const aaRange: ContrastSuggestion[] = [];
  const aaaRange: ContrastSuggestion[] = [];

  // Generate lightness variations
  for (let i = 0; i <= steps; i++) {
    const lightness = (i / steps) * 100;
    const hsl: HSLColor = {
      h: baseColor.hsl.h,
      s: baseColor.hsl.s,
      l: lightness,
    };

    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

    // Calculate contrast ratio
    const ratio = isBackground
      ? getContrastRatio(baseColor.rgb, rgb)
      : getContrastRatio(rgb, baseColor.rgb);

    const contrastResult = isBackground
      ? calculateWCAGCompliance(baseColorHex, hex)
      : calculateWCAGCompliance(hex, baseColorHex);

    const suggestion: ContrastSuggestion = {
      hex,
      rgb,
      hsl,
      ratio,
      level: contrastResult.level,
      isRecommended: contrastResult.details.normalText.aa,
    };

    suggestions.push(suggestion);

    // Categorize by compliance level
    if (contrastResult.details.normalText.aa) {
      aaRange.push(suggestion);
    }
    if (contrastResult.details.normalText.aaa) {
      aaaRange.push(suggestion);
    }
  }

  return {
    suggestions: suggestions.sort((a, b) => b.ratio - a.ratio),
    aaRange: aaRange.sort((a, b) => b.ratio - a.ratio),
    aaaRange: aaaRange.sort((a, b) => b.ratio - a.ratio),
  };
}

/**
 * Generate hue variations with good contrast
 */
export function generateHueContrastSuggestions(
  baseColorHex: string,
  isBackground: boolean = true,
  steps: number = 12
): ContrastSuggestionRange {
  const baseColor = getColorInfo(baseColorHex);
  if (!baseColor) {
    throw new Error("Invalid color format");
  }

  const suggestions: ContrastSuggestion[] = [];
  const aaRange: ContrastSuggestion[] = [];
  const aaaRange: ContrastSuggestion[] = [];

  // Generate hue variations
  for (let i = 0; i < steps; i++) {
    const hue = (360 / steps) * i;

    // Try different lightness levels to find good contrast
    const lightnessLevels = isBackground ? [10, 20, 30] : [70, 80, 90];

    for (const lightness of lightnessLevels) {
      const hsl: HSLColor = {
        h: hue,
        s: baseColor.hsl.s,
        l: lightness,
      };

      const rgb = hslToRgb(hue, baseColor.hsl.s, lightness);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

      const ratio = isBackground
        ? getContrastRatio(baseColor.rgb, rgb)
        : getContrastRatio(rgb, baseColor.rgb);

      const contrastResult = isBackground
        ? calculateWCAGCompliance(baseColorHex, hex)
        : calculateWCAGCompliance(hex, baseColorHex);

      const suggestion: ContrastSuggestion = {
        hex,
        rgb,
        hsl,
        ratio,
        level: contrastResult.level,
        isRecommended: contrastResult.details.normalText.aa,
      };

      suggestions.push(suggestion);

      if (contrastResult.details.normalText.aa) {
        aaRange.push(suggestion);
      }
      if (contrastResult.details.normalText.aaa) {
        aaaRange.push(suggestion);
      }
    }
  }

  return {
    suggestions: suggestions.sort((a, b) => b.ratio - a.ratio),
    aaRange: aaRange.sort((a, b) => b.ratio - a.ratio),
    aaaRange: aaaRange.sort((a, b) => b.ratio - a.ratio),
  };
}

/**
 * Get optimal contrast color for accessibility
 */
export function getOptimalContrastColor(
  baseColorHex: string,
  targetLevel: "AA" | "AAA" = "AA"
): string {
  const baseColor = getColorInfo(baseColorHex);
  if (!baseColor) {
    return "#000000";
  }

  // Try simple black or white first
  const blackContrast = getContrastRatio(baseColor.rgb, { r: 0, g: 0, b: 0 });
  const whiteContrast = getContrastRatio(baseColor.rgb, {
    r: 255,
    g: 255,
    b: 255,
  });

  const requiredRatio = targetLevel === "AAA" ? 7 : 4.5;

  if (blackContrast >= requiredRatio) {
    return "#000000";
  }
  if (whiteContrast >= requiredRatio) {
    return "#ffffff";
  }

  // If neither black nor white works, find the best option
  const suggestions = generateContrastSuggestions(baseColorHex, true, 100);
  const targetRange =
    targetLevel === "AAA" ? suggestions.aaaRange : suggestions.aaRange;

  if (targetRange.length > 0) {
    return targetRange[0].hex;
  }

  // Fallback to highest contrast option
  return blackContrast > whiteContrast ? "#000000" : "#ffffff";
}
