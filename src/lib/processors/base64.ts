import { ProcessorError } from "./errors";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder("utf-8", { fatal: true });

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function base64ToBytes(input: string): Uint8Array {
  const binary = atob(input);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

export function encodeBase64(input: string): string {
  try {
    return bytesToBase64(textEncoder.encode(input));
  } catch (error) {
    throw new ProcessorError(
      "Failed to encode text",
      "PROCESSING_FAILED",
      { cause: error }
    );
  }
}

export function decodeBase64(input: string): string {
  try {
    return textDecoder.decode(base64ToBytes(input));
  } catch (error) {
    throw new ProcessorError("Invalid Base64 string", "INVALID_BASE64", {
      cause: error,
    });
  }
}
