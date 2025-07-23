"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Clock, Activity, Info } from "lucide-react";
import { toast } from "sonner";
import { pingHost, type PingResult } from "@/lib/utils/network/network-monitor";

export function OnAirChecker() {
  const [url, setUrl] = useState("");
  const [results, setResults] = useState<PingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{
    message: string;
    category: string;
    details: string;
  } | null>(null);

  const categorizeError = (
    error: unknown,
    result?: PingResult
  ): { category: string; details: string; message: string } => {
    // Check PingResult error first
    if (result?.error) {
      if (
        result.error.includes("timeout") ||
        result.error.includes("Request timeout")
      ) {
        return {
          category: "Timeout Error",
          message: "Service response timeout",
          details:
            "The service took too long to respond. It might be slow or temporarily unavailable.",
        };
      }

      if (
        result.error.includes("Network unreachable") ||
        result.error.includes("Failed to fetch")
      ) {
        return {
          category: "Network Error",
          message: "Service unreachable",
          details:
            "The service appears to be offline or blocked by network restrictions.",
        };
      }

      return {
        category: "Connection Error",
        message: result.error,
        details: result.errorDetails || "Unable to connect to the service.",
      };
    }

    if (error instanceof Error) {
      if (
        error.message.includes("Invalid URL") ||
        error.message.includes("malformed")
      ) {
        return {
          category: "Invalid URL",
          message: "URL format is invalid",
          details:
            "Please enter a valid URL including protocol (http:// or https://).",
        };
      }

      if (error.message.includes("DNS") || error.message.includes("resolve")) {
        return {
          category: "DNS Error",
          message: "Cannot resolve domain",
          details:
            "The domain name could not be resolved. Check if the service domain exists.",
        };
      }

      return {
        category: "Service Error",
        message: error.message,
        details:
          "Failed to check service status. The service might be temporarily unavailable.",
      };
    }

    return {
      category: "Unknown Error",
      message: "Service check failed",
      details:
        "An unexpected error occurred while checking the service status.",
    };
  };

  const handleCheck = async () => {
    if (!url) {
      toast.error("Please enter a URL or service address");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await pingHost(url);
      setResults((prev) => [result, ...prev.slice(0, 9)]); // Keep last 10 results

      if (!result.alive) {
        const errorInfo = categorizeError(null, result);
        setError(errorInfo);
        toast.error(`Service check failed: ${errorInfo.category}`);
      } else {
        toast.success(`Service is online (${result.responseTime}ms)`);
      }
    } catch (error) {
      const errorInfo = categorizeError(error);
      setError(errorInfo);
      toast.error(`Service check failed: ${errorInfo.category}`);
      console.error("Service check error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const commonServices = [
    "https://google.com",
    "https://github.com",
    "https://stackoverflow.com",
    "https://youtube.com",
    "https://twitter.com",
    "https://facebook.com",
  ];

  const checkService = async (service: string) => {
    setIsLoading(true);
    try {
      const result = await pingHost(service);
      setResults((prev) => [result, ...prev.slice(0, 9)]);
    } catch {
      toast.error(`Failed to check ${service}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">On Air Checker</h2>
        <p className="text-muted-foreground">
          Check if websites and services are accessible and online
        </p>
      </div>

      {/* Input */}
      <Card>
        <CardHeader>
          <CardTitle>Service Status Check</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleCheck} disabled={isLoading || !url}>
              {isLoading ? "Checking..." : "Check"}
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">
              Quick Check Common Services:
            </h4>
            <div className="flex flex-wrap gap-2">
              {commonServices.map((service) => (
                <Button
                  key={service}
                  variant="outline"
                  size="sm"
                  onClick={() => checkService(service)}
                  disabled={isLoading}
                >
                  {new URL(service).hostname}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

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
                      <li>Check if the service URL is correct and complete</li>
                      <li>
                        Verify the service is actually online (try in browser)
                      </li>
                      <li>Some services may block automated requests</li>
                      <li>Network restrictions might prevent access</li>
                      <li>
                        Try one of the common services to test connectivity
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Service Status History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {result.alive ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="font-medium">{result.host}</span>
                    <Badge variant={result.alive ? "default" : "destructive"}>
                      {result.alive ? "Online" : "Offline"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {result.responseTime && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {result.responseTime}ms
                      </div>
                    )}
                    <span>
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
