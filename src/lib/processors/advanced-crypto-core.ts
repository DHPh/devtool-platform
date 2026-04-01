import { inspectJwt, type DigestAlgorithm } from "./crypto-core";
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
  keyType: Exclude<JwtVerificationKeyType, "auto">;
  claimValidation: JwtClaimValidation | null;
  warning: string;
}

export type JwtVerificationKeyType = "auto" | "hmac" | "jwk" | "jwks" | "pem";

export interface JwtVerificationOptions {
  keyType?: JwtVerificationKeyType;
  expectedAlgorithm?: string;
  validateClaims?: boolean;
  expectedIssuer?: string;
  expectedAudience?: string;
  clockToleranceSeconds?: number;
  now?: Date;
}

export interface JwtClaimCheck {
  claim: "exp" | "nbf" | "iss" | "aud";
  valid: boolean;
  message: string;
}

export interface JwtClaimValidation {
  valid: boolean;
  checks: JwtClaimCheck[];
}

export type JwtSigningAlgorithm = "HS256" | "HS384" | "HS512" | "RS256" | "RS384" | "RS512" | "ES256" | "ES384";
export type JwtSigningKeyType = "hmac" | "jwk" | "pem";

export interface JwtGenerationOptions {
  algorithm: JwtSigningAlgorithm;
  keyType: JwtSigningKeyType;
}

export interface JwtGenerationResult {
  token: string;
  algorithm: JwtSigningAlgorithm;
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  warning: string;
}

export interface GeneratedJwtSigningKeyPair {
  publicJwk: JsonWebKey;
  privateJwk: JsonWebKey;
}

function isJwk(value: unknown): value is JsonWebKey {
  return Boolean(value && !Array.isArray(value) && typeof value === "object" && "kty" in value);
}

function parseJwks(input: string, kid: unknown): JsonWebKey {
  const value = JSON.parse(input) as unknown;
  if (!value || Array.isArray(value) || typeof value !== "object" || !("keys" in value) || !Array.isArray(value.keys)) {
    throw new Error("JWKS must be a JSON object containing a keys array.");
  }
  const keys = value.keys.filter(isJwk);
  if (keys.length === 0) throw new Error("JWKS does not contain any usable keys.");
  if (typeof kid === "string") {
    const match = keys.find((key) => (key as JsonWebKey & { kid?: string }).kid === kid);
    if (!match) throw new Error(`JWKS does not contain a key with kid "${kid}".`);
    return match;
  }
  if (keys.length !== 1) throw new Error("JWT header has no kid. Provide a JWKS containing exactly one key.");
  return keys[0];
}

function inferJwtKeyType(input: string): Exclude<JwtVerificationKeyType, "auto"> {
  const trimmed = input.trimStart();
  if (trimmed.startsWith("-----BEGIN")) return "pem";
  if (trimmed.startsWith("{")) {
    const value = JSON.parse(input) as unknown;
    return Boolean(value && !Array.isArray(value) && typeof value === "object" && "keys" in value) ? "jwks" : "jwk";
  }
  return "hmac";
}

function validateJwtClaims(
  payload: Record<string, unknown>,
  options: JwtVerificationOptions,
): JwtClaimValidation {
  const checks: JwtClaimCheck[] = [];
  const nowSeconds = (options.now ?? new Date()).valueOf() / 1000;
  const tolerance = options.clockToleranceSeconds ?? 0;
  if (!Number.isFinite(tolerance) || tolerance < 0 || tolerance > 3600) {
    throw new Error("Clock tolerance must be from 0 to 3600 seconds.");
  }
  if ("exp" in payload) {
    const valid = typeof payload.exp === "number" && Number.isFinite(payload.exp) && nowSeconds < payload.exp + tolerance;
    checks.push({ claim: "exp", valid, message: valid ? "Token has not expired." : "Token is expired or exp is invalid." });
  }
  if ("nbf" in payload) {
    const valid = typeof payload.nbf === "number" && Number.isFinite(payload.nbf) && nowSeconds + tolerance >= payload.nbf;
    checks.push({ claim: "nbf", valid, message: valid ? "Token is active." : "Token is not active yet or nbf is invalid." });
  }
  const expectedIssuer = options.expectedIssuer?.trim();
  if (expectedIssuer) {
    const valid = payload.iss === expectedIssuer;
    checks.push({ claim: "iss", valid, message: valid ? "Issuer matches." : "Issuer does not match." });
  }
  const expectedAudience = options.expectedAudience?.trim();
  if (expectedAudience) {
    const audiences = typeof payload.aud === "string"
      ? [payload.aud]
      : Array.isArray(payload.aud) && payload.aud.every((value) => typeof value === "string")
        ? payload.aud
        : [];
    const valid = audiences.includes(expectedAudience);
    checks.push({ claim: "aud", valid, message: valid ? "Audience matches." : "Audience does not match." });
  }
  return { valid: checks.every((check) => check.valid), checks };
}

function parseJsonObject(input: string, label: string): Record<string, unknown> {
  const value = JSON.parse(input) as unknown;
  if (!value || Array.isArray(value) || typeof value !== "object") throw new Error(`${label} must be a JSON object.`);
  return value as Record<string, unknown>;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function generateJwtHmacSecret(byteCount = 32): ProcessorResult<string> {
  if (!Number.isInteger(byteCount) || byteCount < 32 || byteCount > 128) {
    return { ok: false, error: "JWT HMAC secret size must be from 32 to 128 bytes." };
  }
  return { ok: true, value: bytesToBase64Url(crypto.getRandomValues(new Uint8Array(byteCount))) };
}

export async function generateJwtSigningKeyPair(
  algorithm: Exclude<JwtSigningAlgorithm, `HS${number}`>,
): Promise<ProcessorResult<GeneratedJwtSigningKeyPair>> {
  if (!/^(?:RS(?:256|384|512)|ES(?:256|384))$/.test(algorithm)) {
    return { ok: false, error: "Generate an RS or ES JWT signing keypair." };
  }
  try {
    const pair = algorithm.startsWith("RS")
      ? await crypto.subtle.generateKey(
        {
          name: "RSASSA-PKCS1-v1_5",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: `SHA-${algorithm.slice(2)}`,
        },
        true,
        ["sign", "verify"],
      )
      : await crypto.subtle.generateKey(
        { name: "ECDSA", namedCurve: algorithm === "ES256" ? "P-256" : "P-384" },
        true,
        ["sign", "verify"],
      );
    return {
      ok: true,
      value: {
        publicJwk: await crypto.subtle.exportKey("jwk", pair.publicKey),
        privateJwk: await crypto.subtle.exportKey("jwk", pair.privateKey),
      },
    };
  } catch {
    return { ok: false, error: `${algorithm} key generation is not available in this environment.` };
  }
}

export async function generateJwt(
  headerInput: string,
  payloadInput: string,
  keyInput: string,
  options: JwtGenerationOptions,
): Promise<ProcessorResult<JwtGenerationResult>> {
  if (!/^(?:HS|RS)(?:256|384|512)$|^ES(?:256|384)$/.test(options.algorithm)) {
    return { ok: false, error: `Unsupported JWT signing algorithm: ${options.algorithm}.` };
  }
  if (headerInput.length + payloadInput.length > 100_000) return { ok: false, error: "JWT header and payload exceed the 100 KB limit." };
  if (!keyInput) return { ok: false, error: "Enter or generate a signing key." };
  try {
    const header: Record<string, unknown> = { ...parseJsonObject(headerInput, "JWT header"), alg: options.algorithm };
    if (!("typ" in header)) header.typ = "JWT";
    const payload = parseJsonObject(payloadInput, "JWT payload");
    const headerSegment = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(header)));
    const payloadSegment = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
    const data = new TextEncoder().encode(`${headerSegment}.${payloadSegment}`);
    const jwk = options.keyType === "jwk" ? parseJwk(keyInput) : null;
    if (options.keyType === "jwk" && !jwk) throw new Error("Enter a private or symmetric JWK JSON object.");
    let key: CryptoKey;
    let signAlgorithm: AlgorithmIdentifier | EcdsaParams;
    if (options.algorithm.startsWith("HS")) {
      if (!["hmac", "jwk"].includes(options.keyType)) throw new Error(`${options.algorithm} requires an HMAC secret or symmetric JWK.`);
      if (jwk && jwk.kty !== "oct") throw new Error(`${options.algorithm} requires a symmetric oct JWK.`);
      const importAlgorithm = { name: "HMAC", hash: `SHA-${options.algorithm.slice(2)}` };
      key = jwk
        ? await crypto.subtle.importKey("jwk", jwk, importAlgorithm, false, ["sign"])
        : await crypto.subtle.importKey("raw", new TextEncoder().encode(keyInput), importAlgorithm, false, ["sign"]);
      signAlgorithm = "HMAC";
    } else if (options.algorithm.startsWith("RS")) {
      if (options.keyType === "hmac") throw new Error(`${options.algorithm} requires a private JWK or PKCS#8 PEM key.`);
      if (jwk && jwk.kty !== "RSA") throw new Error(`${options.algorithm} requires an RSA private JWK.`);
      const importAlgorithm = { name: "RSASSA-PKCS1-v1_5", hash: `SHA-${options.algorithm.slice(2)}` };
      key = jwk
        ? await crypto.subtle.importKey("jwk", jwk, importAlgorithm, false, ["sign"])
        : await crypto.subtle.importKey("pkcs8", asArrayBuffer(pemToBytes(keyInput)), importAlgorithm, false, ["sign"]);
      signAlgorithm = "RSASSA-PKCS1-v1_5";
    } else {
      if (options.keyType === "hmac") throw new Error(`${options.algorithm} requires a private JWK or PKCS#8 PEM key.`);
      if (jwk && jwk.kty !== "EC") throw new Error(`${options.algorithm} requires an EC private JWK.`);
      const namedCurve = options.algorithm === "ES256" ? "P-256" : "P-384";
      key = jwk
        ? await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve }, false, ["sign"])
        : await crypto.subtle.importKey("pkcs8", asArrayBuffer(pemToBytes(keyInput)), { name: "ECDSA", namedCurve }, false, ["sign"]);
      signAlgorithm = { name: "ECDSA", hash: options.algorithm === "ES256" ? "SHA-256" : "SHA-384" };
    }
    const signature = new Uint8Array(await crypto.subtle.sign(signAlgorithm, key, data));
    return {
      ok: true,
      value: {
        token: `${headerSegment}.${payloadSegment}.${bytesToBase64Url(signature)}`,
        algorithm: options.algorithm,
        header,
        payload,
        warning: "Generated locally for development and testing. Protect signing secrets and private keys; do not paste production keys into shared environments.",
      },
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "JWT could not be generated." };
  }
}

export async function verifyJwtSignature(
  token: string,
  keyInput: string,
  options: JwtVerificationOptions = {},
): Promise<ProcessorResult<JwtVerificationResult>> {
  const segments = token.trim().split(".");
  if (segments.length !== 3 || segments.some((segment) => !segment)) return { ok: false, error: "A signed JWT must contain three non-empty segments." };
  if (!keyInput.trim()) return { ok: false, error: "Enter a verification key or HMAC secret." };
  try {
    const inspection = inspectJwt(token, options.now);
    if (!inspection.ok) return inspection;
    const { header, payload } = inspection.value;
    const algorithm = typeof header.alg === "string" ? header.alg : "";
    if (!algorithm || algorithm === "none") return { ok: false, error: "JWT must declare a supported signing algorithm." };
    if (options.expectedAlgorithm && algorithm !== options.expectedAlgorithm) {
      return { ok: false, error: `Algorithm mismatch: expected ${options.expectedAlgorithm}, but JWT declares ${algorithm}.` };
    }
    const keyType = options.keyType && options.keyType !== "auto" ? options.keyType : inferJwtKeyType(keyInput);
    if (/^HS/.test(algorithm) && !["hmac", "jwk", "jwks"].includes(keyType)) {
      return { ok: false, error: `${algorithm} requires an HMAC secret or symmetric JWK, not a PEM key.` };
    }
    if (/^(?:RS|ES)/.test(algorithm) && keyType === "hmac") {
      return { ok: false, error: `${algorithm} requires a public JWK, JWKS, or SPKI PEM key, not an HMAC secret.` };
    }
    const data = new TextEncoder().encode(`${segments[0]}.${segments[1]}`);
    const signature = base64UrlToBytes(segments[2]);
    let key: CryptoKey;
    let verifyAlgorithm: AlgorithmIdentifier | RsaPssParams | EcdsaParams;
    const jwk = keyType === "jwk"
      ? parseJwk(keyInput)
      : keyType === "jwks"
        ? parseJwks(keyInput, header.kid)
        : null;
    if (keyType === "jwk" && !jwk) throw new Error("Enter a JWK JSON object.");
    if (/^HS/.test(algorithm) && jwk && jwk.kty !== "oct") throw new Error(`${algorithm} requires a symmetric oct JWK.`);
    if (/^RS/.test(algorithm) && jwk && jwk.kty !== "RSA") throw new Error(`${algorithm} requires an RSA JWK.`);
    if (/^ES/.test(algorithm) && jwk && jwk.kty !== "EC") throw new Error(`${algorithm} requires an EC JWK.`);
    if (/^HS(?:256|384|512)$/.test(algorithm)) {
      const hash = `SHA-${algorithm.slice(2)}`;
      key = jwk
        ? await crypto.subtle.importKey("jwk", jwk, { name: "HMAC", hash }, false, ["verify"])
        : await crypto.subtle.importKey("raw", new TextEncoder().encode(keyInput), { name: "HMAC", hash }, false, ["verify"]);
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
    const claimValidation = options.validateClaims && verified ? validateJwtClaims(payload, options) : null;
    return {
      ok: true,
      value: {
        verified,
        algorithm,
        keyType,
        claimValidation,
        warning: !verified
          ? "Signature did not verify. Claims were not validated or trusted."
          : claimValidation
          ? "Signature and configured claims are reported separately. Unconfigured claims were not validated."
          : "Signature only. Issuer, audience, expiry, and other claims were not validated.",
      },
    };
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
