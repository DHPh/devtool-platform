// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { DataTable } from "@/components/layout/data-table";

afterEach(cleanup);

const SAMPLE_ROWS = [
  { name: "Charlie", count: 30, active: false, notes: null },
  { name: "Alice", count: 1000, active: true, notes: "2026-04-12" },
  { name: "Bob", count: 5, active: true, notes: '{"role":"admin"}' },
];

describe("shared DataTable", () => {
  it("formats null, booleans, numbers, dates, and JSON values cleanly", () => {
    render(<DataTable data={SAMPLE_ROWS} />);

    expect(screen.getByText("null")).toBeVisible();
    expect(screen.getByText("1,000")).toBeVisible();
    expect(screen.getAllByText("true")).toHaveLength(2);
    expect(screen.getByText("2026-04-12")).toBeVisible();
    expect(screen.getByText('{"role":"admin"}')).toBeVisible();
  });

  it("filters rows via global search and supports accessible column sorting", async () => {
    const user = userEvent.setup();
    render(<DataTable data={SAMPLE_ROWS} />);

    const searchInput = screen.getByRole("searchbox", {
      name: "Search table rows",
    });
    await user.type(searchInput, "Alice");

    expect(screen.getByText("Showing 1 to 1 of 1 entries")).toBeVisible();
    expect(screen.queryByText("Charlie")).not.toBeInTheDocument();

    await user.clear(searchInput);
    expect(screen.getByText("Showing 1 to 3 of 3 entries")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "name" }));
    const firstBodyRow = screen.getAllByRole("row")[1];
    expect(firstBodyRow).toHaveTextContent("Alice");
  });

  it("paginates datasets larger than the configured page size", async () => {
    const user = userEvent.setup();
    const rows = Array.from({ length: 12 }, (_, index) => ({
      id: index + 1,
      label: `Row ${index + 1}`,
    }));

    render(<DataTable data={rows} defaultPageSize={10} />);

    expect(screen.getByText("Showing 1 to 10 of 12 entries")).toBeVisible();
    expect(screen.getByText("Page 1 of 2")).toBeVisible();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText("Showing 11 to 12 of 12 entries")).toBeVisible();
    expect(screen.getByText("Page 2 of 2")).toBeVisible();
  });
});
