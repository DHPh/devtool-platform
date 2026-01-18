import { ProcessorError } from "./errors";

export function encodeBase64(input: string): string {
  try {
    return btoa(input);
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
    return atob(input);
  } catch (error) {
    throw new ProcessorError("Invalid Base64 string", "INVALID_BASE64", {
      cause: error,
    });
  }
}
