/**
 * CSS Gradient generator utilities
 */

import { getColorInfo } from "./color-converter";

export interface GradientStop {
  color: string;
  position: number; // 0-100
}

export interface LinearGradient {
  type: "linear";
  angle: number; // 0-360 degrees
  stops: GradientStop[];
}

export interface RadialGradient {
  type: "radial";
  shape: "circle" | "ellipse";
  size: "closest-side" | "closest-corner" | "farthest-side" | "farthest-corner";
  position: { x: number; y: number }; // 0-100
  stops: GradientStop[];
}

export interface ConicGradient {
  type: "conic";
  angle: number; // 0-360 degrees
  position: { x: number; y: number }; // 0-100
  stops: GradientStop[];
}

export type Gradient = LinearGradient | RadialGradient | ConicGradient;

/**
 * Generate CSS for linear gradient
 */
export function generateLinearGradientCSS(gradient: LinearGradient): string {
  const stopsCSS = gradient.stops
    .map((stop) => `${stop.color} ${stop.position}%`)
    .join(", ");

  return `linear-gradient(${gradient.angle}deg, ${stopsCSS})`;
}

/**
 * Generate CSS for radial gradient
 */
export function generateRadialGradientCSS(gradient: RadialGradient): string {
  const stopsCSS = gradient.stops
    .map((stop) => `${stop.color} ${stop.position}%`)
    .join(", ");

  const position = `${gradient.position.x}% ${gradient.position.y}%`;
  const sizeShape = `${gradient.shape} ${gradient.size}`;

  return `radial-gradient(${sizeShape} at ${position}, ${stopsCSS})`;
}

/**
 * Generate CSS for conic gradient
 */
export function generateConicGradientCSS(gradient: ConicGradient): string {
  const stopsCSS = gradient.stops
    .map((stop) => `${stop.color} ${stop.position}%`)
    .join(", ");

  const position = `${gradient.position.x}% ${gradient.position.y}%`;

  return `conic-gradient(from ${gradient.angle}deg at ${position}, ${stopsCSS})`;
}

/**
 * Generate CSS for any gradient type
 */
export function generateGradientCSS(gradient: Gradient): string {
  switch (gradient.type) {
    case "linear":
      return generateLinearGradientCSS(gradient);
    case "radial":
      return generateRadialGradientCSS(gradient);
    case "conic":
      return generateConicGradientCSS(gradient);
    default:
      throw new Error("Unknown gradient type");
  }
}

/**
 * Create gradient with evenly spaced stops
 */
export function createEvenGradient(
  colors: string[],
  type: Gradient["type"] = "linear"
): Gradient {
  const stops: GradientStop[] = colors.map((color, index) => ({
    color,
    position: colors.length === 1 ? 0 : (index / (colors.length - 1)) * 100,
  }));

  const baseGradient = {
    stops,
  };

  switch (type) {
    case "linear":
      return {
        type: "linear",
        angle: 90,
        ...baseGradient,
      };
    case "radial":
      return {
        type: "radial",
        shape: "circle",
        size: "farthest-corner",
        position: { x: 50, y: 50 },
        ...baseGradient,
      };
    case "conic":
      return {
        type: "conic",
        angle: 0,
        position: { x: 50, y: 50 },
        ...baseGradient,
      };
    default:
      throw new Error("Unknown gradient type");
  }
}

/**
 * Predefined gradient presets
 */
export const GRADIENT_PRESETS = {
  sunset: createEvenGradient(["#ff7f50", "#ff6b6b", "#4ecdc4"], "linear"),
  ocean: createEvenGradient(["#667eea", "#764ba2"], "linear"),
  rainbow: createEvenGradient(
    [
      "#ff0000",
      "#ff8000",
      "#ffff00",
      "#80ff00",
      "#00ff00",
      "#00ff80",
      "#00ffff",
      "#0080ff",
      "#0000ff",
      "#8000ff",
      "#ff00ff",
      "#ff0080",
    ],
    "linear"
  ),
  fire: createEvenGradient(["#ff9a9e", "#fecfef", "#fecfef"], "radial"),
  cool: createEvenGradient(["#a8edea", "#fed6e3"], "linear"),
  warm: createEvenGradient(["#ffecd2", "#fcb69f"], "linear"),
  night: createEvenGradient(
    ["#0c3483", "#a2b6df", "#6b8cce", "#a2b6df"],
    "linear"
  ),
  dawn: createEvenGradient(["#f093fb", "#f5576c"], "linear"),
  forest: createEvenGradient(["#134e5e", "#71b280"], "linear"),
  lavender: createEvenGradient(["#ffeef8", "#e0c3fc"], "linear"),
} as const;

/**
 * Get gradient preset by name
 */
export function getGradientPreset(
  name: keyof typeof GRADIENT_PRESETS
): Gradient {
  return GRADIENT_PRESETS[name];
}

/**
 * Generate random gradient
 */
export function generateRandomGradient(
  type: Gradient["type"] = "linear",
  colorCount: number = 3
): Gradient {
  const colors: string[] = [];

  for (let i = 0; i < colorCount; i++) {
    const h = Math.floor(Math.random() * 360);
    const s = Math.floor(Math.random() * 40) + 60; // 60-100%
    const l = Math.floor(Math.random() * 30) + 35; // 35-65%
    colors.push(`hsl(${h}, ${s}%, ${l}%)`);
  }

  return createEvenGradient(colors, type);
}

/**
 * Interpolate between two colors for smooth gradients
 */
export function interpolateColors(
  color1: string,
  color2: string,
  steps: number
): string[] {
  const c1 = getColorInfo(color1);
  const c2 = getColorInfo(color2);

  if (!c1 || !c2) throw new Error("Invalid colors for interpolation");

  const colors: string[] = [];

  for (let i = 0; i < steps; i++) {
    const ratio = i / (steps - 1);

    const r = Math.round(c1.rgb.r + (c2.rgb.r - c1.rgb.r) * ratio);
    const g = Math.round(c1.rgb.g + (c2.rgb.g - c1.rgb.g) * ratio);
    const b = Math.round(c1.rgb.b + (c2.rgb.b - c1.rgb.b) * ratio);

    colors.push(`rgb(${r}, ${g}, ${b})`);
  }

  return colors;
}

/**
 * Convert gradient to different type while preserving colors
 */
export function convertGradientType(
  gradient: Gradient,
  newType: Gradient["type"]
): Gradient {
  const baseProps = { stops: gradient.stops };

  switch (newType) {
    case "linear":
      return {
        type: "linear",
        angle: 90,
        ...baseProps,
      };
    case "radial":
      return {
        type: "radial",
        shape: "circle",
        size: "farthest-corner",
        position: { x: 50, y: 50 },
        ...baseProps,
      };
    case "conic":
      return {
        type: "conic",
        angle: 0,
        position: { x: 50, y: 50 },
        ...baseProps,
      };
    default:
      throw new Error("Unknown gradient type");
  }
}

/**
 * Add color stop to gradient
 */
export function addGradientStop(
  gradient: Gradient,
  color: string,
  position: number
): Gradient {
  const newStops = [...gradient.stops, { color, position }].sort(
    (a, b) => a.position - b.position
  );

  return {
    ...gradient,
    stops: newStops,
  };
}

/**
 * Remove color stop from gradient
 */
export function removeGradientStop(
  gradient: Gradient,
  index: number
): Gradient {
  if (gradient.stops.length <= 2) {
    throw new Error("Gradient must have at least 2 stops");
  }

  const newStops = gradient.stops.filter((_, i) => i !== index);

  return {
    ...gradient,
    stops: newStops,
  };
}

/**
 * Update color stop in gradient
 */
export function updateGradientStop(
  gradient: Gradient,
  index: number,
  updates: Partial<GradientStop>
): Gradient {
  const newStops = gradient.stops.map((stop, i) =>
    i === index ? { ...stop, ...updates } : stop
  );

  return {
    ...gradient,
    stops: newStops.sort((a, b) => a.position - b.position),
  };
}
