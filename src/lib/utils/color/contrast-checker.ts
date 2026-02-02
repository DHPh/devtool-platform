/**
 * Color contrast and accessibility utilities
 * WCAG 2.2 contrast compliance checking
 */

import { getColorInfo, getContrastRatio } from "./color-converter";

export interface ContrastResult {
  ratio: number;
  level: "AAA" | "AA" | "A" | "Fail";
  isAccessible: boolean;
  details: {
    normalText: {
      aa: boolean;
      aaa: boolean;
    };
    largeText: {
      aa: boolean;
      aaa: boolean;
    };
    uiComponents: {
      aa: boolean;
    };
  };
}

export interface ColorAccessibility {
  foreground: string;
  background: string;
  contrast: ContrastResult;
  recommendations: string[];
}

/**
 * Calculate WCAG contrast compliance
 */
export function calculateWCAGCompliance(
  foregroundHex: string,
  backgroundHex: string
): ContrastResult {
  const fgColor = getColorInfo(foregroundHex);
  const bgColor = getColorInfo(backgroundHex);

  if (!fgColor || !bgColor) {
    throw new Error("Invalid color format");
  }

  const ratio = getContrastRatio(fgColor.rgb, bgColor.rgb);

  // WCAG 2.2 contrast thresholds:
  // Normal text: AA = 4.5:1, AAA = 7:1
  // Large text (18pt+/14pt+ bold): AA = 3:1, AAA = 4.5:1
  // UI Components: AA = 3:1

  const details = {
    normalText: {
      aa: ratio >= 4.5,
      aaa: ratio >= 7,
    },
    largeText: {
      aa: ratio >= 3,
      aaa: ratio >= 4.5,
    },
    uiComponents: {
      aa: ratio >= 3,
    },
  };

  let level: ContrastResult["level"];
  if (details.normalText.aaa) level = "AAA";
  else if (details.normalText.aa) level = "AA";
  else if (details.largeText.aa || details.uiComponents.aa) level = "A";
  else level = "Fail";

  return {
    ratio: Math.round(ratio * 100) / 100,
    level,
    isAccessible: level !== "Fail",
    details,
  };
}

/**
 * Get accessibility recommendations
 */
export function getAccessibilityRecommendations(
  foregroundHex: string,
  backgroundHex: string
): string[] {
  const result = calculateWCAGCompliance(foregroundHex, backgroundHex);
  const recommendations: string[] = [];

  if (result.level === "Fail") {
    recommendations.push("This color combination fails all WCAG guidelines");
    recommendations.push("Consider using colors with higher contrast");
  }

  if (!result.details.normalText.aa) {
    recommendations.push("Not suitable for normal text (fails AA standard)");
    recommendations.push("Increase contrast ratio to at least 4.5:1");
  }

  if (!result.details.normalText.aaa) {
    recommendations.push(
      "Not suitable for enhanced accessibility (fails AAA standard)"
    );
    recommendations.push(
      "Increase contrast ratio to at least 7:1 for AAA compliance"
    );
  }

  if (result.details.largeText.aa && !result.details.normalText.aa) {
    recommendations.push("Only suitable for large text (18pt+ or 14pt+ bold)");
  }

  if (result.level === "AAA") {
    recommendations.push("Excellent! Meets highest accessibility standards");
  } else if (result.level === "AA") {
    recommendations.push("Good! Meets standard accessibility requirements");
  }

  return recommendations;
}

/**
 * Find accessible foreground colors for a background
 */
export function findAccessibleColors(
  backgroundHex: string,
  targetLevel: "AA" | "AAA" = "AA",
  textSize: "normal" | "large" = "normal"
): string[] {
  const bgColor = getColorInfo(backgroundHex);
  if (!bgColor) throw new Error("Invalid background color");

  const targetRatio = getTargetRatio(targetLevel, textSize);
  const accessibleColors: string[] = [];

  // Generate colors across the lightness spectrum
  for (let l = 0; l <= 100; l += 5) {
    const testColor = `hsl(0, 0%, ${l}%)`;
    const testColorInfo = getColorInfo(testColor);

    if (testColorInfo) {
      const ratio = getContrastRatio(testColorInfo.rgb, bgColor.rgb);
      if (ratio >= targetRatio) {
        accessibleColors.push(testColorInfo.hex);
      }
    }
  }

  // Add some colored options if background is not too saturated
  if (bgColor.hsl.s < 50) {
    const hues = [0, 30, 60, 120, 180, 240, 270, 300]; // Key hues

    for (const hue of hues) {
      for (let l = 10; l <= 90; l += 20) {
        const testColor = `hsl(${hue}, 80%, ${l}%)`;
        const testColorInfo = getColorInfo(testColor);

        if (testColorInfo) {
          const ratio = getContrastRatio(testColorInfo.rgb, bgColor.rgb);
          if (ratio >= targetRatio) {
            accessibleColors.push(testColorInfo.hex);
          }
        }
      }
    }
  }

  // Remove duplicates and sort by contrast ratio
  const uniqueColors = Array.from(new Set(accessibleColors));

  return uniqueColors
    .map((color) => ({
      hex: color,
      ratio: getContrastRatio(getColorInfo(color)!.rgb, bgColor.rgb),
    }))
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 20) // Return top 20 options
    .map((item) => item.hex);
}

/**
 * Get target contrast ratio based on compliance level and text size
 */
function getTargetRatio(
  level: "AA" | "AAA",
  textSize: "normal" | "large"
): number {
  if (level === "AAA") {
    return textSize === "large" ? 4.5 : 7;
  } else {
    return textSize === "large" ? 3 : 4.5;
  }
}

/**
 * Check if color combination is accessible
 */
export function isAccessible(
  foregroundHex: string,
  backgroundHex: string,
  level: "AA" | "AAA" = "AA",
  textSize: "normal" | "large" = "normal"
): boolean {
  const result = calculateWCAGCompliance(foregroundHex, backgroundHex);
  const targetRatio = getTargetRatio(level, textSize);
  return result.ratio >= targetRatio;
}

/**
 * Adjust color to meet accessibility requirements
 */
export function adjustForAccessibility(
  foregroundHex: string,
  backgroundHex: string,
  targetLevel: "AA" | "AAA" = "AA",
  textSize: "normal" | "large" = "normal"
): string {
  const fgColor = getColorInfo(foregroundHex);
  const bgColor = getColorInfo(backgroundHex);

  if (!fgColor || !bgColor) {
    throw new Error("Invalid color format");
  }

  const targetRatio = getTargetRatio(targetLevel, textSize);
  const currentRatio = getContrastRatio(fgColor.rgb, bgColor.rgb);

  if (currentRatio >= targetRatio) {
    return foregroundHex; // Already accessible
  }

  // Determine if we should make the foreground lighter or darker
  const bgLuminance = bgColor.luminance;
  const shouldBeLighter = bgLuminance < 0.5;

  // Adjust lightness to meet target ratio
  const { h, s } = fgColor.hsl;
  let bestColor = foregroundHex;
  let bestRatio = currentRatio;

  const step = shouldBeLighter ? 5 : -5;
  const start = shouldBeLighter ? fgColor.hsl.l : fgColor.hsl.l;
  const end = shouldBeLighter ? 100 : 0;

  for (let l = start; shouldBeLighter ? l <= end : l >= end; l += step) {
    const testColor = `hsl(${h}, ${s}%, ${l}%)`;
    const testColorInfo = getColorInfo(testColor);

    if (testColorInfo) {
      const ratio = getContrastRatio(testColorInfo.rgb, bgColor.rgb);

      if (ratio >= targetRatio) {
        return testColorInfo.hex;
      }

      if (ratio > bestRatio) {
        bestColor = testColorInfo.hex;
        bestRatio = ratio;
      }
    }
  }

  return bestColor;
}

/**
 * Get contrast level description
 */
export function getContrastLevelDescription(
  level: ContrastResult["level"]
): string {
  switch (level) {
    case "AAA":
      return "Enhanced (AAA) - Highest level of accessibility";
    case "AA":
      return "Standard (AA) - Meets accessibility requirements";
    case "A":
      return "Minimum (A) - Only suitable for large text or UI components";
    case "Fail":
      return "Fail - Does not meet accessibility requirements";
    default:
      return "Unknown";
  }
}

/**
 * Common accessible color combinations
 */
export const ACCESSIBLE_COMBINATIONS = [
  { fg: "#000000", bg: "#FFFFFF", name: "Black on White" },
  { fg: "#FFFFFF", bg: "#000000", name: "White on Black" },
  { fg: "#2563EB", bg: "#FFFFFF", name: "Blue on White" },
  { fg: "#DC2626", bg: "#FFFFFF", name: "Red on White" },
  { fg: "#059669", bg: "#FFFFFF", name: "Green on White" },
  { fg: "#FFFFFF", bg: "#1F2937", name: "White on Dark Gray" },
  { fg: "#F9FAFB", bg: "#374151", name: "Light Gray on Dark Gray" },
  { fg: "#111827", bg: "#F3F4F6", name: "Dark Gray on Light Gray" },
  { fg: "#1E40AF", bg: "#EFF6FF", name: "Dark Blue on Light Blue" },
  { fg: "#B91C1C", bg: "#FEF2F2", name: "Dark Red on Light Red" },
] as const;

/**
 * Get accessible color combinations for a base color
 */
export function getAccessibleCombinations(
  baseHex: string
): Array<{ fg: string; bg: string; name: string }> {
  const baseColor = getColorInfo(baseHex);
  if (!baseColor) return [];

  const combinations: Array<{ fg: string; bg: string; name: string }> = [];

  // Light background variations
  const lightBg = `hsl(${baseColor.hsl.h}, ${Math.min(
    baseColor.hsl.s,
    20
  )}%, 95%)`;
  const darkFg = adjustForAccessibility("#000000", lightBg);
  combinations.push({
    fg: darkFg,
    bg: lightBg,
    name: "Dark text on light background",
  });

  // Dark background variations
  const darkBg = `hsl(${baseColor.hsl.h}, ${Math.min(
    baseColor.hsl.s,
    30
  )}%, 15%)`;
  const lightFg = adjustForAccessibility("#FFFFFF", darkBg);
  combinations.push({
    fg: lightFg,
    bg: darkBg,
    name: "Light text on dark background",
  });

  return combinations;
}
