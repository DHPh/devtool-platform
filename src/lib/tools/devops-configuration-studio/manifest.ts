import { defineStudioManifest } from "@/lib/studio-manifest";

export const DEVOPS_CONFIGURATION_STUDIO_MANIFEST = defineStudioManifest(
  "devops-configuration-studio",
  "devops-configuration-studio",
  [
    { id: "cron-expression-builder", shortLabel: "Cron", icon: "Activity", loadComponent: () => import("./tabs/CronExpressionBuilderTab").then((module) => ({ default: module.CronExpressionBuilderTab })) },
    { id: "chmod-calculator", shortLabel: "Chmod", icon: "Shield", loadComponent: () => import("./tabs/ChmodCalculatorTab").then((module) => ({ default: module.ChmodCalculatorTab })) },
    { id: "env-file-manager", shortLabel: ".env", icon: "FileCode", loadComponent: () => import("./tabs/EnvFileManagerTab").then((module) => ({ default: module.EnvFileManagerTab })) },
    { id: "semver-comparator", shortLabel: "SemVer", icon: "GitCompare", loadComponent: () => import("./tabs/SemverComparatorTab").then((module) => ({ default: module.SemverComparatorTab })) },
  ],
);
