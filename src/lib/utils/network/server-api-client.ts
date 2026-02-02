/**
 * Server-side API client for network tools
 * Replaces browser-based network operations with server-side API calls
 */

export interface ServerPingResult {
  host: string;
  alive: boolean;
  responseTime?: number;
  error?: string;
  method?: string;
  timestamp: number;
}

export interface ServerPortScanResult {
  host: string;
  port: number;
  open: boolean;
  service?: string;
  responseTime?: number;
  timestamp: number;
}

export interface ServerDnsResult {
  domain: string;
  recordType: string;
  records: string[];
  success: boolean;
  error?: string;
  timestamp: number;
}

export interface ServerIpInfoResult {
  ip: string;
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
  organization?: string;
  asn?: string;
  error?: string;
  errorCode?: string;
  timestamp: number;
}

export interface ServerUrlTestResult {
  url: string;
  accessible: boolean;
  statusCode?: number;
  statusText?: string;
  responseTime?: number;
  headers?: Record<string, string>;
  contentType?: string;
  server?: string;
  error?: string;
  timestamp: number;
}

export interface ServerWebSocketTestResult {
  url: string;
  connected: boolean;
  responseTime?: number;
  protocol?: string;
  error?: string;
  timestamp: number;
}

export interface ServerSpeedTestResult {
  testType: "download" | "upload";
  bytesTransferred: number;
  duration: number;
  speedBps: number;
  speedKbps: number;
  speedMbps: number;
  completed?: boolean;
  error?: string;
  timestamp: number;
}

export interface ServerFileLinkResult {
  url: string;
  exists: boolean;
  statusCode?: number;
  statusText?: string;
  contentType?: string;
  contentLength?: number;
  lastModified?: string;
  headers?: Record<string, string>;
  error?: string;
  timestamp: number;
}

/**
 * Server-side ping host
 */
export async function serverPingHost(
  host: string,
  timeout?: number
): Promise<ServerPingResult> {
  try {
    const response = await fetch("/api/network/ping", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ host, timeout }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Server ping failed");
    }

    return data;
  } catch (error) {
    return {
      host,
      alive: false,
      error: error instanceof Error ? error.message : "Network error",
      timestamp: Date.now(),
    };
  }
}

/**
 * Server-side port scan
 */
export async function serverPortScan(
  host: string,
  ports: number[],
  timeout?: number
): Promise<ServerPortScanResult[]> {
  try {
    const response = await fetch("/api/network/port-scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ host, ports, timeout }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Server port scan failed");
    }

    return data.results || [];
  } catch (error) {
    return ports.map((port) => ({
      host,
      port,
      open: false,
      error: error instanceof Error ? error.message : "Network error",
      timestamp: Date.now(),
    }));
  }
}

/**
 * Server-side DNS lookup
 */
export async function serverDnsLookup(
  domain: string,
  recordType: string = "A"
): Promise<ServerDnsResult> {
  try {
    const response = await fetch("/api/network/dns-lookup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ domain, recordType }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Server DNS lookup failed");
    }

    return data;
  } catch (error) {
    return {
      domain,
      recordType,
      records: [], // Ensure records is always an array
      success: false,
      error: error instanceof Error ? error.message : "Network error",
      timestamp: Date.now(),
    };
  }
}

/**
 * Server-side IP info lookup
 */
export async function serverIpInfo(ip: string): Promise<ServerIpInfoResult> {
  try {
    const response = await fetch("/api/network/ip-info", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ip }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Server IP info lookup failed");
    }

    return data;
  } catch (error) {
    return {
      ip,
      error: error instanceof Error ? error.message : "Network error",
      timestamp: Date.now(),
    };
  }
}

/**
 * Server-side URL test
 */
export async function serverUrlTest(
  url: string,
  timeout?: number
): Promise<ServerUrlTestResult> {
  try {
    const response = await fetch("/api/network/url-test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, timeout }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Server URL test failed");
    }

    return data;
  } catch (error) {
    return {
      url,
      accessible: false,
      error: error instanceof Error ? error.message : "Network error",
      timestamp: Date.now(),
    };
  }
}

/**
 * Server-side WebSocket test
 */
export async function serverWebSocketTest(
  url: string,
  timeout?: number
): Promise<ServerWebSocketTestResult> {
  try {
    const response = await fetch("/api/network/websocket-test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, timeout }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Server WebSocket test failed");
    }

    return data;
  } catch (error) {
    return {
      url,
      connected: false,
      error: error instanceof Error ? error.message : "Network error",
      timestamp: Date.now(),
    };
  }
}

/**
 * Server-side speed test
 */
export async function serverSpeedTest(
  testType: "download" | "upload" = "download",
  duration: number = 10
): Promise<ServerSpeedTestResult> {
  try {
    const response = await fetch("/api/network/speed-test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ testType, duration }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Server speed test failed");
    }

    return data;
  } catch (error) {
    return {
      testType,
      bytesTransferred: 0,
      duration: 0,
      speedBps: 0,
      speedKbps: 0,
      speedMbps: 0,
      error: error instanceof Error ? error.message : "Network error",
      timestamp: Date.now(),
    };
  }
}

/**
 * Server-side file link check
 */
export async function serverFileLinkCheck(
  url: string
): Promise<ServerFileLinkResult> {
  try {
    const response = await fetch("/api/network/file-link-check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Server file link check failed");
    }

    return data;
  } catch (error) {
    return {
      url,
      exists: false,
      error: error instanceof Error ? error.message : "Network error",
      timestamp: Date.now(),
    };
  }
}
