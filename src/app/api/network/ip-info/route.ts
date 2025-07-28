import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { ip } = await request.json();

    if (!ip) {
      return NextResponse.json(
        { error: "IP address is required" },
        { status: 400 }
      );
    }

    // Validate IP format
    if (!isValidIP(ip)) {
      return NextResponse.json(
        { error: "Invalid IP address format" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,isp,org,as,query`
    );
    const data = await response.json();

    if (data.status === "fail") {
      return NextResponse.json({
        ip,
        error: data.message || "IP lookup failed",
        timestamp: Date.now(),
      });
    }

    return NextResponse.json({
      ip: data.query,
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
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("IP info API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function isValidIP(ip: string): boolean {
  // IPv4 validation
  const ipv4Regex =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  // IPv6 validation (simplified)
  const ipv6Regex =
    /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4})$/;

  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}
