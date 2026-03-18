import { defineStudioManifest } from "@/lib/studio-manifest";

export const WEB_DEVELOPMENT_STUDIO_MANIFEST = defineStudioManifest(
  "web-development-studio",
  "web-development-studio",
  [
    { id: "javascript-formatter", shortLabel: "JS/TS", icon: "FileCode", loadComponent: () => import("./tabs/JavaScriptFormatterTab").then((module) => ({ default: module.JavaScriptFormatterTab })) },
    { id: "svg-data-uri-converter", shortLabel: "SVG URI", icon: "Link", loadComponent: () => import("./tabs/SvgDataUriConverterTab").then((module) => ({ default: module.SvgDataUriConverterTab })) },
    { id: "css-unit-converter", shortLabel: "CSS Units", icon: "RefreshCw", loadComponent: () => import("./tabs/CssUnitConverterTab").then((module) => ({ default: module.CssUnitConverterTab })) },
    { id: "css-clamp-calculator", shortLabel: "Clamp", icon: "Activity", loadComponent: () => import("./tabs/CssClampCalculatorTab").then((module) => ({ default: module.CssClampCalculatorTab })) },
    { id: "open-graph-generator", shortLabel: "Open Graph", icon: "Globe", loadComponent: () => import("./tabs/OpenGraphGeneratorTab").then((module) => ({ default: module.OpenGraphGeneratorTab })) },
    { id: "web-manifest-generator", shortLabel: "Manifest", icon: "File", loadComponent: () => import("./tabs/WebManifestGeneratorTab").then((module) => ({ default: module.WebManifestGeneratorTab })) },
    { id: "javascript-minifier", shortLabel: "JS minify", icon: "Zap", loadComponent: () => import("./tabs/JavaScriptMinifierTab").then((module) => ({ default: module.JavaScriptMinifierTab })) },
    { id: "svg-optimizer", shortLabel: "SVG optimize", icon: "Image", loadComponent: () => import("./tabs/SvgOptimizerTab").then((module) => ({ default: module.SvgOptimizerTab })) },
  ],
);
