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
  const timeout = request.timeout ?? 30000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
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
          errorDetails: `Request timed out after ${timeout}ms`,
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
  } finally {
    clearTimeout(timeoutId);
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

function tokenizeShellArgs(command: string): string[] {
  const normalized = command.replace(/\\\r?\n/g, " ");
  const tokens: string[] = [];
  let current = "";
  let inSingle = false;
  let inDouble = false;
  let hasToken = false;

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];

    if (inSingle) {
      if (ch === "'") {
        inSingle = false;
      } else {
        current += ch;
      }
      hasToken = true;
      continue;
    }

    if (inDouble) {
      if (ch === "\\" && i + 1 < normalized.length) {
        const next = normalized[i + 1];
        if (next === '"' || next === "\\" || next === "$" || next === "`") {
          current += next;
          i += 1;
          continue;
        }
      }
      if (ch === '"') {
        inDouble = false;
      } else {
        current += ch;
      }
      hasToken = true;
      continue;
    }

    if (/\s/.test(ch)) {
      if (hasToken) {
        tokens.push(current);
        current = "";
        hasToken = false;
      }
      continue;
    }

    if (ch === "'") {
      inSingle = true;
      hasToken = true;
      continue;
    }

    if (ch === '"') {
      inDouble = true;
      hasToken = true;
      continue;
    }

    if (ch === "\\" && i + 1 < normalized.length) {
      current += normalized[i + 1];
      i += 1;
      hasToken = true;
      continue;
    }

    current += ch;
    hasToken = true;
  }

  if (hasToken) {
    tokens.push(current);
  }

  return tokens;
}

const VALID_HTTP_METHODS = new Set<HttpMethodType>([
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "HEAD",
  "OPTIONS",
]);

/**
 * Parse cURL command to ApiRequest
 */
export function parseCurlCommand(curl: string): ApiRequest | null {
  try {
    const tokens = tokenizeShellArgs(curl.trim());
    if (tokens.length === 0) return null;

    let startIndex = 0;
    if (tokens[0].toLowerCase() === "curl") {
      startIndex = 1;
    }

    let url = "";
    let explicitMethod: HttpMethodType | null = null;
    let forceGet = false;
    const headers: Record<string, string> = {};
    const bodyParts: string[] = [];

    for (let i = startIndex; i < tokens.length; i++) {
      const token = tokens[i];

      if ((token === "-X" || token === "--request") && i + 1 < tokens.length) {
        const rawMethod = tokens[++i].toUpperCase() as HttpMethodType;
        if (VALID_HTTP_METHODS.has(rawMethod)) {
          explicitMethod = rawMethod;
        }
        continue;
      }

      if (token.startsWith("--request=")) {
        const rawMethod = token.slice("--request=".length).toUpperCase() as HttpMethodType;
        if (VALID_HTTP_METHODS.has(rawMethod)) {
          explicitMethod = rawMethod;
        }
        continue;
      }

      if ((token === "-H" || token === "--header") && i + 1 < tokens.length) {
        const headerLine = tokens[++i];
        const colonIdx = headerLine.indexOf(":");
        if (colonIdx > 0) {
          const name = headerLine.slice(0, colonIdx).trim();
          const value = headerLine.slice(colonIdx + 1).trim();
          if (name) headers[name] = value;
        }
        continue;
      }

      if (token.startsWith("--header=")) {
        const headerLine = token.slice("--header=".length);
        const colonIdx = headerLine.indexOf(":");
        if (colonIdx > 0) {
          const name = headerLine.slice(0, colonIdx).trim();
          const value = headerLine.slice(colonIdx + 1).trim();
          if (name) headers[name] = value;
        }
        continue;
      }

      if (
        (token === "-d" ||
          token === "--data" ||
          token === "--data-raw" ||
          token === "--data-binary" ||
          token === "--data-urlencode") &&
        i + 1 < tokens.length
      ) {
        bodyParts.push(tokens[++i]);
        continue;
      }

      if (
        token.startsWith("--data=") ||
        token.startsWith("--data-raw=") ||
        token.startsWith("--data-binary=")
      ) {
        const eqIdx = token.indexOf("=");
        bodyParts.push(token.slice(eqIdx + 1));
        continue;
      }

      if (token === "-G" || token === "--get") {
        forceGet = true;
        continue;
      }

      if (token === "--url" && i + 1 < tokens.length) {
        url = tokens[++i];
        continue;
      }

      if (token.startsWith("--url=")) {
        url = token.slice("--url=".length);
        continue;
      }

      if (
        token === "-A" ||
        token === "--user-agent" ||
        token === "-u" ||
        token === "--user"
      ) {
        if (i + 1 < tokens.length) i += 1;
        continue;
      }

      if (!token.startsWith("-") && !url) {
        url = token;
      }
    }

    if (!url) return null;

    const body = bodyParts.length > 0 ? bodyParts.join("&") : undefined;
    const method: HttpMethodType =
      explicitMethod ?? (forceGet ? "GET" : body !== undefined ? "POST" : "GET");

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
  const escapedUrl = request.url.replace(/"/g, '\\"');
  let curl = `curl -X ${request.method} "${escapedUrl}"`;

  if (request.headers) {
    Object.entries(request.headers).forEach(([key, value]) => {
      const safeKey = key.replace(/["\\]/g, "\\$&");
      const safeValue = value.replace(/["\\]/g, "\\$&");
      curl += ` -H "${safeKey}: ${safeValue}"`;
    });
  }

  if (request.body && request.method !== "GET" && request.method !== "HEAD") {
    const safeBody = request.body.replace(/'/g, "'\\''");
    curl += ` -d '${safeBody}'`;
  }

  return curl;
}
