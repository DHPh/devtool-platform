/**
 * Color palette generation utilities
 * Generate harmonious color palettes from base colors
 */

import {
  RGBColor,
  HSLColor,
  getColorInfo,
  hslToRgb,
  rgbToHex,
} from "./color-converter";

export interface PaletteColor {
  hex: string;
  rgb: RGBColor;
  hsl: HSLColor;
  name: string;
}

export interface ColorPalette {
  name: string;
  description: string;
  colors: PaletteColor[];
}

/**
 * Generate monochromatic palette (different shades/tints of same hue)
 */
export function generateMonochromatic(
  baseHex: string,
  count: number = 5
): ColorPalette {
  const baseColor = getColorInfo(baseHex);
  if (!baseColor) throw new Error("Invalid base color");

  const colors: PaletteColor[] = [];
  const { h, s } = baseColor.hsl;

  for (let i = 0; i < count; i++) {
    const lightness = Math.round(20 + (60 / (count - 1)) * i);
    const rgb = hslToRgb(h, s, lightness);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

    colors.push({
      hex,
      rgb,
      hsl: { h, s, l: lightness },
      name: `Shade ${i + 1}`,
    });
  }

  return {
    name: "Monochromatic",
    description: "Different shades and tints of the same hue",
    colors,
  };
}

/**
 * Generate analogous palette (neighboring hues)
 */
export function generateAnalogous(
  baseHex: string,
  count: number = 5
): ColorPalette {
  const baseColor = getColorInfo(baseHex);
  if (!baseColor) throw new Error("Invalid base color");

  const colors: PaletteColor[] = [];
  const { h, s, l } = baseColor.hsl;
  const step = 30; // degrees

  for (let i = 0; i < count; i++) {
    const hue = (h + (i - Math.floor(count / 2)) * step + 360) % 360;
    const rgb = hslToRgb(hue, s, l);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

    colors.push({
      hex,
      rgb,
      hsl: { h: hue, s, l },
      name: `Analogous ${i + 1}`,
    });
  }

  return {
    name: "Analogous",
    description: "Colors that are adjacent on the color wheel",
    colors,
  };
}

/**
 * Generate complementary palette (opposite hues)
 */
export function generateComplementary(baseHex: string): ColorPalette {
  const baseColor = getColorInfo(baseHex);
  if (!baseColor) throw new Error("Invalid base color");

  const { h, s, l } = baseColor.hsl;
  const complementHue = (h + 180) % 360;

  const colors: PaletteColor[] = [
    {
      hex: baseHex.toUpperCase(),
      rgb: baseColor.rgb,
      hsl: baseColor.hsl,
      name: "Base Color",
    },
    {
      ...(() => {
        const rgb = hslToRgb(complementHue, s, l);
        return {
          hex: rgbToHex(rgb.r, rgb.g, rgb.b),
          rgb,
          hsl: { h: complementHue, s, l },
          name: "Complement",
        };
      })(),
    },
  ];

  return {
    name: "Complementary",
    description: "Colors directly opposite on the color wheel",
    colors,
  };
}

/**
 * Generate triadic palette (three evenly spaced hues)
 */
export function generateTriadic(baseHex: string): ColorPalette {
  const baseColor = getColorInfo(baseHex);
  if (!baseColor) throw new Error("Invalid base color");

  const { h, s, l } = baseColor.hsl;
  const colors: PaletteColor[] = [];

  for (let i = 0; i < 3; i++) {
    const hue = (h + i * 120) % 360;
    const rgb = hslToRgb(hue, s, l);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

    colors.push({
      hex,
      rgb,
      hsl: { h: hue, s, l },
      name: i === 0 ? "Base Color" : `Triadic ${i}`,
    });
  }

  return {
    name: "Triadic",
    description: "Three colors evenly spaced around the color wheel",
    colors,
  };
}

/**
 * Generate split-complementary palette
 */
export function generateSplitComplementary(baseHex: string): ColorPalette {
  const baseColor = getColorInfo(baseHex);
  if (!baseColor) throw new Error("Invalid base color");

  const { h, s, l } = baseColor.hsl;
  const complementHue = (h + 180) % 360;

  const colors: PaletteColor[] = [
    {
      hex: baseHex.toUpperCase(),
      rgb: baseColor.rgb,
      hsl: baseColor.hsl,
      name: "Base Color",
    },
    {
      ...(() => {
        const hue1 = (complementHue - 30 + 360) % 360;
        const rgb1 = hslToRgb(hue1, s, l);
        return {
          hex: rgbToHex(rgb1.r, rgb1.g, rgb1.b),
          rgb: rgb1,
          hsl: { h: hue1, s, l },
          name: "Split Complement 1",
        };
      })(),
    },
    {
      ...(() => {
        const hue2 = (complementHue + 30) % 360;
        const rgb2 = hslToRgb(hue2, s, l);
        return {
          hex: rgbToHex(rgb2.r, rgb2.g, rgb2.b),
          rgb: rgb2,
          hsl: { h: hue2, s, l },
          name: "Split Complement 2",
        };
      })(),
    },
  ];

  return {
    name: "Split Complementary",
    description: "Base color with two colors adjacent to its complement",
    colors,
  };
}

/**
 * Generate tetradic (square) palette
 */
export function generateTetradic(baseHex: string): ColorPalette {
  const baseColor = getColorInfo(baseHex);
  if (!baseColor) throw new Error("Invalid base color");

  const { h, s, l } = baseColor.hsl;
  const colors: PaletteColor[] = [];

  for (let i = 0; i < 4; i++) {
    const hue = (h + i * 90) % 360;
    const rgb = hslToRgb(hue, s, l);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

    colors.push({
      hex,
      rgb,
      hsl: { h: hue, s, l },
      name: i === 0 ? "Base Color" : `Square ${i}`,
    });
  }

  return {
    name: "Tetradic (Square)",
    description: "Four colors evenly spaced around the color wheel",
    colors,
  };
}

/**
 * Generate material design palette
 */
export function generateMaterialPalette(baseHex: string): ColorPalette {
  const baseColor = getColorInfo(baseHex);
  if (!baseColor) throw new Error("Invalid base color");

  const { h, s } = baseColor.hsl;
  const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
  const colors: PaletteColor[] = [];

  shades.forEach((shade) => {
    // Material Design-like lightness calculation
    const lightness =
      shade <= 500
        ? 95 - (shade / 500) * 45 // 95% to 50%
        : 50 - ((shade - 500) / 400) * 40; // 50% to 10%

    const adjustedSaturation = shade === 50 ? s * 0.3 : s;
    const rgb = hslToRgb(h, adjustedSaturation, Math.round(lightness));
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

    colors.push({
      hex,
      rgb,
      hsl: { h, s: adjustedSaturation, l: Math.round(lightness) },
      name: `${shade}`,
    });
  });

  return {
    name: "Material Design",
    description: "Material Design inspired color palette",
    colors,
  };
}

/**
 * Generate random palette
 */
export function generateRandomPalette(count: number = 5): ColorPalette {
  const colors: PaletteColor[] = [];

  for (let i = 0; i < count; i++) {
    const h = Math.floor(Math.random() * 360);
    const s = Math.floor(Math.random() * 60) + 40; // 40-100%
    const l = Math.floor(Math.random() * 40) + 30; // 30-70%

    const rgb = hslToRgb(h, s, l);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

    colors.push({
      hex,
      rgb,
      hsl: { h, s, l },
      name: `Random ${i + 1}`,
    });
  }

  return {
    name: "Random",
    description: "Randomly generated color palette",
    colors,
  };
}

/**
 * Generate gradient colors between two colors
 */
export function generateGradient(
  startHex: string,
  endHex: string,
  steps: number = 5
): PaletteColor[] {
  const startColor = getColorInfo(startHex);
  const endColor = getColorInfo(endHex);

  if (!startColor || !endColor) throw new Error("Invalid color(s)");

  const colors: PaletteColor[] = [];

  for (let i = 0; i < steps; i++) {
    const ratio = i / (steps - 1);

    const r = Math.round(
      startColor.rgb.r + (endColor.rgb.r - startColor.rgb.r) * ratio
    );
    const g = Math.round(
      startColor.rgb.g + (endColor.rgb.g - startColor.rgb.g) * ratio
    );
    const b = Math.round(
      startColor.rgb.b + (endColor.rgb.b - startColor.rgb.b) * ratio
    );

    const hex = rgbToHex(r, g, b);
    const colorInfo = getColorInfo(hex);

    if (colorInfo) {
      colors.push({
        hex,
        rgb: { r, g, b },
        hsl: colorInfo.hsl,
        name: `Step ${i + 1}`,
      });
    }
  }

  return colors;
}

/**
 * Get all available palette types
 */
export const PALETTE_TYPES = [
  {
    id: "monochromatic",
    name: "Monochromatic",
    description: "Different shades of same hue",
  },
  {
    id: "analogous",
    name: "Analogous",
    description: "Adjacent colors on color wheel",
  },
  {
    id: "complementary",
    name: "Complementary",
    description: "Opposite colors on color wheel",
  },
  { id: "triadic", name: "Triadic", description: "Three evenly spaced colors" },
  {
    id: "splitComplementary",
    name: "Split Complementary",
    description: "Base + adjacent to complement",
  },
  {
    id: "tetradic",
    name: "Tetradic",
    description: "Four evenly spaced colors",
  },
  {
    id: "material",
    name: "Material Design",
    description: "Material Design inspired",
  },
  { id: "random", name: "Random", description: "Randomly generated colors" },
] as const;

export type PaletteType = (typeof PALETTE_TYPES)[number]["id"];

/**
 * Generate palette by type
 */
export function generatePalette(
  type: PaletteType,
  baseHex: string,
  count?: number
): ColorPalette {
  switch (type) {
    case "monochromatic":
      return generateMonochromatic(baseHex, count);
    case "analogous":
      return generateAnalogous(baseHex, count);
    case "complementary":
      return generateComplementary(baseHex);
    case "triadic":
      return generateTriadic(baseHex);
    case "splitComplementary":
      return generateSplitComplementary(baseHex);
    case "tetradic":
      return generateTetradic(baseHex);
    case "material":
      return generateMaterialPalette(baseHex);
    case "random":
      return generateRandomPalette(count);
    default:
      throw new Error(`Unknown palette type: ${type}`);
  }
}
