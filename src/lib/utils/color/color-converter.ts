import { mapCSSColorToGamut, parseCSSColor, type CSSColor } from "./css-color-4";

/**
 * Color conversion utilities
 * Supports HEX, RGB, HSL, CMYK, and HSV color spaces
 */

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface HSLColor {
  h: number;
  s: number;
  l: number;
}

export interface HSVColor {
  h: number;
  s: number;
  v: number;
}

export interface CMYKColor {
  c: number;
  m: number;
  y: number;
  k: number;
}

export interface ColorInfo {
  hex: string;
  rgb: RGBColor;
  hsl: HSLColor;
  hsv: HSVColor;
  cmyk: CMYKColor;
  name?: string;
  luminance: number;
  isDark: boolean;
  isLight: boolean;
  alpha?: number;
  cssColor?: CSSColor;
}

/**
 * Convert HEX to RGB
 */
export function hexToRgb(hex: string): RGBColor | null {
  // Remove # if present
  hex = hex.replace(/^#/, "");

  // Handle 3-digit hex
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  if (hex.length !== 6) return null;

  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to HEX
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(r: number, g: number, b: number): HSLColor {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h: number, s: number;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
      default:
        h = 0;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(h: number, s: number, l: number): RGBColor {
  h /= 360;
  s /= 100;
  l /= 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255 + 1e-9),
    g: Math.round(g * 255 + 1e-9),
    b: Math.round(b * 255 + 1e-9),
  };
}

/**
 * Convert RGB to HSV
 */
export function rgbToHsv(r: number, g: number, b: number): HSVColor {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h: number;
  const v = max;
  const s = max === 0 ? 0 : diff / max;

  if (diff === 0) {
    h = 0;
  } else {
    switch (max) {
      case r:
        h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / diff + 2) / 6;
        break;
      case b:
        h = ((r - g) / diff + 4) / 6;
        break;
      default:
        h = 0;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
}

/**
 * Convert HSV to RGB
 */
export function hsvToRgb(h: number, s: number, v: number): RGBColor {
  h /= 360;
  s /= 100;
  v /= 100;

  const c = v * s;
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
  const m = v - c;

  let r: number, g: number, b: number;

  if (h < 1 / 6) {
    [r, g, b] = [c, x, 0];
  } else if (h < 2 / 6) {
    [r, g, b] = [x, c, 0];
  } else if (h < 3 / 6) {
    [r, g, b] = [0, c, x];
  } else if (h < 4 / 6) {
    [r, g, b] = [0, x, c];
  } else if (h < 5 / 6) {
    [r, g, b] = [x, 0, c];
  } else {
    [r, g, b] = [c, 0, x];
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

/**
 * Convert RGB to CMYK
 */
export function rgbToCmyk(r: number, g: number, b: number): CMYKColor {
  r /= 255;
  g /= 255;
  b /= 255;

  const k = 1 - Math.max(r, g, b);
  const c = k === 1 ? 0 : (1 - r - k) / (1 - k);
  const m = k === 1 ? 0 : (1 - g - k) / (1 - k);
  const y = k === 1 ? 0 : (1 - b - k) / (1 - k);

  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  };
}

/**
 * Convert CMYK to RGB
 */
export function cmykToRgb(
  c: number,
  m: number,
  y: number,
  k: number
): RGBColor {
  c /= 100;
  m /= 100;
  y /= 100;
  k /= 100;

  const r = 255 * (1 - c) * (1 - k);
  const g = 255 * (1 - m) * (1 - k);
  const b = 255 * (1 - y) * (1 - k);

  return {
    r: Math.round(r),
    g: Math.round(g),
    b: Math.round(b),
  };
}

/**
 * Calculate relative luminance of a color
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: RGBColor, color2: RGBColor): number {
  const l1 = getLuminance(color1.r, color1.g, color1.b);
  const l2 = getLuminance(color2.r, color2.g, color2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get comprehensive color information
 */
export function getColorInfo(input: string): ColorInfo | null {
  const cssColor = parseCSSColor(input);
  if (!cssColor) return null;
  let rgb: RGBColor;
  if (cssColor.space === "hsl") {
    // Preserve the legacy API's validation contract and integer rounding.
    const hslInput = /^hsla?\(\s*[^\s,\/]+\s*(?:,\s*|\s+)([+-]?(?:\d+\.?\d*|\.\d+))%\s*(?:,\s*|\s+)([+-]?(?:\d+\.?\d*|\.\d+))%/i.exec(input.trim());
    if (!hslInput || Number(hslInput[1]) < 0 || Number(hslInput[1]) > 100 || Number(hslInput[2]) < 0 || Number(hslInput[2]) > 100) return null;
    rgb = hslToRgb(...cssColor.components);
  } else if (cssColor.space === "srgb") {
    rgb = {
      r: Math.round(cssColor.components[0] * 255),
      g: Math.round(cssColor.components[1] * 255),
      b: Math.round(cssColor.components[2] * 255),
    };
  } else {
    const mapped = mapCSSColorToGamut(cssColor, "srgb");
    rgb = {
      r: Math.round(mapped.components[0] * 255),
      g: Math.round(mapped.components[1] * 255),
      b: Math.round(mapped.components[2] * 255),
    };
  }

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
  const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);

  return {
    hex: rgbToHex(rgb.r, rgb.g, rgb.b).toUpperCase(),
    rgb,
    hsl,
    hsv,
    cmyk,
    luminance,
    isDark: luminance < 0.5,
    isLight: luminance >= 0.5,
    alpha: cssColor.alpha,
    cssColor,
  };
}

/**
 * Validate color format
 */
export function isValidHex(hex: string): boolean {
  return /^#?([a-f\d]{3}|[a-f\d]{4}|[a-f\d]{6}|[a-f\d]{8})$/i.test(hex);
}

export function isValidRgb(r: number, g: number, b: number): boolean {
  return [r, g, b].every(
    (value) => Number.isInteger(value) && value >= 0 && value <= 255
  );
}

export function isValidHsl(h: number, s: number, l: number): boolean {
  return (
    Number.isInteger(h) &&
    h >= 0 &&
    h <= 360 &&
    Number.isInteger(s) &&
    s >= 0 &&
    s <= 100 &&
    Number.isInteger(l) &&
    l >= 0 &&
    l <= 100
  );
}
