import { NextRequest, NextResponse } from "next/server";
import net from "net";

export async function POST(request: NextRequest) {
  try {
    const { host, ports, timeout = 3000 } = await request.json();

    if (!host || !ports || !Array.isArray(ports)) {
      return NextResponse.json(
        { error: "Host and ports array are required" },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      ports.map((port) => scanPort(host, port, timeout))
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Port scan API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function scanPort(host: string, port: number, timeout: number) {
  const timestamp = Date.now();
  const startTime = Date.now();

  return new Promise((resolve) => {
    const socket = new net.Socket();

    socket.setTimeout(timeout);

    socket.on("connect", () => {
      const responseTime = Date.now() - startTime;
      socket.destroy();
      resolve({
        host,
        port,
        open: true,
        service: getServiceName(port),
        responseTime,
        method: "TCP Connect",
        timestamp,
      });
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve({
        host,
        port,
        open: false,
        error: "Connection timeout",
        errorDetails: `Port ${port} did not respond within ${timeout}ms`,
        method: "TCP Connect",
        timestamp,
      });
    });

    socket.on("error", () => {
      socket.destroy();
      resolve({
        host,
        port,
        open: false,
        error: "Connection refused",
        errorDetails: `Port ${port} is closed or filtered`,
        method: "TCP Connect",
        timestamp,
      });
    });

    socket.connect(port, host);
  });
}

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
    3306: "MySQL",
    5432: "PostgreSQL",
    6379: "Redis",
    27017: "MongoDB",
    3389: "RDP",
    8080: "HTTP Alt",
    8443: "HTTPS Alt",
  };
  return services[port] || "Unknown";
}
