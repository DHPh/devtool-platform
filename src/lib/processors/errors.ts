export type ProcessorErrorCode =
  | "INVALID_BASE64"
  | "INVALID_JSON"
  | "INVALID_URL_ENCODING"
  | "PROCESSING_FAILED";

export class ProcessorError extends Error {
  constructor(
    message: string,
    public readonly code: ProcessorErrorCode,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = "ProcessorError";
  }
}

export const getProcessorErrorMessage = (
  error: unknown,
  fallback = "Processing failed"
): string => (error instanceof Error ? error.message : fallback);
