// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ToolLoading } from "@/components/tool-loading";

describe("ToolLoading", () => {
  it("announces the loading state to assistive technology", () => {
    render(<ToolLoading />);

    expect(screen.getByRole("status", { name: "Loading tool" }))
      .toBeInTheDocument();
    expect(screen.getByText("Loading tool…")).toHaveClass("sr-only");
  });
});
