/**
 * JSON Formatter Tab Component
 * Handles JSON formatting, minification, and validation
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Wand2,
  Minimize2,
  RotateCcw,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ResponsiveTextArea,
  CopyableResult,
  FileUploadZone,
  ValidationMessages,
} from "@/components/layout";
import { JsonStatsDisplay } from "./components";
import {
  formatJson,
  minifyJson,
  validateJson,
  type JsonFormatOptions,
  type JsonValidationResult,
  type JsonStats,
} from "@/lib/utils/json";

interface JsonFormatterTabProps {
  input: string;
  onInputChange: (value: string) => void;
}

export function JsonFormatterTab({
  input,
  onInputChange,
}: JsonFormatterTabProps) {
  const [output, setOutput] = useState("");
  const [validation, setValidation] = useState<JsonValidationResult | null>(
    null
  );
  const [stats, setStats] = useState<JsonStats | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Format options
  const [indentSize, setIndentSize] = useState(2);
  const [sortKeys, setSortKeys] = useState(false);
  const [removeComments, setRemoveComments] = useState(false);

  const validateInput = () => {
    if (!input.trim()) {
      setValidation(null);
      return;
    }

    const result = validateJson(input);
    setValidation(result);
  };

  const formatJson_handler = async () => {
    if (!input.trim()) {
      toast.error("Please provide JSON to format");
      return;
    }

    setIsProcessing(true);

    try {
      const options: JsonFormatOptions = {
        indentSize,
        sortKeys,
        removeComments,
      };

      const result = formatJson(input, options);
      setOutput(result.result);
      setStats(result.stats);
      setValidation({ isValid: true });
      toast.success("JSON formatted successfully!");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Formatting failed";
      toast.error(errorMessage);
      setValidation({
        isValid: false,
        error: errorMessage,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const minifyJson_handler = async () => {
    if (!input.trim()) {
      toast.error("Please provide JSON to minify");
      return;
    }

    setIsProcessing(true);

    try {
      const result = minifyJson(input);
      setOutput(result.result);
      setStats(result.stats);
      setValidation({ isValid: true });
      toast.success("JSON minified successfully!");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Minification failed";
      toast.error(errorMessage);
      setValidation({
        isValid: false,
        error: errorMessage,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAll = () => {
    onInputChange("");
    setOutput("");
    setValidation(null);
    setStats(null);
    toast.success("Cleared all data");
  };

  const downloadOutput = () => {
    if (!output) {
      toast.error("No formatted JSON to download");
      return;
    }

    const blob = new Blob([output], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "formatted.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("JSON downloaded successfully!");
  };

  const handleFileUpload = (content: string, fileName: string) => {
    onInputChange(content);
    toast.success(`File "${fileName}" uploaded successfully!`);
  };

  const copyToInput = () => {
    if (!output) {
      toast.error("No output to copy");
      return;
    }
    onInputChange(output);
    setOutput("");
    toast.success("Output copied to input");
  };

  // Validate input on change
  useState(() => {
    validateInput();
  });

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="h-5 w-5" />
            <span>JSON Input</span>
            {validation &&
              (validation.isValid ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              ))}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <ResponsiveTextArea
              value={input}
              onChange={onInputChange}
              placeholder="Paste your JSON here, or use the file upload below..."
              className="font-mono text-sm min-h-48"
            />

            {/* Validation Messages */}
            {validation && !validation.isValid && (
              <ValidationMessages
                errors={[validation.error || "Invalid JSON"]}
              />
            )}
          </div>

          <FileUploadZone
            onFileSelect={handleFileUpload}
            acceptedTypes={[".json", ".txt"]}
            className="border-dashed border-2 border-muted-foreground/25 rounded-lg p-4"
          />
        </CardContent>
      </Card>

      {/* Options Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Format Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="indent">Indent Size</Label>
              <Input
                id="indent"
                type="number"
                min="1"
                max="8"
                value={indentSize}
                onChange={(e) => setIndentSize(parseInt(e.target.value) || 2)}
                className="w-full"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="sort-keys"
                checked={sortKeys}
                onCheckedChange={setSortKeys}
              />
              <Label htmlFor="sort-keys">Sort keys alphabetically</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="remove-comments"
                checked={removeComments}
                onCheckedChange={setRemoveComments}
              />
              <Label htmlFor="remove-comments">Remove comments</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions Section */}
      <div className="flex flex-wrap gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={formatJson_handler}
                disabled={isProcessing || !input.trim()}
                className="flex-1 min-w-32"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                {isProcessing ? "Formatting..." : "Format"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Format and beautify JSON</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={minifyJson_handler}
                disabled={isProcessing || !input.trim()}
              >
                <Minimize2 className="h-4 w-4 mr-2" />
                Minify
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remove whitespace and minimize size</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" onClick={clearAll}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear all data</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {output && (
          <>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={downloadOutput}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download formatted JSON</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={copyToInput}>
                    <Copy className="h-4 w-4 mr-2" />
                    Use as Input
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Copy output to input for further processing
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}
      </div>

      <Separator />

      {/* Output and Stats Section */}
      {(output || stats) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Output */}
          {output && (
            <div className="lg:col-span-2">
              <CopyableResult
                value={output}
                label="Formatted JSON"
                fontFamily="mono"
                className="h-96"
                rows={20}
              />
            </div>
          )}

          {/* Stats */}
          {stats && (
            <div className="lg:col-span-1">
              <JsonStatsDisplay stats={stats} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
