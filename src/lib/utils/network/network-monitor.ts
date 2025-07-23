/**
 * Network monitoring and performance utilities
 */

export interface PingResult {
  host: string;
  alive: boolean;
  responseTime?: number;
  error?: string;
  errorDetails?: string;
  method?: string;
  timestamp: number;
}

export interface PortScanResult {
  host: string;
  port: number;
  open: boolean;
  service?: string;
  responseTime?: number;
  error?: string;
  errorDetails?: string;
  method?: string;
  timestamp: number;
}

export interface NetworkPerformance {
  downloadSpeed?: number; // Mbps
  uploadSpeed?: number; // Mbps
  latency?: number; // ms
  jitter?: number; // ms
  packetLoss?: number; // percentage
  timestamp: number;
}

export interface TraceRouteHop {
  hop: number;
  host?: string;
  ip?: string;
  responseTime?: number;
  error?: string;
}

export interface TraceRouteResult {
  target: string;
  hops: TraceRouteHop[];
  error?: string;
  timestamp: number;
}

/**
 * Ping a host (HTTP-based ping since ICMP is not available in browsers)
 */
export async function pingHost(
  host: string,
  timeout = 5000
): Promise<PingResult> {
  const timestamp = Date.now();
  const startTime = performance.now();

  try {
    // Ensure host has protocol
    const url = host.startsWith("http") ? host : `https://${host}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    let method = "HEAD";

    try {
      // First try: HEAD request
      await fetch(url, {
        method: "HEAD",
        mode: "no-cors", // Allow cross-origin requests
        signal: controller.signal,
      });
    } catch {
      // Fallback: GET request (some servers don't support HEAD)
      method = "GET";
      await fetch(url, {
        method: "GET",
        mode: "no-cors",
        signal: controller.signal,
      });
    }

    clearTimeout(timeoutId);
    const responseTime = performance.now() - startTime;

    return {
      host,
      alive: true,
      responseTime: Math.round(responseTime),
      method: `HTTP ${method} (no-cors)`,
      timestamp,
    };
  } catch (error) {
    const responseTime = performance.now() - startTime;

    if (error instanceof Error) {
      const originalMessage = error.message;
      const originalStack = error.stack || "";

      if (error.name === "AbortError") {
        return {
          host,
          alive: false,
          error: "Request timeout",
          errorDetails: `No response within ${timeout}ms. Original error: ${originalMessage}`,
          method: "HTTP HEAD (no-cors)",
          timestamp,
        };
      }

      if (
        error.name === "TypeError" &&
        originalMessage.includes("Failed to fetch")
      ) {
        // Try alternative method first
        try {
          const imgStartTime = performance.now();
          const img = new Image();
          const testUrl = host.startsWith("http") ? host : `http://${host}`;

          await new Promise((resolve, reject) => {
            const imgTimeout = setTimeout(() => {
              img.src = "";
              reject(new Error("Image load timeout"));
            }, timeout);

            img.onload = img.onerror = () => {
              clearTimeout(imgTimeout);
              resolve(true);
            };

            img.src = `${testUrl}/favicon.ico`;
          });

          const imgResponseTime = performance.now() - imgStartTime;
          return {
            host,
            alive: true,
            responseTime: Math.round(imgResponseTime),
            method: "Image load test",
            timestamp,
          };
        } catch {
          return {
            host,
            alive: false,
            error: "Network/CORS error",
            errorDetails: `Connection failed: ${originalMessage}. This could be due to CORS restrictions, network connectivity issues, or the server being down.`,
            method: "HTTP HEAD + Image fallback",
            timestamp,
          };
        }
      }

      if (
        originalMessage.includes("CORS") ||
        originalMessage.includes("Access-Control")
      ) {
        return {
          host,
          alive: false,
          error: "CORS restriction",
          errorDetails: `CORS policy violation: ${originalMessage}`,
          method: "HTTP HEAD (no-cors)",
          responseTime: Math.round(responseTime),
          timestamp,
        };
      }

      if (originalMessage.includes("net::ERR_")) {
        return {
          host,
          alive: false,
          error: "Browser network error",
          errorDetails: `Browser error: ${originalMessage}`,
          method: "HTTP HEAD (no-cors)",
          responseTime: Math.round(responseTime),
          timestamp,
        };
      }

      return {
        host,
        alive: false,
        error: error.name || "Connection error",
        errorDetails: originalStack
          ? `${originalMessage}\n\nStack trace:\n${originalStack}`
          : originalMessage,
        method: "HTTP HEAD (no-cors)",
        responseTime: Math.round(responseTime),
        timestamp,
      };
    }

    return {
      host,
      alive: false,
      error: "Unknown error",
      errorDetails: `Unexpected error: ${String(error)}`,
      method: "HTTP HEAD (no-cors)",
      timestamp,
    };
  }
}

/**
 * Scan multiple ports on a host
 */
export async function scanPorts(
  host: string,
  ports: number[],
  timeout = 3000
): Promise<PortScanResult[]> {
  const promises = ports.map((port) => scanPort(host, port, timeout));
  return Promise.all(promises);
}

/**
 * Scan a single port (limited in browser environment)
 */
export async function scanPort(
  host: string,
  port: number,
  timeout = 3000
): Promise<PortScanResult> {
  const timestamp = Date.now();
  const startTime = performance.now();

  try {
    // For common HTTP/HTTPS ports, try direct connection
    if (port === 80 || port === 443 || port === 8080 || port === 8443) {
      const protocol = port === 443 || port === 8443 ? "https" : "http";
      const url = `${protocol}://${host}:${port}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      let method = "HEAD";

      try {
        // First try: HEAD request
        await fetch(url, {
          method: "HEAD",
          mode: "no-cors",
          signal: controller.signal,
        });
      } catch {
        // Fallback: GET request
        method = "GET";
        await fetch(url, {
          method: "GET",
          mode: "no-cors",
          signal: controller.signal,
        });
      }

      clearTimeout(timeoutId);
      const responseTime = performance.now() - startTime;

      return {
        host,
        port,
        open: true,
        service: getServiceName(port),
        responseTime: Math.round(responseTime),
        method: `HTTP ${method} request`,
        timestamp,
      };
    }

    // For WebSocket ports, try WebSocket connection
    if (port === 8080 || port === 9001 || port === 3000) {
      try {
        const wsUrl = `ws://${host}:${port}`;
        const ws = new WebSocket(wsUrl);

        const result = await new Promise<PortScanResult>((resolve) => {
          const wsTimeout = setTimeout(() => {
            ws.close();
            resolve({
              host,
              port,
              open: false,
              error: "Connection timeout",
              errorDetails: `WebSocket connection to ${wsUrl} timed out after ${timeout}ms`,
              method: "WebSocket test",
              timestamp,
            });
          }, timeout);

          ws.onopen = () => {
            clearTimeout(wsTimeout);
            ws.close();
            const responseTime = performance.now() - startTime;
            resolve({
              host,
              port,
              open: true,
              service: getServiceName(port),
              responseTime: Math.round(responseTime),
              method: "WebSocket connection",
              timestamp,
            });
          };

          ws.onerror = () => {
            clearTimeout(wsTimeout);
            ws.close();
            resolve({
              host,
              port,
              open: false,
              error: "Connection failed",
              errorDetails: `WebSocket connection to ${wsUrl} failed`,
              method: "WebSocket test",
              timestamp,
            });
          };
        });

        return result;
      } catch (wsError) {
        const wsOriginalMessage =
          wsError instanceof Error
            ? wsError.message
            : "Unknown WebSocket error";
        const wsOriginalStack =
          wsError instanceof Error ? wsError.stack || "" : "";

        return {
          host,
          port,
          open: false,
          error: "WebSocket error",
          errorDetails: wsOriginalStack
            ? `${wsOriginalMessage}\n\nStack trace:\n${wsOriginalStack}`
            : wsOriginalMessage,
          method: "WebSocket test",
          timestamp,
        };
      }
    }

    // For other ports, we can't directly test due to browser limitations
    return {
      host,
      port,
      open: false,
      error: "Browser security limitation",
      errorDetails: `Cannot test port ${port} - browsers only allow testing specific ports (80, 443, 8080, 8443) due to security restrictions`,
      method: "Browser limitation check",
      timestamp,
    };
  } catch (error) {
    const responseTime = performance.now() - startTime;

    if (error instanceof Error) {
      const originalMessage = error.message;
      const originalStack = error.stack || "";

      if (error.name === "AbortError") {
        return {
          host,
          port,
          open: false,
          error: "Request timeout",
          errorDetails: `No response within ${timeout}ms. Original error: ${originalMessage}`,
          method: "HTTP HEAD request",
          responseTime: Math.round(responseTime),
          timestamp,
        };
      }

      if (
        originalMessage.includes("CORS") ||
        originalMessage.includes("Access-Control")
      ) {
        return {
          host,
          port,
          open: false,
          error: "CORS restriction",
          errorDetails: `CORS policy violation: ${originalMessage}`,
          method: "HTTP HEAD request",
          responseTime: Math.round(responseTime),
          timestamp,
        };
      }

      if (originalMessage.includes("net::ERR_")) {
        return {
          host,
          port,
          open: false,
          error: "Browser network error",
          errorDetails: `Browser error: ${originalMessage}`,
          method: "HTTP HEAD request",
          responseTime: Math.round(responseTime),
          timestamp,
        };
      }

      return {
        host,
        port,
        open: false,
        error: error.name || "Connection error",
        errorDetails: originalStack
          ? `${originalMessage}\n\nStack trace:\n${originalStack}`
          : originalMessage,
        method: "HTTP HEAD request",
        responseTime: Math.round(responseTime),
        timestamp,
      };
    }

    return {
      host,
      port,
      open: false,
      error: "Unknown error",
      errorDetails: `Unexpected error: ${String(error)}`,
      method: "HTTP HEAD request",
      timestamp,
    };
  }
}

/**
 * Perform network speed test (simplified)
 */
export async function performSpeedTest(): Promise<NetworkPerformance> {
  const timestamp = Date.now();

  try {
    console.log("Starting speed test...");

    // Download test - fetch a small file and measure speed
    const downloadResult = await measureDownloadSpeed();
    console.log("Download test completed:", downloadResult);

    // Latency test - ping a known fast server
    const latencyResult = await measureLatency();
    console.log("Latency test completed:", latencyResult);

    return {
      downloadSpeed: downloadResult.speed,
      latency: latencyResult.latency,
      timestamp,
    };
  } catch (error) {
    console.error("Speed test error:", error);
    const originalMessage =
      error instanceof Error ? error.message : "Unknown error";
    const originalStack = error instanceof Error ? error.stack || "" : "";

    throw new Error(
      originalStack
        ? `Speed test failed: ${originalMessage}\n\nStack trace:\n${originalStack}`
        : `Speed test failed: ${originalMessage}`
    );
  }
}

/**
 * Measure download speed
 */
async function measureDownloadSpeed(): Promise<{ speed: number }> {
  // Try multiple test files for better accuracy
  const testUrls = [
    "https://httpbin.org/bytes/1048576", // 1MB
    "https://jsonplaceholder.typicode.com/photos", // JSON data
    "https://httpbin.org/bytes/524288", // 512KB fallback
  ];

  for (const testUrl of testUrls) {
    try {
      console.log(`Testing download speed with: ${testUrl}`);
      const startTime = performance.now();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(testUrl, {
        method: "GET",
        mode: "cors",
        signal: controller.signal,
      });

      if (!response.ok) {
        console.log(`Failed to fetch ${testUrl}: ${response.status}`);
        continue;
      }

      const blob = await response.blob();
      clearTimeout(timeoutId);
      const endTime = performance.now();

      const sizeInBits = blob.size * 8;
      const timeInSeconds = (endTime - startTime) / 1000;
      const speedInBps = sizeInBits / timeInSeconds;
      const speedInMbps = speedInBps / (1024 * 1024);

      console.log(`Download test successful: ${speedInMbps.toFixed(2)} Mbps`);
      return { speed: Math.round(speedInMbps * 100) / 100 };
    } catch (error) {
      const originalMessage =
        error instanceof Error ? error.message : String(error);
      console.log(`Download test failed for ${testUrl}: ${originalMessage}`);
      continue;
    }
  }

  throw new Error("All download speed tests failed");
}

/**
 * Measure latency
 */
async function measureLatency(): Promise<{ latency: number }> {
  const testUrls = [
    "https://httpbin.org/get",
    "https://jsonplaceholder.typicode.com/posts/1",
    "https://api.github.com",
  ];

  const measurements: number[] = [];

  for (const testUrl of testUrls) {
    for (let i = 0; i < 3; i++) {
      try {
        console.log(`Latency test ${i + 1}/3 for ${testUrl}`);
        const startTime = performance.now();

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        await fetch(testUrl, {
          method: "HEAD",
          mode: "cors",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const endTime = performance.now();
        measurements.push(endTime - startTime);
        console.log(`Latency measurement: ${endTime - startTime}ms`);
      } catch (error) {
        const originalMessage =
          error instanceof Error ? error.message : String(error);
        console.log(`Latency test failed for ${testUrl}: ${originalMessage}`);
        continue;
      }
    }

    // If we got measurements from this URL, break
    if (measurements.length > 0) break;
  }

  if (measurements.length === 0) {
    throw new Error(
      "All latency tests failed - unable to connect to any test servers. This could indicate network connectivity issues or CORS restrictions."
    );
  }

  const averageLatency =
    measurements.reduce((a, b) => a + b, 0) / measurements.length;

  console.log(
    `Average latency: ${averageLatency}ms from ${measurements.length} measurements`
  );
  return { latency: Math.round(averageLatency) };
}

/**
 * Get service name for port
 */
function getServiceName(port: number): string {
  const services: Record<number, string> = {
    21: "FTP",
    22: "SSH",
    23: "Telnet",
    25: "SMTP",
    53: "DNS",
    80: "HTTP",
    110: "POP3",
    143: "IMAP",
    443: "HTTPS",
    993: "IMAPS",
    995: "POP3S",
    3389: "RDP",
    5432: "PostgreSQL",
    3306: "MySQL",
    6379: "Redis",
    27017: "MongoDB",
  };

  return services[port] || "Unknown";
}

/**
 * Get common ports for scanning
 */
export function getCommonPorts(): number[] {
  return [21, 22, 23, 25, 53, 80, 110, 143, 443, 993, 995, 3389, 5432, 3306];
}

/**
 * Predefined scan profiles
 */
export const SCAN_PROFILES = {
  "Quick Scan": {
    name: "Quick Scan",
    description: "Scan common ports quickly",
    ports: [21, 22, 23, 25, 53, 80, 110, 143, 443, 993, 995, 3389],
    timeout: 3000,
  },
  "Common Ports": {
    name: "Common Ports",
    description: "Scan most commonly used ports",
    ports: [
      21, 22, 23, 25, 53, 80, 110, 143, 443, 993, 995, 3389, 5432, 3306, 6379,
      27017,
    ],
    timeout: 5000,
  },
  "Web Servers": {
    name: "Web Servers",
    description: "Scan web server related ports",
    ports: [80, 443, 8080, 8443, 8000, 8888, 3000, 5000, 9000],
    timeout: 3000,
  },
  "Database Ports": {
    name: "Database Ports",
    description: "Scan database server ports",
    ports: [3306, 5432, 1433, 1521, 27017, 6379, 5984, 9200, 9300],
    timeout: 5000,
  },
  "Mail Servers": {
    name: "Mail Servers",
    description: "Scan email server ports",
    ports: [25, 110, 143, 465, 587, 993, 995],
    timeout: 5000,
  },
  "All TCP Ports": {
    name: "All TCP Ports",
    description: "Comprehensive scan (1-1000)",
    ports: Array.from({ length: 1000 }, (_, i) => i + 1),
    timeout: 2000,
  },
};

/**
 * Scan ports using a predefined profile
 */
export async function scanWithProfile(
  host: string,
  profileName: string,
  onProgress?: (progress: number) => void
): Promise<PortScanResult[]> {
  const profile = SCAN_PROFILES[profileName as keyof typeof SCAN_PROFILES];
  if (!profile) {
    throw new Error(`Unknown scan profile: ${profileName}`);
  }

  const results: PortScanResult[] = [];
  const totalPorts = profile.ports.length;

  for (let i = 0; i < profile.ports.length; i++) {
    const port = profile.ports[i];
    try {
      const result = await scanPort(host, port, profile.timeout);
      results.push(result);

      if (onProgress) {
        const progress = ((i + 1) / totalPorts) * 100;
        onProgress(progress);
      }
    } catch (error) {
      const originalMessage =
        error instanceof Error ? error.message : String(error);
      const originalStack = error instanceof Error ? error.stack || "" : "";

      results.push({
        host,
        port,
        open: false,
        error: "Scan failed",
        errorDetails: originalStack
          ? `${originalMessage}\n\nStack trace:\n${originalStack}`
          : originalMessage,
        timestamp: Date.now(),
      });
    }
  }

  return results;
}

/**
 * Monitor network connectivity
 */
export class NetworkMonitor {
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;
  private callbacks: ((status: boolean) => void)[] = [];

  start(intervalMs = 30000) {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(async () => {
      const isOnline = await this.checkConnectivity();
      this.callbacks.forEach((callback) => callback(isOnline));
    }, intervalMs);
  }

  stop() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
  }

  onStatusChange(callback: (status: boolean) => void) {
    this.callbacks.push(callback);
  }

  private async checkConnectivity(): Promise<boolean> {
    try {
      const response = await fetch("https://httpbin.org/get", {
        method: "HEAD",
        mode: "cors",
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
