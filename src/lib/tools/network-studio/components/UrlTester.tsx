"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Link,
  Clock,
  CheckCircle,
  AlertCircle,
  Globe,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { parseUrl } from "@/lib/utils/network/url-validator";
import {
  serverUrlTest,
  type ServerUrlTestResult,
} from "@/lib/utils/network/server-api-client";
import { classifyUrlTestOutcome } from "@/lib/utils/network/url-test-outcome";

export function UrlTester() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<ServerUrlTestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{
    message: string;
    category: string;
    details: string;
  } | null>(null);

  const categorizeError = (
    error: unknown,
    result?: ServerUrlTestResult
  ): { category: string; details: string; message: string } => {
    // Preserve original error message - prioritize result.errorDetails if available
    const originalMessage =
      result?.error || (error instanceof Error ? error.message : String(error));
    const originalStack = error instanceof Error ? error.stack || "" : "";

    // Check for HTTP status codes first
    if (result?.statusCode) {
      if (result.statusCode >= 400 && result.statusCode < 500) {
        const statusMessages: Record<number, string> = {
          400: "Bad Request - The server cannot process the request",
          401: "Unauthorized - Authentication required",
          403: "Forbidden - Access denied",
          404: "Not Found - The requested resource does not exist",
          406: "Not Acceptable - The server rejected the requested representation",
          429: "Too Many Requests - Rate limit exceeded",
        };

        return {
          category: "Client Error",
          message: `HTTP ${result.statusCode} ${
            statusMessages[result.statusCode] || "Client Error"
          }`,
          details: `Original error: ${originalMessage}. This is a client-side error. Check the URL and your permissions to access this resource.`,
        };
      }

      if (result.statusCode >= 500) {
        return {
          category: "Server Error",
          message: `HTTP ${result.statusCode} - Server Error`,
          details: `Original error: ${originalMessage}. The server encountered an error. This is not your fault - try again later or contact the website administrator.`,
        };
      }
    }

    // CORS and network errors
    if (
      originalMessage.includes("Failed to fetch") ||
      originalMessage.includes("TypeError") ||
      originalMessage.includes("CORS") ||
      originalMessage.includes("Access-Control")
    ) {
      return {
        category: "CORS Policy Violation",
        message: "Cross-origin request blocked",
        details: `CORS error: ${originalMessage}. The server's CORS policy prevents this request from being completed. This is a browser security feature that blocks requests from different origins.`,
      };
    }

    // Browser network errors
    if (originalMessage.includes("net::ERR_")) {
      return {
        category: "Browser Network Error",
        message: "Browser-level network error",
        details: `Browser error: ${originalMessage}. This is a low-level network error reported by the browser.`,
      };
    }

    // Timeout errors
    if (
      originalMessage.includes("timeout") ||
      originalMessage.includes("AbortError")
    ) {
      return {
        category: "Timeout Error",
        message: "Request timed out",
        details: `Timeout error: ${originalMessage}. The server took too long to respond. The server might be slow or temporarily unavailable.`,
      };
    }

    // DNS errors
    if (
      originalMessage.includes("DNS") ||
      originalMessage.includes("resolve")
    ) {
      return {
        category: "DNS Error",
        message: "Domain name resolution failed",
        details: `DNS error: ${originalMessage}. The domain name could not be resolved. Check if the domain exists and is spelled correctly.`,
      };
    }

    // Generic error with stack trace if available
    if (error instanceof Error || originalMessage) {
      return {
        category: "Connection Error",
        message: originalMessage || "Connection failed",
        details: originalStack
          ? `Full error details:\n${originalMessage}\n\nStack trace:\n${originalStack}`
          : `Connection failed: ${originalMessage}. Check the URL and try again.`,
      };
    }

    return {
      category: "Unknown Error",
      message: "An unexpected error occurred",
      details: `Unexpected error: ${
        originalMessage || "No error details available"
      }. Please check the URL format and try again.`,
    };
  };

  const handleTest = async () => {
    if (!url) {
      toast.error("Please enter a URL");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const testResult = await serverUrlTest(url);
      setResult(testResult);
      const outcome = classifyUrlTestOutcome(testResult);

      if (outcome === "failure") {
        // Create error object from test result
        const resultError = new Error(testResult.error || "Request failed");

        const errorInfo = categorizeError(resultError, testResult);
        setError(errorInfo);
        toast.error(`URL test failed: ${errorInfo.category}`);
      } else if (outcome === "http-error") {
        toast.warning(`URL responded with HTTP ${testResult.statusCode}`);
      } else {
        toast.success(`URL is accessible (${testResult.statusCode || "OK"})`);
      }
    } catch (error) {
      const errorInfo = categorizeError(error);
      setError(errorInfo);
      toast.error(`URL test failed: ${errorInfo.category}`);
    } finally {
      setIsLoading(false);
    }
  };

  const urlParts = url ? parseUrl(url) : null;
  const resultOutcome = result ? classifyUrlTestOutcome(result) : null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">URL Tester</h2>
        <p className="text-muted-foreground">
          Test URL accessibility and analyze response headers
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle>URL Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button
              onClick={handleTest}
              disabled={isLoading || !url}
              className="w-full"
            >
              {isLoading ? "Testing..." : "Test URL"}
            </Button>

            {urlParts && (
              <div className="space-y-2 text-sm">
                <h4 className="font-medium">URL Components:</h4>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Protocol:</span>
                  <span>{urlParts.protocol}</span>
                  <span className="text-muted-foreground">Domain:</span>
                  <span>{urlParts.hostname}</span>
                  {urlParts.port && (
                    <>
                      <span className="text-muted-foreground">Port:</span>
                      <span>{urlParts.port}</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Test Results
              {result && (
                <Badge
                  variant={resultOutcome === "success" ? "default" : "destructive"}
                >
                  {result.statusCode || "Error"}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="headers">Headers</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {resultOutcome === "success" ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle
                          className={`h-4 w-4 ${
                            resultOutcome === "http-error"
                              ? "text-amber-500"
                              : "text-red-500"
                          }`}
                        />
                      )}
                      <span>
                        {resultOutcome === "success"
                          ? "URL is accessible"
                          : resultOutcome === "http-error"
                            ? `URL responded with HTTP ${result.statusCode}`
                            : "URL is not accessible"}
                      </span>
                    </div>

                    {result.responseTime && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Response time: {result.responseTime}ms</span>
                      </div>
                    )}

                    {result.server && (
                      <div>
                        <span className="text-muted-foreground">Server: </span>
                        <Badge variant="secondary">{result.server}</Badge>
                      </div>
                    )}

                    {result.contentType && (
                      <div>
                        <span className="text-muted-foreground">
                          Content Type:{" "}
                        </span>
                        <Badge variant="outline">{result.contentType}</Badge>
                      </div>
                    )}

                    {/* Content length not available in server response */}

                    {/* Redirect URL not available in server response */}

                    {result.error && (
                      <div className="text-red-500">{result.error}</div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="headers">
                  {result.headers ? (
                    <div className="space-y-2">
                      {Object.entries(result.headers).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex justify-between items-start py-1 border-b border-border/50"
                        >
                          <span className="font-mono text-sm text-muted-foreground">
                            {key}:
                          </span>
                          <span className="font-mono text-sm text-right ml-2">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No headers available
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Link className="h-8 w-8 mx-auto mb-2" />
                <p>Enter a URL to test its accessibility</p>
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
                  <div className="text-sm text-red-600 dark:text-red-300 mt-1 max-h-40 overflow-y-auto break-words">
                    <pre className="whitespace-pre-wrap text-xs font-mono">
                      {error.details}
                    </pre>
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
                        Verify the URL is correct and complete (include http://
                        or https://)
                      </li>
                      <li>Check if the website is currently online</li>
                      <li>
                        Some servers block cross-origin requests from browsers
                      </li>
                      <li>Try accessing the URL directly in your browser</li>
                      <li>
                        For CORS issues, the server needs to allow browser
                        requests
                      </li>
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
