/**
 * HTTP Headers Library - Comprehensive HTTP header reference
 */

export interface HttpHeaderInfo {
  name: string;
  category: string;
  description: string;
  examples: string[];
  documentation?: string;
  commonValues?: string[];
}

export const HTTP_HEADER_CATEGORIES = {
  GENERAL: "General",
  REQUEST: "Request",
  RESPONSE: "Response",
  ENTITY: "Entity",
  AUTHENTICATION: "Authentication",
  CACHING: "Caching",
  CORS: "CORS",
  SECURITY: "Security",
  CONTENT: "Content",
} as const;

export const HTTP_HEADERS: HttpHeaderInfo[] = [
  // Authentication Headers
  {
    name: "Authorization",
    category: HTTP_HEADER_CATEGORIES.AUTHENTICATION,
    description:
      "Contains credentials for authenticating the user agent with the server",
    examples: [
      "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "Basic YWxhZGRpbjpvcGVuc2VzYW1l",
      'Digest username="john", realm="testrealm@host.com"',
    ],
    commonValues: ["Bearer", "Basic", "Digest", "OAuth"],
  },
  {
    name: "WWW-Authenticate",
    category: HTTP_HEADER_CATEGORIES.AUTHENTICATION,
    description:
      "Defines the authentication method that should be used to gain access",
    examples: [
      'Basic realm="Access to staging site"',
      'Bearer realm="example"',
      'Digest realm="testrealm@host.com", qop="auth,auth-int"',
    ],
  },

  // Content Headers
  {
    name: "Content-Type",
    category: HTTP_HEADER_CATEGORIES.CONTENT,
    description: "Indicates the media type of the resource",
    examples: [
      "application/json",
      "application/x-www-form-urlencoded",
      "multipart/form-data",
      "text/html; charset=utf-8",
      "application/xml",
    ],
    commonValues: [
      "application/json",
      "application/xml",
      "text/html",
      "text/plain",
      "application/x-www-form-urlencoded",
      "multipart/form-data",
      "application/pdf",
      "image/jpeg",
      "image/png",
    ],
  },
  {
    name: "Content-Length",
    category: HTTP_HEADER_CATEGORIES.CONTENT,
    description: "Indicates the size of the entity-body in bytes",
    examples: ["348", "0", "1024"],
  },
  {
    name: "Content-Encoding",
    category: HTTP_HEADER_CATEGORIES.CONTENT,
    description:
      "Specifies the encoding transformations applied to the entity-body",
    examples: ["gzip", "compress", "deflate", "br"],
    commonValues: ["gzip", "deflate", "br", "compress"],
  },
  {
    name: "Content-Disposition",
    category: HTTP_HEADER_CATEGORIES.CONTENT,
    description:
      "Indicates if content should be displayed inline or as attachment",
    examples: [
      "inline",
      'attachment; filename="example.pdf"',
      'form-data; name="file"; filename="upload.txt"',
    ],
  },

  // CORS Headers
  {
    name: "Access-Control-Allow-Origin",
    category: HTTP_HEADER_CATEGORIES.CORS,
    description: "Specifies which origins are allowed to access the resource",
    examples: ["*", "https://example.com", "null"],
    commonValues: ["*", "https://localhost:3000", "https://example.com"],
  },
  {
    name: "Access-Control-Allow-Methods",
    category: HTTP_HEADER_CATEGORIES.CORS,
    description:
      "Specifies which HTTP methods are allowed when accessing the resource",
    examples: ["GET, POST, PUT, DELETE", "GET, POST", "*"],
    commonValues: ["GET, POST, PUT, DELETE", "GET, POST, OPTIONS"],
  },
  {
    name: "Access-Control-Allow-Headers",
    category: HTTP_HEADER_CATEGORIES.CORS,
    description:
      "Indicates which headers can be used during the actual request",
    examples: [
      "Content-Type, Authorization",
      "X-Requested-With, Content-Type",
      "*",
    ],
    commonValues: [
      "Content-Type, Authorization",
      "X-Requested-With",
      "Accept, Content-Type, Authorization",
    ],
  },
  {
    name: "Access-Control-Expose-Headers",
    category: HTTP_HEADER_CATEGORIES.CORS,
    description:
      "Indicates which headers can be exposed as part of the response",
    examples: ["Content-Length", "X-Custom-Header", "Location"],
  },
  {
    name: "Access-Control-Max-Age",
    category: HTTP_HEADER_CATEGORIES.CORS,
    description:
      "Indicates how long the results of a preflight request can be cached",
    examples: ["86400", "3600", "600"],
  },
  {
    name: "Access-Control-Allow-Credentials",
    category: HTTP_HEADER_CATEGORIES.CORS,
    description:
      "Indicates whether the response can be shared when credentials are included",
    examples: ["true", "false"],
    commonValues: ["true", "false"],
  },

  // Caching Headers
  {
    name: "Cache-Control",
    category: HTTP_HEADER_CATEGORIES.CACHING,
    description: "Specifies directives for caching mechanisms",
    examples: [
      "no-cache",
      "no-store",
      "max-age=3600",
      "public, max-age=31536000",
      "private, must-revalidate",
    ],
    commonValues: [
      "no-cache",
      "no-store",
      "max-age=3600",
      "public",
      "private",
      "must-revalidate",
    ],
  },
  {
    name: "ETag",
    category: HTTP_HEADER_CATEGORIES.CACHING,
    description:
      "Provides a unique identifier for a specific version of a resource",
    examples: ['"686897696a7c876b7e"', 'W/"686897696a7c876b7e"', '"abc123"'],
  },
  {
    name: "Last-Modified",
    category: HTTP_HEADER_CATEGORIES.CACHING,
    description: "Indicates the date and time the resource was last modified",
    examples: [
      "Wed, 21 Oct 2015 07:28:00 GMT",
      "Tue, 15 Nov 1994 12:45:26 GMT",
    ],
  },
  {
    name: "If-Modified-Since",
    category: HTTP_HEADER_CATEGORIES.CACHING,
    description: "Makes the request conditional based on Last-Modified date",
    examples: ["Wed, 21 Oct 2015 07:28:00 GMT"],
  },
  {
    name: "If-None-Match",
    category: HTTP_HEADER_CATEGORIES.CACHING,
    description: "Makes the request conditional based on ETag",
    examples: ['"686897696a7c876b7e"', "*"],
  },

  // Security Headers
  {
    name: "X-Content-Type-Options",
    category: HTTP_HEADER_CATEGORIES.SECURITY,
    description: "Prevents MIME type sniffing",
    examples: ["nosniff"],
    commonValues: ["nosniff"],
  },
  {
    name: "X-Frame-Options",
    category: HTTP_HEADER_CATEGORIES.SECURITY,
    description: "Controls whether the page can be displayed in a frame",
    examples: ["DENY", "SAMEORIGIN", "ALLOW-FROM https://example.com"],
    commonValues: ["DENY", "SAMEORIGIN"],
  },
  {
    name: "X-XSS-Protection",
    category: HTTP_HEADER_CATEGORIES.SECURITY,
    description: "Enables cross-site scripting filtering",
    examples: ["1; mode=block", "0", "1"],
    commonValues: ["1; mode=block", "0"],
  },
  {
    name: "Strict-Transport-Security",
    category: HTTP_HEADER_CATEGORIES.SECURITY,
    description: "Forces HTTPS connections",
    examples: [
      "max-age=31536000",
      "max-age=31536000; includeSubDomains",
      "max-age=31536000; includeSubDomains; preload",
    ],
  },
  {
    name: "Content-Security-Policy",
    category: HTTP_HEADER_CATEGORIES.SECURITY,
    description: "Controls which resources the user agent is allowed to load",
    examples: [
      "default-src 'self'",
      "default-src 'self'; script-src 'self' 'unsafe-inline'",
      "default-src 'none'; script-src 'self'; connect-src 'self'",
    ],
  },

  // Request Headers
  {
    name: "Accept",
    category: HTTP_HEADER_CATEGORIES.REQUEST,
    description: "Indicates which content types the client can understand",
    examples: [
      "application/json",
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "application/json, text/plain, */*",
    ],
    commonValues: [
      "application/json",
      "text/html",
      "application/xml",
      "*/*",
      "text/plain",
    ],
  },
  {
    name: "Accept-Language",
    category: HTTP_HEADER_CATEGORIES.REQUEST,
    description: "Indicates which languages the client can understand",
    examples: ["en-US,en;q=0.9", "fr-FR,fr;q=0.9,en;q=0.8", "de-DE,de;q=0.9"],
    commonValues: ["en-US,en;q=0.9", "en", "fr", "de", "es"],
  },
  {
    name: "Accept-Encoding",
    category: HTTP_HEADER_CATEGORIES.REQUEST,
    description: "Indicates which content encodings the client can understand",
    examples: ["gzip, deflate, br", "gzip, deflate", "*"],
    commonValues: ["gzip, deflate, br", "gzip", "deflate"],
  },
  {
    name: "User-Agent",
    category: HTTP_HEADER_CATEGORIES.REQUEST,
    description:
      "Contains information about the user agent originating the request",
    examples: [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "curl/7.68.0",
      "Postman/7.36.1",
    ],
  },
  {
    name: "Referer",
    category: HTTP_HEADER_CATEGORIES.REQUEST,
    description: "Contains the address of the previous web page",
    examples: ["https://example.com/page1", "https://google.com"],
  },
  {
    name: "Origin",
    category: HTTP_HEADER_CATEGORIES.REQUEST,
    description: "Indicates where a fetch originates from",
    examples: ["https://example.com", "null"],
  },

  // Custom Headers
  {
    name: "X-API-Key",
    category: HTTP_HEADER_CATEGORIES.AUTHENTICATION,
    description: "API key for authentication",
    examples: ["abc123def456", "sk-1234567890abcdef"],
  },
  {
    name: "X-Requested-With",
    category: HTTP_HEADER_CATEGORIES.REQUEST,
    description: "Indicates that the request was made via XMLHttpRequest",
    examples: ["XMLHttpRequest"],
    commonValues: ["XMLHttpRequest"],
  },
  {
    name: "X-Forwarded-For",
    category: HTTP_HEADER_CATEGORIES.REQUEST,
    description:
      "Identifies the originating IP address of a client connecting through a proxy",
    examples: ["203.0.113.195", "203.0.113.195, 70.41.3.18"],
  },
  {
    name: "X-Real-IP",
    category: HTTP_HEADER_CATEGORIES.REQUEST,
    description: "The real IP address of the client",
    examples: ["203.0.113.195"],
  },
];

/**
 * Get headers by category
 */
export function getHeadersByCategory(category: string): HttpHeaderInfo[] {
  return HTTP_HEADERS.filter((header) => header.category === category);
}

/**
 * Search headers by name or description
 */
export function searchHeaders(query: string): HttpHeaderInfo[] {
  const lowerQuery = query.toLowerCase();
  return HTTP_HEADERS.filter(
    (header) =>
      header.name.toLowerCase().includes(lowerQuery) ||
      header.description.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get header info by name
 */
export function getHeaderInfo(name: string): HttpHeaderInfo | undefined {
  return HTTP_HEADERS.find(
    (header) => header.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Get common header presets
 */
export const HEADER_PRESETS = {
  "JSON API": {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  "Form Data": {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  },
  "File Upload": {
    "Content-Type": "multipart/form-data",
    Accept: "application/json",
  },
  "Basic Auth": {
    Authorization: "Basic dXNlcjpwYXNz",
    "Content-Type": "application/json",
  },
  "Bearer Token": {
    Authorization: "Bearer your-token-here",
    "Content-Type": "application/json",
  },
  "API Key": {
    "X-API-Key": "your-api-key-here",
    "Content-Type": "application/json",
  },
  "CORS Preflight": {
    "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers": "Content-Type, Authorization",
    Origin: "https://example.com",
  },
  "Cache Control": {
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  },
} as const;
