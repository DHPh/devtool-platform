// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { GradientCreator } from "@/lib/tools/color-studio/components/GradientCreator";
import { GradientColorPickerTab } from "@/lib/tools/color-studio/tabs/GradientColorPickerTab";
import { PaletteGeneratorTab } from "@/lib/tools/color-studio/tabs/PaletteGeneratorTab";
import { materializeGradientStops } from "@/lib/utils/color/gradient-generator";
import { generateOklchPalette } from "@/lib/utils/color/palette-generator";

afterEach(cleanup);

describe("Color Studio perceptual controls", () => {
  it("exposes interpolation selection in the gradient creator", () => {
    render(<GradientCreator />);
    expect(screen.getByRole("combobox", { name: "Interpolation space" })).toBeVisible();
    expect(screen.getByText(/sampled stops/i)).toBeVisible();
  });

  it("exposes interpolation selection in the gradient sampler", () => {
    render(<GradientColorPickerTab />);
    expect(screen.getByRole("combobox", { name: "Interpolation space" })).toBeVisible();
    expect(screen.getByText("Interactive Gradient Color Picker")).toBeVisible();
  });

  it("keeps perceptual palette generation available in Color Studio", () => {
    render(<PaletteGeneratorTab />);
    expect(screen.getByText("Palette Generator")).toBeVisible();
    expect(screen.getByText("Palette Type")).toBeVisible();
  });

  it("runs the production gradient and palette paths for modern CSS colors", () => {
    expect(() =>
      materializeGradientStops([
        { color: "oklch(60% 0.2 30)", position: 0 },
        { color: "color(display-p3 0.2 0.7 0.4)", position: 50 },
        { color: "hsl(240 100% 50%)", position: 100 },
      ])
    ).not.toThrow();
    expect(() => generateOklchPalette("oklch(60% 0.2 30)", 5)).not.toThrow();
    expect(() =>
      generateOklchPalette("color(display-p3 0.2 0.7 0.4)", 5)
    ).not.toThrow();
    expect(() => generateOklchPalette("hsl(240 100% 50%)", 5)).not.toThrow();
  });
});
