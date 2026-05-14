/**
 * JSON Formatter Tab Component
 * Handles JSON formatting, minification, and validation
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Wand2, Minimize2, RotateCcw, Download, Copy } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CopyableResult } from "@/components/layout";
import { JsonStatsDisplay } from "./components/JsonStatsDisplay";
import {
  formatJson,
  minifyJson,
  type JsonFormatOptions,
  type JsonStats,
} from "@/lib/processors/json";

interface JsonFormatterTabProps {
  input: string;
  onInputChange: (value: string) => void;
}

export function JsonFormatterTab({
  input,
  onInputChange,
}: JsonFormatterTabProps) {
  const [output, setOutput] = useState("");
  const [stats, setStats] = useState<JsonStats | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Format options
  const [indentSize, setIndentSize] = useState(2);
  const [sortKeys, setSortKeys] = useState(false);
  const [removeComments, setRemoveComments] = useState(false);

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
      toast.success("JSON formatted successfully!");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Formatting failed";
      toast.error(errorMessage);
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
      const result = minifyJson(input, { removeComments });
      setOutput(result.result);
      setStats(result.stats);
      toast.success("JSON minified successfully!");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Minification failed";
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAll = () => {
    onInputChange("");
    setOutput("");
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

  const copyToInput = () => {
    if (!output) {
      toast.error("No output to copy");
      return;
    }
    onInputChange(output);
    setOutput("");
    toast.success("Output copied to input");
  };

  return (
    <div className="space-y-6">
      {/* Actions Section */}
      <div className="space-y-4">
        {/* Format Options - Compact inline version */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="indent" className="text-sm">
                  Indent:
                </Label>
                <Input
                  id="indent"
                  type="number"
                  min="1"
                  max="8"
                  value={indentSize}
                  onChange={(e) => setIndentSize(parseInt(e.target.value) || 2)}
                  className="w-16"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="sort-keys"
                  checked={sortKeys}
                  onCheckedChange={setSortKeys}
                />
                <Label htmlFor="sort-keys" className="text-sm">
                  Sort keys
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="remove-comments"
                  checked={removeComments}
                  onCheckedChange={setRemoveComments}
                />
                <Label htmlFor="remove-comments" className="text-sm">
                  Remove comments
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
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
                  {isProcessing ? "Formatting..." : "Format JSON"}
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
              <TooltipContent>
                Remove whitespace and minimize size
              </TooltipContent>
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
                language="json"
                rows={18}
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
