import { defineStudioManifest } from "@/lib/studio-manifest";

export const PASSWORD_STUDIO_MANIFEST = defineStudioManifest(
  "password-studio",
  "password-studio",
  [
    { id: "generator", shortLabel: "Generator", icon: "Key", loadComponent: () => import("./tabs/PasswordGeneratorTab").then((module) => ({ default: module.PasswordGeneratorTab })) },
    { id: "passphrase", shortLabel: "Passphrase", icon: "Zap", loadComponent: () => import("./tabs/PassphraseGeneratorTab").then((module) => ({ default: module.PassphraseGeneratorTab })) },
    { id: "analysis", shortLabel: "Analysis", icon: "Shield", loadComponent: () => import("./tabs/PasswordAnalysisTab").then((module) => ({ default: module.PasswordAnalysisTab })) },
    // create-tool:tabs
  ],
);
