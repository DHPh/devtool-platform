/**
 * API Client utilities for HTTP requests and REST API testing
 */

export interface HttpMethod {
  GET: "GET";
  POST: "POST";
  PUT: "PUT";
  DELETE: "DELETE";
  PATCH: "PATCH";
  HEAD: "HEAD";
  OPTIONS: "OPTIONS";
}

export const HTTP_METHODS: HttpMethod = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
  PATCH: "PATCH",
  HEAD: "HEAD",
  OPTIONS: "OPTIONS",
} as const;

export type HttpMethodType = keyof HttpMethod;

export interface ApiRequest {
  url: string;
  method: HttpMethodType;
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: string;
  responseTime: number;
  size: number;
}

export interface ApiTestResult {
  request: ApiRequest;
  response?: ApiResponse;
  error?: string;
  errorDetails?: string;
  success?: boolean;
  timestamp: number;
}

/**
 * Make HTTP request
 */
export async function makeHttpRequest(
  request: ApiRequest
): Promise<ApiTestResult> {
  const startTime = Date.now();
  const timestamp = startTime;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      request.timeout || 30000
    );

    const response = await fetch(request.url, {
      method: request.method,
      headers: {
        "Content-Type": "application/json",
        ...request.headers,
      },
      body:
        request.method !== "GET" && request.method !== "HEAD"
          ? request.body
          : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    const data = await response.text();

    // Convert Headers to plain object
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const result: ApiTestResult = {
      request,
      response: {
        status: response.status,
        statusText: response.statusText,
        headers,
        data,
        responseTime,
        size: new Blob([data]).size,
      },
      success: response.ok,
      timestamp,
    };

    if (!response.ok) {
      result.error = `HTTP ${response.status}`;
      result.errorDetails = `${response.status} ${
        response.statusText
      }: ${data.substring(0, 200)}${data.length > 200 ? "..." : ""}`;
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return {
          request,
          error: "Request timeout",
          errorDetails: `Request timed out after ${request.timeout || 30000}ms`,
          success: false,
          timestamp,
        };
      }

      if (
        error.name === "TypeError" &&
        error.message.includes("Failed to fetch")
      ) {
        return {
          request,
          error: "Network error",
          errorDetails:
            "Failed to connect to server. This could be due to CORS, network connectivity, or the server being down.",
          success: false,
          timestamp,
        };
      }

      return {
        request,
        error: error.name,
        errorDetails: error.message,
        success: false,
        timestamp,
      };
    }

    return {
      request,
      error: "Unknown error",
      errorDetails: "An unexpected error occurred during the request",
      success: false,
      timestamp,
    };
  }
}

/**
 * Test WebSocket connection
 */
export interface WebSocketTestResult {
  url: string;
  connected: boolean;
  error?: string;
  responseTime?: number;
  timestamp: number;
}

export function testWebSocket(
  url: string,
  timeout = 10000
): Promise<WebSocketTestResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const timestamp = startTime;

    try {
      const ws = new WebSocket(url);
      const timeoutId = setTimeout(() => {
        ws.close();
        resolve({
          url,
          connected: false,
          error: "Connection timeout",
          timestamp,
        });
      }, timeout);

      ws.onopen = () => {
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;
        ws.close();
        resolve({
          url,
          connected: true,
          responseTime,
          timestamp,
        });
      };

      ws.onerror = () => {
        clearTimeout(timeoutId);
        resolve({
          url,
          connected: false,
          error: "Connection failed",
          timestamp,
        });
      };
    } catch (error) {
      resolve({
        url,
        connected: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp,
      });
    }
  });
}

/**
 * Parse cURL command to ApiRequest
 */
export function parseCurlCommand(curl: string): ApiRequest | null {
  try {
    // Basic cURL parsing - can be enhanced
    const urlMatch = curl.match(/curl\s+['"](.*?)['"]|curl\s+(\S+)/);
    if (!urlMatch) return null;

    const url = urlMatch[1] || urlMatch[2];
    const method = curl.includes("-X")
      ? (curl.match(/-X\s+(\w+)/)?.[1] as HttpMethodType) || "GET"
      : "GET";

    const headers: Record<string, string> = {};
    const headerMatches = curl.matchAll(/-H\s+['"]([^:]+):\s*([^'"]+)['"]/g);
    for (const match of headerMatches) {
      headers[match[1]] = match[2];
    }

    const dataMatch = curl.match(/-d\s+['"](.*)['"]|--data\s+['"](.*)['"]/);
    const body = dataMatch?.[1] || dataMatch?.[2];

    return {
      url,
      method,
      headers,
      body,
    };
  } catch {
    return null;
  }
}

/**
 * Generate cURL command from ApiRequest
 */
export function generateCurlCommand(request: ApiRequest): string {
  let curl = `curl -X ${request.method} "${request.url}"`;

  if (request.headers) {
    Object.entries(request.headers).forEach(([key, value]) => {
      curl += ` -H "${key}: ${value}"`;
    });
  }

  if (request.body && request.method !== "GET" && request.method !== "HEAD") {
    curl += ` -d '${request.body}'`;
  }

  return curl;
}
