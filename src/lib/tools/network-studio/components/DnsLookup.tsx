"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Search, Globe, Clock, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";
import {
  getMultipleDnsRecords,
  performWhoisLookup,
  isValidDomain,
  DNS_RECORD_TYPES,
  type DnsLookupResult,
  type WhoisResult,
  type DnsRecordType,
} from "@/lib/utils/network/dns-utils";

export function DnsLookup() {
  const [domain, setDomain] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<DnsRecordType[]>([
    "A",
    "AAAA",
    "MX",
    "TXT",
  ]);
  const [dnsResults, setDnsResults] = useState<DnsLookupResult[]>([]);
  const [whoisResult, setWhoisResult] = useState<WhoisResult | null>(null);
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
        error.message.includes("DNS_PROBE_FINISHED_NXDOMAIN") ||
        error.message.includes("Name or service not known")
      ) {
        return {
          category: "Domain Not Found",
          message: "Domain does not exist",
          details:
            "The domain name could not be resolved. Check if the domain is correctly spelled and actually exists.",
        };
      }

      if (
        error.message.includes("network") ||
        error.message.includes("fetch")
      ) {
        return {
          category: "Network Error",
          message: "Network connection failed",
          details:
            "Unable to connect to DNS servers. Check your internet connection and try again.",
        };
      }

      if (
        error.message.includes("timeout") ||
        error.message.includes("TIMEOUT")
      ) {
        return {
          category: "Timeout Error",
          message: "DNS lookup timed out",
          details:
            "The DNS server took too long to respond. The domain might be temporarily unavailable.",
        };
      }

      return {
        category: "DNS Error",
        message: error.message,
        details:
          "DNS lookup failed. This could be due to server issues or an invalid domain.",
      };
    }

    return {
      category: "Unknown Error",
      message: "An unexpected error occurred",
      details: "Please try again or check if the domain name is valid.",
    };
  };

  const handleLookup = async () => {
    if (!domain) {
      toast.error("Please enter a domain name");
      return;
    }

    if (!isValidDomain(domain)) {
      toast.error("Please enter a valid domain name");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [dnsData, whoisData] = await Promise.all([
        getMultipleDnsRecords(domain, selectedTypes),
        performWhoisLookup(domain),
      ]);

      setDnsResults(dnsData);
      setWhoisResult(whoisData);
      toast.success(`DNS lookup completed for ${domain}`);
    } catch (error) {
      const errorInfo = categorizeError(error);
      setError(errorInfo);
      toast.error(`DNS lookup failed: ${errorInfo.category}`);
      console.error("DNS lookup error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard`);
  };

  const toggleRecordType = (type: DnsRecordType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">DNS Lookup</h2>
        <p className="text-muted-foreground">
          Lookup DNS records and WHOIS information for domains
        </p>
      </div>

      {/* Input */}
      <Card>
        <CardHeader>
          <CardTitle>Domain Lookup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Domain Name</Label>
            <Input
              placeholder="example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Record Types</Label>
            <div className="flex flex-wrap gap-2">
              {DNS_RECORD_TYPES.map((type) => (
                <Badge
                  key={type}
                  variant={selectedTypes.includes(type) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleRecordType(type)}
                >
                  {type}
                </Badge>
              ))}
            </div>
          </div>

          <Button
            onClick={handleLookup}
            disabled={isLoading || !domain}
            className="w-full"
          >
            {isLoading ? "Looking up..." : "Lookup"}
          </Button>
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
                      <li>Verify the domain name is spelled correctly</li>
                      <li>Check if the domain actually exists</li>
                      <li>Try a different DNS server if lookup fails</li>
                      <li>Some domains may block DNS queries</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* DNS Results */}
      {dnsResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              DNS Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dnsResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">
                      {result.records[0]?.type || "Unknown"} Records
                    </h4>
                    {result.records.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleCopy(
                            result.records.map((r) => r.value).join("\n"),
                            `${result.records[0]?.type} records`
                          )
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {result.error ? (
                    <p className="text-red-500">{result.error}</p>
                  ) : result.records.length > 0 ? (
                    <div className="space-y-2">
                      {result.records.map((record, recordIndex) => (
                        <div key={recordIndex} className="bg-muted rounded p-2">
                          <div className="font-mono text-sm">
                            {record.value}
                          </div>
                          {record.ttl && (
                            <div className="text-xs text-muted-foreground mt-1">
                              TTL: {record.ttl}s
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No records found</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* WHOIS Results */}
      {whoisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              WHOIS Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {whoisResult.error ? (
              <p className="text-red-500">{whoisResult.error}</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {whoisResult.registrar && (
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Registrar:
                    </span>
                    <div className="font-medium">{whoisResult.registrar}</div>
                  </div>
                )}
                {whoisResult.registrationDate && (
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Created:
                    </span>
                    <div className="font-medium">
                      {whoisResult.registrationDate}
                    </div>
                  </div>
                )}
                {whoisResult.expirationDate && (
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Expires:
                    </span>
                    <div className="font-medium">
                      {whoisResult.expirationDate}
                    </div>
                  </div>
                )}
                <div>
                  <span className="text-sm text-muted-foreground">
                    Checked:
                  </span>
                  <div className="font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(whoisResult.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
