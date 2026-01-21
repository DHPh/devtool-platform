import { validateIP } from "@/lib/utils/network/ip-utils";

export type OutboundDestinationResult =
  | { allowed: true; url: URL }
  | { allowed: false; error: string };

export function validateHttpDestination(
  input: string,
): OutboundDestinationResult {
  let url: URL;

  try {
    url = new URL(input);
  } catch {
    return { allowed: false, error: "Invalid URL format" };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return {
      allowed: false,
      error: "Only HTTP and HTTPS destinations are supported",
    };
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return { allowed: false, error: "Destination is not allowed" };
  }

  const address = validateIP(hostname);
  if (
    address.isValid &&
    (address.isPrivate ||
      address.isLoopback ||
      address.isMulticast ||
      address.isReserved)
  ) {
    return { allowed: false, error: "Destination is not allowed" };
  }

  return { allowed: true, url };
}
