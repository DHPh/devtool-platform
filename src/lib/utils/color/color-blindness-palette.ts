/**
 * Color blindness-friendly palette generation utilities
 * Generate palettes that are accessible for different types of color vision deficiencies
 */

import {
  RGBColor,
  HSLColor,
  getColorInfo,
  hslToRgb,
  rgbToHex,
  getContrastRatio,
  type ColorInfo,
} from "./color-converter";
import {
  simulateColorBlindness,
  type ColorBlindnessType,
} from "./color-blindness";

/**
 * Calculate Euclidean distance between two colors in RGB space
 */
function getColorDistance(color1: string, color2: string): number {
  const c1 = getColorInfo(color1);
  const c2 = getColorInfo(color2);

  if (!c1 || !c2) return 0;

  const dr = c1.rgb.r - c2.rgb.r;
  const dg = c1.rgb.g - c2.rgb.g;
  const db = c1.rgb.b - c2.rgb.b;

  return Math.sqrt(dr * dr + dg * dg + db * db);
}

export interface ColorBlindnessPaletteItem {
  original: string;
  simulated: string;
  rgb: RGBColor;
  hsl: HSLColor;
  name?: string;
  isDistinguishable: boolean;
  contrastRatio?: number;
}

export interface ColorBlindnessPalette {
  colors: ColorBlindnessPaletteItem[];
  colorBlindnessType: ColorBlindnessType;
  baseColor: string;
  isAccessible: boolean;
  averageDistinguishability: number;
}

export interface PaletteGenerationOptions {
  colorBlindnessType: ColorBlindnessType;
  baseColor: string;
  colorCount: number;
  contrastLevel: "AA" | "AAA";
  algorithm:
    | "hue-shift"
    | "lightness-variation"
    | "saturation-variation"
    | "complement";
  customColors?: string[]; // Optional custom colors array
}

/**
 * Generate a colorblind-friendly palette
 */
export function generateColorBlindnessPalette(
  options: PaletteGenerationOptions
): ColorBlindnessPalette {
  const {
    colorBlindnessType,
    baseColor,
    colorCount,
    contrastLevel,
    algorithm,
    customColors,
  } = options;

  let colors: ColorBlindnessPaletteItem[] = [];

  // If custom colors are provided, use them instead of generation
  if (customColors && customColors.length > 0) {
    colors = customColors.map((color, index) => {
      const colorInfo = getColorInfo(color);
      if (!colorInfo) {
        throw new Error(`Invalid custom color: ${color}`);
      }

      const simulated = simulateColorBlindness(color, colorBlindnessType);
      const simulatedInfo = getColorInfo(simulated);

      // Calculate distinguishability with other colors in the palette
      const isDistinguishable =
        index === 0 ||
        customColors.slice(0, index).every((otherColor) => {
          const dist1 = simulateColorBlindness(color, colorBlindnessType);
          const dist2 = simulateColorBlindness(otherColor, colorBlindnessType);
          return getColorDistance(dist1, dist2) > 30; // Threshold for distinguishability
        });

      return {
        original: color,
        simulated,
        rgb: colorInfo.rgb,
        hsl: colorInfo.hsl,
        isDistinguishable,
        contrastRatio: simulatedInfo
          ? getContrastRatio(simulatedInfo.rgb, { r: 255, g: 255, b: 255 })
          : undefined,
      };
    });
  } else {
    // Use automatic generation algorithms
    const baseColorInfo = getColorInfo(baseColor);
    if (!baseColorInfo) {
      throw new Error("Invalid base color");
    }

    switch (algorithm) {
      case "hue-shift":
        colors = generateHueShiftPalette(
          baseColorInfo,
          colorCount,
          colorBlindnessType
        );
        break;
      case "lightness-variation":
        colors = generateLightnessVariationPalette(
          baseColorInfo,
          colorCount,
          colorBlindnessType
        );
        break;
      case "saturation-variation":
        colors = generateSaturationVariationPalette(
          baseColorInfo,
          colorCount,
          colorBlindnessType
        );
        break;
      case "complement":
        colors = generateComplementaryPalette(
          baseColorInfo,
          colorCount,
          colorBlindnessType
        );
        break;
      default:
        colors = generateHueShiftPalette(
          baseColorInfo,
          colorCount,
          colorBlindnessType
        );
    }
  }

  // Filter colors to meet contrast requirements
  const filteredColors = filterByContrastRequirements(colors, contrastLevel);

  // Calculate accessibility metrics
  const isAccessible = checkPaletteAccessibility(filteredColors);
  const averageDistinguishability =
    calculateAverageDistinguishability(filteredColors);

  return {
    colors: filteredColors,
    colorBlindnessType,
    baseColor:
      customColors && customColors.length > 0 ? customColors[0] : baseColor,
    isAccessible,
    averageDistinguishability,
  };
}

/**
 * Generate palette using hue shifts
 */
function generateHueShiftPalette(
  baseColor: ColorInfo,
  count: number,
  colorBlindnessType: ColorBlindnessType
): ColorBlindnessPaletteItem[] {
  const colors: ColorBlindnessPaletteItem[] = [];

  // Define safe hue ranges for different color blindness types
  const safeHueRanges = getSafeHueRanges(colorBlindnessType);

  for (let i = 0; i < count; i++) {
    let hue: number;

    if (safeHueRanges.length > 0) {
      // Use safe hue ranges
      const rangeIndex = i % safeHueRanges.length;
      const range = safeHueRanges[rangeIndex];
      const position = (i / count) * (range.end - range.start);
      hue = range.start + position;
    } else {
      // Fallback to even distribution
      hue = (360 / count) * i;
    }

    const hsl: HSLColor = {
      h: hue,
      s: Math.max(50, baseColor.hsl.s), // Ensure minimum saturation
      l: baseColor.hsl.l,
    };

    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    const simulated = simulateColorBlindness(hex, colorBlindnessType);

    colors.push({
      original: hex,
      simulated,
      rgb,
      hsl,
      isDistinguishable: calculateDistinguishability(hex, simulated) > 0.1,
    });
  }

  return colors;
}

/**
 * Generate palette using lightness variations
 */
function generateLightnessVariationPalette(
  baseColor: ColorInfo,
  count: number,
  colorBlindnessType: ColorBlindnessType
): ColorBlindnessPaletteItem[] {
  const colors: ColorBlindnessPaletteItem[] = [];

  for (let i = 0; i < count; i++) {
    const lightness = 20 + (60 / (count - 1)) * i; // Range from 20% to 80%

    const hsl: HSLColor = {
      h: baseColor.hsl.h,
      s: baseColor.hsl.s,
      l: lightness,
    };

    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    const simulated = simulateColorBlindness(hex, colorBlindnessType);

    colors.push({
      original: hex,
      simulated,
      rgb,
      hsl,
      isDistinguishable: calculateDistinguishability(hex, simulated) > 0.1,
    });
  }

  return colors;
}

/**
 * Generate palette using saturation variations
 */
function generateSaturationVariationPalette(
  baseColor: ColorInfo,
  count: number,
  colorBlindnessType: ColorBlindnessType
): ColorBlindnessPaletteItem[] {
  const colors: ColorBlindnessPaletteItem[] = [];

  for (let i = 0; i < count; i++) {
    const saturation = 30 + (70 / (count - 1)) * i; // Range from 30% to 100%

    const hsl: HSLColor = {
      h: baseColor.hsl.h,
      s: saturation,
      l: baseColor.hsl.l,
    };

    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    const simulated = simulateColorBlindness(hex, colorBlindnessType);

    colors.push({
      original: hex,
      simulated,
      rgb,
      hsl,
      isDistinguishable: calculateDistinguishability(hex, simulated) > 0.1,
    });
  }

  return colors;
}

/**
 * Generate complementary color palette
 */
function generateComplementaryPalette(
  baseColor: ColorInfo,
  count: number,
  colorBlindnessType: ColorBlindnessType
): ColorBlindnessPaletteItem[] {
  const colors: ColorBlindnessPaletteItem[] = [];

  // Generate colors using complementary and triadic relationships
  const hueOffsets = [0, 60, 120, 180, 240, 300]; // Hexadic color scheme

  for (let i = 0; i < count; i++) {
    const hueOffset = hueOffsets[i % hueOffsets.length];
    const hue = (baseColor.hsl.h + hueOffset) % 360;

    const hsl: HSLColor = {
      h: hue,
      s: baseColor.hsl.s,
      l: baseColor.hsl.l,
    };

    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    const simulated = simulateColorBlindness(hex, colorBlindnessType);

    colors.push({
      original: hex,
      simulated,
      rgb,
      hsl,
      isDistinguishable: calculateDistinguishability(hex, simulated) > 0.1,
    });
  }

  return colors;
}

/**
 * Get safe hue ranges for different color blindness types
 */
function getSafeHueRanges(
  colorBlindnessType: ColorBlindnessType
): { start: number; end: number }[] {
  switch (colorBlindnessType) {
    case "protanopia":
    case "protanomaly":
      // Avoid red-green confusion, prefer blue and yellow
      return [
        { start: 180, end: 270 }, // Blue range
        { start: 45, end: 75 }, // Yellow range
      ];
    case "deuteranopia":
    case "deuteranomaly":
      // Avoid red-green confusion, prefer blue and purple
      return [
        { start: 200, end: 280 }, // Blue-purple range
        { start: 45, end: 75 }, // Yellow range
      ];
    case "tritanopia":
    case "tritanomaly":
      // Avoid blue-yellow confusion, prefer red and green
      return [
        { start: 0, end: 30 }, // Red range
        { start: 120, end: 150 }, // Green range
      ];
    case "achromatopsia":
      // Only use lightness variations
      return [];
    default:
      return [];
  }
}

/**
 * Calculate distinguishability between original and simulated colors
 */
function calculateDistinguishability(
  original: string,
  simulated: string
): number {
  const originalInfo = getColorInfo(original);
  const simulatedInfo = getColorInfo(simulated);

  if (!originalInfo || !simulatedInfo) return 0;

  // Calculate perceptual difference
  const deltaR = originalInfo.rgb.r - simulatedInfo.rgb.r;
  const deltaG = originalInfo.rgb.g - simulatedInfo.rgb.g;
  const deltaB = originalInfo.rgb.b - simulatedInfo.rgb.b;

  const euclideanDistance = Math.sqrt(
    deltaR * deltaR + deltaG * deltaG + deltaB * deltaB
  );
  return euclideanDistance / 441.67; // Normalize to 0-1 range
}

/**
 * Filter colors by contrast requirements
 */
function filterByContrastRequirements(
  colors: ColorBlindnessPaletteItem[],
  contrastLevel: "AA" | "AAA"
): ColorBlindnessPaletteItem[] {
  const requiredRatio = contrastLevel === "AAA" ? 7 : 4.5;

  return colors.filter((color) => {
    // Check contrast against white and black backgrounds
    const whiteContrast = getContrastRatio(color.rgb, {
      r: 255,
      g: 255,
      b: 255,
    });
    const blackContrast = getContrastRatio(color.rgb, { r: 0, g: 0, b: 0 });

    color.contrastRatio = Math.max(whiteContrast, blackContrast);
    return color.contrastRatio >= requiredRatio;
  });
}

/**
 * Check if palette is accessible for the given color blindness type
 */
function checkPaletteAccessibility(
  colors: ColorBlindnessPaletteItem[]
): boolean {
  if (colors.length < 2) return false;

  // Check if all colors are distinguishable when simulated
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const distinguishability = calculateDistinguishability(
        colors[i].simulated,
        colors[j].simulated
      );

      if (distinguishability < 0.15) {
        return false; // Colors are too similar
      }
    }
  }

  return true;
}

/**
 * Calculate average distinguishability of palette
 */
function calculateAverageDistinguishability(
  colors: ColorBlindnessPaletteItem[]
): number {
  if (colors.length < 2) return 0;

  let totalDistinguishability = 0;
  let pairCount = 0;

  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      totalDistinguishability += calculateDistinguishability(
        colors[i].simulated,
        colors[j].simulated
      );
      pairCount++;
    }
  }

  return totalDistinguishability / pairCount;
}
