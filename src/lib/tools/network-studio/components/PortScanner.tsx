"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
  scanWithProfile,
  SCAN_PROFILES,
  type PortScanResult,
} from "@/lib/utils/network/network-monitor";

export function PortScanner() {
  const [host, setHost] = useState("");
  const [selectedProfile, setSelectedProfile] = useState("Quick Scan");
  const [results, setResults] = useState<PortScanResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleScan = async () => {
    if (!host) {
      toast.error("Please enter a host name or IP address");
      return;
    }

    setIsScanning(true);
    setResults([]);
    setProgress(0);

    try {
      const scanResults = await scanWithProfile(
        host,
        selectedProfile,
        (progress: number) => {
          setProgress(progress);
        }
      );
      setResults(scanResults);
    } catch (error) {
      toast.error(
        "Scan failed: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setIsScanning(false);
      setProgress(0);
    }
  };

  const openPorts = results.filter((r) => r.open);
  const closedPorts = results.filter((r) => !r.open);

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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(SCAN_PROFILES).map((profile) => (
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

          {isScanning && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <div className="text-sm text-center text-muted-foreground">
                {Math.round(progress)}% complete
              </div>
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
                {openPorts.length} open / {results.length} total
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
                        {result.error && (
                          <span className="text-sm text-muted-foreground">
                            {result.error}
                          </span>
                        )}
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
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
