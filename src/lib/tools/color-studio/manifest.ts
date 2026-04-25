import { defineStudioManifest } from "@/lib/studio-manifest";

export const COLOR_STUDIO_MANIFEST = defineStudioManifest(
  "color-studio",
  "color-studio",
  [
    { id: "converter", shortLabel: "Converter", icon: "Palette", loadComponent: () => import("./tabs/ColorConverterTab").then((module) => ({ default: module.ColorConverterTab })) },
    { id: "picker", shortLabel: "Picker", icon: "Pipette", loadComponent: () => import("./tabs/ColorPickerTab").then((module) => ({ default: module.ColorPickerTab })) },
    { id: "palette", shortLabel: "Palette", icon: "Layers", loadComponent: () => import("./tabs/PaletteGeneratorTab").then((module) => ({ default: module.PaletteGeneratorTab })) },
    { id: "gradient", shortLabel: "Gradient", icon: "Zap", loadComponent: () => import("./tabs/GradientCreatorTab").then((module) => ({ default: module.GradientCreatorTab })) },
    { id: "gradient-picker", shortLabel: "Grad Pick", icon: "Pipette", loadComponent: () => import("./tabs/GradientColorPickerTab").then((module) => ({ default: module.GradientColorPickerTab })) },
    { id: "contrast", shortLabel: "Contrast", icon: "Contrast", loadComponent: () => import("./tabs/ContrastCheckerTab").then((module) => ({ default: module.ContrastCheckerTab })) },
    { id: "colorblind", shortLabel: "Colorblind", icon: "Eye", loadComponent: () => import("./tabs/ColorBlindnessTab").then((module) => ({ default: module.ColorBlindnessTab })) },
    { id: "accessibility-palette", shortLabel: "A11y", icon: "Accessibility", loadComponent: () => import("./tabs/AccessibilityPaletteTab").then((module) => ({ default: module.AccessibilityPaletteTab })) },
    // create-tool:tabs
  ],
);
