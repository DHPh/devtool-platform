// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { JsonStudio } from "@/lib/tools/json-studio/JsonStudio";
import { JsonPathTab } from "@/lib/tools/json-studio/JsonPathTab";
import { JsonSchemaTab } from "@/lib/tools/json-studio/JsonSchemaTab";
import { JsonDiffTab } from "@/lib/tools/json-studio/JsonDiffTab";
import { JsonStudioFormatterView } from "@/lib/tools/json-studio/JsonStudioWrapper";

afterEach(cleanup);
beforeEach(() => window.history.replaceState({}, "", "/tools/json-studio"));

describe("JSONC studio UX", () => {
  const jsonc = '{\n  // useful note\n  "url": "https://example.com/*literal*/",\n  "count": 2\n}';

  it("keeps the shared JSON editor available on a schema deep link", async () => {
    window.history.replaceState({}, "", "/tools/json-studio?tab=schema");
    render(<JsonStudio />);

    const editor = await screen.findByRole("textbox", { name: "JSON input" });
    expect(screen.getByRole("tab", { name: /Schema/i })).toHaveAttribute(
      "data-state",
      "active",
    );
    fireEvent.change(editor, { target: { value: jsonc } });
    expect(screen.getByText("Valid JSON / JSONC")).toBeVisible();
    expect(screen.getAllByText("JSON Schema Validator").length).toBeGreaterThan(0);
  });

  it("opens the standalone JSON Formatter entry directly on its formatter with an editor", async () => {
    window.history.replaceState({}, "", "/tools/json-formatter");
    render(<JsonStudioFormatterView />);
    expect(await screen.findByRole("textbox", { name: "JSON input" })).toBeVisible();
    expect(screen.getByRole("tab", { name: /Formatter/i })).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it.each([
    ["JSONPath", JsonPathTab],
    ["JSON Schema", JsonSchemaTab],
    ["JSON Diff", JsonDiffTab],
  ] as const)("accepts JSONC in the %s tab", (name, Component) => {
    render(<Component input={jsonc} />);
    expect(screen.queryByText(/Invalid JSON/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(name === "JSONPath" ? "JSONPath Explorer" : name === "JSON Schema" ? "JSON Schema Validator" : "JSON Diff Viewer").length).toBeGreaterThan(0);
  });

  it("preserves child diff input across temporary syntax errors in the parent JSON", () => {
    const { rerender } = render(<JsonDiffTab input='{"a":1}' />);
    const compareInput = screen.getByPlaceholderText("Enter JSON data to compare with the original...");
    fireEvent.change(compareInput, { target: { value: '{"a":2}' } });
    rerender(<JsonDiffTab input='{"a":' />);
    expect(screen.getByText(/Invalid JSON in the editor above/i)).toBeVisible();
    expect(screen.getByPlaceholderText("Enter JSON data to compare with the original...")).toHaveValue('{"a":2}');
  });
});
