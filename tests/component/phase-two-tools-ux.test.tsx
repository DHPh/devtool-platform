// @vitest-environment jsdom

import { webcrypto } from "node:crypto";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ChmodCalculator,
  CronExpressionBuilder,
  EnvFileManager,
  SemverComparator,
} from "@/lib/tools/devops-configuration-studio/DevOpsTool";
import {
  JsonFlattenTool,
  JsonToTypeScriptTool,
} from "@/lib/tools/data-api-studio/DataTool";
import {
  HashHmacGeneratorTool,
  JwtInspectorTool,
} from "@/lib/tools/security-identity-studio/SecurityTool";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Phase 2 quick-tool UX", () => {
  it("provides independent cron outputs", () => {
    render(<CronExpressionBuilder />);
    expect(screen.getByRole("button", { name: "Copy expression" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy explanation" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy run 1" })).toBeVisible();
  });

  it("provides independent chmod outputs", () => {
    render(<ChmodCalculator />);
    expect(screen.getByRole("button", { name: "Copy octal" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy symbolic" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy command" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy breakdown" })).toBeVisible();
  });

  it("provides redacted and comparison env outputs", () => {
    render(<EnvFileManager />);
    expect(screen.getByRole("button", { name: "Copy redacted file" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy changed" })).toBeVisible();
  });

  it("provides separate semver comparison and range outputs", () => {
    render(<SemverComparator />);
    expect(screen.getByRole("button", { name: "Copy comparison" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy range result" })).toBeVisible();
  });

  it("copies generated TypeScript", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText");
    render(<JsonToTypeScriptTool />);
    const output = screen.getByRole("textbox", { name: "Result" });
    await user.click(screen.getByRole("button", { name: "Copy result" }));
    expect(writeText).toHaveBeenCalledWith((output as HTMLTextAreaElement).value);
  });

  it("reverses a successful flatten operation without losing data", async () => {
    const user = userEvent.setup();
    render(<JsonFlattenTool />);
    await user.click(screen.getByRole("button", { name: "Reverse direction" }));
    expect((screen.getByRole("textbox", { name: "Input" }) as HTMLTextAreaElement).value).toContain("user.display-name");
    expect((screen.getByRole("textbox", { name: "Result" }) as HTMLTextAreaElement).value).toContain('"display-name": "Ada"');
  });

  it("provides a copy action for each JWT output", () => {
    render(<JwtInspectorTool />);
    expect(screen.getByRole("button", { name: "Copy header" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy payload" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy signature" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy claim summary" })).toBeVisible();
  });

  it("generates and copies a Web Crypto hash", async () => {
    vi.stubGlobal("crypto", webcrypto);
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText");
    render(<HashHmacGeneratorTool />);
    await user.click(screen.getByRole("button", { name: "Generate hash" }));
    const copy = await screen.findByRole("button", { name: "Copy hash" });
    await user.click(copy);
    expect(writeText).toHaveBeenCalledWith("315f5bdb76d078c43b8ac0064e4a0164612b1fce77c869345bfc94c75894edd3");
  });
});
