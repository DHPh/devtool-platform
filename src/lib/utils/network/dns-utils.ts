/**
 * DNS utilities for DNS record lookup and domain information
 */

export interface DnsRecord {
  name: string;
  type: string;
  value: string;
  ttl?: number;
}

export interface DnsLookupResult {
  domain: string;
  recordType?: string;
  records: DnsRecord[];
  success?: boolean;
  error?: string;
  timestamp: number;
  provider?: string;
}

export interface WhoisResult {
  domain: string;
  registrar?: string;
  registrationDate?: string;
  expirationDate?: string;
  nameServers?: string[];
  status?: string[];
  error?: string;
  timestamp: number;
}

export interface IpInfo {
  ip: string;
  hostname?: string;
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  isp?: string;
  organization?: string;
  asn?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  error?: string;
  timestamp: number;
}

/**
 * DNS record types
 */
export const DNS_RECORD_TYPES = [
  "A",
  "AAAA",
  "CNAME",
  "MX",
  "TXT",
  "NS",
  "SOA",
  "PTR",
  "SRV",
  "SPF",
] as const;

export type DnsRecordType = (typeof DNS_RECORD_TYPES)[number];

interface DohResponse {
  Status: number;
  Answer?: Array<{
    name: string;
    type: number;
    data: string;
    TTL: number;
  }>;
}

/**
 * Perform DNS lookup using browser APIs with multiple providers
 */
export async function performDnsLookup(
  domain: string,
  recordType: DnsRecordType = "A"
): Promise<DnsLookupResult> {
  const timestamp = Date.now();

  const providers = [
    {
      name: "Google DNS",
      url: `https://dns.google/resolve?name=${encodeURIComponent(
        domain
      )}&type=${recordType}`,
      transform: (data: DohResponse) => {
        if (data.Status === 0 && data.Answer) {
          return data.Answer.map((record) => ({
            name: record.name,
            type: getRecordTypeName(record.type),
            value: record.data,
            ttl: record.TTL,
          }));
        }
        return [];
      },
    },
    {
      name: "Cloudflare DNS",
      url: `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(
        domain
      )}&type=${recordType}`,
      transform: (data: DohResponse) => {
        if (data.Status === 0 && data.Answer) {
          return data.Answer.map((record) => ({
            name: record.name,
            type: getRecordTypeName(record.type),
            value: record.data,
            ttl: record.TTL,
          }));
        }
        return [];
      },
    },
  ];

  for (const provider of providers) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(provider.url, {
        headers: {
          Accept: "application/dns-json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const records = provider.transform(data);

      if (records.length > 0) {
        return {
          domain,
          recordType,
          records,
          success: true,
          timestamp,
          provider: provider.name,
        };
      } else if (data.Status === 3) {
        // NXDOMAIN - domain doesn't exist
        return {
          domain,
          recordType,
          records: [],
          success: false,
          error: "Domain not found (NXDOMAIN)",
          timestamp,
          provider: provider.name,
        };
      } else if (data.Status === 2) {
        // SERVFAIL
        return {
          domain,
          recordType,
          records: [],
          success: false,
          error: "DNS server failure (SERVFAIL)",
          timestamp,
          provider: provider.name,
        };
      }
    } catch (error) {
      console.warn(`DNS provider ${provider.name} failed:`, error);
      if (provider === providers[providers.length - 1]) {
        // Last provider failed
        return {
          domain,
          recordType,
          records: [],
          success: false,
          error: `DNS lookup failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          timestamp,
          provider: provider.name,
        };
      }
      // Try next provider
      continue;
    }
  }

  return {
    domain,
    recordType,
    records: [],
    success: false,
    error: "All DNS providers failed",
    timestamp,
  };
}

/**
 * Get multiple DNS record types
 */
export async function getMultipleDnsRecords(
  domain: string,
  types: DnsRecordType[]
): Promise<DnsLookupResult[]> {
  const promises = types.map((type) => performDnsLookup(domain, type));
  return Promise.all(promises);
}

/**
 * Get IP information using public IP API
 */
export async function getIpInfo(ip: string): Promise<IpInfo> {
  const timestamp = Date.now();

  try {
    // Use ipapi.co for IP information
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await response.json();

    if (data.error) {
      return {
        ip,
        error: data.reason || "IP lookup failed",
        timestamp,
      };
    }

    return {
      ip,
      hostname: data.hostname,
      city: data.city,
      region: data.region,
      country: data.country_name,
      countryCode: data.country_code,
      isp: data.isp,
      organization: data.org,
      asn: data.asn,
      timezone: data.timezone,
      latitude: data.latitude,
      longitude: data.longitude,
      timestamp,
    };
  } catch (error) {
    return {
      ip,
      error: error instanceof Error ? error.message : "IP lookup failed",
      timestamp,
    };
  }
}

/**
 * Check if IP is in blacklist
 */
export async function checkIpReputation(ip: string): Promise<{
  ip: string;
  isBlacklisted: boolean;
  reputation: "good" | "suspicious" | "malicious" | "unknown";
  sources: string[];
  error?: string;
  timestamp: number;
}> {
  const timestamp = Date.now();

  try {
    // Use AbuseIPDB API (requires API key in production)
    // For demo purposes, we'll simulate the check
    const isPrivateIp = isPrivateIpAddress(ip);

    if (isPrivateIp) {
      return {
        ip,
        isBlacklisted: false,
        reputation: "good",
        sources: ["Private IP"],
        timestamp,
      };
    }

    // Simulate reputation check
    return {
      ip,
      isBlacklisted: false,
      reputation: "unknown",
      sources: ["Demo Mode"],
      error: "API key required for actual reputation check",
      timestamp,
    };
  } catch (error) {
    return {
      ip,
      isBlacklisted: false,
      reputation: "unknown",
      sources: [],
      error: error instanceof Error ? error.message : "Reputation check failed",
      timestamp,
    };
  }
}

/**
 * Perform WHOIS lookup (simulated - real WHOIS requires backend)
 */
export async function performWhoisLookup(domain: string): Promise<WhoisResult> {
  const timestamp = Date.now();

  try {
    // In a real implementation, this would use a WHOIS API
    // For demo purposes, we'll use a public WHOIS API
    const response = await fetch(
      `https://api.whois.vu/?q=${encodeURIComponent(domain)}`
    );
    const data = await response.text();

    // Parse basic WHOIS data (simplified)
    const registrarMatch = data.match(/Registrar:\s*(.+)/i);
    const createdMatch = data.match(/Creation Date:\s*(.+)/i);
    const expiresMatch = data.match(/Registry Expiry Date:\s*(.+)/i);

    return {
      domain,
      registrar: registrarMatch?.[1]?.trim(),
      registrationDate: createdMatch?.[1]?.trim(),
      expirationDate: expiresMatch?.[1]?.trim(),
      timestamp,
    };
  } catch (error) {
    return {
      domain,
      error: error instanceof Error ? error.message : "WHOIS lookup failed",
      timestamp,
    };
  }
}

/**
 * Validate domain name
 */
export function isValidDomain(domain: string): boolean {
  const domainRegex =
    /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return domainRegex.test(domain) && domain.length <= 253;
}

/**
 * Validate IP address
 */
export function isValidIpv4(ip: string): boolean {
  const ipv4Regex =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
}

/**
 * Check if IP is private
 */
export function isPrivateIpAddress(ip: string): boolean {
  if (!isValidIpv4(ip)) return false;

  const parts = ip.split(".").map(Number);

  // 10.0.0.0/8
  if (parts[0] === 10) return true;

  // 172.16.0.0/12
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

  // 192.168.0.0/16
  if (parts[0] === 192 && parts[1] === 168) return true;

  // 127.0.0.0/8 (localhost)
  if (parts[0] === 127) return true;

  return false;
}

/**
 * Convert DNS record type number to name
 */
function getRecordTypeName(type: number): string {
  const typeMap: Record<number, string> = {
    1: "A",
    28: "AAAA",
    5: "CNAME",
    15: "MX",
    16: "TXT",
    2: "NS",
    6: "SOA",
    12: "PTR",
    33: "SRV",
  };

  return typeMap[type] || `TYPE${type}`;
}

/**
 * Extract domain from URL
 */
export function extractDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `http://${url}`);
    return urlObj.hostname;
  } catch {
    return url;
  }
}
