// @vitest-environment jsdom

import { webcrypto } from "node:crypto";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CertificateDecoderTab as CertificateDecoderTool } from "@/lib/tools/security-identity-studio/tabs/CertificateDecoderTab";
import { HashHmacGeneratorTab as HashHmacGeneratorTool } from "@/lib/tools/security-identity-studio/tabs/HashHmacGeneratorTab";
import { JwtGeneratorTab as JwtGeneratorTool } from "@/lib/tools/security-identity-studio/tabs/JwtGeneratorTab";
import { JwtSignatureVerifierTab as JwtSignatureVerifierTool } from "@/lib/tools/security-identity-studio/tabs/JwtSignatureVerifierTab";
import { KeypairSignatureTab as KeypairSignatureTool } from "@/lib/tools/security-identity-studio/tabs/KeypairSignatureTab";
import { SriGeneratorTab as SriGeneratorTool } from "@/lib/tools/security-identity-studio/tabs/SriGeneratorTab";
import { SymmetricEncryptionTab as SymmetricEncryptionTool } from "@/lib/tools/security-identity-studio/tabs/SymmetricEncryptionTab";
import { TotpTab as TotpTool } from "@/lib/tools/security-identity-studio/tabs/TotpTab";

beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("Phase 4 security-tool UX", () => {
  it("lets users reveal and hide the HMAC secret key", async () => {
    const user = userEvent.setup();
    render(<HashHmacGeneratorTool />);
    const operation = screen.getByRole("combobox", { name: "Operation" });
    fireEvent.keyDown(operation, { key: "ArrowDown" });
    fireEvent.keyDown(screen.getByRole("option", { name: "HMAC" }), { key: "Enter" });
    const secret = screen.getByLabelText("Secret key");
    expect(secret).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Show" }));
    expect(secret).toHaveAttribute("type", "text");
    await user.click(screen.getByRole("button", { name: "Hide" }));
    expect(secret).toHaveAttribute("type", "password");
  });

  it("generates and exposes a copyable signed JWT", async () => {
    const user = userEvent.setup();
    render(<JwtGeneratorTool />);
    await user.click(screen.getByRole("button", { name: "Generate signed JWT" }));
    expect(await screen.findByRole("button", { name: "Copy signed JWT" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy generator security note" })).toBeVisible();
  });

  it("adds current issue and expiry claims to a generator payload", async () => {
    const user = userEvent.setup();
    render(<JwtGeneratorTool />);
    await user.click(screen.getByRole("button", { name: "Set iat and 1-hour expiry" }));
    const payload = screen.getByRole("textbox", { name: "Payload JSON" }) as HTMLTextAreaElement;
    expect(JSON.parse(payload.value)).toMatchObject({ sub: "123", iat: expect.any(Number), exp: expect.any(Number) });
  });

  it("shows separate JWT verification outputs", async () => {
    const user = userEvent.setup();
    render(<JwtSignatureVerifierTool />);
    expect(screen.getByRole("button", { name: "Copy verifier header" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy verifier payload" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Verify signature" }));
    expect(await screen.findByRole("button", { name: "Copy signature result" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy algorithm" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy limitation" })).toBeVisible();
  });

  it("clears a stale JWT verification result when inputs change", async () => {
    const user = userEvent.setup();
    render(<JwtSignatureVerifierTool />);
    await user.click(screen.getByRole("button", { name: "Verify signature" }));
    expect(await screen.findByRole("button", { name: "Copy signature result" })).toBeVisible();
    await user.type(screen.getByRole("textbox", { name: "JWT" }), "changed");
    expect(screen.queryByRole("button", { name: "Copy signature result" })).not.toBeInTheDocument();
  });

  it("reveals optional JWT claim-validation controls", async () => {
    const user = userEvent.setup();
    render(<JwtSignatureVerifierTool />);
    await user.click(screen.getByRole("switch", { name: "Validate standard claims" }));
    expect(screen.getByRole("textbox", { name: "Expected issuer (optional)" })).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Expected audience (optional)" })).toBeVisible();
    expect(screen.getByRole("spinbutton", { name: "Clock tolerance (seconds)" })).toBeVisible();
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
