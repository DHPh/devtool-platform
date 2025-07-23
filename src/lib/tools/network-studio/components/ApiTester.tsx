"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Copy,
  Play,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  makeHttpRequest,
  generateCurlCommand,
  parseCurlCommand,
  HTTP_METHODS,
  type ApiRequest,
  type ApiTestResult,
  type HttpMethodType,
} from "@/lib/utils/network/api-client";

export function ApiTester() {
  const [request, setRequest] = useState<ApiRequest>({
    url: "",
    method: "GET",
    headers: {},
    body: "",
    timeout: 30000,
  });

  const [result, setResult] = useState<ApiTestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [headersInput, setHeadersInput] = useState("");
  const [curlInput, setCurlInput] = useState("");

  const handleTest = async () => {
    if (!request.url) {
      toast.error("Please enter a URL");
      return;
    }

    setIsLoading(true);
    try {
      // Parse headers from input
      const headers: Record<string, string> = {};
      if (headersInput.trim()) {
        const headerLines = headersInput.split("\n");
        for (const line of headerLines) {
          const colonIndex = line.indexOf(":");
          if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).trim();
            const value = line.substring(colonIndex + 1).trim();
            headers[key] = value;
          }
        }
      }

      const testRequest = { ...request, headers };
      const testResult = await makeHttpRequest(testRequest);
      setResult(testResult);
    } catch (error) {
      toast.error(
        "Request failed: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCurlImport = () => {
    if (!curlInput.trim()) {
      toast.error("Please enter a cURL command");
      return;
    }

    const parsed = parseCurlCommand(curlInput);
    if (parsed) {
      setRequest(parsed);
      if (parsed.headers) {
        const headerString = Object.entries(parsed.headers)
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n");
        setHeadersInput(headerString);
      }
      toast.success("cURL command imported successfully");
    } else {
      toast.error("Invalid cURL command");
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard`);
  };

  const formatHeaders = (headers: Record<string, string>) => {
    return Object.entries(headers).map(([key, value]) => (
      <div
        key={key}
        className="flex justify-between items-center py-1 border-b border-border/50"
      >
        <span className="font-mono text-sm text-muted-foreground">{key}:</span>
        <span className="font-mono text-sm">{value}</span>
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">API Tester</h2>
        <p className="text-muted-foreground">
          Test REST APIs and HTTP endpoints with detailed response analysis
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Request Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Request Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* URL and Method */}
            <div className="flex gap-2">
              <Select
                value={request.method}
                onValueChange={(value) =>
                  setRequest({ ...request, method: value as HttpMethodType })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.values(HTTP_METHODS) as string[]).map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="https://api.example.com/users"
                value={request.url}
                onChange={(e) =>
                  setRequest({ ...request, url: e.target.value })
                }
                className="flex-1"
              />
            </div>

            {/* Headers */}
            <div className="space-y-2">
              <Label>Headers (key: value, one per line)</Label>
              <Textarea
                placeholder="Content-Type: application/json&#10;Authorization: Bearer token"
                value={headersInput}
                onChange={(e) => setHeadersInput(e.target.value)}
                rows={4}
                className="font-mono text-sm"
              />
            </div>

            {/* Body (for POST, PUT, PATCH) */}
            {(request.method === "POST" ||
              request.method === "PUT" ||
              request.method === "PATCH") && (
              <div className="space-y-2">
                <Label>Request Body</Label>
                <Textarea
                  placeholder='{"name": "John", "email": "john@example.com"}'
                  value={request.body || ""}
                  onChange={(e) =>
                    setRequest({ ...request, body: e.target.value })
                  }
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
            )}

            {/* Timeout */}
            <div className="space-y-2">
              <Label>Timeout (ms)</Label>
              <Input
                type="number"
                value={request.timeout}
                onChange={(e) =>
                  setRequest({
                    ...request,
                    timeout: parseInt(e.target.value) || 30000,
                  })
                }
                min={1000}
                max={120000}
              />
            </div>

            {/* cURL Import */}
            <div className="space-y-2">
              <Label>Import from cURL</Label>
              <div className="flex gap-2">
                <Textarea
                  placeholder="curl -X GET 'https://api.example.com/users' -H 'Authorization: Bearer token'"
                  value={curlInput}
                  onChange={(e) => setCurlInput(e.target.value)}
                  rows={3}
                  className="font-mono text-sm flex-1"
                />
                <Button onClick={handleCurlImport} variant="outline">
                  Import
                </Button>
              </div>
            </div>

            {/* Send Request */}
            <Button
              onClick={handleTest}
              disabled={isLoading || !request.url}
              className="w-full"
            >
              {isLoading ? "Sending..." : "Send Request"}
            </Button>
          </CardContent>
        </Card>

        {/* Response */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Response
              {result?.response && (
                <Badge
                  variant={
                    result.response.status < 400 ? "default" : "destructive"
                  }
                >
                  {result.response.status}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <Tabs defaultValue="response" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="response">Response</TabsTrigger>
                  <TabsTrigger value="headers">Headers</TabsTrigger>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                  <TabsTrigger value="info">Info</TabsTrigger>
                </TabsList>

                <TabsContent value="response" className="space-y-4">
                  {result.response ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {result.response.status < 400 ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="font-medium">
                            {result.response.status}{" "}
                            {result.response.statusText}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleCopy(result.response!.data, "Response body")
                          }
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="bg-muted rounded-lg p-3 max-h-80 overflow-auto">
                        <pre className="text-sm font-mono whitespace-pre-wrap">
                          {result.response.data || "(Empty response)"}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                      <p>Request failed: {result.error}</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="headers">
                  {result.response ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Response Headers</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleCopy(
                              Object.entries(result.response!.headers)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join("\n"),
                              "Headers"
                            )
                          }
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="bg-muted rounded-lg p-3 max-h-80 overflow-auto">
                        {formatHeaders(result.response.headers)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No headers available
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="curl">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Equivalent cURL Command</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleCopy(
                            generateCurlCommand(result.request),
                            "cURL command"
                          )
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <pre className="text-sm font-mono whitespace-pre-wrap">
                        {generateCurlCommand(result.request)}
                      </pre>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="info">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {result.response && (
                        <>
                          <div>
                            <span className="text-muted-foreground">
                              Response Time:
                            </span>
                            <div className="flex items-center gap-1 font-medium">
                              <Clock className="h-3 w-3" />
                              {result.response.responseTime}ms
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Response Size:
                            </span>
                            <div className="font-medium">
                              {result.response.size} bytes
                            </div>
                          </div>
                        </>
                      )}
                      <div>
                        <span className="text-muted-foreground">
                          Timestamp:
                        </span>
                        <div className="font-medium">
                          {new Date(result.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Method:</span>
                        <div className="font-medium">
                          {result.request.method}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Play className="h-8 w-8 mx-auto mb-2" />
                <p>Send a request to see the response</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
