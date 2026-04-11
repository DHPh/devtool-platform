"use client";

import { useState } from "react";
import { FileText, Download } from "lucide-react";
import { toast } from "sonner";
import {
  ToolHeader,
  QuickActions,
  ResultCard,
  CopyableResult,
  ResponsiveTextArea,
  ModeTabs,
  ValidationMessages,
} from "@/components/layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  FormatterSyntaxError,
  formatCssSource,
  minifyCssSource,
} from "@/lib/processors/source-formatters";

export default function CssFormatter() {
  const [input, setInput] = useState(
    ".header { color: red; background: blue; } .footer { margin: 10px; }"
  );
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"format" | "minify">("format");
  const [indentSize, setIndentSize] = useState("2");
  const [indentType, setIndentType] = useState("spaces");
  const [errors, setErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const processCss = async () => {
    if (!input.trim()) {
      setOutput("");
      setErrors([]);
      return;
    }

    setIsProcessing(true);
    try {
      const result = mode === "format"
        ? await formatCssSource(input, {
            indentSize: Number(indentSize),
            useTabs: indentType === "tabs",
          })
        : minifyCssSource(input);
      setOutput(result);
      setErrors([]);
      toast.success(mode === "format" ? "CSS parsed and formatted locally." : "CSS parsed and minified locally.");
    } catch (error) {
      const message = error instanceof FormatterSyntaxError ? error.message : "Unable to process CSS.";
      setOutput("");
      setErrors([message]);
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const examples = [
    {
      name: "Basic CSS",
      code: ".header { color: red; background: blue; } .footer { margin: 10px; padding: 5px; }",
    },
    {
      name: "Responsive CSS", 
      code: "@media (max-width: 768px) { .container { width: 100%; } .sidebar { display: none; } }",
    },
    {
      name: "Flexbox Layout",
      code: ".container { display: flex; justify-content: center; align-items: center; flex-direction: column; }",
    },
    {
      name: "CSS Grid",
      code: ".grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }",
    },
  ];

  const loadExample = (code: string) => {
    setInput(code);
    toast.success("Example loaded!");
  };

  const downloadOutput = () => {
    const blob = new Blob([output], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `formatted-styles.css`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded!");
  };

  const clearAll = () => {
    setInput("");
    setOutput("");
  };

  return (
    <div className="space-y-6">
      <ToolHeader
        title="CSS Formatter"
        description="Format, beautify, or minify CSS code with customizable indentation"
        icon={FileText}
      />

      <ModeTabs
        value={mode}
        onValueChange={(value) => setMode(value as "format" | "minify")}
        options={[
          {
            value: "format",
            label: "Format",
            description: "Beautify CSS with proper indentation and formatting",
          },
          {
            value: "minify",
            label: "Minify",
            description: "Compress CSS by removing whitespace and unnecessary characters",
          },
        ]}
      />

      <QuickActions
        actions={[
          {
            id: "format",
            label: isProcessing ? "Processing…" : mode === "format" ? "Format CSS" : "Minify CSS",
            onClick: () => void processCss(),
            variant: "default" as const,
          },
          {
            id: "clear",
            label: "Clear All",
            onClick: clearAll,
            variant: "outline" as const,
          },
          ...examples.map(example => ({
            id: `example-${example.name.toLowerCase().replace(/\s+/g, '-')}`,
            label: example.name,
            onClick: () => loadExample(example.code),
            variant: "outline" as const,
          })),
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-4">
          <div>
            <Label className="block text-sm font-medium mb-2">Input CSS</Label>
            <ResponsiveTextArea
              value={input}
              onChange={setInput}
              placeholder="Enter CSS code here..."
              minHeight={300}
              showCharacterCount={true}
              allowFileUpload={true}
              acceptedFileTypes=".css"
            />
          </div>

          {mode === "format" && (
            <ResultCard
              title="Format Settings"
              description="Customize CSS formatting options"
              status="info"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="indent-size">Indent Size</Label>
                  <Select value={indentSize} onValueChange={setIndentSize}>
                    <SelectTrigger aria-label="Indent size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 spaces</SelectItem>
                      <SelectItem value="4">4 spaces</SelectItem>
                      <SelectItem value="8">8 spaces</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="indent-type">Indent Type</Label>
                  <Select value={indentType} onValueChange={setIndentType}>
                    <SelectTrigger aria-label="Indent type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spaces">Spaces</SelectItem>
                      <SelectItem value="tabs">Tabs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </ResultCard>
          )}
        </div>

        {/* Output */}
        <div className="space-y-4">
          <ResultCard
            title={mode === "format" ? "Formatted CSS" : "Minified CSS"}
            description={`${output.split("\n").length} lines, ${output.length} characters`}
            status={output ? "success" : "info"}
          >
            <div className="space-y-2">
              {output && (
                <div className="flex gap-2 mb-4">
                  <Download
                    className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground"
                    onClick={downloadOutput}
                  />
                </div>
              )}
              <CopyableResult
                value={output}
                placeholder={`${mode === "format" ? "Formatted" : "Minified"} CSS will appear here...`}
                fontFamily="mono"
                rows={12}
              />
            </div>
          </ResultCard>
        </div>
      </div>

      {errors.length > 0 && <ValidationMessages errors={errors} warnings={[]} />}

      {/* Information */}
      <ResultCard
        title="Parser-backed behavior"
        status="info"
        description="Formatting and minification operate on a CSS syntax tree rather than regular expressions"
      >
        <div className="space-y-4 text-sm text-muted-foreground">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-medium mb-2">Format Benefits</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Preserves comments, strings, and custom properties</li>
                <li>Handles at-rules and nested rules</li>
                <li>Reports parser errors with source locations</li>
                <li>Uses configurable spaces or tabs</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Minify Benefits</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Compacts parser-owned whitespace</li>
                <li>Preserves comments and declaration values</li>
                <li>Does not perform unsafe semantic rewrites</li>
                <li>Runs entirely in your browser</li>
              </ul>
            </div>
          </div>
          <p className="text-xs bg-muted p-2 rounded">
            <strong>Note:</strong> Conservative minification preserves comments by design and does not replace a production optimizer.
          </p>
        </div>
      </ResultCard>
    </div>
  );
}
