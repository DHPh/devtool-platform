// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CssClampCalculatorTab as CssClampCalculatorTool } from "@/lib/tools/web-development-studio/tabs/CssClampCalculatorTab";
import { CssUnitConverterTab as CssUnitConverterTool } from "@/lib/tools/web-development-studio/tabs/CssUnitConverterTab";
import { JavaScriptFormatterTab as JavaScriptFormatterTool } from "@/lib/tools/web-development-studio/tabs/JavaScriptFormatterTab";
import { OpenGraphGeneratorTab as OpenGraphGeneratorTool } from "@/lib/tools/web-development-studio/tabs/OpenGraphGeneratorTab";
import { SvgDataUriConverterTab as SvgDataUriConverterTool } from "@/lib/tools/web-development-studio/tabs/SvgDataUriConverterTab";
import { WebManifestGeneratorTab as WebManifestGeneratorTool } from "@/lib/tools/web-development-studio/tabs/WebManifestGeneratorTab";

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Phase 3 web-tool UX", () => {
  it("formats source and exposes its copy action", async () => {
    const user = userEvent.setup();
    render(<JavaScriptFormatterTool />);
    await user.click(screen.getByRole("button", { name: "Format source" }));
    expect(await screen.findByRole("button", { name: "Copy formatted source" })).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Formatted source" })).toHaveValue(
      'const user = { name: "Ada", active: true };\nconsole.log(user);\n',
    );
  });

  it("keeps a successful SVG result when reversing direction", async () => {
    const user = userEvent.setup();
    render(<SvgDataUriConverterTool />);
    expect(screen.getByRole("button", { name: "Copy data URI" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Reverse direction" }));
    expect(screen.getByRole("button", { name: "Copy SVG markup" })).toBeVisible();
    expect(screen.getByRole<HTMLInputElement>("textbox", { name: "SVG data URI" }).value).toContain(
      "data:image/svg+xml,",
    );
  });

  it("provides one copy action for every CSS unit result", () => {
    render(<CssUnitConverterTool />);
    for (const unit of ["px", "rem", "em", "%", "vw", "vh"]) {
      expect(screen.getByRole("button", { name: `Copy ${unit}` })).toBeVisible();
    }
  });

  it("provides independent clamp result copy actions", () => {
    render(<CssClampCalculatorTool />);
    expect(screen.getByRole("button", { name: "Copy CSS clamp" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy slope" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy intercept" })).toBeVisible();
  });

  it("copies generated social metadata", () => {
    render(<OpenGraphGeneratorTool />);
    expect(screen.getByRole("button", { name: "Copy meta tags" })).toBeVisible();
    expect(screen.getByRole<HTMLInputElement>("textbox", { name: "Meta tags" }).value).toContain(
      'property="og:title"',
    );
  });

  it("copies the generated web manifest", () => {
    render(<WebManifestGeneratorTool />);
    expect(screen.getByRole("button", { name: "Copy web manifest" })).toBeVisible();
    expect(screen.getByRole<HTMLInputElement>("textbox", { name: "manifest.webmanifest" }).value).toContain(
      '"display": "standalone"',
    );
  });
});
