/**
 * IP utilities for IP address operations and geolocation
 */

export interface IpLocation {
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
  timestamp: number;
}

export interface IpValidationResult {
  ip: string;
  isValid: boolean;
  version: 4 | 6 | null;
  isPrivate: boolean;
  isLoopback: boolean;
  isMulticast: boolean;
  isReserved: boolean;
  error?: string;
}

/**
 * Validate IPv4 address
 */
export function isValidIPv4(ip: string): boolean {
  const ipv4Regex =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
}

/**
 * Validate IPv6 address
 */
export function isValidIPv6(ip: string): boolean {
  const ipv6Regex =
    /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
  return ipv6Regex.test(ip);
}

/**
 * Validate IP address (IPv4 or IPv6)
 */
export function validateIP(ip: string): IpValidationResult {
  const isIPv4 = isValidIPv4(ip);
  const isIPv6 = isValidIPv6(ip);

  if (!isIPv4 && !isIPv6) {
    return {
      ip,
      isValid: false,
      version: null,
      isPrivate: false,
      isLoopback: false,
      isMulticast: false,
      isReserved: false,
      error: "Invalid IP address format",
    };
  }

  const version = isIPv4 ? 4 : 6;

  return {
    ip,
    isValid: true,
    version,
    isPrivate: isPrivateIP(ip, version),
    isLoopback: isLoopbackIP(ip, version),
    isMulticast: isMulticastIP(ip, version),
    isReserved: isReservedIP(ip, version),
  };
}

/**
 * Check if IP is private
 */
export function isPrivateIP(ip: string, version?: 4 | 6): boolean {
  if (version === 4 || isValidIPv4(ip)) {
    const parts = ip.split(".").map(Number);

    // 10.0.0.0/8
    if (parts[0] === 10) return true;

    // 172.16.0.0/12
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

    // 192.168.0.0/16
    if (parts[0] === 192 && parts[1] === 168) return true;

    return false;
  }

  if (version === 6 || isValidIPv6(ip)) {
    // IPv6 private addresses
    const normalizedIP = ip.toLowerCase();

    // Unique local addresses (fc00::/7)
    if (normalizedIP.startsWith("fc") || normalizedIP.startsWith("fd"))
      return true;

    // Link-local addresses (fe80::/10)
    if (
      normalizedIP.startsWith("fe8") ||
      normalizedIP.startsWith("fe9") ||
      normalizedIP.startsWith("fea") ||
      normalizedIP.startsWith("feb")
    )
      return true;

    return false;
  }

  return false;
}

/**
 * Check if IP is loopback
 */
export function isLoopbackIP(ip: string, version?: 4 | 6): boolean {
  if (version === 4 || isValidIPv4(ip)) {
    return ip.startsWith("127.");
  }

  if (version === 6 || isValidIPv6(ip)) {
    const normalizedIP = ip.toLowerCase();
    return (
      normalizedIP === "::1" ||
      normalizedIP === "0000:0000:0000:0000:0000:0000:0000:0001"
    );
  }

  return false;
}

/**
 * Check if IP is multicast
 */
export function isMulticastIP(ip: string, version?: 4 | 6): boolean {
  if (version === 4 || isValidIPv4(ip)) {
    const firstOctet = parseInt(ip.split(".")[0]);
    return firstOctet >= 224 && firstOctet <= 239;
  }

  if (version === 6 || isValidIPv6(ip)) {
    const normalizedIP = ip.toLowerCase();
    return normalizedIP.startsWith("ff");
  }

  return false;
}

/**
 * Check if IP is reserved
 */
export function isReservedIP(ip: string, version?: 4 | 6): boolean {
  if (version === 4 || isValidIPv4(ip)) {
    const parts = ip.split(".").map(Number);

    // 0.0.0.0/8 - This network
    if (parts[0] === 0) return true;

    // 169.254.0.0/16 - Link local
    if (parts[0] === 169 && parts[1] === 254) return true;

    // 224.0.0.0/4 - Multicast
    if (parts[0] >= 224) return true;

    return false;
  }

  if (version === 6 || isValidIPv6(ip)) {
    const normalizedIP = ip.toLowerCase();

    // Reserved prefixes
    if (normalizedIP.startsWith("2001:db8")) return true; // Documentation
    if (normalizedIP.startsWith("2001:10")) return true; // ORCHID
    if (normalizedIP.startsWith("2002:")) return true; // 6to4

    return false;
  }

  return false;
}

/**
 * Get IP location information with improved error handling
 */
export async function getIPLocation(ip: string): Promise<IpLocation> {
  const timestamp = Date.now();

  try {
    // Multiple providers for redundancy
    const providers = [
      {
        name: "ipapi.co",
        url: `https://ipapi.co/${ip}/json/`,
        transform: (data: {
          country_name?: string;
          country_code?: string;
          region?: string;
          city?: string;
          latitude?: number;
          longitude?: number;
          timezone?: string;
          isp?: string;
          org?: string;
          asn?: string;
        }) => ({
          ip,
          country: data.country_name,
          countryCode: data.country_code,
          region: data.region,
          city: data.city,
          latitude: data.latitude,
          longitude: data.longitude,
          timezone: data.timezone,
          isp: data.isp,
          organization: data.org,
          asn: data.asn,
          timestamp,
        }),
      },
      {
        name: "ip-api.com",
        url: `http://ip-api.com/json/${ip}`,
        transform: (data: {
          country?: string;
          countryCode?: string;
          regionName?: string;
          city?: string;
          lat?: number;
          lon?: number;
          timezone?: string;
          isp?: string;
          org?: string;
          as?: string;
        }) => ({
          ip,
          country: data.country,
          countryCode: data.countryCode,
          region: data.regionName,
          city: data.city,
          latitude: data.lat,
          longitude: data.lon,
          timezone: data.timezone,
          isp: data.isp,
          organization: data.org,
          asn: data.as,
          timestamp,
        }),
      },
    ];

    for (const provider of providers) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(provider.url, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.error || data.status === "fail") {
          throw new Error(data.message || data.reason || "API returned error");
        }

        return provider.transform(data);
      } catch (error) {
        console.warn(`Provider ${provider.name} failed:`, error);
        if (provider === providers[providers.length - 1]) {
          // Last provider failed
          throw error;
        }
        // Try next provider
        continue;
      }
    }

    throw new Error("All providers failed");
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const detailedError =
      error instanceof Error && error.name === "AbortError"
        ? "Request timeout - please try again"
        : errorMessage;

    return {
      ip,
      error: `IP lookup failed: ${detailedError}`,
      timestamp,
    };
  }
}

/**
 * Get current public IP with fallback providers
 */
export async function getCurrentPublicIP(): Promise<{
  ip: string;
  error?: string;
}> {
  const providers = [
    "https://api.ipify.org?format=json",
    "https://ipapi.co/json/",
    "https://api.my-ip.io/ip.json",
    "https://httpbin.org/ip",
  ];

  for (const provider of providers) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(provider, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Different providers have different response formats
      let ip = "";
      if (data.ip) {
        ip = data.ip;
      } else if (data.origin) {
        ip = data.origin; // httpbin.org format
      } else if (typeof data === "string") {
        ip = data;
      }

      if (ip && validateIP(ip).isValid) {
        return { ip };
      }

      throw new Error("Invalid IP returned from provider");
    } catch (error) {
      console.warn(`IP provider ${provider} failed:`, error);
      if (provider === providers[providers.length - 1]) {
        // Last provider failed
        return {
          ip: "",
          error: `All IP providers failed. Last error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        };
      }
      // Try next provider
      continue;
    }
  }

  return {
    ip: "",
    error: "Failed to get public IP from any provider",
  };
}

/**
 * Generate IP range
 */
export function generateIPRange(startIP: string, endIP: string): string[] {
  if (!isValidIPv4(startIP) || !isValidIPv4(endIP)) {
    return [];
  }

  const ipToNumber = (ip: string): number => {
    const parts = ip.split(".").map(Number);
    return (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
  };

  const numberToIP = (num: number): string => {
    return [
      (num >>> 24) & 255,
      (num >>> 16) & 255,
      (num >>> 8) & 255,
      num & 255,
    ].join(".");
  };

  const startNum = ipToNumber(startIP);
  const endNum = ipToNumber(endIP);
  const ips: string[] = [];

  if (endNum - startNum > 1000) {
    throw new Error("IP range too large (max 1000 IPs)");
  }

  for (let i = startNum; i <= endNum; i++) {
    ips.push(numberToIP(i));
  }

  return ips;
}

/**
 * Parse CIDR notation
 */
export function parseCIDR(
  cidr: string
): { network: string; mask: number; ips: string[] } | null {
  const [network, maskStr] = cidr.split("/");
  const mask = parseInt(maskStr);

  if (!isValidIPv4(network) || mask < 0 || mask > 32) {
    return null;
  }

  const ipToNumber = (ip: string): number => {
    const parts = ip.split(".").map(Number);
    return (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
  };

  const numberToIP = (num: number): string => {
    return [
      (num >>> 24) & 255,
      (num >>> 16) & 255,
      (num >>> 8) & 255,
      num & 255,
    ].join(".");
  };

  const networkNum = ipToNumber(network);
  const hostBits = 32 - mask;
  const hostCount = Math.pow(2, hostBits);

  if (hostCount > 1000) {
    return {
      network,
      mask,
      ips: [], // Too many IPs to list
    };
  }

  const ips: string[] = [];
  for (let i = 0; i < hostCount; i++) {
    ips.push(numberToIP(networkNum + i));
  }

  return { network, mask, ips };
}
