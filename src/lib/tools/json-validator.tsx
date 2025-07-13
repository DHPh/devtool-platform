"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Copy } from "lucide-react";
import { toast } from "sonner";

export const metadata = {
  id: "json-validator",
  name: "JSON Validator",
  description: "Validate JSON syntax and structure",
  category: "Validators",
  tags: ["json", "validator", "syntax"],
  path: "/tools/json-validator",
  icon: "✅",
};

export default function JsonValidator() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<{
    isValid: boolean;
    error: string | null;
    formatted: string | null;
  } | null>(null);

  const validateJson = () => {
    if (!input.trim()) {
      setResult(null);
      return;
    }

    try {
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, 2);
      setResult({
        isValid: true,
        error: null,
        formatted,
      });
    } catch (error) {
      setResult({
        isValid: false,
        error: error instanceof Error ? error.message : "Invalid JSON",
        formatted: null,
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>JSON Validator</CardTitle>
          <CardDescription>
            Validate JSON syntax and check for formatting errors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="input">JSON Input</Label>
              <Textarea
                id="input"
                placeholder="Paste your JSON here..."
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setResult(null);
                }}
                rows={10}
                className="font-mono"
              />
            </div>

            <Button onClick={validateJson} className="w-full">
              Validate JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              {result.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <CardTitle
                className={result.isValid ? "text-green-500" : "text-red-500"}
              >
                {result.isValid ? "Valid JSON" : "Invalid JSON"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {result.isValid ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-green-700">
                    JSON is valid
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(result.formatted!)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Formatted
                  </Button>
                </div>
                <div className="max-h-96 overflow-auto">
                  <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                    {result.formatted}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Badge variant="destructive">Syntax Error</Badge>
                <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-red-700 dark:text-red-300 text-sm font-mono">
                    {result.error}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
