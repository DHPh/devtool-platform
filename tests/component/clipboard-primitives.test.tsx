// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  AsyncActionButton,
  CopyButton,
  CopyableResult,
  CopyableResultGrid,
  ToolErrorResult,
} from "@/components/layout";

beforeEach(() => {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("clipboard primitives", () => {
  it("copies the exact value and resets copied state", async () => {
    vi.useFakeTimers();
    render(
      <CopyButton
        value={"  exact\nvalue  "}
        label="Copy result"
        resetAfter={100}
      />,
    );

    await act(async () => {
      screen.getByRole("button", { name: "Copy result" }).click();
      await Promise.resolve();
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "  exact\nvalue  ",
    );
    expect(screen.getByRole("button", { name: "Copied" })).toBeVisible();

    await act(() => vi.advanceTimersByTimeAsync(100));
    expect(screen.getByRole("button", { name: "Copy result" })).toBeVisible();
  });

  it("disables empty values and reports copy failures", async () => {
    const user = userEvent.setup();
    const writeText = vi
      .fn()
      .mockRejectedValueOnce(new Error("permission denied"));
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(
      <>
        <CopyButton value="" label="Copy empty" />
        <CopyButton value="value" label="Copy failing" />
      </>,
    );

    expect(screen.getByRole("button", { name: "Copy empty" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Copy failing" }));
    expect(
      await screen.findByRole("button", { name: "Copy failing failed" }),
    ).toBeVisible();
  });

  it("handles an unavailable Clipboard API", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
    render(<CopyButton value="value" label="Copy unavailable" />);

    await user.click(screen.getByRole("button", { name: "Copy unavailable" }));
    expect(
      await screen.findByRole("button", { name: "Copy unavailable failed" }),
    ).toBeVisible();
  });

  it("cleans up reset timers when unmounted", async () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    const view = render(<CopyButton value="value" />);

    screen.getByRole("button", { name: "Copy" }).click();
    await vi.waitFor(() =>
      expect(screen.getByRole("button", { name: "Copied" })).toBeVisible(),
    );
    view.unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it("keeps multi-result copied state independent", async () => {
    const user = userEvent.setup();
    render(
      <CopyableResultGrid
        items={[
          { id: "decimal", label: "Decimal", value: "10" },
          { id: "hex", label: "Hex", value: "A" },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Copy Decimal" }));
    expect(
      screen.getByRole("button", { name: "Decimal copied" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy Hex" })).toBeVisible();
  });

  it("preserves CopyableResult props", () => {
    render(
      <CopyableResult
        value="secret"
        label="Generated secret"
        showToggleVisibility
        rows={2}
      />,
    );
    expect(screen.getByRole("textbox", { name: "Generated secret" })).toHaveValue(
      "secret",
    );
    expect(
      screen.getByRole("button", { name: "Copy" }),
    ).toBeVisible();
  });
});

describe("shared async and error presentation", () => {
  it("exposes errors as alerts", () => {
    render(<ToolErrorResult>Request failed</ToolErrorResult>);
    expect(screen.getByRole("alert")).toHaveTextContent("Request failed");
  });

  it("prevents duplicate async execution", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <AsyncActionButton pending onClick={onClick}>
        Run
      </AsyncActionButton>,
    );
    const button = screen.getByRole("button", { name: "Working…" });
    await user.click(button);
    expect(button).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });
});
