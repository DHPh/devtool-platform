"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Download, Upload, Trash2 } from "lucide-react";
import { TwoColumnToolLayout } from "@/components/layout";
import { toast } from "sonner";

export function JsonFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [indentSize, setIndentSize] = useState(2);
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState("");

  const formatJson = () => {
    try {
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, indentSize);
      setOutput(formatted);
      setIsValid(true);
      setError("");
      toast.success("JSON formatted successfully!");
    } catch (err) {
      setIsValid(false);
      setError(err instanceof Error ? err.message : "Invalid JSON");
      setOutput("");
      toast.error("Invalid JSON format");
    }
  };

  const minifyJson = () => {
    try {
      const parsed = JSON.parse(input);
      const minified = JSON.stringify(parsed);
      setOutput(minified);
      setIsValid(true);
      setError("");
      toast.success("JSON minified successfully!");
    } catch (err) {
      setIsValid(false);
      setError(err instanceof Error ? err.message : "Invalid JSON");
      setOutput("");
      toast.error("Invalid JSON format");
    }
  };

  const validateJson = () => {
    try {
      JSON.parse(input);
      setIsValid(true);
      setError("");
      toast.success("JSON is valid!");
    } catch (err) {
      setIsValid(false);
      setError(err instanceof Error ? err.message : "Invalid JSON");
      toast.error("Invalid JSON format");
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(output);
    toast.success("Copied to clipboard!");
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setInput(content);
      };
      reader.readAsText(file);
    }
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
      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={formatJson} disabled={!input.trim()}>
          Format JSON
        </Button>
        <Button onClick={minifyJson} variant="outline" disabled={!input.trim()}>
          Minify JSON
        </Button>
        <Button
          onClick={validateJson}
          variant="outline"
          disabled={!input.trim()}
        >
          Validate JSON
        </Button>
        <Button onClick={clearAll} variant="outline">
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All
        </Button>
        <Button onClick={() => setInput(sampleJson)} variant="outline">
          Load Sample
        </Button>
      </div>

      <TwoColumnToolLayout
        leftTitle="Input JSON"
        leftDescription="Paste your JSON data here"
        leftActions={[
          {
            label: "Upload",
            icon: <Upload className="h-4 w-4" />,
            onClick: () => document.getElementById("file-upload")?.click(),
          },
        ]}
        leftChildren={
          <>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your JSON here..."
              className="min-h-[400px] font-mono text-sm tool-input textarea-enhanced"
            />
            {!isValid && error && (
              <p className="text-destructive text-sm mt-2">{error}</p>
            )}
            <input
              id="file-upload"
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </>
        }
        rightTitle="Formatted JSON"
        rightDescription="Formatted and validated JSON output"
        rightActions={[
          {
            label: "Copy",
            icon: <Copy className="h-4 w-4" />,
            onClick: copyToClipboard,
            disabled: !output,
          },
          {
            label: "Download",
            icon: <Download className="h-4 w-4" />,
            onClick: downloadJson,
            disabled: !output,
          },
        ]}
        rightChildren={
          <Textarea
            value={output}
            readOnly
            placeholder="Formatted JSON will appear here..."
            className="min-h-[400px] font-mono text-sm tool-output textarea-enhanced"
          />
        }
      />

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="format" className="w-full">
            <TabsList>
              <TabsTrigger value="format">Format Options</TabsTrigger>
              <TabsTrigger value="validation">Validation</TabsTrigger>
            </TabsList>
            <TabsContent value="format" className="space-y-4">
              <div className="space-y-2">
                <Label>Indent Size</Label>
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
            <TabsContent value="validation" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">JSON Status:</span>
                  <span
                    className={`text-sm ${
                      isValid ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {input ? (isValid ? "✓ Valid" : "✗ Invalid") : "No input"}
                  </span>
                </div>
                {input && (
                  <div className="text-sm text-muted-foreground">
                    Characters: {input.length}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
