// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { TermHelp, ToolGlossary } from "@/components/tool-glossary";
import { Badge } from "@/components/ui/badge";

afterEach(cleanup);

describe("tool vocabulary help", () => {
  it("shows curated definitions at the bottom of specialist tools", () => {
    render(<ToolGlossary toolId="color-studio" />);

    expect(
      screen.getByRole("heading", { name: "Terms explained" }),
    ).toBeVisible();
    expect(screen.getByText("sRGB")).toBeVisible();
    expect(screen.getByText("Display-P3 / P3")).toBeVisible();
    expect(screen.getByText("Clipped preview")).toBeVisible();
    expect(
      screen.getByText(/out-of-range channel was limited/i),
    ).toBeVisible();
  });

  it("does not add an empty help section to self-explanatory tools", () => {
    const { container } = render(<ToolGlossary toolId="case-converter" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("makes inline definitions available by keyboard focus", async () => {
    const user = userEvent.setup();
    render(
      <TermHelp definition="The range of colors a display can represent.">
        Gamut
      </TermHelp>,
    );

    await user.tab();
    expect(screen.getByRole("button", { name: "Explain this term" })).toHaveFocus();
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "The range of colors a display can represent.",
    );
  });

  it("keeps the help icon visible and large enough on destructive badges", () => {
    render(
      <Badge variant="destructive">
        <TermHelp term="sRGB gamut status" definition="Preview explanation">
          sRGB clipped
        </TermHelp>
      </Badge>,
    );

    const trigger = screen.getByRole("button", {
      name: "Explain sRGB gamut status",
    });
    expect(trigger).toHaveClass("text-current", "h-6", "w-6");
    expect(trigger).not.toHaveClass("text-muted-foreground");
  });
});
