// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { DockerComposeValidatorTab as DockerComposeValidator } from "@/lib/tools/devops-configuration-studio/tabs/DockerComposeValidatorTab";
import { DockerfileLinterTab as DockerfileLinter } from "@/lib/tools/devops-configuration-studio/tabs/DockerfileLinterTab";
import { GitignoreGeneratorTab as GitignoreGenerator } from "@/lib/tools/devops-configuration-studio/tabs/GitignoreGeneratorTab";
import { KubernetesManifestValidatorTab as KubernetesManifestValidator } from "@/lib/tools/devops-configuration-studio/tabs/KubernetesManifestValidatorTab";

afterEach(cleanup);

describe("Phase 3 DevOps-tool UX", () => {
  it("provides independent copy actions for every Dockerfile issue", async () => {
    const user = userEvent.setup();
    render(<DockerfileLinter />);
    await user.clear(screen.getByRole("textbox", { name: "Dockerfile" }));
    await user.type(screen.getByRole("textbox", { name: "Dockerfile" }), "FROM node:latest\nADD . /app");
    expect(screen.getByRole("button", { name: "Copy summary" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy issue 1" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy issue 2" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy issue 3" })).toBeVisible();
  });

  it("shows copyable Compose services and validation result", () => {
    render(<DockerComposeValidator />);
    expect(screen.getByRole("button", { name: "Copy services" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy validation result" })).toBeVisible();
  });

  it("provides one copy action for each Kubernetes resource", async () => {
    const user = userEvent.setup();
    render(<KubernetesManifestValidator />);
    const input = screen.getByRole("textbox", { name: "Kubernetes YAML" });
    await user.clear(input);
    await user.type(input, "apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: one\n---\napiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: two");
    expect(screen.getByRole("button", { name: "Copy resource 1" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy resource 2" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy validation result" })).toBeVisible();
  });

  it("updates and copies generated gitignore output", async () => {
    const user = userEvent.setup();
    render(<GitignoreGenerator />);
    expect(screen.getByRole("button", { name: "Copy .gitignore" })).toBeVisible();
    await user.click(screen.getByRole("checkbox", { name: "Python" }));
    expect(screen.getByRole<HTMLInputElement>("textbox", { name: ".gitignore" }).value).toContain("__pycache__/");
  });
});
