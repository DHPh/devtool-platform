import { defineStudioManifest } from "@/lib/studio-manifest";

export const DEVOPS_CONFIGURATION_STUDIO_MANIFEST = defineStudioManifest(
  "devops-configuration-studio",
  "devops-configuration-studio",
  [
    { id: "cron-expression-builder", shortLabel: "Cron", icon: "Activity", loadComponent: () => import("./tabs/CronExpressionBuilderTab").then((module) => ({ default: module.CronExpressionBuilderTab })) },
    { id: "chmod-calculator", shortLabel: "Chmod", icon: "Shield", loadComponent: () => import("./tabs/ChmodCalculatorTab").then((module) => ({ default: module.ChmodCalculatorTab })) },
    { id: "env-file-manager", shortLabel: ".env", icon: "FileCode", loadComponent: () => import("./tabs/EnvFileManagerTab").then((module) => ({ default: module.EnvFileManagerTab })) },
    { id: "semver-comparator", shortLabel: "SemVer", icon: "GitCompare", loadComponent: () => import("./tabs/SemverComparatorTab").then((module) => ({ default: module.SemverComparatorTab })) },
    { id: "dockerfile-linter", shortLabel: "Dockerfile", icon: "FileCode", loadComponent: () => import("./tabs/DockerfileLinterTab").then((module) => ({ default: module.DockerfileLinterTab })) },
    { id: "docker-compose-validator", shortLabel: "Compose", icon: "Layers", loadComponent: () => import("./tabs/DockerComposeValidatorTab").then((module) => ({ default: module.DockerComposeValidatorTab })) },
    { id: "kubernetes-manifest-validator", shortLabel: "Kubernetes", icon: "CheckCircle", loadComponent: () => import("./tabs/KubernetesManifestValidatorTab").then((module) => ({ default: module.KubernetesManifestValidatorTab })) },
    { id: "gitignore-generator", shortLabel: ".gitignore", icon: "FileText", loadComponent: () => import("./tabs/GitignoreGeneratorTab").then((module) => ({ default: module.GitignoreGeneratorTab })) },
  ],
);
