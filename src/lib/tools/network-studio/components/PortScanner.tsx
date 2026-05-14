"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import {
  SCAN_PROFILES,
  SUPPORTED_SCAN_PROFILES,
} from "@/lib/utils/network/network-monitor";
import {
  serverPortScan,
  type ServerPortScanResult,
} from "@/lib/utils/network/server-api-client";

export function PortScanner() {
  const [host, setHost] = useState("");
  const [selectedProfile, setSelectedProfile] = useState("Quick Scan");
  const [results, setResults] = useState<ServerPortScanResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const availableProfiles = SUPPORTED_SCAN_PROFILES;

  const handleScan = async () => {
    if (!host) {
      toast.error("Please enter a host name or IP address");
      return;
    }

    setIsScanning(true);
    setResults([]);
    setScanError("");

    try {
      const profile = availableProfiles.find(
        (p) => p.name === selectedProfile
      );

      if (!profile) {
        throw new Error("Invalid scan profile");
      }

      const scanResults = await serverPortScan(
        host,
        profile.ports,
        profile.timeout
      );

      setResults(scanResults);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setScanError(message);
      toast.error("Scan failed: " + message);
    } finally {
      setIsScanning(false);
    }
  };

  const openPorts = results.filter((r) => r.open);
  const failedPorts = results.filter((r) => !r.open && r.error);
  const closedPorts = results.filter((r) => !r.open && !r.error);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Port Scanner</h2>
        <p className="text-muted-foreground">
          Scan network ports to check service availability (limited in browser)
        </p>
      </div>

      {/* Input */}
      <Card>
        <CardHeader>
          <CardTitle>Port Scan Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Host</label>
              <Input
                placeholder="example.com or 192.168.1.1"
                value={host}
                onChange={(e) => setHost(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Scan Profile</label>
              <Select
                value={selectedProfile}
                onValueChange={setSelectedProfile}
              >
                <SelectTrigger aria-label="Port scan profile">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                {availableProfiles.map((profile) => (
                    <SelectItem key={profile.name} value={profile.name}>
                      {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedProfile && (
            <div className="text-sm text-muted-foreground">
              {
                Object.values(SCAN_PROFILES).find(
                  (p) => p.name === selectedProfile
                )?.description
              }
            </div>
          )}

          <Button
            onClick={handleScan}
            disabled={isScanning || !host}
            className="w-full"
          >
            {isScanning ? "Scanning..." : "Start Scan"}
          </Button>

          {scanError && (
            <div role="alert" className="text-sm text-destructive">
              Scan failed: {scanError}
            </div>
          )}

        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Scan Results
              <Badge variant="outline">
                {openPorts.length} open / {closedPorts.length} closed / {failedPorts.length} failed
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Open Ports */}
              {openPorts.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 text-green-600">
                    Open Ports
                  </h4>
                  <div className="grid gap-2">
                    {openPorts.map((result, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="font-medium">
                            Port {result.port}
                          </span>
                          {result.service && (
                            <Badge variant="secondary">{result.service}</Badge>
                          )}
                        </div>
                        {result.responseTime && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {result.responseTime}ms
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Closed/Filtered Ports */}
              {closedPorts.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 text-red-600">
                    Closed/Filtered Ports
                  </h4>
                  <div className="grid gap-2">
                    {closedPorts.slice(0, 10).map((result, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800"
                      >
                        <div className="flex items-center gap-3">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <span className="font-medium">
                            Port {result.port}
                          </span>
                          {result.service && (
                            <Badge variant="outline">{result.service}</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    {closedPorts.length > 10 && (
                      <div className="text-center text-sm text-muted-foreground">
                        ... and {closedPorts.length - 10} more closed ports
                      </div>
                    )}
                  </div>
                </div>
              )}

              {failedPorts.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 text-amber-600">
                    Could Not Check
                  </h4>
                  <div className="grid gap-2">
                    {failedPorts.slice(0, 10).map((result) => (
                      <div key={result.port} className="rounded-lg border border-amber-200 p-3 text-sm dark:border-amber-800">
                        <span className="font-medium">Port {result.port}</span>
                        <span className="ml-2 text-muted-foreground">{result.error}</span>
                      </div>
                    ))}
                    {failedPorts.length > 10 && (
                      <div className="text-center text-sm text-muted-foreground">
                        ... and {failedPorts.length - 10} more ports could not be checked
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
