import { ProcessorError } from "./errors";

const textEncoder = new TextEncoder();
const fatalTextDecoder = new TextDecoder("utf-8", { fatal: true });

export type Base64Variant = "standard" | "url";
export type Base64DecodeMode = "strict" | "forgiving";

export interface Base64EncodeOptions {
  variant?: Base64Variant;
  /** Base64url is conventionally unpadded; standard Base64 is padded. */
  padding?: boolean;
}

export interface Base64DecodeOptions {
  variant?: Base64Variant;
  mode?: Base64DecodeMode;
}

function bytesToStandardBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function standardBase64ToBytes(input: string): Uint8Array {
  const binary = atob(input);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function canonicalInput(
  input: string,
  variant: Base64Variant,
  mode: Base64DecodeMode,
): string {
  let value = input;
  if (mode === "forgiving") {
    value = value.replace(/[\t\n\f\r ]/g, "");
    if (variant === "url") value = value.replace(/-/g, "+").replace(/_/g, "/");
    if (value.length % 4 === 1) throw new Error("Invalid Base64 length");
    value += "=".repeat((4 - (value.length % 4)) % 4);
    return value;
  }

  if (/[\t\n\f\r ]/.test(value)) throw new Error("Whitespace is not allowed in strict mode");
  if (variant === "standard") {
    if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
      throw new Error("Invalid canonical Base64");
    }
    return value;
  }

  if (!/^[A-Za-z0-9_-]*={0,2}$/.test(value) || /=/.test(value.slice(0, -2))) {
    throw new Error("Invalid Base64url alphabet or padding");
  }
  const unpadded = value.replace(/=+$/, "");
  if (unpadded.length % 4 === 1) throw new Error("Invalid Base64url length");
  const expectedPadding = "=".repeat((4 - (unpadded.length % 4)) % 4);
  const suppliedPadding = value.slice(unpadded.length);
  if (suppliedPadding && suppliedPadding !== expectedPadding) {
    throw new Error("Invalid Base64url padding");
  }
  return unpadded.replace(/-/g, "+").replace(/_/g, "/") + expectedPadding;
}

export function encodeBase64Bytes(
  bytes: Uint8Array,
  options: Base64EncodeOptions = {},
): string {
  try {
    const variant = options.variant ?? "standard";
    const padding = options.padding ?? variant === "standard";
    let encoded = bytesToStandardBase64(bytes);
    if (variant === "url") encoded = encoded.replace(/\+/g, "-").replace(/\//g, "_");
    return padding ? encoded : encoded.replace(/=+$/, "");
  } catch (error) {
    throw new ProcessorError("Failed to encode bytes", "PROCESSING_FAILED", { cause: error });
  }
}

export function decodeBase64Bytes(
  input: string,
  options: Base64DecodeOptions = {},
): Uint8Array {
  try {
    const variant = options.variant ?? "standard";
    const mode = options.mode ?? "strict";
    const canonical = canonicalInput(input, variant, mode);
    const bytes = standardBase64ToBytes(canonical);
    if (mode === "strict") {
      const expected = encodeBase64Bytes(bytes, {
        variant,
        padding: variant === "standard" || input.endsWith("="),
      });
      if (expected !== input) throw new Error("Non-canonical Base64 encoding");
    }
    return bytes;
  } catch (error) {
    throw new ProcessorError(
      variantMessage(options.variant ?? "standard"),
      "INVALID_BASE64",
      { cause: error },
    );
  }
}

function variantMessage(variant: Base64Variant): string {
  return variant === "url" ? "Invalid Base64url string" : "Invalid Base64 string";
}

export function encodeBase64(input: string, options: Base64EncodeOptions = {}): string {
  return encodeBase64Bytes(textEncoder.encode(input), options);
}

export function decodeBase64(input: string, options: Base64DecodeOptions = {}): string {
  try {
    return fatalTextDecoder.decode(decodeBase64Bytes(input, options));
  } catch (error) {
    if (error instanceof ProcessorError) throw error;
    throw new ProcessorError("Decoded bytes are not valid UTF-8 text", "PROCESSING_FAILED", {
      cause: error,
    });
  }
}
