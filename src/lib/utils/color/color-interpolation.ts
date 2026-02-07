/** Color interpolation primitives backed by the shared CSS Color 4 model. */

import { mapCSSColorToGamut, parseCSSColor } from "./css-color-4";

export type ColorInterpolationSpace =
  | "srgb"
  | "linear-srgb"
  | "oklab"
  | "oklch";

export type HueInterpolationMethod =
  | "shorter"
  | "longer"
  | "increasing"
  | "decreasing";

export interface ColorInterpolationOptions {
  space?: ColorInterpolationSpace;
  hue?: HueInterpolationMethod;
}

export interface RGBAColor {
  /** Encoded sRGB channels in the inclusive range 0..1. */
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface OKLabColor {
  l: number;
  a: number;
  b: number;
}

export interface OKLCHColor {
  l: number;
  c: number;
  /** Hue in degrees, or null when hue is powerless. */
  h: number | null;
}

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

const normalizeHue = (hue: number) => ((hue % 360) + 360) % 360;

export function parseInterpolationColor(input: string): RGBAColor | null {
  const parsed = parseCSSColor(input);
  if (!parsed) return null;

  // The interpolation engine's portable output is encoded sRGB. Preserve the
  // authored alpha while using the shared model's explicit clipping policy for
  // colors outside sRGB (for example, some display-p3 and OKLCH colors).
  // Avoid a needless matrix round trip for authored sRGB. Besides being more
  // direct, this preserves exact byte endpoints such as #fff.
  const components =
    parsed.space === "srgb"
      ? parsed.components
      : mapCSSColorToGamut(parsed, "srgb").components;
  return {
    r: components[0],
    g: components[1],
    b: components[2],
    a: parsed.alpha,
  };
}

export function srgbToLinear(channel: number): number {
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

export function linearToSrgb(channel: number): number {
  return channel <= 0.0031308
    ? channel * 12.92
    : 1.055 * channel ** (1 / 2.4) - 0.055;
}

export function rgbaToOklab(color: RGBAColor): OKLabColor {
  const r = srgbToLinear(color.r);
  const g = srgbToLinear(color.g);
  const b = srgbToLinear(color.b);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  return {
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

export function oklabToRgba(color: OKLabColor, alpha = 1): RGBAColor {
  const l = (color.l + 0.3963377774 * color.a + 0.2158037573 * color.b) ** 3;
  const m = (color.l - 0.1055613458 * color.a - 0.0638541728 * color.b) ** 3;
  const s = (color.l - 0.0894841775 * color.a - 1.291485548 * color.b) ** 3;

  return {
    r: clamp(linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)),
    g: clamp(linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)),
    b: clamp(linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)),
    a: clamp(alpha),
  };
}

export function oklabToOklch(color: OKLabColor): OKLCHColor {
  const c = Math.hypot(color.a, color.b);
  return {
    l: color.l,
    c,
    h: c < 1e-7 ? null : normalizeHue((Math.atan2(color.b, color.a) * 180) / Math.PI),
  };
}

export function oklchToOklab(color: OKLCHColor): OKLabColor {
  const hue = ((color.h ?? 0) * Math.PI) / 180;
  return {
    l: color.l,
    a: color.c * Math.cos(hue),
    b: color.c * Math.sin(hue),
  };
}

export function interpolateHue(
  start: number,
  end: number,
  ratio: number,
  method: HueInterpolationMethod = "shorter"
): number {
  let delta = normalizeHue(end) - normalizeHue(start);
  if (method === "shorter") {
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
  } else if (method === "longer") {
    if (delta > 0 && delta < 180) delta -= 360;
    if (delta <= 0 && delta > -180) delta += 360;
  } else if (method === "increasing" && delta < 0) {
    delta += 360;
  } else if (method === "decreasing" && delta > 0) {
    delta -= 360;
  }
  return normalizeHue(start + delta * ratio);
}

const mix = (start: number, end: number, ratio: number) =>
  start + (end - start) * ratio;

const mixPremultiplied = (
  start: number,
  end: number,
  startAlpha: number,
  endAlpha: number,
  alpha: number,
  ratio: number
) =>
  alpha === 0
    ? 0
    : mix(start * startAlpha, end * endAlpha, ratio) / alpha;

export function interpolateColorValues(
  start: RGBAColor,
  end: RGBAColor,
  ratio: number,
  options: ColorInterpolationOptions = {}
): RGBAColor {
  const t = clamp(ratio);
  const alpha = mix(start.a, end.a, t);
  const space = options.space ?? "srgb";

  if (space === "srgb") {
    return {
      r: mixPremultiplied(start.r, end.r, start.a, end.a, alpha, t),
      g: mixPremultiplied(start.g, end.g, start.a, end.a, alpha, t),
      b: mixPremultiplied(start.b, end.b, start.a, end.a, alpha, t),
      a: alpha,
    };
  }

  if (space === "linear-srgb") {
    return {
      r: clamp(
        linearToSrgb(
          mixPremultiplied(
            srgbToLinear(start.r),
            srgbToLinear(end.r),
            start.a,
            end.a,
            alpha,
            t
          )
        )
      ),
      g: clamp(
        linearToSrgb(
          mixPremultiplied(
            srgbToLinear(start.g),
            srgbToLinear(end.g),
            start.a,
            end.a,
            alpha,
            t
          )
        )
      ),
      b: clamp(
        linearToSrgb(
          mixPremultiplied(
            srgbToLinear(start.b),
            srgbToLinear(end.b),
            start.a,
            end.a,
            alpha,
            t
          )
        )
      ),
      a: alpha,
    };
  }

  const first = rgbaToOklab(start);
  const second = rgbaToOklab(end);
  if (space === "oklab") {
    return oklabToRgba(
      {
        l: mixPremultiplied(first.l, second.l, start.a, end.a, alpha, t),
        a: mixPremultiplied(first.a, second.a, start.a, end.a, alpha, t),
        b: mixPremultiplied(first.b, second.b, start.a, end.a, alpha, t),
      },
      alpha
    );
  }

  const firstLch = oklabToOklch(first);
  const secondLch = oklabToOklch(second);
  // CSS Color 4 carries the meaningful hue into a powerless-hue endpoint.
  const firstMeaningfulHue = start.a === 0 ? null : firstLch.h;
  const secondMeaningfulHue = end.a === 0 ? null : secondLch.h;
  const firstHue = firstMeaningfulHue ?? secondMeaningfulHue ?? 0;
  const secondHue = secondMeaningfulHue ?? firstMeaningfulHue ?? 0;
  return oklabToRgba(
    oklchToOklab({
      l: mixPremultiplied(firstLch.l, secondLch.l, start.a, end.a, alpha, t),
      c: mixPremultiplied(firstLch.c, secondLch.c, start.a, end.a, alpha, t),
      h: interpolateHue(firstHue, secondHue, t, options.hue),
    }),
    alpha
  );
}

export function formatInterpolatedColor(color: RGBAColor): string {
  const channels = [color.r, color.g, color.b].map((channel) =>
    Math.round(clamp(channel) * 255)
  );
  if (color.a >= 1 - 1e-7) return `rgb(${channels.join(", ")})`;
  const alpha = Number(clamp(color.a).toFixed(4));
  return `rgba(${channels.join(", ")}, ${alpha})`;
}

export function interpolateColor(
  start: string,
  end: string,
  ratio: number,
  options: ColorInterpolationOptions = {}
): string {
  const first = parseInterpolationColor(start);
  const second = parseInterpolationColor(end);
  if (!first || !second) throw new Error("Invalid colors for interpolation");
  return formatInterpolatedColor(interpolateColorValues(first, second, ratio, options));
}
