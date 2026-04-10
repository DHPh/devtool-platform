import { parseAllDocuments } from "yaml";
import type { ProcessorResult } from "./result";

export interface ValidationIssue {
  severity: "error" | "warning";
  message: string;
  line?: number;
}

export interface DockerfileLintResult {
  instructions: number;
  stages: number;
  issues: ValidationIssue[];
}

const DOCKER_INSTRUCTIONS = new Set([
  "ADD", "ARG", "CMD", "COPY", "ENTRYPOINT", "ENV", "EXPOSE", "FROM",
  "HEALTHCHECK", "LABEL", "MAINTAINER", "ONBUILD", "RUN", "SHELL", "STOPSIGNAL",
  "USER", "VOLUME", "WORKDIR",
]);

export function lintDockerfile(input: string): ProcessorResult<DockerfileLintResult> {
  if (!input.trim()) return { ok: false, error: "Enter a Dockerfile." };
  const issues: ValidationIssue[] = [];
  const instructions: Array<{ name: string; value: string; line: number }> = [];
  let pending = "";
  let pendingLine = 0;

  input.split(/\r?\n/).forEach((source, index) => {
    const trimmed = source.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    if (!pending) pendingLine = index + 1;
    pending += `${pending ? " " : ""}${trimmed.replace(/\\\s*$/, "")}`;
    if (/\\\s*$/.test(trimmed)) return;
    const match = /^([A-Za-z]+)(?:\s+([\s\S]+))?$/.exec(pending);
    if (!match || !DOCKER_INSTRUCTIONS.has(match[1].toUpperCase())) {
      issues.push({ severity: "error", line: pendingLine, message: "Unknown or malformed Dockerfile instruction." });
    } else {
      instructions.push({ name: match[1].toUpperCase(), value: match[2]?.trim() ?? "", line: pendingLine });
    }
    pending = "";
  });
  if (pending) issues.push({ severity: "error", line: pendingLine, message: "Unterminated line continuation." });
  if (!instructions.some(({ name }) => name === "FROM")) issues.push({ severity: "error", message: "Dockerfile must contain a FROM instruction." });
  const firstInstruction = instructions[0];
  if (firstInstruction && !["ARG", "FROM"].includes(firstInstruction.name)) issues.push({ severity: "error", line: firstInstruction.line, message: "The first instruction must be ARG or FROM." });
  for (const instruction of instructions) {
    if (!instruction.value && !["HEALTHCHECK"].includes(instruction.name)) issues.push({ severity: "error", line: instruction.line, message: `${instruction.name} requires a value.` });
    if (instruction.name === "FROM" && /:latest(?:\s|$)/i.test(instruction.value)) issues.push({ severity: "warning", line: instruction.line, message: "Pin the base image to a specific version instead of latest." });
    if (instruction.name === "ADD" && !/^https?:\/\//i.test(instruction.value)) issues.push({ severity: "warning", line: instruction.line, message: "Prefer COPY over ADD for local files." });
    if (instruction.name === "RUN" && /\b(?:apt-get|apt)\s+upgrade\b/i.test(instruction.value)) issues.push({ severity: "warning", line: instruction.line, message: "Avoid upgrading all system packages in an image build." });
  }
  const stages = instructions.filter(({ name }) => name === "FROM").length;
  if (!instructions.some(({ name }) => name === "USER")) issues.push({ severity: "warning", message: "No USER instruction found; the container may run as root." });
  return { ok: true, value: { instructions: instructions.length, stages, issues } };
}

function parseYamlObjects(input: string): ProcessorResult<unknown[]> {
  if (!input.trim()) return { ok: false, error: "Enter YAML content." };
  try {
    const documents = parseAllDocuments(input, { prettyErrors: true });
    const errors = documents.flatMap((document) => document.errors.map((error) => error.message));
    if (errors.length) return { ok: false, error: errors.join("\n") };
    return { ok: true, value: documents.map((document) => document.toJS()) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "YAML could not be parsed." };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export interface ComposeValidationResult {
  services: string[];
  issues: ValidationIssue[];
}

export function validateDockerCompose(input: string): ProcessorResult<ComposeValidationResult> {
  const parsed = parseYamlObjects(input);
  if (!parsed.ok) return parsed;
  if (parsed.value.length !== 1 || !isRecord(parsed.value[0])) return { ok: false, error: "Compose YAML must contain one object document." };
  const root = parsed.value[0];
  if (!isRecord(root.services) || Object.keys(root.services).length === 0) return { ok: false, error: "Compose file must define at least one service." };
  const issues: ValidationIssue[] = [];
  const services = Object.keys(root.services).sort();
  for (const name of services) {
    const service = root.services[name];
    if (!isRecord(service)) {
      issues.push({ severity: "error", message: `Service ${name} must be an object.` });
      continue;
    }
    if (!service.image && !service.build) issues.push({ severity: "warning", message: `Service ${name} defines neither image nor build.` });
    if (service.ports !== undefined && !Array.isArray(service.ports)) issues.push({ severity: "error", message: `Service ${name} ports must be a list.` });
    if (service.depends_on !== undefined && !Array.isArray(service.depends_on) && !isRecord(service.depends_on)) issues.push({ severity: "error", message: `Service ${name} depends_on must be a list or object.` });
  }
  for (const key of Object.keys(root)) {
    if (!["name", "services", "networks", "volumes", "configs", "secrets", "version", "include"].includes(key) && !key.startsWith("x-")) issues.push({ severity: "warning", message: `Unknown top-level Compose key: ${key}.` });
  }
  return { ok: true, value: { services, issues } };
}

export interface KubernetesResource {
  apiVersion: string;
  kind: string;
  name: string;
}

export interface KubernetesValidationResult {
  resources: KubernetesResource[];
  issues: ValidationIssue[];
}

export function validateKubernetesManifest(input: string): ProcessorResult<KubernetesValidationResult> {
  const parsed = parseYamlObjects(input);
  if (!parsed.ok) return parsed;
  const resources: KubernetesResource[] = [];
  const issues: ValidationIssue[] = [];
  const objects = parsed.value.flatMap((document) => isRecord(document) && document.kind === "List" && isRecord(document) && Array.isArray(document.items) ? document.items : [document]);
  objects.forEach((object, index) => {
    if (!isRecord(object)) {
      issues.push({ severity: "error", message: `Document ${index + 1} must be an object.` });
      return;
    }
    const apiVersion = typeof object.apiVersion === "string" ? object.apiVersion : "";
    const kind = typeof object.kind === "string" ? object.kind : "";
    const metadata = isRecord(object.metadata) ? object.metadata : {};
    const name = typeof metadata.name === "string" ? metadata.name : "";
    if (!apiVersion) issues.push({ severity: "error", message: `Document ${index + 1} is missing apiVersion.` });
    if (!kind) issues.push({ severity: "error", message: `Document ${index + 1} is missing kind.` });
    if (!name) issues.push({ severity: "error", message: `Document ${index + 1} is missing metadata.name.` });
    if (apiVersion && kind && name) resources.push({ apiVersion, kind, name });
    if (["Deployment", "StatefulSet", "DaemonSet", "Job", "CronJob", "Service"].includes(kind) && !isRecord(object.spec)) issues.push({ severity: "error", message: `${kind || `Document ${index + 1}`} must define spec.` });
    if (/^(?:extensions|apps)\/v1beta/i.test(apiVersion)) issues.push({ severity: "warning", message: `${kind || `Document ${index + 1}`} uses deprecated apiVersion ${apiVersion}.` });
  });
  return { ok: true, value: { resources, issues } };
}

export type GitignorePreset = "node" | "nextjs" | "python" | "go" | "rust" | "java" | "macos" | "windows" | "vscode" | "jetbrains";

const GITIGNORE_PRESETS: Record<GitignorePreset, string[]> = {
  node: ["node_modules/", "npm-debug.log*", "yarn-debug.log*", "pnpm-debug.log*", ".npm/"],
  nextjs: [".next/", "out/", ".vercel", "next-env.d.ts"],
  python: ["__pycache__/", "*.py[cod]", ".venv/", "venv/", ".pytest_cache/"],
  go: ["bin/", "*.test", "*.out", "vendor/"],
  rust: ["target/", "Cargo.lock"],
  java: ["*.class", "target/", ".gradle/", "build/"],
  macos: [".DS_Store", ".AppleDouble", ".LSOverride"],
  windows: ["Thumbs.db", "Desktop.ini", "$RECYCLE.BIN/"],
  vscode: [".vscode/*", "!.vscode/settings.json", "!.vscode/extensions.json"],
  jetbrains: [".idea/", "*.iml", "*.iws"],
};

export function generateGitignore(presets: GitignorePreset[], customPatterns = ""): ProcessorResult<string> {
  if (!presets.length && !customPatterns.trim()) return { ok: false, error: "Select a preset or enter a custom pattern." };
  const unknown = presets.filter((preset) => !(preset in GITIGNORE_PRESETS));
  if (unknown.length) return { ok: false, error: `Unknown preset: ${unknown[0]}.` };
  const output: string[] = [];
  const seen = new Set<string>();
  const add = (line: string) => { if (line && !seen.has(line)) { seen.add(line); output.push(line); } };
  presets.forEach((preset) => {
    if (output.length) output.push("");
    output.push(`# ${preset}`);
    GITIGNORE_PRESETS[preset].forEach(add);
  });
  const custom = customPatterns.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (custom.length) {
    if (output.length) output.push("");
    output.push("# custom");
    custom.forEach(add);
  }
  return { ok: true, value: `${output.join("\n")}\n` };
}
