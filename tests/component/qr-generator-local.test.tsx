// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import QrGenerator from "@/lib/tools/qr-generator";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("local QR Generator UI", () => {
  it("previews a local data artifact without network requests", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<QrGenerator />);
    const preview = screen.getByTestId("local-qr-preview");
    expect(preview.getAttribute("src")).toMatch(/^data:image\/svg\+xml/);
    expect(preview.getAttribute("src")).not.toMatch(/^https?:/);
    expect(screen.getByText(/No QR content is transmitted/)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("downloads SVG through a temporary object URL and revokes it", () => {
    vi.useFakeTimers();
    const createUrl = vi.fn(() => "blob:local-qr");
    const revokeUrl = vi.fn();
    vi.stubGlobal("URL", { ...URL, createObjectURL: createUrl, revokeObjectURL: revokeUrl });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<QrGenerator />);

    fireEvent.click(screen.getByRole("button", { name: "SVG" }));
    expect(createUrl).toHaveBeenCalledWith(expect.objectContaining({ type: "image/svg+xml;charset=utf-8" }));
    vi.runAllTimers();
    expect(revokeUrl).toHaveBeenCalledWith("blob:local-qr");
  });

  it("shows encoder capacity errors and disables downloads", () => {
    render(<QrGenerator />);
    fireEvent.change(screen.getByLabelText("Text or URL"), { target: { value: "🙂".repeat(4_000) } });
    expect(screen.getByRole("alert")).toHaveTextContent(/does not fit a QR Code/i);
    expect(screen.getByRole("button", { name: "SVG" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "PNG" })).toBeDisabled();
  });
});
