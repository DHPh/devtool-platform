// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ResultCard } from "@/components/layout";
import { Button } from "@/components/ui/button";
import EmailValidator from "@/lib/tools/email-validator";
import NumberGenerator from "@/lib/tools/number-generator";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("shared result actions", () => {
  it("shows configured actions without a duplicate result prop", async () => {
    const user = userEvent.setup();
    const onCopy = vi.fn();
    const onDownload = vi.fn();

    render(
      <ResultCard
        title="Output"
        onCopy={onCopy}
        onDownload={onDownload}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Copy" }));
    await user.click(screen.getByRole("button", { name: "Download" }));

    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it("defaults shared buttons to non-submitting behavior", () => {
    render(
      <form>
        <Button>Action</Button>
      </form>,
    );

    expect(screen.getByRole("button", { name: "Action" })).toHaveAttribute(
      "type",
      "button",
    );
  });
});

describe("multi-result copy actions", () => {
  it("copies an individual generated number", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const writeText = vi.spyOn(navigator.clipboard, "writeText");
    const user = userEvent.setup();
    render(<NumberGenerator />);

    await user.click(
      screen.getAllByRole("button", { name: "Generate Numbers" })[0],
    );
    await user.click(
      (await screen.findAllByRole("button", { name: "Copy 51" }))[0],
    );

    expect(writeText).toHaveBeenCalledWith("51");
  });

  it("provides a copy action for each bulk email result", async () => {
    const writeText = vi.spyOn(navigator.clipboard, "writeText");
    const user = userEvent.setup();
    render(<EmailValidator />);

    await user.type(
      screen.getByRole("textbox", { name: "Email addresses" }),
      "valid@example.com\ninvalid",
    );
    await user.click(screen.getAllByRole("button", { name: "Validate" })[1]);
    await user.click(
      screen.getByRole("button", { name: "Copy valid@example.com" }),
    );

    expect(
      screen.getByRole("button", { name: "Copy invalid" }),
    ).toBeVisible();
    expect(writeText).toHaveBeenCalledWith("valid@example.com");
  });
});
