// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { JsonDiffViewer } from "@/lib/tools/json-studio/components/JsonDiffViewer";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
afterEach(cleanup);

describe("JSON Diff Viewer RFC 6902 integration", () => {
  it("accepts falsey JSON roots and verifies a root replacement patch", () => {
    render(<JsonDiffViewer data={0} />);
    fireEvent.change(screen.getByPlaceholderText("Enter JSON data to compare with the original..."), { target: { value: "false" } });
    expect(screen.getByRole("button", { name: "Compare" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Compare" }));

    expect(screen.getByText("Applicable patch verified")).toBeInTheDocument();
    expect(screen.getByTestId("json-patch-output")).toHaveTextContent('"op": "replace"');
    expect(screen.getByTestId("json-patch-output")).toHaveTextContent('"path": ""');
  });

  it("shows escaped RFC 6901 pointers in generated patch output", () => {
    render(<JsonDiffViewer data={{ "a/b": { "m~n": 1 } }} />);
    fireEvent.change(screen.getByPlaceholderText("Enter JSON data to compare with the original..."), {
      target: { value: '{"a/b":{"m~n":2}}' },
    });
    fireEvent.click(screen.getByRole("button", { name: "Compare" }));

    expect(screen.getByTestId("json-patch-output")).toHaveTextContent("/a~1b/m~0n");
    expect(screen.getByText("Applicable patch verified")).toBeInTheDocument();
  });
});
