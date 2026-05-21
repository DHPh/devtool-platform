// @vitest-environment jsdom

import { webcrypto } from "node:crypto";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ColorPicker } from "@/lib/tools/color-studio/components/ColorPicker";
import DiffChecker from "@/lib/tools/diff-checker";
import LoremIpsum from "@/lib/tools/lorem-ipsum";
import NumberGenerator from "@/lib/tools/number-generator";
import { PassphraseGeneratorTab } from "@/lib/tools/password-studio/tabs/PassphraseGeneratorTab";
import { getDefaultPassphraseOptions } from "@/lib/utils/password";
import { RegexStudio } from "@/lib/tools/regex-studio/RegexStudio";
import TimestampConverter from "@/lib/tools/timestamp-converter";
import UrlEncoder from "@/lib/tools/url-encoder";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

beforeEach(() => {
  vi.stubGlobal("crypto", webcrypto);
  vi.stubGlobal(
    "ResizeObserver",
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  window.history.replaceState({}, "", "/");
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("UX completeness & workflow regressions", () => {
  it("pre-generates Lorem Ipsum and immediately applies clicked presets", async () => {
    const user = userEvent.setup();
    render(<LoremIpsum />);

    const resultBox = screen.getByPlaceholderText("Generated lorem ipsum will appear here...") as HTMLTextAreaElement;
    expect(resultBox.value.length).toBeGreaterThan(20);

    await user.click(screen.getByRole("button", { name: "50 Words" }));
    expect(screen.getByLabelText("Count (1–100)")).toHaveValue(50);
    expect(screen.getByText(/Generated: 50 words/i)).toBeVisible();
  });

  it("allows typing negative ranges and generates unique Lottery picks in NumberGenerator", async () => {
    const user = userEvent.setup();
    render(<NumberGenerator />);

    const minInput = screen.getByLabelText("Minimum");
    const maxInput = screen.getByLabelText("Maximum");
    fireEvent.change(minInput, { target: { value: "-20" } });
    fireEvent.change(maxInput, { target: { value: "-10" } });
    expect(minInput).toHaveValue(-20);
    expect(maxInput).toHaveValue(-10);

    await user.click(screen.getAllByRole("button", { name: "Generate Numbers" })[0]);
    expect(screen.getByText(/10 numbers generated/i)).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Lottery (1-49)" }));
    expect(screen.getByRole("switch", { name: "Allow Duplicates" })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText(/6 numbers generated/i)).toBeVisible();
  });

  it("provides a dedicated output and auto-converts Epoch preset in TimestampConverter", async () => {
    const user = userEvent.setup();
    render(<TimestampConverter />);

    await user.click(screen.getByRole("button", { name: "Unix Epoch" }));
    expect(screen.getByLabelText("Unix timestamp")).toHaveValue("0");
    expect(screen.getByLabelText("Converted date-time")).toHaveValue("1970-01-01T00:00:00Z");

    fireEvent.change(screen.getByLabelText("Date-time"), {
      target: { value: "2024-01-15T10:30:00Z" },
    });
    await user.click(screen.getAllByRole("button", { name: "Convert" })[1]);
    expect(screen.getByRole("button", { name: "Copy converted timestamp" })).toBeVisible();
  });

  it("prevents copying invalid decode strings and toggles + as space in UrlEncoder", async () => {
    const user = userEvent.setup();
    render(<UrlEncoder />);

    const input = screen.getByLabelText("Input");
    fireEvent.change(input, { target: { value: "hello+world%zz" } });
    expect(screen.getByRole("alert")).toHaveTextContent(/Invalid percent-encoding/i);

    fireEvent.change(input, { target: { value: "hello+world" } });
    expect(screen.getByDisplayValue("hello world")).toBeVisible();

    await user.click(screen.getByRole("switch", { name: "Treat + as space when decoding" }));
    expect(screen.getAllByDisplayValue("hello+world").length).toBeGreaterThanOrEqual(2);
  });

  it("renders inline highlights in DiffChecker By Word mode", async () => {
    const user = userEvent.setup();
    render(<DiffChecker />);

    fireEvent.change(screen.getByLabelText("Original Text"), {
      target: { value: "hello old world" },
    });
    fireEvent.change(screen.getByLabelText("Modified Text"), {
      target: { value: "hello new world" },
    });

    await user.click(screen.getByRole("button", { name: "Compare Texts" }));
    expect(await screen.findByText("+1 additions")).toBeVisible();

    fireEvent.keyDown(screen.getByRole("combobox", { name: "Comparison level" }), { key: "ArrowDown" });
    fireEvent.keyDown(screen.getByRole("option", { name: "By Word" }), { key: "Enter" });
    expect(await screen.findByTestId("inline-diff-unified")).toHaveTextContent("hello oldnew world");
  });

  it("gives each ColorPicker instance its own native color input id", () => {
    const { container } = render(
      <div>
        <ColorPicker value="#ff0000" onChange={vi.fn()} showPresets={false} />
        <ColorPicker value="#00ff00" onChange={vi.fn()} showPresets={false} />
      </div>,
    );
    const nativeInputs = container.querySelectorAll('input[type="color"]');
    expect(nativeInputs).toHaveLength(2);
    expect(nativeInputs[0].id).not.toBe(nativeInputs[1].id);
  });

  it("surfaces inline validation errors in PassphraseGeneratorTab when word pool is exhausted", async () => {
    const user = userEvent.setup();
    render(<PassphraseGeneratorTab />);

    fireEvent.change(screen.getByLabelText("Min Word Length"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("Max Word Length"), { target: { value: "10" } });
    await user.click(screen.getByRole("button", { name: /^Generate$/i }));
    expect((screen.getByLabelText("Passphrase") as HTMLInputElement).value.length).toBeGreaterThan(10);

    cleanup();
    render(
      <PassphraseGeneratorTab
        initialOptions={{
          ...getDefaultPassphraseOptions(),
          wordCount: 4,
          customWordList: ["onlyone"],
        }}
      />,
    );
    await user.click(screen.getByRole("button", { name: /^Generate$/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/Not enough words/i);
  });

  it("preserves RegexStudio pattern and test text across Tester and Replace tabs", async () => {
    const user = userEvent.setup();
    render(<RegexStudio />);

    const patternInput = await screen.findByLabelText("Pattern");
    fireEvent.change(patternInput, { target: { value: "\\d+" } });
    fireEvent.change(screen.getByLabelText("Input Text"), {
      target: { value: "Order 42 ready" },
    });

    await user.click(screen.getByRole("tab", { name: /Replace/i }));
    expect(await screen.findByLabelText("Pattern")).toHaveValue("\\d+");
    expect(screen.getByLabelText("Text")).toHaveValue("Order 42 ready");
  });
});
