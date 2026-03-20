// @vitest-environment jsdom

import { webcrypto } from "node:crypto";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  JwtSignatureVerifierTool,
  CertificateDecoderTool,
  KeypairSignatureTool,
  SriGeneratorTool,
  SymmetricEncryptionTool,
  TotpTool,
} from "@/lib/tools/security-identity-studio/SecurityTool";

beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("Phase 4 security-tool UX", () => {
  it("shows separate JWT verification outputs", async () => {
    const user = userEvent.setup();
    render(<JwtSignatureVerifierTool />);
    await user.click(screen.getByRole("button", { name: "Verify signature" }));
    expect(await screen.findByRole("button", { name: "Copy signature result" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy algorithm" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy limitation" })).toBeVisible();
  });

  it("encrypts and copies an authenticated envelope", async () => {
    const user = userEvent.setup();
    render(<SymmetricEncryptionTool />);
    await user.click(screen.getByRole("button", { name: "Encrypt text" }));
    expect(await screen.findByRole("button", { name: "Copy encryption envelope" })).toBeVisible();
  });

  it("generates separately copyable public and private keys", async () => {
    const user = userEvent.setup();
    render(<KeypairSignatureTool />);
    await user.click(screen.getByRole("button", { name: "Generate keypair" }));
    expect(await screen.findByRole("button", { name: "Copy public JWK" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy private JWK" })).toBeVisible();
  });

  it("generates and copies an SRI attribute", async () => {
    const user = userEvent.setup();
    render(<SriGeneratorTool />);
    await user.click(screen.getByRole("button", { name: "Generate SRI" }));
    expect(await screen.findByRole("button", { name: "Copy integrity attribute" })).toBeVisible();
  });

  it("keeps TOTP secret, code, and validation independently copyable", async () => {
    const user = userEvent.setup();
    render(<TotpTool />);
    expect(screen.getByRole("button", { name: "Copy Base32 secret" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Generate current code" }));
    expect(await screen.findByRole("button", { name: "Copy current code" })).toBeVisible();
  });

  it("decodes certificate fields into independently copyable results", async () => {
    await import("reflect-metadata");
    const x509 = await import("@peculiar/x509");
    x509.cryptoProvider.set(webcrypto as unknown as Crypto);
    const algorithm = { name: "ECDSA", namedCurve: "P-256", hash: "SHA-256" };
    const keys = await webcrypto.subtle.generateKey(algorithm, true, ["sign", "verify"]);
    const certificate = await x509.X509CertificateGenerator.createSelfSigned({ serialNumber: "03", name: "CN=UX Test", notBefore: new Date("2026-01-01T00:00:00Z"), notAfter: new Date("2027-01-01T00:00:00Z"), signingAlgorithm: algorithm, keys });
    const user = userEvent.setup();
    render(<CertificateDecoderTool />);
    fireEvent.change(screen.getByRole("textbox", { name: "PEM, DER Base64, or hexadecimal certificate" }), { target: { value: certificate.toString("pem") } });
    await user.click(screen.getByRole("button", { name: "Decode certificate" }));
    expect(await screen.findByRole("button", { name: "Copy subject" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy SHA-256 fingerprint" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy trust limitation" })).toBeVisible();
  });
});
