import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { host, timeout = 5000 } = await request.json();

    if (!host) {
      return NextResponse.json({ error: "Host is required" }, { status: 400 });
    }

    const startTime = Date.now();

    try {
      // Try HTTP ping first (works better for web services)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const url = host.startsWith("http") ? host : `https://${host}`;

      const response = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      return NextResponse.json({
        host,
        alive: true,
        responseTime,
        method: "HTTP HEAD",
        statusCode: response.status,
        timestamp: Date.now(),
      });
    } catch (httpError) {
      // Fallback to ICMP ping using system ping command
      try {
        const pingCommand =
          process.platform === "win32"
            ? `ping -n 1 -w ${timeout} ${host.replace(/^https?:\/\//, "")}`
            : `ping -c 1 -W ${Math.floor(timeout / 1000)} ${host.replace(
                /^https?:\/\//,
                ""
              )}`;

        const { stdout } = await execAsync(pingCommand);
        const responseTime = Date.now() - startTime;

        // Parse ping output to get response time
        const timeMatch =
          stdout.match(/time[<=](\d+\.?\d*)ms/i) ||
          stdout.match(/time=(\d+\.?\d*)ms/i);
        const actualTime = timeMatch ? parseFloat(timeMatch[1]) : responseTime;

        return NextResponse.json({
          host,
          alive: true,
          responseTime: actualTime,
          method: "ICMP Ping",
          timestamp: Date.now(),
        });
      } catch (pingError) {
        console.error("ICMP ping failed:", pingError);
        return NextResponse.json({
          host,
          alive: false,
          error: "Connection failed",
          errorDetails: `Both HTTP and ICMP ping failed. HTTP error: ${
            httpError instanceof Error ? httpError.message : "Unknown"
          }`,
          method: "HTTP HEAD + ICMP fallback",
          timestamp: Date.now(),
        });
      }
    }
  } catch (error) {
    console.error("Ping API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
