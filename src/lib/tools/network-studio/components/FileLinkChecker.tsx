"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { File, CheckCircle, AlertCircle, Download, Clock } from "lucide-react";
import { LightbulbIcon as Lightbulb } from "@phosphor-icons/react/Lightbulb";
import { toast } from "sonner";
import {
  formatFileSize,
  getContentTypeDescription,
} from "@/lib/utils/network/url-validator";
import {
  serverFileLinkCheck,
  type ServerFileLinkResult,
} from "@/lib/utils/network/server-api-client";

export function FileLinkChecker() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<ServerFileLinkResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCheck = async () => {
    if (!url) {
      toast.error("Please enter a file URL");
      return;
    }

    setIsLoading(true);
    try {
      const checkResult = await serverFileLinkCheck(url);
      setResult(checkResult);
    } catch {
      toast.error("Check failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">File Link Checker</h2>
        <p className="text-muted-foreground">
          Check file links without downloading - verify size, type, and
          availability
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle>File Link Check</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="https://example.com/file.pdf"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setResult(null);
              }}
            />
            <Button
              onClick={handleCheck}
              disabled={isLoading || !url}
              className="w-full"
            >
              {isLoading ? "Checking..." : "Check File"}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <File className="h-5 w-5" />
              File Information
              {result && (
                <Badge
                  variant={
                    result.error ? "outline" : result.exists ? "default" : "destructive"
                  }
                >
                  {result.error
                    ? "Check Failed"
                    : result.exists
                      ? "Available"
                      : result.statusCode === 404
                        ? "Not Found"
                        : "Unavailable"}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              result.error ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-red-500">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Check Failed</span>
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-red-700 dark:text-red-300">
                          Error:
                        </span>
                        <span className="ml-2 text-red-600 dark:text-red-400">
                          {result.error}
                        </span>
                      </div>

                      {result.error && (
                        <div>
                          <span className="font-medium text-red-700 dark:text-red-300">
                            Details:
                          </span>
                          <div className="ml-2 text-red-600 dark:text-red-400 mt-1 p-2 bg-red-100 dark:bg-red-900/30 rounded border">
                            {result.error}
                          </div>
                        </div>
                      )}

                      <div>
                        <span className="font-medium text-red-700 dark:text-red-300">
                          URL:
                        </span>
                        <span className="ml-2 text-red-600 dark:text-red-400 font-mono break-all">
                          {url}
                        </span>
                      </div>

                      <div>
                        <span className="font-medium text-red-700 dark:text-red-300">
                          Timestamp:
                        </span>
                        <span className="ml-2 text-red-600 dark:text-red-400">
                          {new Date(result.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Troubleshooting tips */}
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <h4 className="flex items-center gap-1.5 font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                      <Lightbulb aria-hidden="true" className="h-4 w-4" />
                      Troubleshooting Tips:
                    </h4>
                    <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                      <li>• Check if the URL is correct and accessible</li>
                      <li>• Verify the server allows HEAD requests</li>
                      <li>• Some servers block cross-origin requests (CORS)</li>
                      <li>• The file might require authentication</li>
                      <li>• Try accessing the URL directly in your browser</li>
                    </ul>
                  </div>
                </div>
              ) : result.exists ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">File is available</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 text-sm">
                    {result.contentLength && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          File Size:
                        </span>
                        <div className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          <span className="font-medium">
                            {formatFileSize(result.contentLength)}
                          </span>
                        </div>
                      </div>
                    )}

                    {result.contentType && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Content Type:
                        </span>
                        <Badge variant="outline">
                          {getContentTypeDescription(result.contentType)}
                        </Badge>
                      </div>
                    )}

                    {result.lastModified && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Last Modified:
                        </span>
                        <span className="font-medium">
                          {new Date(result.lastModified).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Checked:</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span className="font-medium">
                          {new Date(result.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {result.headers && Object.keys(result.headers).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Response Headers:</h4>
                      <div className="bg-muted rounded-lg p-3 max-h-40 overflow-auto">
                        {Object.entries(result.headers)
                          .slice(0, 10)
                          .map(([key, value]) => (
                            <div
                              key={key}
                              className="flex justify-between items-start py-1 text-xs"
                            >
                              <span className="font-mono text-muted-foreground">
                                {key}:
                              </span>
                              <span className="font-mono text-right ml-2">
                                {String(value)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  <span>File not found or not accessible</span>
                </div>
              )
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <File className="h-8 w-8 mx-auto mb-2" />
                <p>Enter a file URL to check its availability</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
