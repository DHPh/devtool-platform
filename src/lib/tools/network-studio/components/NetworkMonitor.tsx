"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Wifi, Clock, TrendingUp, Info } from "lucide-react";
import { toast } from "sonner";
import {
  serverPingHost,
  serverSpeedTest,
  type ServerPingResult,
  type ServerSpeedTestResult,
} from "@/lib/utils/network/server-api-client";

export function NetworkMonitor() {
  const [url, setUrl] = useState("https://google.com");
  const [pingResult, setPingResult] = useState<ServerPingResult | null>(null);
  const [speedTest, setSpeedTest] = useState<ServerSpeedTestResult | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [pingLogs, setPingLogs] = useState<string[]>([]);
  const [speedTestError, setSpeedTestError] = useState("");

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setPingLogs((prev) => [...prev, logMessage]);
  };

  const handlePing = async () => {
    if (!url) return;

    setIsLoading(true);
    setPingLogs([]);
    addLog(`Starting ping test to ${url}`);

    try {
      addLog("Attempting HTTP HEAD request...");
      const startTime = performance.now();
      const result = await serverPingHost(url);
      const endTime = performance.now();

      setPingResult(result);

      if (result.alive) {
        addLog(`[OK] Host is reachable via ${result.method}`);
        addLog(`Response time: ${result.responseTime}ms`);
      } else {
        addLog(`[ERR] Host unreachable: ${result.error}`);
      }

      addLog(`Total test duration: ${Math.round(endTime - startTime)}ms`);
    } catch (error) {
      addLog(
        `[ERR] Ping test failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      toast.error("Ping failed");
      console.error("Ping error:", error);
    } finally {
      setIsLoading(false);
      addLog("Ping test completed");
    }
  };

  const handleSpeedTest = async () => {
    setIsLoading(true);
    setSpeedTest(null);
    setSpeedTestError("");

    try {
      addLog("Starting speed test...");
      addLog("Testing download speed...");

      const result = await serverSpeedTest("download", 10);
      if (result.error || result.completed !== true) {
        const message = result.error || "Speed test did not complete.";
        setSpeedTestError(message);
        addLog(`[ERR] Speed test failed: ${message}`);
        toast.error("Speed test failed");
        return;
      }
      setSpeedTest(result);

      addLog("[OK] Speed test completed");
      if (result.speedMbps) {
        addLog(`Download speed: ${result.speedMbps} Mbps`);
      }

      toast.success("Speed test completed successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setSpeedTestError(message);
      addLog(
        `[ERR] Speed test failed: ${message}`
      );
      toast.error("Speed test failed");
      console.error("Speed test error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Network Monitor</h2>
        <p className="text-muted-foreground">
          Monitor network performance and connectivity
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Ping Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Ping Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="https://google.com"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setPingResult(null);
              }}
            />
            <Button
              onClick={handlePing}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Pinging..." : "Ping"}
            </Button>

            {/* Ping Method Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium">Server HTTP Probe:</p>
                  <p>
                    Uses HTTP HEAD requests instead of ICMP. Results may differ
                    from traditional ping tools due to HTTP overhead and server
                    processing time.
                  </p>
                </div>
              </div>
            </div>

            {pingResult && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant={pingResult.alive ? "default" : "destructive"}>
                    {pingResult.alive ? "Online" : "Offline"}
                  </Badge>
                  {pingResult.method && (
                    <Badge variant="outline">{pingResult.method}</Badge>
                  )}
                </div>

                {pingResult.responseTime && (
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="h-3 w-3" />
                    {pingResult.responseTime}ms
                  </div>
                )}

                {pingResult.error && (
                  <div className="text-sm text-red-600 dark:text-red-400">
                    <strong>Error:</strong> {pingResult.error}
                  </div>
                )}
              </div>
            )}

            {/* Ping Logs */}
            {pingLogs.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Test Log:</h4>
                <div className="bg-muted/50 border border-border p-3 rounded-lg max-h-40 overflow-y-auto">
                  {pingLogs.map((log, index) => (
                    <div
                      key={index}
                      className="text-xs font-mono text-muted-foreground"
                    >
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Speed Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Speed Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleSpeedTest}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Testing..." : "Run Speed Test"}
            </Button>

            {speedTestError && (
              <div role="alert" className="text-sm text-destructive">
                Speed test failed: {speedTestError}
              </div>
            )}

            {speedTest && (
              <div className="space-y-3">
                {speedTest.speedMbps > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Download:
                    </span>
                    <div className="text-xl font-bold">
                      {speedTest.speedMbps} Mbps
                    </div>
                  </div>
                )}
                <div>
                  <span className="text-sm text-muted-foreground">
                    Data Transferred:
                  </span>
                  <div className="text-lg font-semibold">
                    {Math.round(speedTest.bytesTransferred / 1024)} KB
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Duration:
                  </span>
                  <div className="text-lg font-semibold">
                    {speedTest.duration.toFixed(1)}s
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
