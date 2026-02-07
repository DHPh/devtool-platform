import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ContrastChecker } from "@/lib/tools/color-studio/components/ContrastChecker";
import { ContrastSuggestions } from "@/lib/tools/color-studio/components/ContrastSuggestions";
import { ContrastCheckerTab } from "@/lib/tools/color-studio/tabs/ContrastCheckerTab";
import { AccessibilityPaletteGenerator } from "@/lib/tools/color-studio/components/AccessibilityPaletteGenerator";

describe("WCAG-facing color studio copy", () => {
  it("labels contrast thresholds as WCAG 2.2 and defines large text accurately", () => {
    const html = renderToStaticMarkup(<ContrastChecker />);

    expect(html).toContain("WCAG 2.2 AA");
    expect(html).toContain("WCAG 2.2 AAA");
    expect(html).toContain("Large text example (24px+ regular)");
    expect(html).toContain("Large bold text example (about 19px+)");
    expect(html).not.toContain("Large text example (18px+)");
  });

  it("describes the checker as a contrast-threshold check, not broad compliance", () => {
    const html = renderToStaticMarkup(<ContrastCheckerTab />);
    expect(html).toContain(
      "Check text contrast ratios against WCAG 2.2 AA and AAA thresholds"
    );
    expect(html).not.toContain("accessibility compliance");
  });

  it("labels suggestion ranges as normal-text thresholds", () => {
    const html = renderToStaticMarkup(
      <ContrastSuggestions
        baseColor="#ffffff"
        isBackground={false}
        isVisible
        onColorSelect={vi.fn()}
      />
    );

    expect(html).toContain("WCAG 2.2 normal-text contrast");
    expect(html).toContain("AAA normal text");
    expect(html).toContain("AA normal text");
    expect(html).toContain("All (≥3:1)");
  });

  it("separates the OKLab heuristic from WCAG requirements", () => {
    const html = renderToStaticMarkup(<AccessibilityPaletteGenerator />);
    expect(html).toContain("WCAG 2.2 contrast");
    expect(html).toContain("OKLab delta-E");
    expect(html).toContain("design heuristic");
    expect(html).toContain("not a WCAG success criterion");
    expect(html).not.toContain("APCA");
  });
});
