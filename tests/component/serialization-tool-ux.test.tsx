// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  SerializationTool,
  type SerializationToolId,
} from "@/lib/tools/encoding-serialization-studio/SerializationTool";

afterEach(cleanup);

describe("serialization studio UX", () => {
  it.each<SerializationToolId>([
    "yaml-formatter",
    "yaml-validator",
    "xml-formatter",
    "xml-validator",
    "toml-formatter",
    "json-yaml-converter",
    "csv-json-converter",
  ])("%s exposes a copy action for its text result", (tool) => {
    render(<SerializationTool tool={tool} />);

    expect(screen.getByRole("button", { name: "Copy result" })).toBeVisible();
  });

  it("copies text results with visible confirmation", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText");
    render(<SerializationTool tool="yaml-formatter" />);

    const result = screen.getByRole("textbox", { name: "Result" });
    const resultText = (result as HTMLTextAreaElement).value;
    await user.click(screen.getByRole("button", { name: "Copy result" }));

    expect(writeText).toHaveBeenCalledWith(resultText);
    expect(screen.getByRole("button", { name: "Result copied" })).toBeVisible();
  });

  it("feeds successful converter output into the reverse direction", async () => {
    const user = userEvent.setup();
    render(<SerializationTool tool="json-yaml-converter" />);

    await user.selectOptions(
      screen.getByLabelText("Direction"),
      "yaml-to-json",
    );

    expect(
      (screen.getByRole("textbox", { name: "Input" }) as HTMLTextAreaElement)
        .value,
    ).toContain("name: DevTool");
    expect(
      (screen.getByRole("textbox", { name: "Result" }) as HTMLTextAreaElement)
        .value,
    ).toContain('"name": "DevTool"');
  });

  it("preserves invalid converter input when direction changes", async () => {
    const user = userEvent.setup();
    render(<SerializationTool tool="json-yaml-converter" />);

    const input = screen.getByRole("textbox", { name: "Input" });
    await user.clear(input);
    await user.type(input, "not-json");
    await user.selectOptions(
      screen.getByLabelText("Direction"),
      "yaml-to-json",
    );

    expect(input).toHaveValue("not-json");
  });

  it("restores each successful converter draft when returning to its direction", async () => {
    const user = userEvent.setup();
    render(<SerializationTool tool="json-yaml-converter" />);
    const input = screen.getByRole("textbox", { name: "Input" });
    await user.clear(input);
    fireEvent.change(input, { target: { value: '{"first":true}' } });
    await user.selectOptions(screen.getByLabelText("Direction"), "yaml-to-json");
    expect(input).toHaveValue("first: true\n");
    await user.clear(input);
    fireEvent.change(input, { target: { value: "second: true" } });
    await user.selectOptions(screen.getByLabelText("Direction"), "json-to-yaml");
    expect(input).toHaveValue('{"first":true}');
    await user.selectOptions(screen.getByLabelText("Direction"), "yaml-to-json");
    expect(input).toHaveValue("second: true");
  });

  it("round-trips negative numeric CSV values and exposes spreadsheet-safe mode", async () => {
    const user = userEvent.setup();
    render(<SerializationTool tool="csv-json-converter" />);
    const input = screen.getByRole("textbox", { name: "Input" });
    await user.clear(input);
    await user.type(input, "amount,formula\n-42.5,=1+1");
    expect(screen.getByRole("textbox", { name: "Result" })).toHaveValue(
      '[\n  {\n    "amount": -42.5,\n    "formula": "=1+1"\n  }\n]',
    );

    await user.selectOptions(screen.getByLabelText("Direction"), "json-to-csv");
    expect(screen.getByRole("textbox", { name: "Result" })).toHaveValue(
      "amount,formula\n-42.5,'=1+1",
    );
    await user.click(screen.getByLabelText("Spreadsheet-safe CSV export"));
    expect(screen.getByRole("textbox", { name: "Result" })).toHaveValue(
      "amount,formula\n-42.5,=1+1",
    );
    await user.selectOptions(screen.getByLabelText("Direction"), "csv-to-json");
    expect(screen.getByRole("textbox", { name: "Input" })).toHaveValue(
      "amount,formula\n-42.5,=1+1",
    );
    expect(screen.getByRole("textbox", { name: "Result" })).toHaveValue(
      '[\n  {\n    "amount": -42.5,\n    "formula": "=1+1"\n  }\n]',
    );
  });

  it("preserves the numeric value when the input base changes", async () => {
    const user = userEvent.setup();
    render(<SerializationTool tool="number-base-converter" />);

    await user.selectOptions(screen.getByLabelText("Input base"), "16");

    expect(screen.getByRole("textbox", { name: "Input" })).toHaveValue("FF");
    expect(screen.getByRole("textbox", { name: "Decimal" })).toHaveValue("255");
  });

  it("copies each number-base result independently", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText");
    render(<SerializationTool tool="number-base-converter" />);

    expect(screen.getByRole("button", { name: "Copy binary" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy octal" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy decimal" })).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Copy hexadecimal" }),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Copy hexadecimal" }));
    expect(writeText).toHaveBeenCalledWith("FF");
  });

  it("preserves invalid number input when the base changes", async () => {
    const user = userEvent.setup();
    render(<SerializationTool tool="number-base-converter" />);

    const input = screen.getByRole("textbox", { name: "Input" });
    await user.clear(input);
    await user.type(input, "invalid");
    await user.selectOptions(screen.getByLabelText("Input base"), "16");

    expect(input).toHaveValue("invalid");
  });

  it("provides clear and example recovery actions", async () => {
    const user = userEvent.setup();
    render(<SerializationTool tool="toml-formatter" />);

    await user.click(screen.getByRole("button", { name: "Clear input" }));
    expect(screen.getByRole("textbox", { name: "Input" })).toHaveValue("");
    expect(screen.getByRole("textbox", { name: "Error" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Load example" }));
    expect(
      (screen.getByRole("textbox", { name: "Input" }) as HTMLTextAreaElement)
        .value,
    ).toContain("[server]");
  });
});
