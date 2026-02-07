/**
 * CSS Color 4 parsing and colorimetric conversion utilities.
 *
 * Internally colors are converted through CIE XYZ D50. RGB gamut conversion
 * uses simple channel clipping deliberately; callers can distinguish the
 * original gamut result from the explicitly mapped output.
 */

export type CSSColorSpace =
  | "srgb"
  | "hsl"
  | "hwb"
  | "lab"
  | "lch"
  | "oklab"
  | "oklch"
  | "display-p3";

export type RGBGamut = "srgb" | "display-p3";
export type ColorComponents = [number, number, number];

export interface CSSColorGamutStatus {
  srgb: boolean;
  displayP3: boolean;
}

export interface CSSColor {
  space: CSSColorSpace;
  components: ColorComponents;
  alpha: number;
  /** The trimmed author-provided serialization. */
  original: string;
  /** Colorimetric representation using a D50 white point. */
  xyzD50: ColorComponents;
  gamut: CSSColorGamutStatus;
  /** True when a cylindrical hue has no visual effect. */
  powerlessHue: boolean;
}

export interface GamutMappedColor {
  target: RGBGamut;
  method: "clip";
  wasInGamut: boolean;
  components: ColorComponents;
  alpha: number;
  css: string;
  hex: string | null;
}

const EPSILON = 1e-7;
const D50 = [0.96422, 1, 0.82521] as const;

// The complete CSS named-color set (transparent is handled separately because
// it carries alpha). Values are the standardized 8-bit sRGB coordinates.
const NAMED_COLORS: Record<string, ColorComponents> = {
  aliceblue:[240,248,255], antiquewhite:[250,235,215], aqua:[0,255,255], aquamarine:[127,255,212], azure:[240,255,255],
  beige:[245,245,220], bisque:[255,228,196], black:[0,0,0], blanchedalmond:[255,235,205], blue:[0,0,255], blueviolet:[138,43,226], brown:[165,42,42], burlywood:[222,184,135],
  cadetblue:[95,158,160], chartreuse:[127,255,0], chocolate:[210,105,30], coral:[255,127,80], cornflowerblue:[100,149,237], cornsilk:[255,248,220], crimson:[220,20,60], cyan:[0,255,255],
  darkblue:[0,0,139], darkcyan:[0,139,139], darkgoldenrod:[184,134,11], darkgray:[169,169,169], darkgreen:[0,100,0], darkgrey:[169,169,169], darkkhaki:[189,183,107], darkmagenta:[139,0,139], darkolivegreen:[85,107,47], darkorange:[255,140,0], darkorchid:[153,50,204], darkred:[139,0,0], darksalmon:[233,150,122], darkseagreen:[143,188,143], darkslateblue:[72,61,139], darkslategray:[47,79,79], darkslategrey:[47,79,79], darkturquoise:[0,206,209], darkviolet:[148,0,211],
  deeppink:[255,20,147], deepskyblue:[0,191,255], dimgray:[105,105,105], dimgrey:[105,105,105], dodgerblue:[30,144,255],
  firebrick:[178,34,34], floralwhite:[255,250,240], forestgreen:[34,139,34], fuchsia:[255,0,255],
  gainsboro:[220,220,220], ghostwhite:[248,248,255], gold:[255,215,0], goldenrod:[218,165,32], gray:[128,128,128], green:[0,128,0], greenyellow:[173,255,47], grey:[128,128,128],
  honeydew:[240,255,240], hotpink:[255,105,180], indianred:[205,92,92], indigo:[75,0,130], ivory:[255,255,240], khaki:[240,230,140],
  lavender:[230,230,250], lavenderblush:[255,240,245], lawngreen:[124,252,0], lemonchiffon:[255,250,205], lightblue:[173,216,230], lightcoral:[240,128,128], lightcyan:[224,255,255], lightgoldenrodyellow:[250,250,210], lightgray:[211,211,211], lightgreen:[144,238,144], lightgrey:[211,211,211], lightpink:[255,182,193], lightsalmon:[255,160,122], lightseagreen:[32,178,170], lightskyblue:[135,206,250], lightslategray:[119,136,153], lightslategrey:[119,136,153], lightsteelblue:[176,196,222], lightyellow:[255,255,224], lime:[0,255,0], limegreen:[50,205,50], linen:[250,240,230],
  magenta:[255,0,255], maroon:[128,0,0], mediumaquamarine:[102,205,170], mediumblue:[0,0,205], mediumorchid:[186,85,211], mediumpurple:[147,112,219], mediumseagreen:[60,179,113], mediumslateblue:[123,104,238], mediumspringgreen:[0,250,154], mediumturquoise:[72,209,204], mediumvioletred:[199,21,133], midnightblue:[25,25,112], mintcream:[245,255,250], mistyrose:[255,228,225], moccasin:[255,228,181],
  navajowhite:[255,222,173], navy:[0,0,128], oldlace:[253,245,230], olive:[128,128,0], olivedrab:[107,142,35], orange:[255,165,0], orangered:[255,69,0], orchid:[218,112,214],
  palegoldenrod:[238,232,170], palegreen:[152,251,152], paleturquoise:[175,238,238], palevioletred:[219,112,147], papayawhip:[255,239,213], peachpuff:[255,218,185], peru:[205,133,63], pink:[255,192,203], plum:[221,160,221], powderblue:[176,224,230], purple:[128,0,128],
  rebeccapurple:[102,51,153], red:[255,0,0], rosybrown:[188,143,143], royalblue:[65,105,225], saddlebrown:[139,69,19], salmon:[250,128,114], sandybrown:[244,164,96], seagreen:[46,139,87], seashell:[255,245,238], sienna:[160,82,45], silver:[192,192,192], skyblue:[135,206,235], slateblue:[106,90,205], slategray:[112,128,144], slategrey:[112,128,144], snow:[255,250,250], springgreen:[0,255,127], steelblue:[70,130,180],
  tan:[210,180,140], teal:[0,128,128], thistle:[216,191,216], tomato:[255,99,71], turquoise:[64,224,208], violet:[238,130,238], wheat:[245,222,179], white:[255,255,255], whitesmoke:[245,245,245], yellow:[255,255,0], yellowgreen:[154,205,50],
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const normalizeHue = (value: number) => ((value % 360) + 360) % 360;
const multiply = (m: readonly (readonly number[])[], v: readonly number[]): ColorComponents => [
  m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
  m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
  m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
];

const D65_TO_D50 = [
  [1.0479298, 0.0229468, -0.0501922],
  [0.0296278, 0.9904345, -0.0170738],
  [-0.009243, 0.0150552, 0.7518743],
] as const;
const D50_TO_D65 = [
  [0.9554734, -0.0230985, 0.0632593],
  [-0.0283697, 1.0099955, 0.0210414],
  [0.012314, -0.0205077, 1.3303659],
] as const;
const SRGB_TO_XYZ_D65 = [
  [0.4123907993, 0.3575843394, 0.1804807884],
  [0.2126390059, 0.7151686788, 0.0721923154],
  [0.0193308187, 0.1191947798, 0.9505321522],
] as const;
const XYZ_D65_TO_SRGB = [
  [3.2409699419, -1.5373831776, -0.4986107603],
  [-0.9692436363, 1.8759675015, 0.0415550574],
  [0.0556300797, -0.2039769589, 1.0569715142],
] as const;
const P3_TO_XYZ_D65 = [
  [0.4865709486, 0.2656676932, 0.1982172852],
  [0.2289745641, 0.6917385218, 0.0792869141],
  [0, 0.0451133819, 1.0439443689],
] as const;
const XYZ_D65_TO_P3 = [
  [2.4934969119, -0.9313836179, -0.4027107845],
  [-0.8294889696, 1.7626640603, 0.0236246858],
  [0.0358458302, -0.0761723893, 0.956884524],
] as const;

const toLinear = (value: number) => {
  const sign = Math.sign(value);
  const absolute = Math.abs(value);
  return sign * (absolute <= 0.04045 ? absolute / 12.92 : ((absolute + 0.055) / 1.055) ** 2.4);
};
const toGamma = (value: number) => {
  const sign = Math.sign(value);
  const absolute = Math.abs(value);
  return sign * (absolute <= 0.0031308 ? 12.92 * absolute : 1.055 * absolute ** (1 / 2.4) - 0.055);
};

function rgbToXyz(rgb: ColorComponents, gamut: RGBGamut): ColorComponents {
  const linear = rgb.map(toLinear) as ColorComponents;
  return multiply(D65_TO_D50, multiply(gamut === "srgb" ? SRGB_TO_XYZ_D65 : P3_TO_XYZ_D65, linear));
}

function xyzToRgb(xyzD50: ColorComponents, gamut: RGBGamut): ColorComponents {
  const xyzD65 = multiply(D50_TO_D65, xyzD50);
  return multiply(gamut === "srgb" ? XYZ_D65_TO_SRGB : XYZ_D65_TO_P3, xyzD65).map(toGamma) as ColorComponents;
}

function hslToSrgb([h, s, l]: ColorComponents): ColorComponents {
  h = normalizeHue(h) / 360;
  s /= 100;
  l /= 100;
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [f(0), f(8), f(4)];
}

function hwbToSrgb([h, w, b]: ColorComponents): ColorComponents {
  w /= 100;
  b /= 100;
  if (w + b >= 1) {
    const gray = w / (w + b);
    return [gray, gray, gray];
  }
  return hslToSrgb([h, 100, 50]).map(channel => channel * (1 - w - b) + w) as ColorComponents;
}

function labToXyz([l, a, b]: ColorComponents): ColorComponents {
  const f1 = (value: number) => {
    const cube = value ** 3;
    return cube > 216 / 24389 ? cube : (116 * value - 16) / (24389 / 27);
  };
  const fy = (l + 16) / 116;
  return [D50[0] * f1(fy + a / 500), D50[1] * f1(fy), D50[2] * f1(fy - b / 200)];
}

function xyzToLab(xyz: ColorComponents): ColorComponents {
  const f = (value: number) => value > 216 / 24389
    ? Math.cbrt(value)
    : (24389 / 27 * value + 16) / 116;
  const fx = f(xyz[0] / D50[0]);
  const fy = f(xyz[1] / D50[1]);
  const fz = f(xyz[2] / D50[2]);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

function lchToLab([l, c, h]: ColorComponents): ColorComponents {
  const radians = normalizeHue(h) * Math.PI / 180;
  return [l, c * Math.cos(radians), c * Math.sin(radians)];
}

function labToLch([l, a, b]: ColorComponents): ColorComponents {
  const c = Math.hypot(a, b);
  return [l, c, c < EPSILON ? 0 : normalizeHue(Math.atan2(b, a) * 180 / Math.PI)];
}

function oklabToXyz([l, a, b]: ColorComponents): ColorComponents {
  const ll = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mm = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const ss = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linearSrgb: ColorComponents = [
    4.0767416621 * ll - 3.3077115913 * mm + 0.2309699292 * ss,
    -1.2684380046 * ll + 2.6097574011 * mm - 0.3413193965 * ss,
    -0.0041960863 * ll - 0.7034186147 * mm + 1.707614701 * ss,
  ];
  return multiply(D65_TO_D50, multiply(SRGB_TO_XYZ_D65, linearSrgb));
}

function xyzToOklab(xyzD50: ColorComponents): ColorComponents {
  const [r, g, b] = multiply(XYZ_D65_TO_SRGB, multiply(D50_TO_D65, xyzD50));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function componentsToXyz(space: CSSColorSpace, components: ColorComponents): ColorComponents {
  switch (space) {
    case "srgb": return rgbToXyz(components, "srgb");
    case "display-p3": return rgbToXyz(components, "display-p3");
    case "hsl": return rgbToXyz(hslToSrgb(components), "srgb");
    case "hwb": return rgbToXyz(hwbToSrgb(components), "srgb");
    case "lab": return labToXyz(components);
    case "lch": return labToXyz(lchToLab(components));
    case "oklab": return oklabToXyz(components);
    case "oklch": return oklabToXyz(lchToLab(components));
  }
}

function xyzToComponents(xyz: ColorComponents, space: CSSColorSpace): ColorComponents {
  switch (space) {
    case "srgb": return xyzToRgb(xyz, "srgb");
    case "display-p3": return xyzToRgb(xyz, "display-p3");
    case "lab": return xyzToLab(xyz);
    case "lch": return labToLch(xyzToLab(xyz));
    case "oklab": return xyzToOklab(xyz);
    case "oklch": return labToLch(xyzToOklab(xyz));
    case "hsl": return srgbToHsl(xyzToRgb(xyz, "srgb"));
    case "hwb": return srgbToHwb(xyzToRgb(xyz, "srgb"));
  }
}

function srgbToHsl([r, g, b]: ColorComponents): ColorComponents {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;
  if (delta < EPSILON) return [0, 0, l * 100];
  let h = max === r ? (g - b) / delta : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  h = normalizeHue(h * 60);
  return [h, delta / (1 - Math.abs(2 * l - 1)) * 100, l * 100];
}

function srgbToHwb(rgb: ColorComponents): ColorComponents {
  return [srgbToHsl(rgb)[0], Math.min(...rgb) * 100, (1 - Math.max(...rgb)) * 100];
}

function parseNumber(value: string, percentScale?: number): number | null {
  if (value.toLowerCase() === "none") return 0;
  const match = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)(%)?$/i.exec(value);
  if (!match) return null;
  const number = Number(match[1]);
  if (!Number.isFinite(number)) return null;
  if (match[2]) return percentScale === undefined ? null : number * percentScale / 100;
  return number;
}

function parseAlpha(value: string | undefined): number | null {
  if (value === undefined) return 1;
  const parsed = parseNumber(value, 1);
  return parsed === null ? null : clamp(parsed);
}

function parsePercentage(value: string, scale: number): number | null {
  return value.endsWith("%") ? parseNumber(value, scale) : null;
}

function parseHue(value: string): number | null {
  if (value.toLowerCase() === "none") return 0;
  const match = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)(deg|grad|rad|turn)?$/i.exec(value);
  if (!match) return null;
  const number = Number(match[1]);
  const unit = match[2]?.toLowerCase();
  return normalizeHue(unit === "grad" ? number * 0.9 : unit === "rad" ? number * 180 / Math.PI : unit === "turn" ? number * 360 : number);
}

function splitFunctionBody(body: string): { channels: string[]; alpha?: string } | null {
  const slashParts = body.trim().split(/\s*\/\s*/);
  if (slashParts.length > 2 || !slashParts[0]) return null;
  const commaSyntax = slashParts[0].includes(",");
  if (commaSyntax && slashParts.length === 2) return null;
  const channels = commaSyntax
    ? slashParts[0].split(/\s*,\s*/)
    : slashParts[0].trim().split(/\s+/);
  let alpha: string | undefined = slashParts[1];
  if (commaSyntax && channels.length === 4 && alpha === undefined) alpha = channels.pop();
  return channels.some(channel => !channel) ? null : { channels, alpha };
}

function parseHex(value: string): { components: ColorComponents; alpha: number } | null {
  const match = /^#([\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.exec(value);
  if (!match) return null;
  let hex = match[1];
  if (hex.length <= 4) hex = [...hex].map(char => char + char).join("");
  const components: ColorComponents = [0, 2, 4].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255) as ColorComponents;
  return { components, alpha: hex.length === 8 ? parseInt(hex.slice(6), 16) / 255 : 1 };
}

function buildColor(space: CSSColorSpace, components: ColorComponents, alpha: number, original: string): CSSColor {
  const xyzD50 = componentsToXyz(space, components);
  const srgb = xyzToRgb(xyzD50, "srgb");
  const p3 = xyzToRgb(xyzD50, "display-p3");
  const inRange = (values: ColorComponents) => values.every(value => value >= -EPSILON && value <= 1 + EPSILON);
  const powerlessHue = (space === "hsl" && components[1] < EPSILON)
    || (space === "hwb" && components[1] + components[2] >= 100 - EPSILON)
    || ((space === "lch" || space === "oklch") && components[1] < EPSILON);
  return { space, components, alpha, original, xyzD50, gamut: { srgb: inRange(srgb), displayP3: inRange(p3) }, powerlessHue };
}

/** Parse a concrete CSS Color 4 color (relative colors and calc() are excluded). */
export function parseCSSColor(input: string): CSSColor | null {
  const original = input.trim();
  if (!original) return null;
  const lower = original.toLowerCase();
  if (lower === "transparent") return buildColor("srgb", [0, 0, 0], 0, original);
  const named = NAMED_COLORS[lower];
  if (named) return buildColor("srgb", named.map(channel => channel / 255) as ColorComponents, 1, original);
  const hex = parseHex(original);
  if (hex) return buildColor("srgb", hex.components, hex.alpha, original);

  const fn = /^([a-z][\w-]*)\((.*)\)$/i.exec(original);
  if (!fn) return null;
  const name = fn[1].toLowerCase();
  if (name === "color") {
    const match = /^display-p3\s+(.+)$/i.exec(fn[2].trim());
    if (!match) return null;
    const split = splitFunctionBody(match[1]);
    if (!split || split.channels.length !== 3) return null;
    const values = split.channels.map(channel => parseNumber(channel, 1));
    const alpha = parseAlpha(split.alpha);
    if (values.some(value => value === null) || alpha === null) return null;
    return buildColor("display-p3", values as ColorComponents, alpha, original);
  }

  const split = splitFunctionBody(fn[2]);
  if (!split || split.channels.length !== 3) return null;
  const alpha = parseAlpha(split.alpha);
  if (alpha === null) return null;
  let space: CSSColorSpace;
  let components: (number | null)[];
  switch (name) {
    case "rgb":
    case "rgba":
      space = "srgb";
      if (fn[2].includes(",")) {
        const usesPercentages = split.channels.map(channel => channel.endsWith("%"));
        if (!usesPercentages.every(isPercentage => isPercentage === usesPercentages[0])) return null;
      }
      components = split.channels.map(channel => parseNumber(channel, channel.endsWith("%") ? 1 : 255));
      components = components.map((value, index) => value === null ? null : split.channels[index].endsWith("%") ? value : value / 255);
      components = components.map(value => value === null ? null : clamp(value));
      break;
    case "hsl":
    case "hsla":
      space = "hsl";
      components = [parseHue(split.channels[0]), parsePercentage(split.channels[1], 100), parsePercentage(split.channels[2], 100)];
      components = components.map((value, index) => value === null || index === 0 ? value : clamp(value, 0, 100));
      break;
    case "hwb":
      space = "hwb";
      components = [parseHue(split.channels[0]), parsePercentage(split.channels[1], 100), parsePercentage(split.channels[2], 100)];
      components = components.map((value, index) => value === null || index === 0 ? value : clamp(value, 0, 100));
      break;
    case "lab":
      space = "lab";
      components = [parseNumber(split.channels[0], 100), parseNumber(split.channels[1], 125), parseNumber(split.channels[2], 125)];
      if (components[0] !== null) components[0] = clamp(components[0], 0, 100);
      break;
    case "lch":
      space = "lch";
      components = [parseNumber(split.channels[0], 100), parseNumber(split.channels[1], 150), parseHue(split.channels[2])];
      if (components[0] !== null) components[0] = clamp(components[0], 0, 100);
      if (components[1] !== null) components[1] = Math.max(0, components[1]);
      break;
    case "oklab":
      space = "oklab";
      components = [parseNumber(split.channels[0], 1), parseNumber(split.channels[1], 0.4), parseNumber(split.channels[2], 0.4)];
      if (components[0] !== null) components[0] = clamp(components[0]);
      break;
    case "oklch":
      space = "oklch";
      components = [parseNumber(split.channels[0], 1), parseNumber(split.channels[1], 0.4), parseHue(split.channels[2])];
      if (components[0] !== null) components[0] = clamp(components[0]);
      if (components[1] !== null) components[1] = Math.max(0, components[1]);
      break;
    default: return null;
  }
  if (components.some(value => value === null)) return null;
  return buildColor(space, components as ColorComponents, alpha, original);
}

/** Convert a parsed color without clipping. Values may be outside the target gamut. */
export function convertCSSColor(color: CSSColor, target: CSSColorSpace): ColorComponents {
  return xyzToComponents(color.xyzD50, target);
}

const rounded = (value: number, digits = 4) => Number(value.toFixed(digits));

/** Serialize a color in its source space or a requested target space. */
export function serializeCSSColor(color: CSSColor, target: CSSColorSpace = color.space): string {
  const [c1, c2, c3] = convertCSSColor(color, target).map(value => rounded(value)) as ColorComponents;
  const alpha = color.alpha < 1 ? ` / ${rounded(color.alpha)}` : "";
  switch (target) {
    case "srgb": return `rgb(${rounded(c1 * 255)} ${rounded(c2 * 255)} ${rounded(c3 * 255)}${alpha})`;
    case "display-p3": return `color(display-p3 ${c1} ${c2} ${c3}${alpha})`;
    case "hsl": return `hsl(${c1} ${c2}% ${c3}%${alpha})`;
    case "hwb": return `hwb(${c1} ${c2}% ${c3}%${alpha})`;
    case "lab": return `lab(${c1} ${c2} ${c3}${alpha})`;
    case "lch": return `lch(${c1} ${c2} ${c3}${alpha})`;
    case "oklab": return `oklab(${c1} ${c2} ${c3}${alpha})`;
    case "oklch": return `oklch(${c1} ${c2} ${c3}${alpha})`;
  }
}

/** Return a deliberately clipped, displayable RGB result with mapping metadata. */
export function mapCSSColorToGamut(color: CSSColor, target: RGBGamut = "srgb"): GamutMappedColor {
  const raw = xyzToRgb(color.xyzD50, target);
  const components = raw.map(value => clamp(value)) as ColorComponents;
  const cssAlpha = color.alpha < 1 ? ` / ${rounded(color.alpha)}` : "";
  const css = target === "srgb"
    ? `rgb(${components.map(value => rounded(value * 255)).join(" ")}${cssAlpha})`
    : `color(display-p3 ${components.map(value => rounded(value)).join(" ")}${cssAlpha})`;
  const hex = target === "srgb"
    ? `#${components.map(value => Math.round(value * 255).toString(16).padStart(2, "0")).join("")}${color.alpha < 1 ? Math.round(color.alpha * 255).toString(16).padStart(2, "0") : ""}`.toUpperCase()
    : null;
  return { target, method: "clip", wasInGamut: target === "srgb" ? color.gamut.srgb : color.gamut.displayP3, components, alpha: color.alpha, css, hex };
}
