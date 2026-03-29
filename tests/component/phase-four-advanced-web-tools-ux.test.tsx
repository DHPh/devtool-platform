// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import {
  JavaScriptMinifierTool,
  SvgOptimizerTool,
} from "@/lib/tools/web-development-studio/WebDevelopmentTool";

afterEach(cleanup);

async function expectCompressionCopyActions(outputName: string) {
  expect(await screen.findByRole("button", { name: outputName })).toBeVisible();
  expect(screen.getByRole("button", { name: "Copy original bytes" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Copy output bytes" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Copy saved bytes" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Copy reduction" })).toBeVisible();
}

describe("Phase 4 advanced web-tool UX", () => {
  it("minifies JavaScript and exposes independent output metrics", async () => {
    const user = userEvent.setup();
    render(<JavaScriptMinifierTool />);
    await user.click(screen.getByRole("button", { name: "Minify JavaScript" }));
    await expectCompressionCopyActions("Copy minified JavaScript");
  });

  it("optimizes SVG and exposes independent output metrics", async () => {
    const user = userEvent.setup();
    render(<SvgOptimizerTool />);
    await user.click(screen.getByRole("button", { name: "Optimize SVG" }));
    await expectCompressionCopyActions("Copy optimized SVG");
  });
});
