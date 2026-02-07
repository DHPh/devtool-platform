import { describe, expect, it } from "vitest";
import {
  convertCSSColor,
  getColorInfo,
  mapCSSColorToGamut,
  parseCSSColor,
  serializeCSSColor,
} from "@/lib/utils/color";

const expectClose = (actual: number[], expected: number[], digits = 4) => {
  expected.forEach((value, index) => expect(actual[index]).toBeCloseTo(value, digits));
};

describe("CSS Color 4 parser", () => {
  it("parses short and long hex with alpha", () => {
    const short = parseCSSColor("#0f08")!;
    const long = parseCSSColor("#00ff0088")!;

    expect(short.space).toBe("srgb");
    expectClose(short.components, [0, 1, 0]);
    expect(short.alpha).toBeCloseTo(0x88 / 255, 8);
    expectClose(long.components, short.components);
    expect(long.alpha).toBeCloseTo(short.alpha, 8);
  });

  it("supports legacy and modern rgb/hsl syntax", () => {
    const legacy = parseCSSColor("rgba(255, 0, 127.5, 50%)")!;
    const legacyPercent = parseCSSColor("rgb(100%, 0%, 50%)")!;
    const modern = parseCSSColor("rgb(100% 0% 50% / .5)")!;
    const modernMixed = parseCSSColor("rgb(255 0% 50% / .5)")!;
    const hsl = parseCSSColor("hsl(0.5turn 100% 50% / 25%)")!;
    const legacyHsl = parseCSSColor("hsl(180, 100%, 50%)")!;

    expectClose(legacy.components, [1, 0, 0.5]);
    expectClose(legacyPercent.components, [1, 0, 0.5]);
    expectClose(modern.components, [1, 0, 0.5]);
    expectClose(modernMixed.components, [1, 0, 0.5]);
    expect(legacy.alpha).toBe(0.5);
    expect(hsl.components).toEqual([180, 100, 50]);
    expect(legacyHsl.components).toEqual([180, 100, 50]);
    expect(hsl.alpha).toBe(0.25);
  });

  it("enforces percentage-only HSL and HWB components", () => {
    expect(parseCSSColor("hsl(120 100 50)")) .toBeNull();
    expect(parseCSSColor("hsl(120, 100%, 50)")) .toBeNull();
    expect(parseCSSColor("hwb(120 20 30%)")) .toBeNull();
    expect(parseCSSColor("hwb(120 20% 30)")) .toBeNull();

    expect(parseCSSColor("hsl(120 100% 50%)")?.components).toEqual([120, 100, 50]);
    expect(parseCSSColor("hwb(120 20% 30%)")?.components).toEqual([120, 20, 30]);
  });

  it("rejects mixed channel units only in legacy comma-separated RGB", () => {
    expect(parseCSSColor("rgb(255, 0%, 127)")) .toBeNull();
    expect(parseCSSColor("rgba(100%, 0, 50%, .5)")) .toBeNull();

    expect(parseCSSColor("rgb(255, 0, 127)")) .not.toBeNull();
    expect(parseCSSColor("rgb(100%, 0%, 50%)")) .not.toBeNull();
    expect(parseCSSColor("rgb(255 0% 50%)")) .not.toBeNull();
  });

  it.each([
    ["hwb(120 20% 30% / .8)", "hwb"],
    ["lab(50% 20 -30 / .8)", "lab"],
    ["lch(50% 40 270deg / .8)", "lch"],
    ["oklab(60% .1 -.1 / .8)", "oklab"],
    ["oklch(60% .2 1.5rad / .8)", "oklch"],
    ["color(display-p3 1 0 .25 / .8)", "display-p3"],
  ])("parses %s", (input, space) => {
    const color = parseCSSColor(input);
    expect(color?.space).toBe(space);
    expect(color?.alpha).toBe(0.8);
  });

  it("supports transparent and practical named colors", () => {
    expect(parseCSSColor("transparent")?.alpha).toBe(0);
    const purple = parseCSSColor("ReBeCcApUrPlE")!;
    expectClose(purple.components, [0.4, 0.2, 0.6]);
    expect(purple.original).toBe("ReBeCcApUrPlE");
  });

  it("supports the complete CSS named-color set including uncommon aliases", () => {
    expectClose(parseCSSColor("aliceblue")!.components, [240 / 255, 248 / 255, 1]);
    expectClose(parseCSSColor("darkslategrey")!.components, [47 / 255, 79 / 255, 79 / 255]);
    expectClose(parseCSSColor("lightgoldenrodyellow")!.components, [250 / 255, 250 / 255, 210 / 255]);
  });

  it("rejects unsupported or malformed colors", () => {
    expect(parseCSSColor("")) .toBeNull();
    expect(parseCSSColor("rgb(1 2)")) .toBeNull();
    expect(parseCSSColor("color(rec2020 1 0 0)")) .toBeNull();
    expect(parseCSSColor("oklch(50% nope 10)")) .toBeNull();
  });
});

describe("CSS Color 4 conversion", () => {
  it("converts D50 Lab boundaries to sRGB black and white", () => {
    expectClose(convertCSSColor(parseCSSColor("lab(0 0 0)")!, "srgb"), [0, 0, 0], 3);
    expectClose(convertCSSColor(parseCSSColor("lab(100 0 0)")!, "srgb"), [1, 1, 1], 3);
  });

  it("round-trips colors through the colorimetric representation", () => {
    const input = parseCSSColor("oklch(62% .18 245 / .4)")!;
    expectClose(convertCSSColor(input, "oklch"), input.components, 4);
    expect(serializeCSSColor(input)).toBe("oklch(0.62 0.18 245 / 0.4)");
  });

  it("marks powerless cylindrical hues", () => {
    expect(parseCSSColor("hsl(270 0% 50%)")?.powerlessHue).toBe(true);
    expect(parseCSSColor("hwb(270 60% 40%)")?.powerlessHue).toBe(true);
    expect(parseCSSColor("lch(50 0 270)")?.powerlessHue).toBe(true);
    expect(parseCSSColor("oklch(0.5 0 270)")?.powerlessHue).toBe(true);
  });

  it("reports sRGB and Display-P3 gamut independently", () => {
    const p3Red = parseCSSColor("color(display-p3 1 0 0)")!;
    expect(p3Red.gamut.displayP3).toBe(true);
    expect(p3Red.gamut.srgb).toBe(false);
  });

  it("round-trips extended RGB with negative channels using signed transfer functions", () => {
    const extended = parseCSSColor("color(display-p3 1.1 -0.1 0.25)")!;
    expect(extended.gamut.displayP3).toBe(false);
    expectClose(convertCSSColor(extended, "display-p3"), [1.1, -0.1, 0.25], 4);
  });

  it("returns an explicit clipped mapping and preserves alpha", () => {
    const p3Red = parseCSSColor("color(display-p3 1 0 0 / .5)")!;
    const mapped = mapCSSColorToGamut(p3Red, "srgb");

    expect(mapped.method).toBe("clip");
    expect(mapped.wasInGamut).toBe(false);
    expect(mapped.components.every(value => value >= 0 && value <= 1)).toBe(true);
    expect(mapped.alpha).toBe(0.5);
    expect(mapped.hex).toBe("#FF000080");
  });

  it("keeps the legacy color info API while accepting Color 4", () => {
    const info = getColorInfo("oklch(62.8% .2577 29.23 / 75%)")!;
    expect(info.hex).toBe("#FF0000");
    expect(info.alpha).toBe(0.75);
    expect(info.cssColor?.space).toBe("oklch");
  });
});
