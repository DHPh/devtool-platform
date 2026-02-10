// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import TimestampConverter from "@/lib/tools/timestamp-converter";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Timestamp Converter UI", () => {
  it("uses the exact timestamp processor for conversion", () => {
    render(<TimestampConverter />);
    fireEvent.change(screen.getByLabelText("Unix timestamp"), {
      target: { value: "1704067200.123456789" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Convert" })[0]);
    expect(screen.getByDisplayValue("2024-01-01T00:00:00.123456789Z")).toBeInTheDocument();
  });

  it("reports a DST gap rather than guessing an instant", () => {
    render(<TimestampConverter />);
    fireEvent.change(screen.getByLabelText("Timezone"), {
      target: { value: "America/New_York" },
    });
    fireEvent.change(screen.getByLabelText("Date-time"), {
      target: { value: "2024-03-10 02:30:00" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Convert" })[1]);
    expect(screen.getByRole("status")).toHaveTextContent(/does not exist.*DST gap/i);
  });

  it("rejects locale-dependent date text", () => {
    render(<TimestampConverter />);
    fireEvent.change(screen.getByLabelText("Date-time"), {
      target: { value: "January 15, 2024 10:30 AM" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Convert" })[1]);
    expect(screen.getByRole("status")).toHaveTextContent(/Expected local YYYY-MM-DD/);
  });
});
