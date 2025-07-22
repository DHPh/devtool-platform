/**
 * Color blindness simulation utilities
 * Simulate different types of color vision deficiencies
 */

import { RGBColor, getColorInfo, rgbToHex } from "./color-converter";

export type ColorBlindnessType =
  | "protanopia" // Red-blind
  | "deuteranopia" // Green-blind
  | "tritanopia" // Blue-blind
  | "achromatopsia" // Complete color blindness
  | "protanomaly" // Red-weak
  | "deuteranomaly" // Green-weak
  | "tritanomaly"; // Blue-weak

export interface ColorBlindnessInfo {
  type: ColorBlindnessType;
  name: string;
  description: string;
  affectedPopulation: string;
  severity: "mild" | "moderate" | "severe";
}

export interface SimulationResult {
  original: string;
  simulated: string;
  type: ColorBlindnessType;
  difference: number; // Perceptual difference percentage
}

/**
 * Color blindness type information
 */
export const COLOR_BLINDNESS_TYPES: Record<
  ColorBlindnessType,
  ColorBlindnessInfo
> = {
  protanopia: {
    type: "protanopia",
    name: "Protanopia (Red-blind)",
    description: "Complete absence of red cone cells",
    affectedPopulation: "~1% of males, <0.01% of females",
    severity: "severe",
  },
  deuteranopia: {
    type: "deuteranopia",
    name: "Deuteranopia (Green-blind)",
    description: "Complete absence of green cone cells",
    affectedPopulation: "~1% of males, <0.01% of females",
    severity: "severe",
  },
  tritanopia: {
    type: "tritanopia",
    name: "Tritanopia (Blue-blind)",
    description: "Complete absence of blue cone cells",
    affectedPopulation: "<0.01% of population",
    severity: "severe",
  },
  achromatopsia: {
    type: "achromatopsia",
    name: "Achromatopsia (Complete color blindness)",
    description: "Complete absence of color vision (monochromacy)",
    affectedPopulation: "~0.003% of population",
    severity: "severe",
  },
  protanomaly: {
    type: "protanomaly",
    name: "Protanomaly (Red-weak)",
    description: "Reduced sensitivity to red light",
    affectedPopulation: "~1% of males, ~0.01% of females",
    severity: "mild",
  },
  deuteranomaly: {
    type: "deuteranomaly",
    name: "Deuteranomaly (Green-weak)",
    description: "Reduced sensitivity to green light",
    affectedPopulation: "~5% of males, ~0.4% of females",
    severity: "moderate",
  },
  tritanomaly: {
    type: "tritanomaly",
    name: "Tritanomaly (Blue-weak)",
    description: "Reduced sensitivity to blue light",
    affectedPopulation: "~0.01% of population",
    severity: "mild",
  },
};

/**
 * Transformation matrices for color blindness simulation
 * Based on Brettel, Viénot and Mollon (1997) algorithm
 */
const TRANSFORMATION_MATRICES = {
  protanopia: [
    [0.567, 0.433, 0.0],
    [0.558, 0.442, 0.0],
    [0.0, 0.242, 0.758],
  ],
  deuteranopia: [
    [0.625, 0.375, 0.0],
    [0.7, 0.3, 0.0],
    [0.0, 0.3, 0.7],
  ],
  tritanopia: [
    [0.95, 0.05, 0.0],
    [0.0, 0.433, 0.567],
    [0.0, 0.475, 0.525],
  ],
  protanomaly: [
    [0.817, 0.183, 0.0],
    [0.333, 0.667, 0.0],
    [0.0, 0.125, 0.875],
  ],
  deuteranomaly: [
    [0.8, 0.2, 0.0],
    [0.258, 0.742, 0.0],
    [0.0, 0.142, 0.858],
  ],
  tritanomaly: [
    [0.967, 0.033, 0.0],
    [0.0, 0.733, 0.267],
    [0.0, 0.183, 0.817],
  ],
};

/**
 * Convert RGB to linear RGB for accurate color space calculations
 */
function rgbToLinear(value: number): number {
  const v = value / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

/**
 * Convert linear RGB back to sRGB
 */
function linearToRgb(value: number): number {
  const v =
    value <= 0.0031308
      ? 12.92 * value
      : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
  return Math.round(Math.max(0, Math.min(1, v)) * 255);
}

/**
 * Apply transformation matrix to RGB values
 */
function applyMatrix(rgb: RGBColor, matrix: number[][]): RGBColor {
  // Convert to linear RGB
  const linear = {
    r: rgbToLinear(rgb.r),
    g: rgbToLinear(rgb.g),
    b: rgbToLinear(rgb.b),
  };

  // Apply transformation matrix
  const transformed = {
    r:
      matrix[0][0] * linear.r +
      matrix[0][1] * linear.g +
      matrix[0][2] * linear.b,
    g:
      matrix[1][0] * linear.r +
      matrix[1][1] * linear.g +
      matrix[1][2] * linear.b,
    b:
      matrix[2][0] * linear.r +
      matrix[2][1] * linear.g +
      matrix[2][2] * linear.b,
  };

  // Convert back to sRGB
  return {
    r: linearToRgb(transformed.r),
    g: linearToRgb(transformed.g),
    b: linearToRgb(transformed.b),
  };
}

/**
 * Simulate color blindness for a single color
 */
export function simulateColorBlindness(
  hex: string,
  type: ColorBlindnessType
): string {
  const colorInfo = getColorInfo(hex);
  if (!colorInfo) throw new Error("Invalid color format");

  // Special case for achromatopsia (complete color blindness)
  if (type === "achromatopsia") {
    const gray = Math.round(
      0.299 * colorInfo.rgb.r +
        0.587 * colorInfo.rgb.g +
        0.114 * colorInfo.rgb.b
    );
    return rgbToHex(gray, gray, gray);
  }

  const matrix = TRANSFORMATION_MATRICES[type];
  if (!matrix) throw new Error(`Unknown color blindness type: ${type}`);

  const transformedRgb = applyMatrix(colorInfo.rgb, matrix);
  return rgbToHex(transformedRgb.r, transformedRgb.g, transformedRgb.b);
}

/**
 * Simulate color blindness for multiple colors
 */
export function simulateColorPalette(
  colors: string[],
  type: ColorBlindnessType
): SimulationResult[] {
  return colors.map((color) => {
    const simulated = simulateColorBlindness(color, type);
    const difference = calculatePerceptualDifference(color, simulated);

    return {
      original: color,
      simulated,
      type,
      difference,
    };
  });
}

/**
 * Calculate perceptual difference between two colors (Delta E)
 */
function calculatePerceptualDifference(color1: string, color2: string): number {
  const c1 = getColorInfo(color1);
  const c2 = getColorInfo(color2);

  if (!c1 || !c2) return 0;

  // Simple RGB difference (could be improved with LAB color space)
  const dr = c1.rgb.r - c2.rgb.r;
  const dg = c1.rgb.g - c2.rgb.g;
  const db = c1.rgb.b - c2.rgb.b;

  const distance = Math.sqrt(dr * dr + dg * dg + db * db);
  const maxDistance = Math.sqrt(255 * 255 * 3); // Maximum possible distance

  return Math.round((distance / maxDistance) * 100);
}

/**
 * Check if colors are distinguishable for color blind users
 */
export function areColorsDistinguishable(
  color1: string,
  color2: string,
  type: ColorBlindnessType,
  threshold: number = 10
): boolean {
  const sim1 = simulateColorBlindness(color1, type);
  const sim2 = simulateColorBlindness(color2, type);

  const difference = calculatePerceptualDifference(sim1, sim2);
  return difference >= threshold;
}

/**
 * Test color palette accessibility for all color blindness types
 */
export function testPaletteAccessibility(
  colors: string[]
): Record<ColorBlindnessType, SimulationResult[]> {
  const results = {} as Record<ColorBlindnessType, SimulationResult[]>;

  for (const type of Object.keys(
    COLOR_BLINDNESS_TYPES
  ) as ColorBlindnessType[]) {
    results[type] = simulateColorPalette(colors, type);
  }

  return results;
}

/**
 * Get suggestions for improving color accessibility
 */
export function getAccessibilitySuggestions(colors: string[]): string[] {
  const suggestions: string[] = [];
  const types: ColorBlindnessType[] = [
    "protanopia",
    "deuteranopia",
    "tritanopia",
  ];

  // Test pairwise color distinguishability
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const color1 = colors[i];
      const color2 = colors[j];

      for (const type of types) {
        if (!areColorsDistinguishable(color1, color2, type, 15)) {
          const typeName = COLOR_BLINDNESS_TYPES[type].name;
          suggestions.push(
            `Colors ${i + 1} and ${
              j + 1
            } may be difficult to distinguish for users with ${typeName}`
          );
        }
      }
    }
  }

  // General suggestions
  if (suggestions.length === 0) {
    suggestions.push(
      "Color palette appears accessible for common types of color blindness"
    );
  } else {
    suggestions.unshift(
      "Consider using patterns, textures, or labels in addition to color"
    );
    suggestions.unshift("Increase contrast between similar colors");
  }

  return Array.from(new Set(suggestions)); // Remove duplicates
}

/**
 * Generate color blind friendly alternatives
 */
export function generateColorBlindFriendlyPalette(
  baseColors: string[]
): string[] {
  // Use colors that are generally distinguishable across color blindness types
  const safePalette = [
    "#000000", // Black
    "#E69F00", // Orange
    "#56B4E9", // Sky Blue
    "#009E73", // Bluish Green
    "#F0E442", // Yellow
    "#0072B2", // Blue
    "#D55E00", // Vermillion
    "#CC79A7", // Reddish Purple
    "#FFFFFF", // White
    "#999999", // Gray
  ];

  // If we have fewer base colors than safe colors, return subset
  if (baseColors.length <= safePalette.length) {
    return safePalette.slice(0, baseColors.length);
  }

  // Otherwise, extend with variations
  const extended = [...safePalette];
  while (extended.length < baseColors.length) {
    // Add lighter/darker variations of safe colors
    const baseIndex =
      (extended.length - safePalette.length) % safePalette.length;
    const baseColor = getColorInfo(safePalette[baseIndex]);

    if (baseColor) {
      const { h, s, l } = baseColor.hsl;
      const newL = l > 50 ? Math.max(20, l - 30) : Math.min(80, l + 30);
      const variation = `hsl(${h}, ${s}%, ${newL}%)`;
      const variationHex = getColorInfo(variation)?.hex;

      if (variationHex) {
        extended.push(variationHex);
      }
    }
  }

  return extended.slice(0, baseColors.length);
}
