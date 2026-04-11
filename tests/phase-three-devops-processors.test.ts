import { describe, expect, it } from "vitest";
import {
  generateGitignore,
  lintDockerfile,
  validateDockerCompose,
  validateKubernetesManifest,
} from "@/lib/processors/devops-validation-core";

describe("Phase 3 DevOps validation processors", () => {
  it("lints Dockerfile structure and risky instructions", () => {
    expect(lintDockerfile("FROM node:22-alpine\nUSER node\nCMD [\"node\", \"app.js\"]")).toMatchObject({
      ok: true,
      value: { instructions: 3, stages: 1, issues: [] },
    });
    const result = lintDockerfile("FROM node:latest\nADD . /app");
    expect(result).toMatchObject({ ok: true });
    if (result.ok) expect(result.value.issues.map(({ severity }) => severity)).toEqual(["warning", "warning", "warning"]);
    expect(lintDockerfile("RUN echo hello")).toMatchObject({ ok: true, value: { stages: 0 } });
  });

  it("validates Compose services and common field shapes", () => {
    expect(validateDockerCompose("services:\n  web:\n    image: nginx:1.27\n    ports:\n      - '8080:80'")).toEqual({ ok: true, value: { services: ["web"], issues: [] } });
    const result = validateDockerCompose("services:\n  api:\n    ports: 3000");
    expect(result).toMatchObject({ ok: true });
    if (result.ok) expect(result.value.issues).toHaveLength(2);
    expect(validateDockerCompose("version: '3.9'").ok).toBe(false);
  });

  it("validates multi-document Kubernetes manifests", () => {
    const input = "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: api\nspec:\n  replicas: 2\n---\napiVersion: v1\nkind: Service\nmetadata:\n  name: api\nspec:\n  selector:\n    app: api";
    expect(validateKubernetesManifest(input)).toMatchObject({ ok: true, value: { resources: [{ kind: "Deployment", name: "api" }, { kind: "Service", name: "api" }], issues: [] } });
    const invalid = validateKubernetesManifest("kind: Deployment\nmetadata: {}\nspec: {}");
    expect(invalid).toMatchObject({ ok: true });
    if (invalid.ok) expect(invalid.value.issues).toHaveLength(2);
  });

  it("generates deterministic de-duplicated gitignore output", () => {
    const result = generateGitignore(["node", "nextjs"], ".env\nnode_modules/");
    expect(result).toMatchObject({ ok: true });
    if (result.ok) {
      expect(result.value).toContain("# nextjs\n.next/");
      expect(result.value.match(/node_modules\//g)).toHaveLength(1);
      expect(result.value).toContain("# custom\n.env");
    }
    expect(generateGitignore([]).ok).toBe(false);
  });
});
