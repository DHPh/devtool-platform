import { webcrypto } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import {
  decryptText,
  decodeCertificate,
  encryptText,
  generateSigningKeyPair,
  generateSri,
  generateTotp,
  signText,
  validateTotp,
  verifyJwtSignature,
  verifyTextSignature,
} from "@/lib/processors";

beforeAll(() => { if (!globalThis.crypto) Object.defineProperty(globalThis, "crypto", { value: webcrypto }); });

function base64Url(value: string | Uint8Array): string {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  return Buffer.from(bytes).toString("base64url");
}

describe("Phase 4 advanced crypto processors", () => {
  it("verifies an HS256 JWT signature without claiming claim validation", async () => {
    const secret = "correct horse battery staple";
    const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = base64Url(JSON.stringify({ sub: "123" }));
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${header}.${payload}`)));
    await expect(verifyJwtSignature(`${header}.${payload}.${base64Url(signature)}`, secret)).resolves.toMatchObject({ ok: true, value: { verified: true, algorithm: "HS256" } });
  });

  it("round-trips authenticated AES-GCM text and rejects a wrong password", async () => {
    const encrypted = await encryptText("strong password", "private message", 100_000);
    expect(encrypted).toMatchObject({ ok: true });
    if (!encrypted.ok) return;
    await expect(decryptText("strong password", encrypted.value)).resolves.toEqual({ ok: true, value: "private message" });
    await expect(decryptText("wrong password", encrypted.value)).resolves.toMatchObject({ ok: false });
  });

  it("generates ECDSA keys and signs and verifies text", async () => {
    const pair = await generateSigningKeyPair();
    expect(pair).toMatchObject({ ok: true });
    if (!pair.ok) return;
    const signature = await signText(JSON.stringify(pair.value.privateJwk), "signed message");
    expect(signature).toMatchObject({ ok: true });
    if (!signature.ok) return;
    await expect(verifyTextSignature(JSON.stringify(pair.value.publicJwk), "signed message", signature.value)).resolves.toEqual({ ok: true, value: true });
    await expect(verifyTextSignature(JSON.stringify(pair.value.publicJwk), "changed", signature.value)).resolves.toEqual({ ok: true, value: false });
  });

  it("generates a standards-shaped SRI value", async () => {
    await expect(generateSri("hello", "SHA-384")).resolves.toEqual({ ok: true, value: "sha-384-WeF0h3dEjGnea4ANejO7+5/xtGPkQ1TDVTvNucZm+pASWjx5+QOXvfX2oT3oKGhP" });
  });

  it("matches the RFC 6238 SHA-1 test vector", async () => {
    const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
    await expect(generateTotp(secret, 59_000, 8)).resolves.toEqual({ ok: true, value: "94287082" });
    await expect(validateTotp(secret, "94287082", 59_000)).resolves.toEqual({ ok: true, value: true });
  });

  it("decodes certificate fields without claiming chain trust", async () => {
    await import("reflect-metadata");
    const x509 = await import("@peculiar/x509");
    x509.cryptoProvider.set(crypto);
    const algorithm = { name: "ECDSA", namedCurve: "P-256", hash: "SHA-256" };
    const keys = await crypto.subtle.generateKey(algorithm, true, ["sign", "verify"]);
    const certificate = await x509.X509CertificateGenerator.createSelfSigned({ serialNumber: "01", name: "CN=Processor Test", notBefore: new Date("2026-01-01T00:00:00Z"), notAfter: new Date("2027-01-01T00:00:00Z"), signingAlgorithm: algorithm, keys });
    const result = await decodeCertificate(certificate.toString("pem"), new Date("2026-02-19T00:00:00Z"));
    expect(result).toMatchObject({ ok: true, value: { subject: "CN=Processor Test", issuer: "CN=Processor Test", serialNumber: "01", status: "valid", selfSigned: true } });
    await expect(decodeCertificate("not a certificate")).resolves.toMatchObject({ ok: false });
  });
});