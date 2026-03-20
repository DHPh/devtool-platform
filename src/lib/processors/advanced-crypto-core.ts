import type { DigestAlgorithm } from "./crypto-core";
import type { ProcessorResult } from "./devops-config-core";

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function base64UrlToBytes(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]*$/.test(value)) throw new Error("Invalid Base64url value.");
  return base64ToBytes(value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4));
}

function asArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return new Uint8Array(bytes).buffer;
}

function pemToBytes(pem: string): Uint8Array {
  const body = pem.replace(/-----BEGIN [^-]+-----|-----END [^-]+-----|\s+/g, "");
  if (!body) throw new Error("PEM key does not contain encoded data.");
  return base64ToBytes(body);
}

function parseJwk(input: string): JsonWebKey | null {
  if (!input.trimStart().startsWith("{")) return null;
  const value = JSON.parse(input) as unknown;
  if (!value || Array.isArray(value) || typeof value !== "object") throw new Error("JWK must be a JSON object.");
  return value as JsonWebKey;
}

export interface JwtVerificationResult {
  verified: boolean;
  algorithm: string;
  warning: string;
}

export async function verifyJwtSignature(token: string, keyInput: string): Promise<ProcessorResult<JwtVerificationResult>> {
  const segments = token.trim().split(".");
  if (segments.length !== 3 || segments.some((segment) => !segment)) return { ok: false, error: "A signed JWT must contain three non-empty segments." };
  if (!keyInput.trim()) return { ok: false, error: "Enter a verification key or HMAC secret." };
  try {
    const header = JSON.parse(new TextDecoder().decode(base64UrlToBytes(segments[0]))) as Record<string, unknown>;
    const algorithm = typeof header.alg === "string" ? header.alg : "";
    if (!algorithm || algorithm === "none") return { ok: false, error: "JWT must declare a supported signing algorithm." };
    const data = new TextEncoder().encode(`${segments[0]}.${segments[1]}`);
    const signature = base64UrlToBytes(segments[2]);
    let key: CryptoKey;
    let verifyAlgorithm: AlgorithmIdentifier | RsaPssParams | EcdsaParams;
    const jwk = parseJwk(keyInput);
    if (/^HS(?:256|384|512)$/.test(algorithm)) {
      const hash = `SHA-${algorithm.slice(2)}`;
      key = await crypto.subtle.importKey("raw", new TextEncoder().encode(keyInput), { name: "HMAC", hash }, false, ["verify"]);
      verifyAlgorithm = "HMAC";
    } else if (/^RS(?:256|384|512)$/.test(algorithm)) {
      const importAlgorithm = { name: "RSASSA-PKCS1-v1_5", hash: `SHA-${algorithm.slice(2)}` };
      key = jwk
        ? await crypto.subtle.importKey("jwk", jwk, importAlgorithm, false, ["verify"])
        : await crypto.subtle.importKey("spki", asArrayBuffer(pemToBytes(keyInput)), importAlgorithm, false, ["verify"]);
      verifyAlgorithm = "RSASSA-PKCS1-v1_5";
    } else if (/^ES(?:256|384)$/.test(algorithm)) {
      const namedCurve = algorithm === "ES256" ? "P-256" : "P-384";
      key = jwk
        ? await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve }, false, ["verify"])
        : await crypto.subtle.importKey("spki", asArrayBuffer(pemToBytes(keyInput)), { name: "ECDSA", namedCurve }, false, ["verify"]);
      verifyAlgorithm = { name: "ECDSA", hash: algorithm === "ES256" ? "SHA-256" : "SHA-384" };
    } else return { ok: false, error: `Unsupported JWT algorithm: ${algorithm}.` };
    const verified = await crypto.subtle.verify(verifyAlgorithm, key, asArrayBuffer(signature), data);
    return { ok: true, value: { verified, algorithm, warning: "Signature only. Issuer, audience, expiry, and other claims were not validated." } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "JWT signature could not be verified." };
  }
}

interface EncryptionEnvelope {
  version: 1;
  algorithm: "AES-GCM";
  kdf: "PBKDF2-SHA-256";
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
}

async function deriveAesKey(password: string, salt: Uint8Array, iterations: number, usage: KeyUsage[]): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", salt: asArrayBuffer(salt), iterations }, material, { name: "AES-GCM", length: 256 }, false, usage);
}

export async function encryptText(password: string, plaintext: string, iterations = 210_000): Promise<ProcessorResult<string>> {
  if (!password) return { ok: false, error: "Enter an encryption password." };
  if (!plaintext) return { ok: false, error: "Enter text to encrypt." };
  if (!Number.isInteger(iterations) || iterations < 100_000 || iterations > 2_000_000) return { ok: false, error: "PBKDF2 iterations must be from 100000 to 2000000." };
  try {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveAesKey(password, salt, iterations, ["encrypt"]);
    const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plaintext)));
    const envelope: EncryptionEnvelope = { version: 1, algorithm: "AES-GCM", kdf: "PBKDF2-SHA-256", iterations, salt: bytesToBase64(salt), iv: bytesToBase64(iv), ciphertext: bytesToBase64(ciphertext) };
    return { ok: true, value: JSON.stringify(envelope, null, 2) };
  } catch { return { ok: false, error: "Text could not be encrypted in this environment." }; }
}

export async function decryptText(password: string, envelopeInput: string): Promise<ProcessorResult<string>> {
  if (!password) return { ok: false, error: "Enter the decryption password." };
  try {
    const envelope = JSON.parse(envelopeInput) as Partial<EncryptionEnvelope>;
    if (envelope.version !== 1 || envelope.algorithm !== "AES-GCM" || envelope.kdf !== "PBKDF2-SHA-256" || !envelope.salt || !envelope.iv || !envelope.ciphertext || !envelope.iterations) throw new Error("Unsupported or incomplete encryption envelope.");
    const salt = base64ToBytes(envelope.salt);
    const iv = base64ToBytes(envelope.iv);
    if (salt.length !== 16 || iv.length !== 12) throw new Error("Encryption envelope has invalid salt or IV length.");
    const key = await deriveAesKey(password, salt, envelope.iterations, ["decrypt"]);
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: asArrayBuffer(iv) }, key, asArrayBuffer(base64ToBytes(envelope.ciphertext)));
    return { ok: true, value: new TextDecoder("utf-8", { fatal: true }).decode(plaintext) };
  } catch (error) {
    return { ok: false, error: error instanceof Error && error.message.startsWith("Unsupported") ? error.message : "Decryption failed. Check the password and envelope." };
  }
}

export interface GeneratedKeyPair { publicJwk: JsonWebKey; privateJwk: JsonWebKey; warning: string }

export async function generateSigningKeyPair(): Promise<ProcessorResult<GeneratedKeyPair>> {
  try {
    const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
    return { ok: true, value: { publicJwk: await crypto.subtle.exportKey("jwk", pair.publicKey), privateJwk: await crypto.subtle.exportKey("jwk", pair.privateKey), warning: "Private key material is shown only for local use. Do not share or persist production keys here." } };
  } catch { return { ok: false, error: "ECDSA P-256 is not available in this environment." }; }
}

export async function signText(privateJwkInput: string, text: string): Promise<ProcessorResult<string>> {
  if (!text) return { ok: false, error: "Enter text to sign." };
  try {
    const jwk = parseJwk(privateJwkInput);
    if (!jwk) throw new Error("Enter a private JWK object.");
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
    const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(text));
    return { ok: true, value: bytesToBase64(new Uint8Array(signature)) };
  } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Text could not be signed." }; }
}

export async function verifyTextSignature(publicJwkInput: string, text: string, signatureInput: string): Promise<ProcessorResult<boolean>> {
  try {
    const jwk = parseJwk(publicJwkInput);
    if (!jwk) throw new Error("Enter a public JWK object.");
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
    return { ok: true, value: await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, asArrayBuffer(base64ToBytes(signatureInput)), new TextEncoder().encode(text)) };
  } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Signature could not be verified." }; }
}

export async function generateSri(input: string, algorithm: DigestAlgorithm = "SHA-384"): Promise<ProcessorResult<string>> {
  if (!input) return { ok: false, error: "Enter resource content." };
  try {
    const digest = await crypto.subtle.digest(algorithm, new TextEncoder().encode(input));
    return { ok: true, value: `${algorithm.toLowerCase().replace("-", "-")}-${bytesToBase64(new Uint8Array(digest))}` };
  } catch { return { ok: false, error: `${algorithm} is not available in this environment.` }; }
}

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generateTotpSecret(byteCount = 20): ProcessorResult<string> {
  if (!Number.isInteger(byteCount) || byteCount < 10 || byteCount > 64) return { ok: false, error: "Secret size must be from 10 to 64 bytes." };
  const bytes = crypto.getRandomValues(new Uint8Array(byteCount));
  let bits = "";
  bytes.forEach((byte) => { bits += byte.toString(2).padStart(8, "0"); });
  let output = "";
  for (let index = 0; index < bits.length; index += 5) output += BASE32_ALPHABET[parseInt(bits.slice(index, index + 5).padEnd(5, "0"), 2)];
  return { ok: true, value: output };
}

function decodeBase32(input: string): Uint8Array {
  const normalized = input.toUpperCase().replace(/[\s=-]/g, "");
  if (!normalized || [...normalized].some((character) => !BASE32_ALPHABET.includes(character))) throw new Error("Secret must use Base32 characters A-Z and 2-7.");
  let bits = "";
  for (const character of normalized) bits += BASE32_ALPHABET.indexOf(character).toString(2).padStart(5, "0");
  const output: number[] = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) output.push(parseInt(bits.slice(index, index + 8), 2));
  return new Uint8Array(output);
}

export async function generateTotp(secret: string, timeMs = Date.now(), digits = 6, period = 30): Promise<ProcessorResult<string>> {
  if (![6, 8].includes(digits)) return { ok: false, error: "TOTP digits must be 6 or 8." };
  if (!Number.isInteger(period) || period < 15 || period > 120) return { ok: false, error: "TOTP period must be from 15 to 120 seconds." };
  try {
    const counter = BigInt(Math.floor(timeMs / 1000 / period));
    const counterBytes = new Uint8Array(8);
    new DataView(counterBytes.buffer).setBigUint64(0, counter);
    const key = await crypto.subtle.importKey("raw", asArrayBuffer(decodeBase32(secret)), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
    const hmac = new Uint8Array(await crypto.subtle.sign("HMAC", key, counterBytes));
    const offset = hmac[hmac.length - 1] & 0x0f;
    const value = ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3];
    return { ok: true, value: String(value % 10 ** digits).padStart(digits, "0") };
  } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "TOTP could not be generated." }; }
}

export async function validateTotp(secret: string, code: string, timeMs = Date.now(), window = 1): Promise<ProcessorResult<boolean>> {
  if (!/^\d{6}$|^\d{8}$/.test(code)) return { ok: false, error: "Enter a 6- or 8-digit TOTP code." };
  for (let offset = -window; offset <= window; offset += 1) {
    const result = await generateTotp(secret, timeMs + offset * 30_000, code.length);
    if (!result.ok) return result;
    if (result.value === code) return { ok: true, value: true };
  }
  return { ok: true, value: false };
}

export interface CertificateDetails {
  subject: string;
  issuer: string;
  serialNumber: string;
  notBefore: string;
  notAfter: string;
  status: "valid" | "expired" | "not-yet-valid";
  signatureAlgorithm: string;
  publicKeyAlgorithm: string;
  sha256Fingerprint: string;
  selfSigned: boolean;
  extensions: Array<{ oid: string; critical: boolean }>;
  warning: string;
}

function bytesToHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join(":").toUpperCase();
}

function algorithmLabel(algorithm: Algorithm): string {
  const hash = "hash" in algorithm && algorithm.hash && typeof algorithm.hash === "object" && "name" in algorithm.hash
    ? ` / ${String(algorithm.hash.name)}`
    : "";
  return `${algorithm.name}${hash}`;
}

export async function decodeCertificate(input: string, now = new Date()): Promise<ProcessorResult<CertificateDetails>> {
  if (!input.trim()) return { ok: false, error: "Enter a PEM, DER Base64, or hexadecimal X.509 certificate." };
  if (input.length > 1_000_000) return { ok: false, error: "Certificate input exceeds the 1 MB browser limit." };
  try {
    await import("reflect-metadata");
    const { X509Certificate, cryptoProvider } = await import("@peculiar/x509");
    cryptoProvider.set(crypto);
    const certificate = new X509Certificate(input.trim());
    const status = now < certificate.notBefore ? "not-yet-valid" : now > certificate.notAfter ? "expired" : "valid";
    return {
      ok: true,
      value: {
        subject: certificate.subject,
        issuer: certificate.issuer,
        serialNumber: certificate.serialNumber,
        notBefore: certificate.notBefore.toISOString(),
        notAfter: certificate.notAfter.toISOString(),
        status,
        signatureAlgorithm: algorithmLabel(certificate.signatureAlgorithm),
        publicKeyAlgorithm: algorithmLabel(certificate.publicKey.algorithm),
        sha256Fingerprint: bytesToHex(await certificate.getThumbprint("SHA-256", crypto)),
        selfSigned: await certificate.isSelfSigned(crypto),
        extensions: certificate.extensions.map((extension) => ({ oid: extension.type, critical: extension.critical })),
        warning: "Decoded locally. Parsing a certificate does not establish trust or validate its chain, hostname, revocation, or policy.",
      },
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Certificate could not be decoded." };
  }
}
