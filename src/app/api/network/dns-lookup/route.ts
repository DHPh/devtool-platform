import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

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
    let command;
    if (process.platform === "win32") {
      // Use nslookup with specific formatting
      command = `nslookup -type=${recordType} ${domain} 8.8.8.8`;
    } else {
      // Use dig with clean output
      command = `dig @8.8.8.8 ${domain} ${recordType} +short +timeout=10`;
    }

    console.log("DNS command:", command);
    const { stdout, stderr } = await execAsync(command);

    if (stderr && !stderr.includes("Warning")) {
      return {
        domain,
        recordType,
        records: [],
        success: false,
        error: stderr.trim(),
        timestamp: Date.now(),
      };
    }

    const records = parseDnsOutput(stdout, recordType);
    console.log("Parsed records:", records);

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

function parseDnsOutput(output: string, recordType?: string) {
  const lines = output.split("\n").filter((line) => line.trim());
  const records: string[] = [];

  console.log("Raw DNS output:", output);

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines, comments, and common headers
    if (
      !trimmed ||
      trimmed.startsWith(";") ||
      trimmed.startsWith(";;") ||
      trimmed.includes("Non-authoritative answer:") ||
      trimmed.includes("unknown query type:") ||
      trimmed.includes("canonical name") ||
      trimmed.startsWith("Server:") ||
      trimmed.startsWith("Address:") ||
      trimmed.includes("*** Can't find") ||
      trimmed.startsWith("Name:") ||
      trimmed === "---"
    ) {
      continue;
    }

    // For Windows nslookup, extract the actual values
    if (process.platform === "win32" && recordType) {
      // For A records, look for IP addresses
      if (recordType === "A" && /^\d+\.\d+\.\d+\.\d+$/.test(trimmed)) {
        records.push(trimmed);
      }
      // For MX records, extract after priority
      else if (recordType === "MX" && trimmed.includes("mail exchanger")) {
        const parts = trimmed.split("=");
        if (parts.length > 1) {
          const mx = parts[1].trim();
          if (mx) records.push(mx);
        }
      }
      // For TXT records, extract quoted content
      else if (recordType === "TXT" && trimmed.includes('"')) {
        const match = trimmed.match(/"([^"]+)"/);
        if (match) records.push(match[1]);
      }
      // For AAAA records (IPv6)
      else if (recordType === "AAAA" && /^[0-9a-fA-F:]+$/.test(trimmed)) {
        records.push(trimmed);
      }
      // For NS records
      else if (recordType === "NS" && trimmed.includes("nameserver")) {
        const parts = trimmed.split("=");
        if (parts.length > 1) {
          const ns = parts[1].trim();
          if (ns) records.push(ns);
        }
      }
      // Generic fallback - any line that looks like a value
      else if (
        trimmed.length > 3 &&
        !trimmed.includes(":") &&
        !trimmed.includes("=")
      ) {
        records.push(trimmed);
      }
    } else {
      // For dig output (Unix/Linux), it's cleaner
      if (trimmed.length > 3) {
        records.push(trimmed);
      }
    }
  }

  console.log("Parsed records:", records);
  return records;
}
