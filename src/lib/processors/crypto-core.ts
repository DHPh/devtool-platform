import type { ProcessorResult } from "./result";

export interface JwtInspection {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  algorithm: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  notBefore: string | null;
  status: "active" | "expired" | "not-active" | "no-time-claims";
  warning: string;
}

function decodeBase64Url(segment: string): string {
  if (!/^[A-Za-z0-9_-]+$/.test(segment)) throw new Error("JWT segments must use Base64url encoding.");
  const padding = "=".repeat((4 - (segment.length % 4)) % 4);
  const binary = atob(segment.replace(/-/g, "+").replace(/_/g, "/") + padding);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

function parseJwtObject(segment: string, name: string): Record<string, unknown> {
  const value = JSON.parse(decodeBase64Url(segment)) as unknown;
  if (!value || Array.isArray(value) || typeof value !== "object") {
    throw new Error(`JWT ${name} must be a JSON object.`);
  }
  return value as Record<string, unknown>;
}

function numericDate(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function dateLabel(seconds: number | null): string | null {
  if (seconds === null) return null;
  const date = new Date(seconds * 1000);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

export function inspectJwt(token: string, now = new Date()): ProcessorResult<JwtInspection> {
  const normalized = token.trim();
  if (normalized.length > 100_000) return { ok: false, error: "JWT exceeds the 100 KB limit." };
  const segments = normalized.split(".");
  if (segments.length !== 3 || !segments[0] || !segments[1]) {
    return { ok: false, error: "A JWT must contain header, payload, and signature segments." };
  }
  if (segments[2] && !/^[A-Za-z0-9_-]+$/.test(segments[2])) {
    return { ok: false, error: "JWT signature must use Base64url encoding." };
  }

  try {
    const header = parseJwtObject(segments[0], "header");
    const payload = parseJwtObject(segments[1], "payload");
    const exp = numericDate(payload.exp);
    const nbf = numericDate(payload.nbf);
    const iat = numericDate(payload.iat);
    const nowSeconds = now.valueOf() / 1000;
    const status =
      nbf !== null && nowSeconds < nbf
        ? "not-active"
        : exp !== null && nowSeconds >= exp
          ? "expired"
          : exp !== null || nbf !== null
            ? "active"
            : "no-time-claims";
    return {
      ok: true,
      value: {
        header,
        payload,
        signature: segments[2],
        algorithm: typeof header.alg === "string" ? header.alg : null,
        issuedAt: dateLabel(iat),
        expiresAt: dateLabel(exp),
        notBefore: dateLabel(nbf),
        status,
        warning: "Decoded only. The signature and claims have not been verified.",
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Invalid JWT.",
    };
  }
}

export type DigestAlgorithm = "SHA-256" | "SHA-384" | "SHA-512";

function bytesToHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function generateDigest(
  input: string,
  algorithm: DigestAlgorithm,
): Promise<ProcessorResult<string>> {
  try {
    const digest = await globalThis.crypto.subtle.digest(algorithm, new TextEncoder().encode(input));
    return { ok: true, value: bytesToHex(digest) };
  } catch {
    return { ok: false, error: `${algorithm} is not available in this environment.` };
  }
}

export async function generateHmac(
  input: string,
  secret: string,
  algorithm: DigestAlgorithm,
): Promise<ProcessorResult<string>> {
  if (!secret) return { ok: false, error: "Enter an HMAC secret." };
  try {
    const key = await globalThis.crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: algorithm },
      false,
      ["sign"],
    );
    const signature = await globalThis.crypto.subtle.sign("HMAC", key, new TextEncoder().encode(input));
    return { ok: true, value: bytesToHex(signature) };
  } catch {
    return { ok: false, error: `${algorithm} HMAC is not available in this environment.` };
  }
}
