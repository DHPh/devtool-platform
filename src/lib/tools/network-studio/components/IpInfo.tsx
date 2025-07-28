"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Globe, Clock, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { validateIP, getCurrentPublicIP } from "@/lib/utils/network/ip-utils";
import {
  serverIpInfo,
  type ServerIpInfoResult,
} from "@/lib/utils/network/server-api-client";

export function IpInfo() {
  const [ip, setIp] = useState("");
  const [result, setResult] = useState<ServerIpInfoResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{
    message: string;
    category: string;
    details: string;
  } | null>(null);

  const categorizeError = (
    error: unknown
  ): { category: string; details: string; message: string } => {
    if (error instanceof Error) {
      if (
        error.message.includes("Invalid IP") ||
        error.message.includes("malformed")
      ) {
        return {
          category: "Invalid IP Address",
          message: "IP address format is invalid",
          details:
            "Please enter a valid IPv4 or IPv6 address (e.g., 8.8.8.8 or 2001:4860:4860::8888)",
        };
      }

      if (
        error.message.includes("private") ||
        error.message.includes("local")
      ) {
        return {
          category: "Private IP Address",
          message: "Cannot lookup private IP addresses",
          details:
            "Private IP addresses (192.168.x.x, 10.x.x.x, 172.16-31.x.x) are not publicly routable and don't have geolocation data.",
        };
      }

      if (
        error.message.includes("rate limit") ||
        error.message.includes("quota")
      ) {
        return {
          category: "Rate Limit Exceeded",
          message: "Too many requests",
          details:
            "The IP geolocation service has rate limits. Please wait a moment before trying again.",
        };
      }

      if (
        error.message.includes("network") ||
        error.message.includes("fetch")
      ) {
        return {
          category: "Network Error",
          message: "Connection failed",
          details:
            "Unable to connect to the IP geolocation service. Check your internet connection.",
        };
      }

      return {
        category: "Lookup Error",
        message: error.message,
        details:
          "IP geolocation lookup failed. The service might be temporarily unavailable.",
      };
    }

    return {
      category: "Unknown Error",
      message: "An unexpected error occurred",
      details: "Please try again with a different IP address.",
    };
  };

  const handleLookup = async () => {
    if (!ip) {
      toast.error("Please enter an IP address");
      return;
    }

    const validation = validateIP(ip);
    if (!validation.isValid) {
      toast.error("Please enter a valid IP address");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const locationData = await serverIpInfo(ip);
      setResult(locationData);
      toast.success(`IP location lookup completed for ${ip}`);
    } catch (error) {
      const errorInfo = categorizeError(error);
      setError(errorInfo);
      toast.error(`IP lookup failed: ${errorInfo.category}`);
      console.error("IP lookup error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetMyIP = async () => {
    setIsLoading(true);
    try {
      const { ip: publicIP, error } = await getCurrentPublicIP();
      if (error) {
        toast.error("Failed to get public IP: " + error);
      } else {
        setIp(publicIP);
        const locationData = await serverIpInfo(publicIP);
        setResult(locationData);
      }
    } catch (error) {
      toast.error("Failed to get IP info");
      console.error("Error getting public IP:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">IP Information</h2>
        <p className="text-muted-foreground">
          Get geolocation and ISP information for IP addresses
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle>IP Address Lookup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="8.8.8.8"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleLookup}
                disabled={isLoading || !ip}
                className="flex-1"
              >
                {isLoading ? "Looking up..." : "Lookup"}
              </Button>
              <Button
                onClick={handleGetMyIP}
                disabled={isLoading}
                variant="outline"
              >
                My IP
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              IP Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              result.error ? (
                <div className="flex items-center gap-2 text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  <span>{result.error}</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-medium text-lg">{result.ip}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {result.country && (
                      <div>
                        <span className="text-muted-foreground">Country:</span>
                        <div className="font-medium flex items-center gap-1">
                          {result.countryCode && (
                            <Badge variant="outline">
                              {result.countryCode}
                            </Badge>
                          )}
                          {result.country}
                        </div>
                      </div>
                    )}

                    {result.city && (
                      <div>
                        <span className="text-muted-foreground">City:</span>
                        <div className="font-medium">{result.city}</div>
                      </div>
                    )}

                    {result.region && (
                      <div>
                        <span className="text-muted-foreground">Region:</span>
                        <div className="font-medium">{result.region}</div>
                      </div>
                    )}

                    {result.timezone && (
                      <div>
                        <span className="text-muted-foreground">Timezone:</span>
                        <div className="font-medium">{result.timezone}</div>
                      </div>
                    )}

                    {result.isp && (
                      <div>
                        <span className="text-muted-foreground">ISP:</span>
                        <div className="font-medium">{result.isp}</div>
                      </div>
                    )}

                    {result.organization && (
                      <div>
                        <span className="text-muted-foreground">
                          Organization:
                        </span>
                        <div className="font-medium">{result.organization}</div>
                      </div>
                    )}

                    {result.asn && (
                      <div>
                        <span className="text-muted-foreground">ASN:</span>
                        <div className="font-medium">{result.asn}</div>
                      </div>
                    )}

                    {result.latitude && result.longitude && (
                      <div>
                        <span className="text-muted-foreground">
                          Coordinates:
                        </span>
                        <div className="font-medium">
                          {result.latitude}, {result.longitude}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Checked: {new Date(result.timestamp).toLocaleString()}
                  </div>
                </div>
              )
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Globe className="h-8 w-8 mx-auto mb-2" />
                <p>Enter an IP address to get information</p>
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
                        Use public IP addresses (avoid 192.168.x.x, 10.x.x.x)
                      </li>
                      <li>
                        Check IP format: IPv4 (8.8.8.8) or IPv6
                        (2001:4860:4860::8888)
                      </li>
                      <li>Some services may block geolocation queries</li>
                      <li>
                        Try using &ldquo;My IP&rdquo; to get your current public
                        IP
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
