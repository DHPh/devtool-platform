// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { JsonSchemaValidator } from "@/lib/tools/json-studio/components/JsonSchemaValidator";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
afterEach(cleanup);

describe("JSON Schema Validator UI", () => {
  it("identifies the exact dialect and permits falsey JSON values", () => {
    render(<JsonSchemaValidator data={0} />);
    expect(screen.getByText("Draft 2020-12")).toBeInTheDocument();
    expect(screen.getByText(/remote schema fetching is intentionally disabled/i)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Enter your JSON Schema here..."), {
      target: { value: '{"type":"number"}' },
    });
    expect(screen.getByRole("button", { name: "Validate" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Validate" }));
    expect(screen.getByText("Valid")).toBeInTheDocument();
  });

  it("renders useful instance, keyword, and schema paths", () => {
    render(<JsonSchemaValidator data={{ count: 1.5 }} />);
    fireEvent.change(screen.getByPlaceholderText("Enter your JSON Schema here..."), {
      target: { value: '{"type":"object","properties":{"count":{"type":"integer"}}}' },
    });
    fireEvent.click(screen.getByRole("button", { name: "Validate" }));

    expect(screen.getByText("$.count")).toBeInTheDocument();
    expect(screen.getByText(/must be integer/)).toBeInTheDocument();
    expect(screen.getByText((_, element) => element?.textContent === "type · schema #/properties/count/type")).toBeInTheDocument();
  });

  it("loads a Draft 2020-12 sample schema", () => {
    render(<JsonSchemaValidator data={{ name: "Ada", email: "ada@example.com", tags: ["profile"] }} />);
    fireEvent.click(screen.getByRole("button", { name: "Sample" }));
    const schema = (screen.getByPlaceholderText("Enter your JSON Schema here...") as HTMLTextAreaElement).value;
    expect(schema).toContain('"$schema": "https://json-schema.org/draft/2020-12/schema"');
  });
});
