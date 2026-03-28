"use client";

import React, { useState } from "react";
import { writeClipboardText } from "@/hooks/use-clipboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Send,
  Plus,
  Trash2,
  Copy,
  ChevronDown,
  Clock,
  AlertCircle,
  CheckCircle,
  Book,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  HTTP_HEADERS,
  HTTP_HEADER_CATEGORIES,
  HEADER_PRESETS,
  searchHeaders,
  getHeadersByCategory,
  type HttpHeaderInfo,
} from "@/lib/utils/network/http-headers";
import {
  makeHttpRequest,
  type HttpMethodType,
} from "@/lib/utils/network/api-client";

interface HeaderEntry {
  key: string;
  value: string;
  enabled: boolean;
}

interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: unknown;
  responseTime: number;
  size: number;
  url: string;
  method: string;
  error?: string;
  errorDetails?: string;
  errorCategory?: string;
}

const HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "HEAD",
  "OPTIONS",
];

export function UnifiedHttpTester() {
  const [url, setUrl] = useState("https://httpbin.org/get");
  const [method, setMethod] = useState("GET");
  const [headers, setHeaders] = useState<HeaderEntry[]>([
    { key: "Content-Type", value: "application/json", enabled: true },
  ]);
  const [body, setBody] = useState("");
  const [response, setResponse] = useState<HttpResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Header library state
  const [headerSearch, setHeaderSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showHeaderLibrary, setShowHeaderLibrary] = useState(false);

  const filteredHeaders = headerSearch
    ? searchHeaders(headerSearch)
    : selectedCategory === "all"
    ? HTTP_HEADERS
    : getHeadersByCategory(selectedCategory);

  const addHeader = (key = "", value = "") => {
    setHeaders([...headers, { key, value, enabled: true }]);
  };

  const updateHeader = (
    index: number,
    field: keyof HeaderEntry,
    value: string | boolean
  ) => {
    const newHeaders = [...headers];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    setHeaders(newHeaders);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const applyHeaderPreset = (presetName: string) => {
    const preset = HEADER_PRESETS[presetName as keyof typeof HEADER_PRESETS];
    if (preset) {
      const newHeaders = Object.entries(preset).map(([key, value]) => ({
        key,
        value,
        enabled: true,
      }));
      setHeaders(newHeaders);
      toast.success(`Applied ${presetName} preset`);
    }
  };

  const addHeaderFromLibrary = (headerInfo: HttpHeaderInfo) => {
    const existingIndex = headers.findIndex(
      (h) => h.key.toLowerCase() === headerInfo.name.toLowerCase()
    );

    if (existingIndex !== -1) {
      // Update existing header
      updateHeader(existingIndex, "value", headerInfo.examples[0] || "");
      toast.success(`Updated ${headerInfo.name} header`);
    } else {
      // Add new header
      addHeader(headerInfo.name, headerInfo.examples[0] || "");
      toast.success(`Added ${headerInfo.name} header`);
    }
  };

  const categorizeError = (
    error: unknown,
    status?: number
  ): { category: string; details: string } => {
    if (status) {
      if (status >= 400 && status < 500) {
        return {
          category: "Client Error",
          details: `HTTP ${status} - Check your request parameters, authentication, or permissions`,
        };
      }
      if (status >= 500) {
        return {
          category: "Server Error",
          details: `HTTP ${status} - Server-side error, try again later`,
        };
      }
    }

    if (error instanceof Error) {
      if (
        error.name === "TypeError" &&
        error.message?.includes("Failed to fetch")
      ) {
        return {
          category: "CORS/Network Error",
          details:
            "Request blocked by CORS policy or network is unreachable. Check if the server allows cross-origin requests.",
        };
      }

      if (error.name === "AbortError") {
        return {
          category: "Timeout Error",
          details: "Request timed out. The server took too long to respond.",
        };
      }

      return {
        category: "Unknown Error",
        details: error.message || "An unexpected error occurred",
      };
    }

    return {
      category: "Unknown Error",
      details: "An unexpected error occurred",
    };
  };

  const handleSubmit = async () => {
    if (!url) {
      toast.error("Please enter a URL");
      return;
    }

    setIsLoading(true);
    try {
      // Prepare headers
      const requestHeaders: Record<string, string> = {};
      headers
        .filter((h) => h.enabled && h.key && h.value)
        .forEach((h) => {
          requestHeaders[h.key] = h.value;
        });

      const result = await makeHttpRequest({
        url,
        method: method as HttpMethodType,
        headers: requestHeaders,
        body: ["POST", "PUT", "PATCH"].includes(method) && body ? body : undefined,
      });

      if (!result.response) {
        const error = new Error(result.errorDetails || result.error || "Request failed");
        if (result.error === "Request timeout") error.name = "AbortError";
        if (result.error === "Network error") error.name = "TypeError";
        throw error;
      }

      const responseResult = result.response;
      const contentType = responseResult.headers["content-type"] || "";
      let responseData: unknown = responseResult.data;
      if (contentType.includes("application/json")) {
        try {
          responseData = JSON.parse(responseResult.data);
        } catch {
          // Preserve invalid JSON as the response text.
        }
      }

      const httpResponse: HttpResponse = {
        status: responseResult.status,
        statusText: responseResult.statusText,
        headers: responseResult.headers,
        data: responseData,
        responseTime: responseResult.responseTime,
        size: responseResult.size,
        url,
        method,
      };

      // Add error info if not successful
      if (!result.success) {
        const errorInfo = categorizeError(null, responseResult.status);
        httpResponse.error = `${responseResult.status} ${responseResult.statusText}`;
        httpResponse.errorDetails = result.errorDetails || errorInfo.details;
        httpResponse.errorCategory = errorInfo.category;
      }

      setResponse(httpResponse);
      toast.success(`Request completed in ${httpResponse.responseTime}ms`);
    } catch (error) {
      const errorInfo = categorizeError(error);

      const errorResponse: HttpResponse = {
        status: 0,
        statusText: "Network Error",
        headers: {},
        data: null,
        responseTime: 0,
        size: 0,
        url,
        method,
        error: errorInfo.category,
        errorDetails: errorInfo.details,
        errorCategory: errorInfo.category,
      };

      setResponse(errorResponse);
      toast.error(`Request failed: ${errorInfo.category}`);
      console.error("Request error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyResponse = () => {
    if (response) {
      void writeClipboardText(JSON.stringify(response, null, 2));
      toast.success("Response copied to clipboard");
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">HTTP Tester & API Client</h2>
        <p className="text-muted-foreground">
          Requests run in your browser. Cross-origin targets must allow your
          origin through CORS, and browser-restricted headers cannot be set.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Request Builder */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Request Builder
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* URL and Method */}
              <div className="flex gap-2">
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="w-32" aria-label="HTTP method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HTTP_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="https://httpbin.org/get"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1"
                />
              </div>

              {/* Header Presets */}
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground self-center">
                  Quick presets:
                </span>
                {Object.keys(HEADER_PRESETS).map((preset) => (
                  <Button
                    key={preset}
                    variant="outline"
                    size="sm"
                    onClick={() => applyHeaderPreset(preset)}
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    {preset}
                  </Button>
                ))}
              </div>

              {/* Headers */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Headers</h4>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowHeaderLibrary(!showHeaderLibrary)}
                    >
                      <Book className="h-3 w-3 mr-1" />
                      Header Library
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addHeader()}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Header
                    </Button>
                  </div>
                </div>

                {headers.map((header, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      placeholder="Header name"
                      value={header.key}
                      onChange={(e) =>
                        updateHeader(index, "key", e.target.value)
                      }
                      className="flex-1"
                    />
                    <Input
                      placeholder="Header value"
                      value={header.value}
                      onChange={(e) =>
                        updateHeader(index, "value", e.target.value)
                      }
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeHeader(index)}
                      aria-label={`Remove request header ${index + 1}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Request Body */}
              {["POST", "PUT", "PATCH"].includes(method) && (
                <div className="space-y-2">
                  <h4 className="font-medium">Request Body</h4>
                  <Textarea
                    placeholder='{"key": "value"}'
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={6}
                  />
                </div>
              )}

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Sending..." : `Send ${method} Request`}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Header Library */}
        <div className="space-y-4">
          <Collapsible
            open={showHeaderLibrary}
            onOpenChange={setShowHeaderLibrary}
          >
            <CollapsibleTrigger asChild>
              <Card className="cursor-pointer hover:bg-accent/50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Book className="h-5 w-5" />
                      HTTP Headers Library
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </CardTitle>
                </CardHeader>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Search */}
                    <Input
                      placeholder="Search headers..."
                      value={headerSearch}
                      onChange={(e) => setHeaderSearch(e.target.value)}
                    />

                    {/* Category Filter */}
                    <Select
                      value={selectedCategory}
                      onValueChange={setSelectedCategory}
                    >
                      <SelectTrigger aria-label="Header category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {Object.values(HTTP_HEADER_CATEGORIES).map(
                          (category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>

                    {/* Header List */}
                    <div className="max-h-80 overflow-y-auto space-y-2">
                      {filteredHeaders.slice(0, 20).map((header) => (
                        <button
                          type="button"
                          key={header.name}
                          className="w-full p-3 border rounded-lg hover:bg-accent/50 cursor-pointer text-left"
                          onClick={() => addHeaderFromLibrary(header)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium text-sm">
                                {header.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {header.description}
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {header.category}
                            </Badge>
                          </div>
                          {header.examples.length > 0 && (
                            <div className="text-xs text-muted-foreground mt-2 font-mono">
                              {header.examples[0]}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Response */}
      {response && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {response.error ? (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                Response
                <Badge
                  variant={response.status >= 400 ? "destructive" : "default"}
                >
                  {response.status} {response.statusText}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {response.responseTime}ms
                </Badge>
                <Button variant="outline" size="sm" onClick={copyResponse} aria-label="Copy HTTP response">
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Error Display */}
            {response.error && (
              <div role="alert" className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-red-800 dark:text-red-200">
                      {response.error}
                    </div>
                    <div className="text-sm text-red-600 dark:text-red-300 mt-1 max-h-40 overflow-y-auto break-words">
                      <pre className="whitespace-pre-wrap text-xs font-mono">
                        {response.errorDetails}
                      </pre>
                    </div>
                    {response.errorCategory && (
                      <Badge
                        variant="outline"
                        className="mt-2 text-red-600 border-red-600"
                      >
                        {response.errorCategory}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Tabs defaultValue="response" className="w-full">
              <TabsList>
                <TabsTrigger value="response">Response</TabsTrigger>
                <TabsTrigger value="headers">
                  Headers ({Object.keys(response.headers).length})
                </TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>

              <TabsContent value="response" className="mt-4">
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <pre className="text-sm overflow-auto max-h-80">
                    {typeof response.data === "string"
                      ? response.data
                      : JSON.stringify(response.data, null, 2)}
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="headers" className="mt-4">
                <div className="space-y-2">
                  {Object.entries(response.headers).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded"
                    >
                      <span className="font-medium">{key}:</span>
                      <span className="text-muted-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="details" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">URL:</span>
                    <div className="font-mono text-sm">{response.url}</div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Method:
                    </span>
                    <div className="font-medium">{response.method}</div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Response Time:
                    </span>
                    <div className="font-medium">{response.responseTime}ms</div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Response Size:
                    </span>
                    <div className="font-medium">{response.size} bytes</div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
