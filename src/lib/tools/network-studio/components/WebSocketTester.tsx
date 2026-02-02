"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Clock, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";
import {
  serverWebSocketTest,
  type ServerWebSocketTestResult,
} from "@/lib/utils/network/server-api-client";

export function WebSocketTester() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<ServerWebSocketTestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{
    message: string;
    category: string;
    details: string;
  } | null>(null);

  const categorizeError = (
    error: unknown,
    result?: ServerWebSocketTestResult
  ): { category: string; details: string; message: string } => {
    // Check WebSocket result error first
    if (result?.error) {
      if (
        result.error.includes("connection failed") ||
        result.error.includes("CONNECTION_FAILED")
      ) {
        return {
          category: "Connection Failed",
          message: "WebSocket connection failed",
          details:
            "Unable to establish WebSocket connection. The server might not support WebSocket or be unreachable.",
        };
      }

      if (
        result.error.includes("timeout") ||
        result.error.includes("TIMEOUT")
      ) {
        return {
          category: "Connection Timeout",
          message: "WebSocket connection timed out",
          details:
            "The WebSocket server took too long to respond. It might be slow or temporarily unavailable.",
        };
      }

      return {
        category: "WebSocket Error",
        message: result.error,
        details:
          "WebSocket connection encountered an error. Check the URL and server configuration.",
      };
    }

    if (error instanceof Error) {
      if (
        error.message.includes("Invalid URL") ||
        error.message.includes("malformed")
      ) {
        return {
          category: "Invalid URL",
          message: "WebSocket URL format is invalid",
          details:
            "Please enter a valid WebSocket URL starting with ws:// or wss://.",
        };
      }

      if (
        error.message.includes("network") ||
        error.message.includes("Failed to fetch")
      ) {
        return {
          category: "Network Error",
          message: "Network connection failed",
          details:
            "Unable to reach the WebSocket server. Check your network connection and the server URL.",
        };
      }

      if (error.message.includes("blocked")) {
        return {
          category: "Security Error",
          message: "Connection blocked by security policy",
          details:
            "The server-side handshake was blocked by the destination policy.",
        };
      }

      return {
        category: "Connection Error",
        message: error.message,
        details:
          "Failed to connect to the WebSocket server. Check the URL and server status.",
      };
    }

    return {
      category: "Unknown Error",
      message: "WebSocket test failed",
      details:
        "An unexpected error occurred during the WebSocket connection test.",
    };
  };

  const handleTest = async () => {
    if (!url) {
      toast.error("Please enter a WebSocket URL");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const testResult = await serverWebSocketTest(url);
      setResult(testResult);

      if (!testResult.connected) {
        const errorInfo = categorizeError(null, testResult);
        setError(errorInfo);
        toast.error(`WebSocket test failed: ${errorInfo.category}`);
      } else {
        toast.success(
          `WebSocket connected successfully (${testResult.responseTime}ms)`
        );
      }
    } catch (error) {
      const errorInfo = categorizeError(error);
      setError(errorInfo);
      toast.error(`WebSocket test failed: ${errorInfo.category}`);
      console.error("WebSocket test error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">WebSocket Tester</h2>
        <p className="text-muted-foreground">
          Run a short server-side opening handshake and measure its latency
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle>WebSocket URL</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                placeholder="wss://echo.websocket.org"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This verifies only the opening handshake. It does not keep a
                connection open or send and receive messages.
              </p>
            </div>
            <Button
              onClick={handleTest}
              disabled={isLoading || !url}
              className="w-full"
            >
              {isLoading ? "Testing..." : "Test Connection"}
            </Button>
          </CardContent>
        </Card>

        {/* Result */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Connection Status
              {result && (
                <Badge variant={result.connected ? "default" : "destructive"}>
                  {result.connected ? "Connected" : "Failed"}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {result.connected ? (
                    <Wifi className="h-5 w-5 text-green-500" />
                  ) : (
                    <WifiOff className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-medium">
                    {result.connected
                      ? "Connection successful"
                      : "Connection failed"}
                  </span>
                </div>

                {result.responseTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Response Time: {result.responseTime}ms</span>
                  </div>
                )}

                {result.error && (
                  <div className="flex items-center gap-2 text-red-500">
                    <AlertCircle className="h-4 w-4" />
                    <span>{result.error}</span>
                  </div>
                )}

                <div className="text-sm text-muted-foreground">
                  Tested at: {new Date(result.timestamp).toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Wifi className="h-8 w-8 mx-auto mb-2" />
                <p>Enter a WebSocket URL to test the connection</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                <div>
                  <div className="font-medium text-red-800 dark:text-red-200">
                    {error.message}
                  </div>
                  <div className="text-sm text-red-600 dark:text-red-300 mt-1">
                    {error.details}
                  </div>
                  <Badge
                    variant="outline"
                    className="mt-2 text-red-600 border-red-600"
                  >
                    {error.category}
                  </Badge>
                </div>
              </div>

              {/* Troubleshooting Tips */}
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-medium">Troubleshooting Tips:</p>
                    <ul className="mt-1 space-y-1 list-disc list-inside">
                      <li>
                        Use ws:// for unencrypted or wss:// for encrypted
                        connections
                      </li>
                      <li>
                        Check if the WebSocket server is running and accessible
                      </li>
                      <li>Verify the server supports WebSocket protocol</li>
                      <li>
                        Some networks/firewalls may block WebSocket handshakes
                      </li>
                      <li>Try the test URL: wss://echo.websocket.org</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
