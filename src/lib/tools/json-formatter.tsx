"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  ToolHeader,
  QuickActions,
  ResultCard,
  ValidationMessages,
  CopyableResult,
  FileUploadZone,
} from "@/components/layout";
import {
  formatJson as processFormatJson,
  minifyJson as processMinifyJson,
  validateJson as processValidateJson,
} from "@/lib/processors/json";
import { ProcessorError } from "@/lib/processors/errors";

const getJsonErrorMessage = (error: unknown): string => {
  if (error instanceof ProcessorError && error.cause instanceof Error) {
    return error.cause.message;
  }

  return error instanceof Error ? error.message : "Invalid JSON";
};

export function JsonFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [indentSize, setIndentSize] = useState(2);
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState("");

  const formatJson = () => {
    try {
      const { result } = processFormatJson(input, { indentSize });
      setOutput(result);
      setIsValid(true);
      setError("");
      toast.success("JSON formatted successfully!");
    } catch (err) {
      setIsValid(false);
      setError(getJsonErrorMessage(err));
      setOutput("");
      toast.error("Invalid JSON format");
    }
  };

  const minifyJson = () => {
    try {
      const { result } = processMinifyJson(input);
      setOutput(result);
      setIsValid(true);
      setError("");
      toast.success("JSON minified successfully!");
    } catch (err) {
      setIsValid(false);
      setError(getJsonErrorMessage(err));
      setOutput("");
      toast.error("Invalid JSON format");
    }
  };

  const validateJson = () => {
    const validation = processValidateJson(input);

    if (validation.isValid) {
      setIsValid(true);
      setError("");
      toast.success("JSON is valid!");
      return;
    }

    setIsValid(false);
    setError(validation.error ?? "Invalid JSON");
    toast.error("Invalid JSON format");
  };

  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard!`);
  };

  const downloadJson = () => {
    const blob = new Blob([output], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "formatted.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("JSON downloaded!");
  };

  const handleFileUpload = (content: string, fileName: string) => {
    setInput(content);
    toast.success(`Loaded ${fileName}`);
  };

  const clearAll = () => {
    setInput("");
    setOutput("");
    setIsValid(true);
    setError("");
  };

  const sampleJson = `{
  "name": "DevTool Platform",
  "version": "1.0.0",
  "description": "A comprehensive collection of developer tools",
  "tools": [
    {
      "id": "json-formatter",
      "name": "JSON Formatter",
      "category": "Text & Format"
    },
    {
      "id": "base64-encoder",
      "name": "Base64 Encoder",
      "category": "Encoding & Decoding"
    }
  ],
  "features": {
    "search": true,
    "bookmarks": true,
    "darkMode": true
  }
}`;

  return (
    <div className="space-y-6">
      <ToolHeader
        title="JSON Formatter"
        description="Format, minify, and validate JSON data with syntax highlighting"
        icon={FileText}
      />

      <QuickActions
        actions={[
          {
            id: "format",
            label: "Format JSON",
            onClick: formatJson,
            disabled: !input.trim(),
          },
          {
            id: "minify",
            label: "Minify JSON",
            onClick: minifyJson,
            disabled: !input.trim(),
          },
          {
            id: "validate",
            label: "Validate",
            onClick: validateJson,
            disabled: !input.trim(),
          },
          {
            id: "sample",
            label: "Load Sample",
            onClick: () => setInput(sampleJson),
            variant: "outline" as const,
          },
          {
            id: "clear",
            label: "Clear All",
            onClick: clearAll,
            variant: "outline" as const,
          },
        ]}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="json-input" className="text-sm font-medium">
              Input JSON
            </Label>
            <div className="mt-2">
              <Textarea
                id="json-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste your JSON here..."
                className="min-h-[400px] font-mono text-sm"
              />
            </div>
          </div>

          <FileUploadZone
            onFileSelect={handleFileUpload}
            acceptedTypes={[".json"]}
            placeholder="Drop JSON files here or click to upload"
          />

          {error && (
            <ValidationMessages
              errors={[error]}
              warnings={[]}
            />
          )}
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          <ResultCard
            title="Formatted JSON"
            description="Formatted and validated JSON output"
            status={output ? (isValid ? "success" : "error") : "info"}
            onCopy={() => copyToClipboard(output, "Formatted JSON")}
            copyLabel="Copy JSON"
          >
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadJson}
                disabled={!output}
                className="h-8"
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
            <CopyableResult
              value={output}
              placeholder="Formatted JSON will appear here..."
              fontFamily="mono"
              rows={20}
            />
          </ResultCard>
        </div>
      </div>

      {/* Settings Panel */}
      <ResultCard
        title="Settings & Options"
        status="info"
      >
        <Tabs defaultValue="format" className="w-full">
          <TabsList>
            <TabsTrigger value="format">Format Options</TabsTrigger>
            <TabsTrigger value="validation">Validation Info</TabsTrigger>
          </TabsList>
          
          <TabsContent value="format" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Indent Size</Label>
              <div className="flex gap-2">
                {[2, 4, 8].map((size) => (
                  <Button
                    key={size}
                    variant={indentSize === size ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIndentSize(size)}
                  >
                    {size} spaces
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="validation" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">JSON Status:</span>
                <span
                  className={`text-sm font-medium ${
                    isValid ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {input ? (isValid ? "✓ Valid" : "✗ Invalid") : "No input"}
                </span>
              </div>
              {input && (
                <div className="text-sm text-muted-foreground">
                  Characters: {input.length.toLocaleString()}
                </div>
              )}
              {output && (
                <div className="text-sm text-muted-foreground">
                  Output size: {output.length.toLocaleString()} characters
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </ResultCard>
    </div>
  );
}
