import { webcrypto } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import {
  decryptText,
  decodeCertificate,
  encryptText,
  generateJwt,
  generateJwtHmacSecret,
  generateJwtSigningKeyPair,
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

async function createHmacJwt(payload: Record<string, unknown>, secret: string, algorithm = "HS256"): Promise<string> {
  const header = base64Url(JSON.stringify({ alg: algorithm, typ: "JWT" }));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: `SHA-${algorithm.slice(2)}` }, false, ["sign"]);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${header}.${encodedPayload}`)));
  return `${header}.${encodedPayload}.${base64Url(signature)}`;
}

describe("Phase 4 advanced crypto processors", () => {
  it("generates an HS256 JWT that the verifier accepts", async () => {
    const secret = generateJwtHmacSecret();
    expect(secret).toMatchObject({ ok: true });
    if (!secret.ok) return;
    const generated = await generateJwt(
      JSON.stringify({ typ: "JWT", kid: "development-key" }),
      JSON.stringify({ sub: "123", role: "developer" }),
      secret.value,
      { algorithm: "HS256", keyType: "hmac" },
    );
    expect(generated).toMatchObject({
      ok: true,
      value: { algorithm: "HS256", header: { alg: "HS256", kid: "development-key" }, payload: { sub: "123" } },
    });
    if (!generated.ok) return;
    await expect(verifyJwtSignature(generated.value.token, secret.value, {
      keyType: "hmac",
      expectedAlgorithm: "HS256",
    })).resolves.toMatchObject({ ok: true, value: { verified: true } });
  });

  it("generates an ES256 JWT with a generated test keypair", async () => {
    const pair = await generateJwtSigningKeyPair("ES256");
    expect(pair).toMatchObject({ ok: true });
    if (!pair.ok) return;
    const generated = await generateJwt(
      "{}",
      JSON.stringify({ sub: "123" }),
      JSON.stringify(pair.value.privateJwk),
      { algorithm: "ES256", keyType: "jwk" },
    );
    expect(generated).toMatchObject({ ok: true, value: { algorithm: "ES256" } });
    if (!generated.ok) return;
    await expect(verifyJwtSignature(generated.value.token, JSON.stringify(pair.value.publicJwk), {
      keyType: "jwk",
      expectedAlgorithm: "ES256",
    })).resolves.toMatchObject({ ok: true, value: { verified: true } });
  });

  it("rejects incompatible JWT signing key types and malformed JSON", async () => {
    await expect(generateJwt("{}", "{}", "secret", { algorithm: "RS256", keyType: "hmac" })).resolves.toEqual({
      ok: false,
      error: "RS256 requires a private JWK or PKCS#8 PEM key.",
    });
    await expect(generateJwt("[]", "{}", "secret", { algorithm: "HS256", keyType: "hmac" })).resolves.toEqual({
      ok: false,
      error: "JWT header must be a JSON object.",
    });
  });

  it("verifies an HS256 JWT signature without claiming claim validation", async () => {
    const secret = "correct horse battery staple";
    await expect(verifyJwtSignature(await createHmacJwt({ sub: "123" }, secret), secret)).resolves.toMatchObject({ ok: true, value: { verified: true, algorithm: "HS256" } });
  });

  it("rejects algorithm and key-type confusion", async () => {
    const token = await createHmacJwt({ sub: "123" }, "public-key-shaped-secret");
    const publicPem = "-----BEGIN PUBLIC KEY-----\ncHVibGljLWtleS1zaGFwZWQtc2VjcmV0\n-----END PUBLIC KEY-----";
    await expect(verifyJwtSignature(token, publicPem)).resolves.toEqual({
      ok: false,
      error: "HS256 requires an HMAC secret or symmetric JWK, not a PEM key.",
    });
    await expect(verifyJwtSignature(token, "public-key-shaped-secret", { expectedAlgorithm: "RS256" })).resolves.toEqual({
      ok: false,
      error: "Algorithm mismatch: expected RS256, but JWT declares HS256.",
    });
  });

  it("validates configured JWT claims separately from the signature", async () => {
    const secret = "claim-test-secret";
    const token = await createHmacJwt(
      { iss: "https://issuer.example", aud: ["api", "account"], exp: 2_000, nbf: 1_000 },
      secret,
    );
    await expect(verifyJwtSignature(token, secret, {
      keyType: "hmac",
      expectedAlgorithm: "HS256",
      validateClaims: true,
      expectedIssuer: "https://issuer.example",
      expectedAudience: "api",
      now: new Date(1_500_000),
    })).resolves.toMatchObject({
      ok: true,
      value: {
        verified: true,
        claimValidation: { valid: true, checks: [{ claim: "exp", valid: true }, { claim: "nbf", valid: true }, { claim: "iss", valid: true }, { claim: "aud", valid: true }] },
      },
    });
    await expect(verifyJwtSignature(token, secret, {
      validateClaims: true,
      expectedAudience: "other-api",
      now: new Date(2_500_000),
    })).resolves.toMatchObject({
      ok: true,
      value: { verified: true, claimValidation: { valid: false } },
    });
  });

  it("selects an RSA verification key from a JWKS by kid", async () => {
    const pair = await crypto.subtle.generateKey(
      { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
      true,
      ["sign", "verify"],
    );
    const header = base64Url(JSON.stringify({ alg: "RS256", kid: "review-key" }));
    const payload = base64Url(JSON.stringify({ sub: "123" }));
    const signature = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", pair.privateKey, new TextEncoder().encode(`${header}.${payload}`)));
    const publicJwk = { ...await crypto.subtle.exportKey("jwk", pair.publicKey), kid: "review-key" };
    await expect(verifyJwtSignature(`${header}.${payload}.${base64Url(signature)}`, JSON.stringify({ keys: [publicJwk] }), {
      keyType: "jwks",
      expectedAlgorithm: "RS256",
    })).resolves.toMatchObject({
      ok: true,
      value: { verified: true, algorithm: "RS256", keyType: "jwks" },
    });
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