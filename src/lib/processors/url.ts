import { ProcessorError } from "./errors";

type UrlOperation = "encode component" | "decode component" | "encode URL";

function processUrl(
  input: string,
  operation: UrlOperation,
  transform: (value: string) => string
): string {
  try {
    return transform(input);
  } catch (error) {
    throw new ProcessorError(
      `Unable to ${operation}`,
      "INVALID_URL_ENCODING",
      { cause: error }
    );
  }
}

export const encodeUrlComponent = (input: string): string =>
  processUrl(input, "encode component", encodeURIComponent);

export const decodeUrlComponent = (input: string): string =>
  processUrl(input, "decode component", decodeURIComponent);

export const encodeFullUrl = (input: string): string =>
  processUrl(input, "encode URL", encodeURI);
