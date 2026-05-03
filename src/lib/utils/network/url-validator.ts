/**
 * URL validation and testing utilities
 */

export interface UrlTestResult {
  url: string;
  isValid: boolean;
  isAccessible: boolean;
  statusCode?: number;
  statusText?: string;
  responseTime?: number;
  headers?: Record<string, string>;
  contentType?: string;
  contentLength?: number;
  redirectUrl?: string;
  sslInfo?: SslInfo;
  error?: string;
  errorDetails?: string;
  method?: string;
  timestamp: number;
}

export interface SslInfo {
  isSecure: boolean;
  issuer?: string;
  subject?: string;
  validFrom?: string;
  validTo?: string;
  protocol?: string;
  cipher?: string;
}

export interface FileLinkInfo {
  url: string;
  exists: boolean;
  fileSize?: number;
  contentType?: string;
  lastModified?: string;
  headers?: Record<string, string>;
  error?: string;
  errorDetails?: string;
  timestamp: number;
}

/**
 * Test URL accessibility and get detailed information
 */
export async function testUrl(
  url: string,
  timeout = 10000
): Promise<UrlTestResult> {
  const timestamp = Date.now();
  const startTime = performance.now();

  // Validate URL format
  if (!isValidUrl(url)) {
    return {
      url,
      isValid: false,
      isAccessible: false,
      error: "Invalid URL format",
      timestamp,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Try different approaches based on potential CORS issues
    let response: Response;
    let fetchError: Error | null = null;
    let method = "HEAD";

    try {
      // First try: HEAD request with CORS
      response = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
        redirect: "follow",
        mode: "cors",
      });
    } catch {
      try {
        // Second try: GET request with CORS (some servers don't support HEAD)
        method = "GET";
        response = await fetch(url, {
          method: "GET",
          signal: controller.signal,
          redirect: "follow",
          mode: "cors",
        });
      } catch {
        try {
          // Third try: GET with no-cors mode (limited info but can detect accessibility)
          method = "GET (no-cors)";
          response = await fetch(url, {
            method: "GET",
            signal: controller.signal,
            redirect: "follow",
            mode: "no-cors",
          });
        } catch (noCorsError) {
          fetchError =
            noCorsError instanceof Error
              ? noCorsError
              : new Error("All fetch methods failed");
          throw fetchError;
        }
      }
    }

    clearTimeout(timeoutId);
    const responseTime = performance.now() - startTime;

    // Convert Headers to plain object
    const headers: Record<string, string> = {};
    try {
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } catch {
      // Headers may not be accessible in no-cors mode
    }

    const result: UrlTestResult = {
      url,
      isValid: true,
      isAccessible: response.type === "opaque" ? true : response.ok,
      statusCode: response.type === "opaque" ? undefined : response.status,
      statusText:
        response.type === "opaque"
          ? "Accessible (CORS restricted)"
          : response.statusText,
      responseTime: Math.round(responseTime),
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      contentType: response.headers.get("content-type") || undefined,
      contentLength:
        parseInt(response.headers.get("content-length") || "0") || undefined,
      redirectUrl: response.url !== url ? response.url : undefined,
      method: method,
      timestamp,
    };

    // Add SSL info for HTTPS URLs
    if (url.startsWith("https://")) {
      result.sslInfo = {
        isSecure: true,
        // Note: Detailed SSL info is not available in browser environment
        // In a real application, this would require a backend service
      };
    }

    return result;
  } catch (error) {
    const responseTime = performance.now() - startTime;

    let errorMessage = "Connection failed";
    let errorDetails = "";

    if (error instanceof Error) {
      // Preserve the original error message first
      const originalMessage = error.message;
      const originalStack = error.stack || "";

      if (error.name === "AbortError") {
        errorMessage = "Request timeout";
        errorDetails = `Request timed out after ${timeout}ms. Original error: ${originalMessage}`;
      } else if (
        originalMessage.includes("CORS") ||
        originalMessage.includes("Access-Control")
      ) {
        errorMessage = "CORS policy restriction";
        errorDetails = `Cross-origin request blocked: ${originalMessage}`;
      } else if (
        originalMessage.includes("net::ERR_") ||
        originalMessage.includes("network")
      ) {
        errorMessage = "Network error";
        errorDetails = `Network connection failed: ${originalMessage}`;
      } else if (
        originalMessage.includes("DNS") ||
        originalMessage.includes("resolve")
      ) {
        errorMessage = "DNS resolution failed";
        errorDetails = `DNS error: ${originalMessage}`;
      } else {
        errorMessage = originalMessage || "Unknown error";
        errorDetails = originalStack
          ? `${originalMessage}\n\nStack trace:\n${originalStack}`
          : originalMessage;
      }
    } else {
      errorMessage = "Unknown error";
      errorDetails = String(error);
    }

    return {
      url,
      isValid: true,
      isAccessible: false,
      responseTime: Math.round(responseTime),
      error: errorMessage,
      errorDetails: errorDetails || undefined,
      timestamp,
    };
  }
}

/**
 * Check file link without downloading
 */
export async function checkFileLink(
  url: string,
  timeout = 10000
): Promise<FileLinkInfo> {
  const timestamp = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    let response: Response;

    try {
      // First try: HEAD request
      response = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
      });
    } catch {
      // Fallback: GET request (some servers don't support HEAD)
      response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
      });
    }

    clearTimeout(timeoutId);

    // Convert Headers to plain object
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    if (!response.ok) {
      return {
        url,
        exists: false,
        error: `HTTP ${response.status}`,
        errorDetails: `${response.status} ${response.statusText}: Server returned an error. The file may not exist or you may not have permission to access it.`,
        headers,
        timestamp,
      };
    }

    return {
      url,
      exists: true,
      fileSize:
        parseInt(response.headers.get("content-length") || "0") || undefined,
      contentType: response.headers.get("content-type") || undefined,
      lastModified: response.headers.get("last-modified") || undefined,
      headers,
      timestamp,
    };
  } catch (error) {
    if (error instanceof Error) {
      const originalMessage = error.message;
      const originalStack = error.stack || "";

      if (error.name === "AbortError") {
        return {
          url,
          exists: false,
          error: "Request timeout",
          errorDetails: `Request timed out after ${timeout}ms. Original error: ${originalMessage}`,
          timestamp,
        };
      }

      if (
        error.name === "TypeError" &&
        originalMessage.includes("Failed to fetch")
      ) {
        return {
          url,
          exists: false,
          error: "Network/CORS error",
          errorDetails: `Network connection failed: ${originalMessage}. This could be due to CORS restrictions, network connectivity issues, or the server being down.`,
          timestamp,
        };
      }

      if (
        originalMessage.includes("CORS") ||
        originalMessage.includes("Access-Control")
      ) {
        return {
          url,
          exists: false,
          error: "CORS restriction",
          errorDetails: `CORS policy violation: ${originalMessage}`,
          timestamp,
        };
      }

      if (originalMessage.includes("net::ERR_")) {
        return {
          url,
          exists: false,
          error: "Browser network error",
          errorDetails: `Browser error: ${originalMessage}`,
          timestamp,
        };
      }

      return {
        url,
        exists: false,
        error: error.name || "Connection error",
        errorDetails: originalStack
          ? `${originalMessage}\n\nStack trace:\n${originalStack}`
          : originalMessage,
        timestamp,
      };
    }

    return {
      url,
      exists: false,
      error: "Unknown error",
      errorDetails: `Unexpected error: ${String(error)}`,
      timestamp,
    };
  }
}

/**
 * Batch test multiple URLs
 */
export async function testMultipleUrls(
  urls: string[],
  timeout = 10000
): Promise<UrlTestResult[]> {
  const promises = urls.map((url) => testUrl(url, timeout));
  return Promise.all(promises);
}

/**
 * Check if URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return "";
  }
}

/**
 * Check if URL is secure (HTTPS)
 */
export function isSecureUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Get URL components
 */
export function parseUrl(url: string): {
  protocol?: string;
  hostname?: string;
  port?: string;
  pathname?: string;
  search?: string;
  hash?: string;
  origin?: string;
} {
  try {
    const urlObj = new URL(url);
    return {
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      port: urlObj.port,
      pathname: urlObj.pathname,
      search: urlObj.search,
      hash: urlObj.hash,
      origin: urlObj.origin,
    };
  } catch {
    return {};
  }
}

import { formatFileSize } from "@/lib/processors/file-core";

export { formatFileSize };

/**
 * Get content type description
 */
export function getContentTypeDescription(contentType: string): string {
  const typeMap: Record<string, string> = {
    "text/html": "HTML Document",
    "text/css": "CSS Stylesheet",
    "text/javascript": "JavaScript",
    "application/javascript": "JavaScript",
    "application/json": "JSON Data",
    "application/xml": "XML Document",
    "text/xml": "XML Document",
    "image/jpeg": "JPEG Image",
    "image/png": "PNG Image",
    "image/gif": "GIF Image",
    "image/svg+xml": "SVG Image",
    "application/pdf": "PDF Document",
    "application/zip": "ZIP Archive",
    "video/mp4": "MP4 Video",
    "audio/mpeg": "MP3 Audio",
  };

  // Get main type
  const mainType = contentType.split(";")[0].toLowerCase();
  return typeMap[mainType] || contentType;
}
