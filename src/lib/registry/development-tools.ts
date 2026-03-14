import { TOOL_CATEGORIES, TOOL_TYPES } from "@/lib/tool-classification";
import type { ToolMetadata } from "./types";

export const DEVELOPMENT_TOOLS = [
  {
    id: "devops-configuration-studio", kind: "studio", studioDirectory: "devops-configuration-studio", processing: "client",
    name: "DevOps and Configuration Studio", description: "Build and inspect common DevOps configuration values locally",
    category: TOOL_CATEGORIES.UTILITIES.id, type: TOOL_TYPES.UTILITY, types: [TOOL_TYPES.CALCULATOR, TOOL_TYPES.PARSER],
    tags: ["devops", "configuration", "cron", "docker", "kubernetes", "gitignore"], path: "/tools/devops-configuration-studio", icon: "🛠️", complexity: "intermediate",
  },
  {
    id: "cron-expression-builder", kind: "studio-subtool", processing: "client", name: "Cron Expression Builder",
    description: "Build, parse, explain, and preview five-field cron schedules", category: TOOL_CATEGORIES.UTILITIES.id,
    type: TOOL_TYPES.GENERATOR, types: [TOOL_TYPES.PARSER], tags: ["cron", "schedule", "devops"],
    path: "/tools/devops-configuration-studio?tab=cron-expression-builder", icon: "⏱️", complexity: "intermediate",
    parent: "devops-configuration-studio", tab: "cron-expression-builder",
  },
  {
    id: "chmod-calculator", kind: "studio-subtool", processing: "client", name: "Chmod Calculator",
    description: "Convert symbolic and numeric Unix file permissions", category: TOOL_CATEGORIES.UTILITIES.id,
    type: TOOL_TYPES.CALCULATOR, types: [TOOL_TYPES.CONVERTER], tags: ["chmod", "permissions", "unix"],
    path: "/tools/devops-configuration-studio?tab=chmod-calculator", icon: "🔐", complexity: "simple",
    parent: "devops-configuration-studio", tab: "chmod-calculator",
  },
  {
    id: "env-file-manager", kind: "studio-subtool", processing: "client", name: ".env File Manager",
    description: "Parse, compare, and safely redact environment files", category: TOOL_CATEGORIES.UTILITIES.id,
    type: TOOL_TYPES.EDITOR, types: [TOOL_TYPES.PARSER], tags: ["env", "configuration", "secrets", "redact"],
    path: "/tools/devops-configuration-studio?tab=env-file-manager", icon: "⚙️", complexity: "intermediate",
    parent: "devops-configuration-studio", tab: "env-file-manager",
  },
  {
    id: "semver-comparator", kind: "studio-subtool", processing: "client", name: "Semantic Version Comparator",
    description: "Compare semantic versions and evaluate npm-style ranges", category: TOOL_CATEGORIES.UTILITIES.id,
    type: TOOL_TYPES.ANALYZER, tags: ["semver", "version", "range", "npm"],
    path: "/tools/devops-configuration-studio?tab=semver-comparator", icon: "🔢", complexity: "simple",
    parent: "devops-configuration-studio", tab: "semver-comparator",
  },
  {
    id: "dockerfile-linter", kind: "studio-subtool", processing: "client", name: "Dockerfile Linter",
    description: "Lint Dockerfiles for structural, security, and reproducibility issues", category: TOOL_CATEGORIES.UTILITIES.id,
    type: TOOL_TYPES.VALIDATOR, types: [TOOL_TYPES.ANALYZER], tags: ["dockerfile", "docker", "container", "lint"],
    path: "/tools/devops-configuration-studio?tab=dockerfile-linter", icon: "🐳", complexity: "intermediate",
    parent: "devops-configuration-studio", tab: "dockerfile-linter",
  },
  {
    id: "docker-compose-validator", kind: "studio-subtool", processing: "client", name: "Docker Compose Validator",
    description: "Validate Compose YAML services and common field structures", category: TOOL_CATEGORIES.UTILITIES.id,
    type: TOOL_TYPES.VALIDATOR, types: [TOOL_TYPES.PARSER], tags: ["docker", "compose", "yaml", "container"],
    path: "/tools/devops-configuration-studio?tab=docker-compose-validator", icon: "📦", complexity: "intermediate",
    parent: "devops-configuration-studio", tab: "docker-compose-validator",
  },
  {
    id: "kubernetes-manifest-validator", kind: "studio-subtool", processing: "client", name: "Kubernetes Manifest Validator",
    description: "Validate required fields across multi-document Kubernetes YAML", category: TOOL_CATEGORIES.UTILITIES.id,
    type: TOOL_TYPES.VALIDATOR, types: [TOOL_TYPES.PARSER], tags: ["kubernetes", "k8s", "yaml", "manifest"],
    path: "/tools/devops-configuration-studio?tab=kubernetes-manifest-validator", icon: "☸️", complexity: "intermediate",
    parent: "devops-configuration-studio", tab: "kubernetes-manifest-validator",
  },
  {
    id: "gitignore-generator", kind: "studio-subtool", processing: "client", name: ".gitignore Generator",
    description: "Generate de-duplicated gitignore files from technology and editor presets", category: TOOL_CATEGORIES.UTILITIES.id,
    type: TOOL_TYPES.GENERATOR, tags: ["gitignore", "git", "generator", "repository"],
    path: "/tools/devops-configuration-studio?tab=gitignore-generator", icon: "🙈", complexity: "simple",
    parent: "devops-configuration-studio", tab: "gitignore-generator",
  },
] satisfies ToolMetadata[];
