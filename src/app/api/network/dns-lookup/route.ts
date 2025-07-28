import { NextRequest, NextResponse } from "next/server";
import { promises as dns } from "dns";

interface DnsError extends Error {
  code?: string;
  errno?: number;
  syscall?: string;
  hostname?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { domain, recordType, recordTypes } = await request.json();

    if (!domain) {
      return NextResponse.json(
        { error: "Domain is required" },
        { status: 400 }
      );
    }

    // Handle both single recordType and multiple recordTypes for backward compatibility
    const typesToLookup = recordTypes || [recordType || "A"];

    const results = await Promise.all(
      typesToLookup.map((type: string) => performDnsLookup(domain, type))
    );

    // If single recordType was requested, return single result
    if (recordType && !recordTypes) {
      return NextResponse.json(
        results[0] || {
          domain,
          recordType,
          records: [],
          success: false,
          error: "DNS lookup failed",
          timestamp: Date.now(),
        }
      );
    }

    // Otherwise return array of results
    return NextResponse.json({ results: results.filter((r) => r !== null) });
  } catch (error) {
    console.error("DNS lookup API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function performDnsLookup(domain: string, recordType: string) {
  try {
    console.log(`DNS lookup: ${domain} ${recordType}`);

    let records: string[] = [];

    // Set DNS resolver timeout
    dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1", "1.0.0.1"]);

    switch (recordType.toUpperCase()) {
      case "A":
        try {
          const result = await dns.resolve4(domain);
          records = result;
        } catch (error) {
          console.log(`A record lookup failed: ${error}`);
          const dnsError = error as DnsError;
          if (dnsError.code === "ENOTFOUND") {
            return {
              domain,
              recordType,
              records: [],
              success: false,
              error: "Domain not found",
              timestamp: Date.now(),
            };
          }
        }
        break;

      case "AAAA":
        try {
          const result = await dns.resolve6(domain);
          records = result;
        } catch (error) {
          console.log(`AAAA record lookup failed: ${error}`);
        }
        break;

      case "MX":
        try {
          const result = await dns.resolveMx(domain);
          records = result.map((mx) => `${mx.priority} ${mx.exchange}`);
        } catch (error) {
          console.log(`MX record lookup failed: ${error}`);
        }
        break;

      case "TXT":
        try {
          const result = await dns.resolveTxt(domain);
          records = result.map((txt) => txt.join(" "));
        } catch (error) {
          console.log(`TXT record lookup failed: ${error}`);
        }
        break;

      case "NS":
        try {
          const result = await dns.resolveNs(domain);
          records = result;
        } catch (error) {
          console.log(`NS record lookup failed: ${error}`);
        }
        break;

      case "SOA":
        try {
          const result = await dns.resolveSoa(domain);
          records = [
            `${result.nsname} ${result.hostmaster} ${result.serial} ${result.refresh} ${result.retry} ${result.expire} ${result.minttl}`,
          ];
        } catch (error) {
          console.log(`SOA record lookup failed: ${error}`);
        }
        break;

      case "CNAME":
        try {
          const result = await dns.resolveCname(domain);
          records = result;
        } catch (error) {
          console.log(`CNAME record lookup failed: ${error}`);
        }
        break;

      case "PTR":
        try {
          const result = await dns.resolvePtr(domain);
          records = result;
        } catch (error) {
          console.log(`PTR record lookup failed: ${error}`);
        }
        break;

      default:
        return {
          domain,
          recordType,
          records: [],
          success: false,
          error: `Unsupported record type: ${recordType}`,
          timestamp: Date.now(),
        };
    }

    console.log(`DNS results for ${domain} ${recordType}:`, records);

    return {
      domain,
      recordType,
      records,
      success: records.length > 0,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("DNS lookup error:", error);
    return {
      domain,
      recordType,
      records: [],
      success: false,
      error: error instanceof Error ? error.message : "DNS lookup failed",
      timestamp: Date.now(),
    };
  }
}
