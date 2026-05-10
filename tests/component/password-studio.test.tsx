// @vitest-environment jsdom

import { createHash, webcrypto } from "node:crypto";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PasswordStudio } from "@/lib/tools/password-studio/PasswordStudio";

describe("PasswordStudio component workflows", () => {
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
    window.history.replaceState({}, "", "/tools/password-studio");
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("shows a validation alert when all character sets are unchecked", async () => {
    const user = userEvent.setup();
    render(<PasswordStudio />);

    await user.click(await screen.findByLabelText("Uppercase (A-Z)"));
    await user.click(screen.getByLabelText("Lowercase (a-z)"));
    await user.click(screen.getByLabelText("Numbers (0-9)"));
    await user.click(screen.getByLabelText("Symbols (!@#$...)"));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /select at least one character type/i,
    );
  });

  it("switches to Passphrase tab and generates a passphrase", async () => {
    const user = userEvent.setup();
    render(<PasswordStudio />);

    await user.click(screen.getByRole("tab", { name: /Passphrase/i }));
    await screen.findByText("Passphrase Settings");

    const generateButtons = screen.getAllByRole("button", { name: /^Generate$/i });
    await user.click(generateButtons[0]);

    const passphraseInput = screen.getByLabelText("Passphrase") as HTMLInputElement;
    expect(passphraseInput.value.length).toBeGreaterThan(5);
  });

  it("shows an unknown status when the breach service is unavailable", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Offline")));
    render(<PasswordStudio initialTab="analysis" />);
    await user.type(await screen.findByLabelText("Password to Analyze"), "hunter2");
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(await screen.findByText("Breach Status Unknown")).toBeVisible();
    expect(screen.getByText("Unknown")).toBeVisible();
    expect(screen.queryByText("Password Not Found in Breaches")).toBeNull();
  });

  it("switches to Analysis tab and checks password breach via HIBP k-anonymity", async () => {
    const user = userEvent.setup();
    const sha1Hex = createHash("sha1")
      .update("hunter2")
      .digest("hex")
      .toUpperCase();
    const suffix = sha1Hex.slice(5);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(`${suffix}:21045\n`, { status: 200 })),
    );

    render(<PasswordStudio initialTab="analysis" />);

    const passwordInput = await screen.findByLabelText("Password to Analyze");
    await user.type(passwordInput, "hunter2");
    await user.click(screen.getByRole("button", { name: /^Check$/i }));

    expect(
      await screen.findByText(/Password Found in Breaches/i),
    ).toBeVisible();
  });
});
